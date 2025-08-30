import type { RequestHandler } from "express";
import { Contact } from "./models";
import { connectDB } from "./db";

export const contactRoutes = {
  list: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const contacts = await Contact.find({ userId }).sort({ pinned: -1, updatedAt: -1 }).lean();
    res.json({ contacts });
  }) as RequestHandler,
  create: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const { phoneNumber, name } = req.body || {};
    if (!phoneNumber) return res.status(400).json({ error: "phoneNumber required" });
    const contact = await Contact.create({ userId, phoneNumber, name });
    res.json({ contact });
  }) as RequestHandler,
  update: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const { id } = req.params as any;
    const { name, pinned, favorite } = req.body || {};
    const contact = await Contact.findOneAndUpdate({ _id: id, userId }, { $set: { name, pinned, favorite } }, { new: true });
    if (!contact) return res.status(404).json({ error: "not found" });
    res.json({ contact });
  }) as RequestHandler,
  remove: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const { id } = req.params as any;
    await Contact.deleteOne({ _id: id, userId });
    res.json({ ok: true });
  }) as RequestHandler,
};
