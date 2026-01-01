import { RequestHandler } from "express";
import { Message, NumberModel, User } from "../models";
import { connectDB } from "../db";

export const twilioWebhooks = {
  incomingSms: (async (req, res) => {
    try {
      await connectDB();
      const { From, To, Body, MessageSid } = req.body;

      if (!From || !To || !Body) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const number = await NumberModel.findOne({ phoneNumber: To }).lean();
      if (!number) {
        return res.status(404).json({ error: "Number not found" });
      }

      const ownerUserId = number.ownerUserId;
      const assignedToUserId = number.assignedToUserId;

      const message = await Message.create({
        from: From,
        to: To,
        body: Body,
        direction: "inbound",
        ownerUserId,
        assignedToUserId,
        providerSid: MessageSid,
        status: "received",
      });

      if (global.io) {
        global.io.emit("sms:new", {
          message: message.toObject(),
          from: From,
          to: To,
        });

        if (ownerUserId) {
          global.io.to(String(ownerUserId)).emit("sms:new", {
            message: message.toObject(),
            from: From,
            to: To,
          });
        }

        if (assignedToUserId) {
          global.io.to(String(assignedToUserId)).emit("sms:new", {
            message: message.toObject(),
            from: From,
            to: To,
          });
        }
      }

      res.json({ ok: true });
    } catch (e: any) {
      console.error("Webhook error:", e);
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,

  messageStatus: (async (req, res) => {
    try {
      await connectDB();
      const { MessageSid, MessageStatus } = req.body;

      if (!MessageSid) {
        return res.status(400).json({ error: "MessageSid required" });
      }

      await Message.updateOne(
        { providerSid: MessageSid },
        { status: MessageStatus },
      );

      res.json({ ok: true });
    } catch (e: any) {
      console.error("Status webhook error:", e);
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,
};
