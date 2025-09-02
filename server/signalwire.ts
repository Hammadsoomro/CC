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

async function swLaml(path: string, init?: RequestInit) {
  if (!spaceUrl || !apiToken || !projectId) throw new Error("SignalWire env not set");
  const url = `https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}${path}`;
  const basic = Buffer.from(`${projectId}:${apiToken}`).toString("base64");
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Basic ${basic}`,
      "X-SignalWire-Project": projectId,
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
      await connectDB();
      const userId = (req as any).userId as string;
      const me = await User.findById(userId).lean();
      if (!me || me.role !== "main") return res.status(403).json({ error: "Only main accounts can search numbers" });

      const country = String((req.query as any)?.country || "US").toUpperCase();
      const limit = String((req.query as any)?.limit || "10");
      const region = String((req.query as any)?.region || "").toUpperCase();
      const areaCode = String((req.query as any)?.areaCode || "").replace(/[^0-9]/g, "");

      let numbers: string[] = [];
      try {
        const params = new URLSearchParams({ limit, country, capabilities: "SMS" } as any);
        if (region) params.set("region", region);
        if (areaCode) params.set("area_code", areaCode);
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
        numbers = candidates
          .map((r: any) => r?.phone_number || r?.number || r?.e164 || (typeof r === "string" ? r : null))
          .filter((n: any) => typeof n === "string");
      } catch {}

      if (!Array.isArray(numbers) || numbers.length === 0) {
        const params = new URLSearchParams({ SmsEnabled: "true", PageSize: String(limit) } as any);
        if (region) params.set("InRegion", region);
        if (areaCode) params.set("AreaCode", areaCode);
        const laml = await swLaml(`/AvailablePhoneNumbers/${country}/Local.json?${params.toString()}`);
        const items: any[] = Array.isArray(laml?.available_phone_numbers) ? laml.available_phone_numbers : Array.isArray(laml) ? laml : [];
        numbers = items
          .map((r: any) => r?.phone_number || r?.PhoneNumber || r?.friendly_name || null)
          .filter((n: any) => typeof n === "string");
      }

      const uniq = Array.from(new Set(numbers.filter(Boolean)));
      res.json({ numbers: uniq });
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

      const toE164 = (n: string) => {
        const raw = String(n).trim();
        if (raw.startsWith("+")) return raw;
        const digits = raw.replace(/\D/g, "");
        if (digits.length === 10) return "+1" + digits;
        if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
        return "+" + digits;
      };
      const e164 = toE164(phone_number);

      let resp: any;
      try {
        resp = await swFetch(`/phone_numbers`, { method: "POST", body: JSON.stringify({ number: e164 }) });
      } catch (err) {
        resp = await swFetch(`/phone_numbers`, { method: "POST", body: JSON.stringify({ phone_number: e164 }) });
      }

      await User.updateOne({ _id: userId }, { $inc: { walletBalance: -price } });
      await NumberModel.create({ phoneNumber: e164, country: resp.country || "US", ownerUserId: userId, providerId: resp.id });

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

  addExisting: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const { phone_number, country } = req.body || {};
    if (!phone_number) return res.status(400).json({ error: "phone_number required" });
    const me = await User.findById(userId).lean();
    if (!me || me.role !== "main") return res.status(403).json({ error: "Only main accounts can add numbers" });
    const toE164 = (n: string) => {
      const raw = String(n).trim();
      if (raw.startsWith("+")) return raw;
      const digits = raw.replace(/\D/g, "");
      if (digits.length === 10) return "+1" + digits;
      if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
      return "+" + digits;
    };
    const e164 = toE164(phone_number);
    const exists = await NumberModel.findOne({ phoneNumber: e164 }).lean();
    if (exists) return res.status(400).json({ error: "Number already exists" });
    await NumberModel.create({ phoneNumber: e164, country: (country || "US").toUpperCase(), ownerUserId: userId });
    res.json({ ok: true });
  }) as RequestHandler,
};
