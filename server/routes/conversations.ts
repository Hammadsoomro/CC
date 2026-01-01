import { RequestHandler } from "express";
import { Contact, Message, User, NumberModel } from "../models";
import { connectDB } from "../db";

export const conversationRoutes = {
  listContacts: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId;
      const user = await User.findById(userId).lean();
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const contacts = await Contact.find({ userId })
        .sort({ pinned: -1, createdAt: -1 })
        .lean();
      res.json({ contacts });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,

  getConversation: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId;
      const { phone } = req.params;
      if (!phone) return res.status(400).json({ error: "Phone required" });

      const user = await User.findById(userId).lean();
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      let contact = await Contact.findOne({
        userId,
        phoneNumber: phone,
      }).lean();

      const messages = await Message.find({
        $or: [
          { from: phone, ownerUserId: userId },
          { to: phone, ownerUserId: userId },
        ],
      })
        .sort({ createdAt: 1 })
        .limit(100)
        .lean();

      res.json({ contact, messages });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,

  upsertContact: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId;
      const { phoneNumber, name } = req.body;
      if (!phoneNumber)
        return res.status(400).json({ error: "Phone required" });

      const contact = await Contact.findOneAndUpdate(
        { userId, phoneNumber },
        { name, phoneNumber },
        { upsert: true, new: true },
      );

      res.json({ contact });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,

  updateContact: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId;
      const { contactId } = req.params;
      const { name, pinned, folder } = req.body;

      const contact = await Contact.findOne({ _id: contactId, userId });
      if (!contact) return res.status(404).json({ error: "Contact not found" });

      if (name !== undefined) contact.name = name;
      if (pinned !== undefined) contact.pinned = pinned;
      if (folder !== undefined) contact.folder = folder;
      await contact.save();

      res.json({ contact });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,

  deleteContact: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId;
      const { contactId } = req.params;

      const contact = await Contact.findOneAndDelete({
        _id: contactId,
        userId,
      });
      if (!contact) return res.status(404).json({ error: "Contact not found" });

      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,

  sendMessage: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId;
      const { to, body, fromNumber } = req.body;

      if (!to || !body || !fromNumber) {
        return res
          .status(400)
          .json({ error: "to, body, and fromNumber required" });
      }

      const user = await User.findById(userId).lean();
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      let twilioUser = user;
      if (user.role === "sub" && user.parentUserId) {
        const parent = await User.findById(user.parentUserId).lean();
        if (!parent)
          return res.status(400).json({ error: "Parent user not found" });
        twilioUser = parent;
      }

      if (!twilioUser?.twilioAccountSid || !twilioUser?.twilioAuthToken) {
        return res.status(400).json({ error: "Twilio not configured" });
      }

      const auth = Buffer.from(
        `${twilioUser.twilioAccountSid}:${twilioUser.twilioAuthToken}`,
      ).toString("base64");

      const body_form = new URLSearchParams();
      body_form.set("From", fromNumber);
      body_form.set("To", to);
      body_form.set("Body", body);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioUser.twilioAccountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body_form.toString(),
        },
      );

      if (!response.ok) {
        const err = await response.text();
        return res.status(400).json({ error: `Twilio error: ${err}` });
      }

      const twMsg = await response.json();

      const message = await Message.create({
        from: fromNumber,
        to,
        body,
        direction: "outbound",
        ownerUserId: userId,
        providerSid: twMsg.sid,
        status: "sent",
      });

      res.json({ message });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,

  getAvailableNumbers: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId;
      const user = await User.findById(userId).lean();
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      let numberQuery: any = { ownerUserId: userId };

      if (user.role === "sub" && user.parentUserId) {
        numberQuery = {
          $or: [
            { ownerUserId: user.parentUserId, assignedToUserId: userId },
            { ownerUserId: userId },
          ],
        };
      } else if (user.role === "main") {
        numberQuery = {
          $or: [
            { ownerUserId: userId, assignedToUserId: { $exists: false } },
            { ownerUserId: userId, assignedToUserId: null },
          ],
        };
      }

      const numbers = await NumberModel.find(numberQuery).lean();
      res.json({ numbers });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,
};
