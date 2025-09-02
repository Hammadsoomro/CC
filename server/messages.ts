import type { RequestHandler } from "express";
import { connectDB } from "./db";
import { NumberModel, User } from "./models";

const spaceUrl = process.env.SIGNALWIRE_SPACE_URL;
const apiToken = process.env.SIGNALWIRE_TOKEN;
const projectId = process.env.SIGNALWIRE_PROJECT_ID;

async function swLaml(path: string, init?: RequestInit) {
  if (!spaceUrl || !apiToken || !projectId) throw new Error("SignalWire env not set");
  const url = `https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}${path}`;
  const basic = Buffer.from(`${projectId}:${apiToken}`).toString("base64");
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Basic ${basic}`,
      ...(init?.headers as any),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SignalWire error ${res.status}: ${err}`);
  }
  return res.json();
}

export const messageRoutes = {
  send: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId as string;
      const { to, body, from } = req.body || {};
      if (!to || !body) return res.status(400).json({ error: "to and body required" });

      const me = await User.findById(userId).lean();
      if (!me) return res.status(401).json({ error: "Unauthorized" });

      const toE164 = (n: string) => {
        const raw = String(n || "").trim();
        if (!raw) return "";
        if (raw.startsWith("+")) return raw.replace(/\s|\(|\)|-/g, "");
        const digits = raw.replace(/\D/g, "");
        if (digits.length === 10) return "+1" + digits; // default country US if local 10-digit
        if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
        return "+" + digits;
      };

      let fromNumber = from as string | undefined;
      if (!fromNumber) {
        if (me.role === "main") {
          const n = await NumberModel.findOne({ ownerUserId: userId }).lean();
          fromNumber = n?.phoneNumber;
        } else {
          const n = await NumberModel.findOne({ assignedToUserId: userId }).lean();
          fromNumber = n?.phoneNumber;
        }
      }
      if (!fromNumber) return res.status(400).json({ error: "No sending number available" });

      const fromE164 = toE164(fromNumber);
      const toE = toE164(to);

      // Verify permission (normalize DB numbers to E.164 before comparing)
      const candidates = await NumberModel.find({ $or: [{ ownerUserId: userId }, { assignedToUserId: userId }] }).lean();
      const has = candidates.some((n: any) => toE164(String(n.phoneNumber)) === fromE164);
      if (!has) return res.status(403).json({ error: "Not allowed to use this number" });

      const form = new URLSearchParams({ To: toE, From: fromE164, Body: String(body) });
      const resp = await swLaml(`/Messages.json`, { method: "POST", body: form as any });
      res.json({ ok: true, sid: resp.sid });
    } catch (e: any) {
      const msg = String(e?.message || e);
      const status = msg.includes("401") ? 401 : 502;
      res.status(status).json({ error: msg });
    }
  }) as RequestHandler,
};
