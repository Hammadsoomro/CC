import type { RequestHandler } from "express";
import { connectDB } from "./db";
import { NumberModel, Transaction, User } from "./models";

const PLAN_PRICES: Record<string, number> = { starter: 9, professional: 19, enterprise: 49 };
const NUMBER_PRICE = 2.5;

export const walletRoutes = {
  startJazzCash: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId as string;
      const { amount } = req.body || {};
      const amt = Number(amount);
      if (!(amt > 0)) return res.status(400).json({ error: "invalid amount" });
      const { Checkout } = await import("./models");
      const checkout = await Checkout.create({ userId, amount: amt, method: "jazzcash", status: "pending", meta: {} });
      const configured = !!process.env.JAZZCASH_MERCHANT_ID;
      if (!configured) return res.status(501).json({ error: "JazzCash not configured", checkoutId: checkout._id });
      res.json({ checkoutId: checkout._id });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,
  startEasyPaisa: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId as string;
      const { amount } = req.body || {};
      const amt = Number(amount);
      if (!(amt > 0)) return res.status(400).json({ error: "invalid amount" });
      const { Checkout } = await import("./models");
      const checkout = await Checkout.create({ userId, amount: amt, method: "easypaisa", status: "pending", meta: {} });
      const configured = !!process.env.EASYPAY_MERCHANT_ID;
      if (!configured) return res.status(501).json({ error: "EasyPaisa not configured", checkoutId: checkout._id });
      res.json({ checkoutId: checkout._id });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,
  transactions: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId as string;
      const tx = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(100).lean();
      res.json({ transactions: tx });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,

  summary: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId as string;
      const me = await User.findById(userId).lean();
      if (!me) return res.status(401).json({ error: "Unauthorized" });
      const q = me.role === "sub" ? { assignedToUserId: userId } : { ownerUserId: userId };
      const numbers = await NumberModel.find(q).select("phoneNumber").lean();
      const planKey = String(me.plan || "free");
      const planRent = PLAN_PRICES[planKey] ?? 0;
      const numbersRent = numbers.length * NUMBER_PRICE;
      const total = planRent + numbersRent;
      const perNumber = numbers.map((n) => ({ phoneNumber: n.phoneNumber, monthly: NUMBER_PRICE }));
      res.json({ plan: planKey, planRent, numbersRent, total, perNumber });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,
};
