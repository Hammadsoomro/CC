import type { RequestHandler } from "express";
import { User } from "./models";
import { connectDB } from "./db";
import Stripe from "stripe";
import { getMaxSubsForPlan } from "./plans";

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

    const currentCount = await User.countDocuments({ parentUserId: userId });
    const maxSubs = getMaxSubsForPlan(me.plan);
    if (currentCount >= maxSubs) return res.status(403).json({ error: `Plan limit reached: max ${maxSubs} sub-accounts` });

    const { email, password, firstName, lastName, phone, walletLimit } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email/password required" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "email already used" });
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.default.hash(password, 10);
    const sub = await User.create({ email, passwordHash, firstName, lastName, phone, role: "sub", parentUserId: userId, walletBalance: 0, walletLimit });
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
      metadata: { userId },
    });
    res.json({ url: session.url });
  }) as RequestHandler,

  createPaymentIntent: (async (req, res) => {
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });
    await connectDB();
    const userId = (req as any).userId as string;
    const me = await User.findById(userId).lean();
    if (!me || me.role !== "main") return res.status(403).json({ error: "Only main accounts can deposit" });
    const { amount } = req.body || {};
    const amt = Math.round(Number(amount) * 100);
    if (!(amt > 0)) return res.status(400).json({ error: "invalid amount" });
    const pi = await stripe.paymentIntents.create({
      amount: amt,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { userId, type: "wallet_topup", amount: String(amt) },
    });
    res.json({ clientSecret: pi.client_secret, id: pi.id });
  }) as RequestHandler,

  confirmDeposit: (async (req, res) => {
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });
    await connectDB();
    const userId = (req as any).userId as string;
    const { paymentIntentId } = req.body || {};
    if (!paymentIntentId) return res.status(400).json({ error: "paymentIntentId required" });
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== "succeeded") return res.status(400).json({ error: "payment not completed" });
    if (pi.metadata?.userId !== String(userId)) return res.status(403).json({ error: "mismatched user" });
    const received = (pi.amount_received ?? 0) / 100;
    if (!(received > 0)) return res.status(400).json({ error: "no amount received" });
    await User.updateOne({ _id: userId }, { $inc: { walletBalance: received } });
    res.json({ ok: true, added: received });
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

    if (typeof sub.walletLimit === "number" && sub.walletLimit >= 0) {
      const next = (sub.walletBalance ?? 0) + amt;
      if (next > sub.walletLimit) return res.status(400).json({ error: "exceeds sub-account wallet limit" });
    }

    await User.updateOne({ _id: main._id }, { $inc: { walletBalance: -amt } });
    await User.updateOne({ _id: sub._id }, { $inc: { walletBalance: amt } });
    res.json({ ok: true });
  }) as RequestHandler,

  subUpdate: (async (req, res) => {
    await connectDB();
    const mainId = (req as any).userId as string;
    const subId = req.params.id;
    const me = await User.findById(mainId).lean();
    if (!me || me.role !== "main") return res.status(403).json({ error: "Only main accounts can edit sub-accounts" });
    const sub = await User.findById(subId);
    if (!sub || String(sub.parentUserId) !== String(mainId)) return res.status(404).json({ error: "sub-account not found" });

    const { firstName, lastName, email, password, walletLimit } = req.body || {};
    if (email && email !== sub.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ error: "email already used" });
    }

    const update: any = { firstName, lastName, email, walletLimit };
    if (password) {
      const bcrypt = await import("bcryptjs");
      update.passwordHash = await bcrypt.default.hash(password, 10);
    }

    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
    await User.updateOne({ _id: sub._id }, { $set: update });
    res.json({ ok: true });
  }) as RequestHandler,

  subDelete: (async (req, res) => {
    await connectDB();
    const mainId = (req as any).userId as string;
    const subId = req.params.id;
    const sub = await User.findById(subId);
    if (!sub) return res.status(404).json({ error: "not found" });
    if (sub.role !== "sub" || String(sub.parentUserId) !== String(mainId)) return res.status(403).json({ error: "not your sub-account" });

    await User.deleteOne({ _id: sub._id });
    res.json({ ok: true });
  }) as RequestHandler,

  choosePlan: (async (req, res) => {
    await connectDB();
    const userId = (req as any).userId as string;
    const { plan } = req.body || {};
    const planKey = String(plan || "").toLowerCase();
    const prices: Record<string, number> = { starter: 9, professional: 19, enterprise: 49 };
    if (!prices[planKey]) return res.status(400).json({ error: "invalid plan" });

    const me = await User.findById(userId).lean();
    if (!me || me.role !== "main") return res.status(403).json({ error: "Only main accounts can choose plans" });
    const amount = prices[planKey];
    if ((me.walletBalance ?? 0) < amount) return res.status(400).json({ error: "Insufficient wallet balance" });

    await User.updateOne({ _id: userId }, { $set: { plan: planKey }, $inc: { walletBalance: -amount } });
    res.json({ ok: true, plan: planKey });
  }) as RequestHandler,
};
