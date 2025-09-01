import type { RequestHandler } from "express";
import { User } from "./models";
import { connectDB } from "./db";
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export const accountRoutes = {
  profileGet: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: "not found" });
    res.json({ user: { firstName: user.firstName, lastName: user.lastName, phone: user.phone } });
  }) as RequestHandler,
  profileUpdate: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const { firstName, lastName, phone } = req.body || {};
    await User.updateOne({ _id: userId }, { $set: { firstName, lastName, phone } });
    res.json({ ok: true });
  }) as RequestHandler,

  subList: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const subs = await User.find({ parentUserId: userId }).lean();
    res.json({ subs });
  }) as RequestHandler,
  subCreate: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const me = await User.findById(userId).lean();
    if (!me || me.role !== "main") return res.status(403).json({ error: "Only main accounts can create sub-accounts" });
    const { email, password, firstName, lastName, phone } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email/password required" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "email already used" });
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.default.hash(password, 10);
    const sub = await User.create({ email, passwordHash, firstName, lastName, phone, role: "sub", parentUserId: userId, walletBalance: 0 });
    res.json({ sub: { id: sub._id, email: sub.email } });
  }) as RequestHandler,

  createCheckoutSession: (async (req, res) => {
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });
    await connectDB();
    const userId = (req as any).userId as string;
    const me = await User.findById(userId).lean();
    if (!me || me.role !== "main") return res.status(403).json({ error: "Only main accounts can deposit" });
    const { amount } = req.body || {};
    const domain = `${req.protocol}://${req.get("host")}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(Number(amount) * 100),
            product_data: { name: "Wallet Top-up" },
          },
          quantity: 1,
        },
      ],
      success_url: `${domain}/wallet?status=success`,
      cancel_url: `${domain}/wallet?status=cancel`,
      metadata: {},
    });
    res.json({ url: session.url });
  }) as RequestHandler,

  transferToSub: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const { toSubUserId, amount } = req.body || {};
    const amt = Number(amount);
    if (!(amt > 0)) return res.status(400).json({ error: "invalid amount" });

    const main = await User.findById(userId);
    const sub = await User.findById(toSubUserId);
    if (!main || !sub) return res.status(404).json({ error: "user not found" });
    if (sub.role !== "sub" || String(sub.parentUserId) !== String(main._id)) return res.status(403).json({ error: "not your sub-account" });
    if ((main.walletBalance ?? 0) < amt) return res.status(400).json({ error: "insufficient balance" });

    await User.updateOne({ _id: main._id }, { $inc: { walletBalance: -amt } });
    await User.updateOne({ _id: sub._id }, { $inc: { walletBalance: amt } });
    res.json({ ok: true });
  }) as RequestHandler,
};
