import type { RequestHandler } from "express";
import { NumberModel, User } from "./models";
import { connectDB } from "./db";

const spaceUrl = process.env.SIGNALWIRE_SPACE_URL;
const apiToken = process.env.SIGNALWIRE_TOKEN; // PT...
const projectId = process.env.SIGNALWIRE_PROJECT_ID;

async function swFetch(path: string, init?: RequestInit) {
  if (!spaceUrl || !apiToken || !projectId) throw new Error("SignalWire env not set");
  const url = `https://${spaceUrl}/api/relay/rest${path}`;
  const basic = Buffer.from(`${projectId}:${apiToken}`).toString("base64");
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Basic ${basic}`,
      "X-SignalWire-Project": projectId,
      "Content-Type": "application/json",
      ...(init?.headers as any),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SignalWire error ${res.status}: ${err}`);
  }
  return res.json();
}

export const numberRoutes = {
  search: (async (req, res) => {
    try {
      const params = new URLSearchParams({ country: "US", limit: "10", ...(req.query as any) } as any);
      const data: any = await swFetch(`/phone_numbers/search?${params.toString()}`);
      const candidates: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.phone_numbers)
        ? data.phone_numbers
        : [];
      const numbers: string[] = candidates
        .map((r: any) => r?.phone_number || r?.number || r?.e164 || (typeof r === "string" ? r : null))
        .filter((n: any) => typeof n === "string");
      res.json({ numbers });
    } catch (e: any) {
      const msg = String(e?.message || e || "SignalWire error");
      const status = msg.includes("401") ? 401 : 502;
      res.status(status).json({ error: msg });
    }
  }) as RequestHandler,
  purchase: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId as string;
      const { phone_number } = req.body || {};
      if (!phone_number) return res.status(400).json({ error: "phone_number required" });

      const me = await User.findById(userId).lean();
      if (!me || me.role !== "main") return res.status(403).json({ error: "Only main accounts can buy numbers" });

      const price = 2.5;
      if ((me.walletBalance ?? 0) < price) return res.status(400).json({ error: "Insufficient wallet balance" });

      const resp = await swFetch(`/phone_numbers`, { method: "POST", body: JSON.stringify({ phone_number }) });

      await User.updateOne({ _id: userId }, { $inc: { walletBalance: -price } });
      await NumberModel.create({ phoneNumber: phone_number, country: resp.country || "US", ownerUserId: userId, providerId: resp.id });

      res.json({ ok: true });
    } catch (e: any) {
      const msg = String(e?.message || e || "SignalWire error");
      const status = msg.includes("401") ? 401 : 502;
      res.status(status).json({ error: msg });
    }
  }) as RequestHandler,
  myNumbers: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const me = await User.findById(userId).lean();
    const q = me?.role === "sub" ? { assignedToUserId: userId } : { ownerUserId: userId };
    const numbers = await NumberModel.find(q).lean();
    res.json({ numbers });
  }) as RequestHandler,
  assign: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const { numberId, subUserId } = req.body || {};
    const number = await NumberModel.findById(numberId);
    if (!number) return res.status(404).json({ error: "Number not found" });
    if (String(number.ownerUserId) !== String(userId)) return res.status(403).json({ error: "Not owner" });
    const sub = await User.findById(subUserId);
    if (!sub || String(sub.parentUserId) !== String(userId)) return res.status(400).json({ error: "Invalid sub-account" });
    number.assignedToUserId = sub._id;
    await number.save();
    res.json({ ok: true });
  }) as RequestHandler,
  unassign: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const { numberId } = req.body || {};
    const number = await NumberModel.findById(numberId);
    if (!number) return res.status(404).json({ error: "Number not found" });
    if (String(number.ownerUserId) !== String(userId)) return res.status(403).json({ error: "Not owner" });
    number.assignedToUserId = undefined;
    await number.save();
    res.json({ ok: true });
  }) as RequestHandler,
};
