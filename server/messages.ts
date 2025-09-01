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

      let fromNumber = from as string | undefined;
      if (!fromNumber) {
        // pick first allowed number
        if (me.role === "main") {
          const n = await NumberModel.findOne({ ownerUserId: userId }).lean();
          fromNumber = n?.phoneNumber;
        } else {
          const n = await NumberModel.findOne({ assignedToUserId: userId }).lean();
          fromNumber = n?.phoneNumber;
        }
      }
      if (!fromNumber) return res.status(400).json({ error: "No sending number available" });

      // Verify permission
      const allowed = await NumberModel.findOne({ phoneNumber: fromNumber, $or: [{ ownerUserId: userId }, { assignedToUserId: userId }] }).lean();
      if (!allowed) return res.status(403).json({ error: "Not allowed to use this number" });

      const form = new URLSearchParams({ To: to, From: fromNumber, Body: String(body) });
      const resp = await swLaml(`/Messages.json`, { method: "POST", body: form as any });
      res.json({ ok: true, sid: resp.sid });
    } catch (e: any) {
      const msg = String(e?.message || e);
      const status = msg.includes("401") ? 401 : 502;
      res.status(status).json({ error: msg });
    }
  }) as RequestHandler,
};
