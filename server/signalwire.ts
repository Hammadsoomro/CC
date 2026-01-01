import type { RequestHandler } from "express";
import { NumberModel, User } from "./models";
import { connectDB } from "./db";

async function getTwilioUser(userId: string) {
  let user = await User.findById(userId).lean();
  if (!user) throw new Error("User not found");
  if (user.role === "sub" && user.parentUserId) {
    user = await User.findById(user.parentUserId).lean();
  }
  if (!user?.twilioAccountSid || !user?.twilioAuthToken) {
    throw new Error("Twilio credentials not configured");
  }
  return user;
}

async function twilioFetch(
  path: string,
  accountSid: string,
  authToken: string,
  init?: RequestInit,
) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}${path}`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(init?.headers as any),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio error ${res.status}: ${err}`);
  }
  return res.json();
}

export const numberRoutes = {
  search: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId as string;
      const me = await User.findById(userId).lean();
      if (!me || me.role !== "main") {
        return res
          .status(403)
          .json({ error: "Only main accounts can search numbers" });
      }

      const user = await getTwilioUser(userId);
      const country = String((req.query as any)?.country || "US").toUpperCase();
      const limit = String((req.query as any)?.limit || "10");
      const region = String((req.query as any)?.region || "").toUpperCase();

      const params = new URLSearchParams({
        SmsEnabled: "true",
        PageSize: limit,
      } as any);
      if (region) params.set("InRegion", region);

      const path = `/AvailablePhoneNumbers/${country}/Local.json?${params.toString()}`;
      const data = await twilioFetch(
        path,
        user.twilioAccountSid,
        user.twilioAuthToken,
      );

      const items: any[] = Array.isArray(data?.available_phone_numbers)
        ? data.available_phone_numbers
        : [];
      const numbers = items
        .map((r: any) => r?.phone_number || null)
        .filter((n: any) => typeof n === "string");

      const uniq = Array.from(new Set(numbers.filter(Boolean)));
      res.json({ numbers: uniq });
    } catch (e: any) {
      const msg = String(e?.message || e || "Twilio error");
      const status =
        msg.includes("401") || msg.includes("Unauthorized") ? 401 : 502;
      res.status(status).json({ error: msg });
    }
  }) as RequestHandler,
  purchase: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId as string;
      const { phone_number } = req.body || {};
      if (!phone_number) {
        return res.status(400).json({ error: "phone_number required" });
      }

      const me = await User.findById(userId).lean();
      if (!me || me.role !== "main") {
        return res
          .status(403)
          .json({ error: "Only main accounts can buy numbers" });
      }

      const price = 2.5;
      if ((me.walletBalance ?? 0) < price) {
        return res.status(400).json({ error: "Insufficient wallet balance" });
      }

      const user = await getTwilioUser(userId);

      const toE164 = (n: string) => {
        const raw = String(n).trim();
        if (raw.startsWith("+")) return raw;
        const digits = raw.replace(/\D/g, "");
        if (digits.length === 10) return "+1" + digits;
        if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
        return "+" + digits;
      };
      const e164 = toE164(phone_number);

      const body = new URLSearchParams();
      body.set("PhoneNumber", e164);
      body.set("FriendlyName", `Number for SMS`);

      const resp = await twilioFetch(
        `/IncomingPhoneNumbers.json`,
        user.twilioAccountSid,
        user.twilioAuthToken,
        {
          method: "POST",
          body: body.toString(),
        },
      );

      await User.updateOne(
        { _id: userId },
        { $inc: { walletBalance: -price } },
      );
      await NumberModel.create({
        phoneNumber: e164,
        country: "US",
        ownerUserId: userId,
        providerId: resp.sid,
      });

      try {
        const { Transaction } = await import("./models");
        await Transaction.create({
          userId,
          type: "purchase",
          amount: price,
          meta: {
            kind: "number",
            phoneNumber: e164,
            providerId: resp?.sid,
          },
        });
      } catch {}

      res.json({ ok: true });
    } catch (e: any) {
      const raw = String(e?.message || e || "Twilio error");
      const status =
        raw.includes("401") || raw.includes("Unauthorized")
          ? 401
          : raw.includes("422")
            ? 400
            : 502;
      const msg =
        raw.includes("21212") || raw.toLowerCase().includes("invalid")
          ? "Invalid number format or unavailable. Please choose another number/region."
          : raw;
      res.status(status).json({ error: msg });
    }
  }) as RequestHandler,
  myNumbers: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const me = await User.findById(userId).lean();
    const q =
      me?.role === "sub"
        ? { assignedToUserId: userId }
        : { ownerUserId: userId };
    const numbers = await NumberModel.find(q).lean();
    res.json({ numbers });
  }) as RequestHandler,
  assign: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const { numberId, subUserId } = req.body || {};
    const number = await NumberModel.findById(numberId);
    if (!number) return res.status(404).json({ error: "Number not found" });
    if (String(number.ownerUserId) !== String(userId))
      return res.status(403).json({ error: "Not owner" });
    const sub = await User.findById(subUserId);
    if (!sub || String(sub.parentUserId) !== String(userId))
      return res.status(400).json({ error: "Invalid sub-account" });
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
    if (String(number.ownerUserId) !== String(userId))
      return res.status(403).json({ error: "Not owner" });
    number.assignedToUserId = undefined;
    await number.save();
    res.json({ ok: true });
  }) as RequestHandler,

  addExisting: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const { phone_number, country } = req.body || {};
    if (!phone_number)
      return res.status(400).json({ error: "phone_number required" });
    const me = await User.findById(userId).lean();
    if (!me || me.role !== "main")
      return res
        .status(403)
        .json({ error: "Only main accounts can add numbers" });
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
    await NumberModel.create({
      phoneNumber: e164,
      country: (country || "US").toUpperCase(),
      ownerUserId: userId,
    });
    res.json({ ok: true });
  }) as RequestHandler,
};
