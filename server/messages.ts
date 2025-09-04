import type { RequestHandler } from "express";
import type { RequestHandler } from "express";
import { connectDB } from "./db";
import { NumberModel, User, Message } from "./models";

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

const toE164 = (n: string) => {
  const raw = String(n || "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return raw.replace(/\s|\(|\)|-/g, "");
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return "+" + digits;
};

const streams = new Map<string, Set<any>>();

function sendEvent(userId: string, event: string, data: any) {
  const set = streams.get(userId);
  if (!set) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of Array.from(set)) {
    try { res.write(payload); } catch { try { set.delete(res); } catch {} }
  }
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

      const candidates = await NumberModel.find({ $or: [{ ownerUserId: userId }, { assignedToUserId: userId }] }).lean();
      const numberDoc = candidates.find((n: any) => toE164(String(n.phoneNumber)) === fromE164);
      if (!numberDoc) return res.status(403).json({ error: "Not allowed to use this number" });

      const form = new URLSearchParams({ To: toE, From: fromE164, Body: String(body) });
      const resp = await swLaml(`/Messages.json`, { method: "POST", body: form as any });

      const doc = await Message.create({
        numberId: numberDoc._id,
        ownerUserId: numberDoc.ownerUserId,
        assignedToUserId: numberDoc.assignedToUserId,
        from: fromE164,
        to: toE,
        body: String(body),
        direction: "outbound",
        providerSid: resp?.sid,
        status: "sent",
      });

      const targets = [numberDoc.ownerUserId, numberDoc.assignedToUserId].filter(Boolean).map(String);
      for (const uid of targets) sendEvent(uid, "message", { id: doc._id, from: fromE164, to: toE, body: String(body), direction: "outbound", createdAt: new Date().toISOString() });

      res.json({ ok: true, sid: resp.sid });
    } catch (e: any) {
      const msg = String(e?.message || e);
      const status = msg.includes("401") ? 401 : 502;
      res.status(status).json({ error: msg });
    }
  }) as RequestHandler,

  history: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId as string;
      const number = toE164(String((req.query.number as string) || ""));
      const other = toE164(String((req.query.with as string) || ""));
      if (!number || !other) return res.status(400).json({ error: "number and with required" });

      const allowed = await NumberModel.find({ $or: [{ ownerUserId: userId }, { assignedToUserId: userId }] }).lean();
      const numberDoc = allowed.find((n: any) => toE164(String(n.phoneNumber)) === number);
      if (!numberDoc) return res.status(403).json({ error: "Not allowed" });

      const messages = await Message.find({ numberId: numberDoc._id, $or: [{ to: other }, { from: other }] }).sort({ createdAt: 1 }).lean();
      res.json({ messages });
    } catch (e: any) {
      const msg = String(e?.message || e);
      res.status(500).json({ error: msg });
    }
  }) as RequestHandler,

  incoming: (async (req, res) => {
    try {
      await connectDB();
      const from = toE164(String((req.body?.From as string) || (req.body?.from as string) || ""));
      const to = toE164(String((req.body?.To as string) || (req.body?.to as string) || ""));
      const body = String((req.body?.Body as string) || (req.body?.body as string) || "");
      const providerSid = String((req.body?.MessageSid as string) || (req.body?.messageSid as string) || "");
      if (!from || !to || !body) {
        res.status(200).send("OK");
        return;
      }

      const numberDoc = await NumberModel.findOne({ $or: [{ phoneNumber: to }, { phoneNumber: from }] }).lean();
      let targetNumber = numberDoc;
      if (!targetNumber) {
        const candidates = await NumberModel.find({}).lean();
        targetNumber = candidates.find((n: any) => toE164(String(n.phoneNumber)) === to) || null;
      }

      const doc = await Message.create({
        numberId: targetNumber?._id,
        ownerUserId: targetNumber?.ownerUserId,
        assignedToUserId: targetNumber?.assignedToUserId,
        from,
        to,
        body,
        direction: "inbound",
        providerSid,
        status: "received",
      });

      const targets = [targetNumber?.ownerUserId, targetNumber?.assignedToUserId].filter(Boolean).map(String);
      for (const uid of targets) sendEvent(uid, "message", { id: doc._id, from, to, body, direction: "inbound", createdAt: new Date().toISOString() });

      res.status(200).send("OK");
    } catch (_e) {
      res.status(200).send("OK");
    }
  }) as RequestHandler,

  stream: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId as string;
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write(`event: hello\ndata: {"ok":true}\n\n`);
      const set = streams.get(userId) || new Set<any>();
      set.add(res);
      streams.set(userId, set);
      const heartbeat = setInterval(() => {
        try { res.write(`event: ping\ndata: {}\n\n`); } catch {}
      }, 30000);
      req.on("close", () => {
        clearInterval(heartbeat);
        try { set.delete(res); } catch {}
      });
    } catch {
      res.status(401).end();
    }
  }) as RequestHandler,
};
