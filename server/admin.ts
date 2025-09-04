import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import { NumberModel, Transaction, User, Message } from "./models";
import { verifyToken } from "./auth";

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    await connectDB();
    const token = req.cookies?.["connectlify_jwt"] || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : undefined);
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifyToken(token);
    const me = await User.findById((decoded as any).userId).lean();
    if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    (req as any).userId = String(me._id);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export async function ensureAdminUser() {
  await connectDB();
  const raw = process.env.ADMIN_EMAIL?.trim();
  const pwd = process.env.ADMIN_PASSWORD?.trim();
  if (!raw || !pwd) return;
  const email = raw.toLowerCase();
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let admin = await User.findOne({ email }).lean();
  if (!admin) {
    admin = await User.findOne({ email: { $regex: new RegExp(`^${escape(email)}$`, "i") } }).lean();
  }
  const passwordHash = await bcrypt.hash(pwd, 10);
  if (!admin) {
    await User.create({ email, passwordHash, role: "admin", firstName: "Admin", lastName: "" });
  } else {
    await User.updateOne({ _id: admin._id }, { $set: { role: "admin", email, passwordHash } });
  }
}

const toE164 = (n: string) => {
  const raw = String(n || "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return raw.replace(/\s|\(|\)|-/g, "");
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return "+" + digits;
};

export const adminRoutes = {
  users: (async (_req, res) => {
    await connectDB();
    const users = await User.find({}).select("email role walletBalance plan createdAt").sort({ createdAt: -1 }).lean();
    const ids = users.map((u: any) => u._id);
    const counts = await NumberModel.aggregate([
      { $match: { ownerUserId: { $in: ids } } },
      { $group: { _id: "$ownerUserId", cnt: { $sum: 1 } } },
    ]);
    const byId: Record<string, number> = {};
    for (const c of counts) byId[String(c._id)] = c.cnt;
    res.json({ users: users.map((u: any) => ({
      id: u._id,
      email: u.email,
      role: u.role,
      walletBalance: u.walletBalance ?? 0,
      plan: u.plan || "free",
      createdAt: u.createdAt,
      numbersOwned: byId[String(u._id)] || 0,
    })) });
  }) as RequestHandler,

  userDetail: (async (req, res) => {
    await connectDB();
    const { id } = req.params as any;
    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    const owned = await NumberModel.find({ ownerUserId: id }).lean();
    const assigned = await NumberModel.find({ assignedToUserId: id }).lean();
    const tx = await Transaction.find({ userId: id }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ user: { id: user._id, email: user.email, role: user.role, walletBalance: user.walletBalance ?? 0, plan: user.plan, createdAt: user.createdAt }, owned, assigned, transactions: tx });
  }) as RequestHandler,

  walletAdjust: (async (req, res) => {
    await connectDB();
    const { id } = req.params as any;
    const { delta, reason } = req.body || {};
    const amt = Number(delta);
    if (!Number.isFinite(amt) || amt === 0) return res.status(400).json({ error: "delta must be non-zero number" });
    const u = await User.findById(id);
    if (!u) return res.status(404).json({ error: "User not found" });
    await User.updateOne({ _id: id }, { $inc: { walletBalance: amt } });
    await Transaction.create({ userId: id, type: amt > 0 ? "deposit" : "transfer", amount: Math.abs(amt), meta: { reason: reason || "admin_adjust" } });
    res.json({ ok: true });
  }) as RequestHandler,

  numbers: (async (_req, res) => {
    await connectDB();
    const nums = await NumberModel.find({}).lean();
    const ownerIds = Array.from(new Set(nums.map((n: any) => String(n.ownerUserId)).filter(Boolean)));
    const assignedIds = Array.from(new Set(nums.map((n: any) => String(n.assignedToUserId)).filter(Boolean)));
    const ids = Array.from(new Set([...ownerIds, ...assignedIds]));
    const users = await User.find({ _id: { $in: ids } }).select("email").lean();
    const emailById: Record<string, string> = {};
    for (const u of users) emailById[String(u._id)] = u.email as any;
    res.json({ numbers: nums.map((n: any) => ({
      id: n._id,
      phoneNumber: n.phoneNumber,
      ownerUserId: n.ownerUserId,
      ownerEmail: emailById[String(n.ownerUserId)] || null,
      assignedToUserId: n.assignedToUserId || null,
      assignedEmail: n.assignedToUserId ? emailById[String(n.assignedToUserId)] || null : null,
      country: n.country || null,
      createdAt: n.createdAt,
    })) });
  }) as RequestHandler,

  assignNumber: (async (req, res) => {
    await connectDB();
    const { phoneNumber, assignedToUserId } = req.body || {};
    if (!phoneNumber || !assignedToUserId) return res.status(400).json({ error: "phoneNumber and assignedToUserId required" });
    const n = await NumberModel.findOne({ phoneNumber: toE164(phoneNumber) });
    if (!n) return res.status(404).json({ error: "Number not found" });
    const u = await User.findById(assignedToUserId).lean();
    if (!u) return res.status(404).json({ error: "User not found" });
    await NumberModel.updateOne({ _id: n._id }, { $set: { assignedToUserId } });
    res.json({ ok: true });
  }) as RequestHandler,

  unassignNumber: (async (req, res) => {
    await connectDB();
    const { phoneNumber } = req.body || {};
    if (!phoneNumber) return res.status(400).json({ error: "phoneNumber required" });
    const n = await NumberModel.findOne({ phoneNumber: toE164(phoneNumber) });
    if (!n) return res.status(404).json({ error: "Number not found" });
    await NumberModel.updateOne({ _id: n._id }, { $unset: { assignedToUserId: 1 } });
    res.json({ ok: true });
  }) as RequestHandler,

  transferOwnership: (async (req, res) => {
    await connectDB();
    const { phoneNumber, newOwnerUserId } = req.body || {};
    if (!phoneNumber || !newOwnerUserId) return res.status(400).json({ error: "phoneNumber and newOwnerUserId required" });
    const n = await NumberModel.findOne({ phoneNumber: toE164(phoneNumber) });
    if (!n) return res.status(404).json({ error: "Number not found" });
    const u = await User.findById(newOwnerUserId).lean();
    if (!u) return res.status(404).json({ error: "User not found" });
    await NumberModel.updateOne({ _id: n._id }, { $set: { ownerUserId: newOwnerUserId }, $unset: { assignedToUserId: 1 } });
    res.json({ ok: true });
  }) as RequestHandler,

  sendMessage: (async (req, res) => {
    try {
      await connectDB();
      const { to, body, from } = req.body || {};
      if (!to || !body || !from) return res.status(400).json({ error: "from, to and body required" });
      const fromE = toE164(from);
      const toE = toE164(to);
      const numberDoc = await NumberModel.findOne({ phoneNumber: fromE }).lean();
      if (!numberDoc) return res.status(400).json({ error: "from number not found" });

      // Reuse SignalWire LAML client inline to avoid cyclic import
      const spaceUrl = process.env.SIGNALWIRE_SPACE_URL;
      const apiToken = process.env.SIGNALWIRE_TOKEN;
      const projectId = process.env.SIGNALWIRE_PROJECT_ID;
      if (!spaceUrl || !apiToken || !projectId) throw new Error("SignalWire env not set");
      const url = `https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/Messages.json`;
      const basic = Buffer.from(`${projectId}:${apiToken}`).toString("base64");
      const form = new URLSearchParams({ To: toE, From: fromE, Body: String(body) });
      const resp = await fetch(url, { method: "POST", body: form as any, headers: { Authorization: `Basic ${basic}` } });
      if (!resp.ok) {
        const txt = await resp.text();
        return res.status(502).json({ error: `SignalWire error ${resp.status}: ${txt}` });
      }
      const data = await resp.json();
      await Message.create({
        numberId: numberDoc._id,
        ownerUserId: numberDoc.ownerUserId,
        assignedToUserId: numberDoc.assignedToUserId,
        from: fromE,
        to: toE,
        body: String(body),
        direction: "outbound",
        providerSid: data?.sid,
        status: "sent",
      });
      res.json({ ok: true, sid: data?.sid });
    } catch (e: any) {
      const msg = String(e?.message || e);
      const status = msg.includes("401") ? 401 : 500;
      res.status(status).json({ error: msg });
    }
  }) as RequestHandler,

  deleteUser: (async (req, res) => {
    await connectDB();
    const { id } = req.params as any;
    const owned = await NumberModel.countDocuments({ ownerUserId: id });
    if (owned > 0) return res.status(400).json({ error: "User owns numbers; transfer ownership before deletion" });
    await User.deleteOne({ _id: id });
    await NumberModel.updateMany({ assignedToUserId: id }, { $unset: { assignedToUserId: 1 } });
    res.json({ ok: true });
  }) as RequestHandler,
};
