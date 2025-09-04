import { RequestHandler } from "express";
import { connectDB } from "./db";
import { PasswordRequest, User } from "./models";

export const passwordRequestRoutes = {
  create: (async (req, res) => {
    await connectDB();
    const email = String((req.body?.email as string) || "").trim().toLowerCase();
    const phone = String((req.body?.phone as string) || "").trim();
    const firstName = String((req.body?.firstName as string) || "").trim();
    const lastName = String((req.body?.lastName as string) || "").trim();

    if (!email || !phone) return res.status(400).json({ error: "email and phone required" });
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(400).json({ error: "No account with this email" });

    if ((user.phone || "").trim() !== phone) return res.status(400).json({ error: "Details do not match" });
    if (firstName && (user.firstName || "").trim().toLowerCase() !== firstName.toLowerCase()) return res.status(400).json({ error: "Details do not match" });
    if (lastName && (user.lastName || "").trim().toLowerCase() !== lastName.toLowerCase()) return res.status(400).json({ error: "Details do not match" });

    const pr = await PasswordRequest.create({ userId: user._id, email, phone, firstName, lastName, status: "pending" });
    res.json({ ok: true, requestId: pr._id });
  }) as RequestHandler,
};
