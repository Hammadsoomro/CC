import type { RequestHandler } from "express";
import { NumberModel, User } from "./models";
import { connectDB } from "./db";

const spaceUrl = process.env.SIGNALWIRE_SPACE_URL;
const token = process.env.SIGNALWIRE_TOKEN;

async function swFetch(path: string, init?: RequestInit) {
  if (!spaceUrl || !token) throw new Error("SignalWire env not set");
  const url = `https://${spaceUrl}/api/relay/rest${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
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
    const { country = "US", limit = 10 } = req.query as any;
    const data = await swFetch(`/phone_numbers/search?country=${encodeURIComponent(country)}&limit=${encodeURIComponent(limit)}`);
    res.json(data);
  }) as RequestHandler,
  purchase: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const { phone_number } = req.body || {};
    if (!phone_number) return res.status(400).json({ error: "phone_number required" });

    const me = await User.findById(userId).lean();
    if (!me || me.role !== "main") return res.status(403).json({ error: "Only main accounts can buy numbers" });

    // charge $2.50 from wallet
    const price = 2.5;
    if ((me.walletBalance ?? 0) < price) return res.status(400).json({ error: "Insufficient wallet balance" });

    const resp = await swFetch(`/phone_numbers`, { method: "POST", body: JSON.stringify({ phone_number }) });

    await User.updateOne({ _id: userId }, { $inc: { walletBalance: -price } });
    await NumberModel.create({ phoneNumber: phone_number, country: resp.country || "US", ownerUserId: userId, providerId: resp.id });

    res.json({ ok: true });
  }) as RequestHandler,
  myNumbers: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const numbers = await NumberModel.find({ ownerUserId: userId }).lean();
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
