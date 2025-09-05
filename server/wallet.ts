import type { RequestHandler } from "express";
import { connectDB } from "./db";
import { NumberModel, Transaction, User } from "./models";
import crypto from "crypto";
import mongoose from "mongoose";

const PLAN_PRICES: Record<string, number> = {
  starter: 9,
  professional: 19,
  enterprise: 49,
};
const NUMBER_PRICE = 2.5;

function nowTimestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}${MM}${dd}${hh}${mm}${ss}`;
}

function hmacSha256Hex(key: string, data: string) {
  return crypto
    .createHmac("sha256", key)
    .update(data, "utf8")
    .digest("hex")
    .toUpperCase();
}

function buildJazzCashParams(opts: {
  amount: number;
  checkoutId: string;
  userId: string;
}) {
  const endpoint =
    process.env.JAZZCASH_ENDPOINT ||
    "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform";
  const merchantId = process.env.JAZZCASH_MERCHANT_ID || "";
  const password = process.env.JAZZCASH_PASSWORD || "";
  const salt = process.env.JAZZCASH_INTEGRITY_SALT || "";
  const returnURL = process.env.JAZZCASH_RETURN_URL || "";
  const txnType = process.env.JAZZCASH_TXN_TYPE || "MWALLET";
  if (!merchantId || !password || !salt || !returnURL)
    throw new Error("JazzCash env missing");

  const txnRefNo = `T${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const billRef = String(opts.checkoutId);
  const amountPaisa = Math.round(opts.amount * 100);

  const now = nowTimestamp();
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  const expiry = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

  const params: Record<string, string> = {
    pp_Version: "1.1",
    pp_TxnType: txnType,
    pp_Language: "EN",
    pp_MerchantID: merchantId,
    pp_Password: password,
    pp_TxnRefNo: txnRefNo,
    pp_Amount: String(amountPaisa),
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: now,
    pp_TxnExpiryDateTime: expiry,
    pp_BillReference: billRef,
    pp_Description: "Wallet Top-up",
    pp_ReturnURL: returnURL,
    pp_SubMerchantID: "",
    ppmpf_1: String(opts.userId),
    ppmpf_2: "",
    ppmpf_3: "",
    ppmpf_4: "",
    ppmpf_5: "",
  };

  const order = [
    "pp_Amount",
    "pp_BillReference",
    "pp_Description",
    "pp_Language",
    "pp_MerchantID",
    "pp_Password",
    "pp_ReturnURL",
    "pp_SubMerchantID",
    "pp_TxnCurrency",
    "pp_TxnDateTime",
    "pp_TxnExpiryDateTime",
    "pp_TxnRefNo",
    "pp_TxnType",
    "pp_Version",
    "ppmpf_1",
    "ppmpf_2",
    "ppmpf_3",
    "ppmpf_4",
    "ppmpf_5",
  ];

  const values: string[] = [];
  values.push(salt);
  for (const key of order) {
    const v = params[key];
    if (v !== undefined && v !== null && String(v) !== "")
      values.push(String(v));
  }
  const dataToHash = values.join("&");
  const pp_SecureHash = hmacSha256Hex(salt, dataToHash);

  return { endpoint, params: { ...params, pp_SecureHash } };
}

function verifyJazzCashHash(payload: Record<string, any>) {
  const salt = process.env.JAZZCASH_INTEGRITY_SALT || "";
  if (!salt) return false;

  const order = [
    "pp_Amount",
    "pp_BillReference",
    "pp_Description",
    "pp_Language",
    "pp_MerchantID",
    "pp_Password",
    "pp_ReturnURL",
    "pp_SubMerchantID",
    "pp_TxnCurrency",
    "pp_TxnDateTime",
    "pp_TxnExpiryDateTime",
    "pp_TxnRefNo",
    "pp_TxnType",
    "pp_Version",
    "ppmpf_1",
    "ppmpf_2",
    "ppmpf_3",
    "ppmpf_4",
    "ppmpf_5",
  ];
  const values: string[] = [];
  values.push(salt);
  for (const key of order) {
    const v = payload[key];
    if (v !== undefined && v !== null && String(v) !== "")
      values.push(String(v));
  }
  const dataToHash = values.join("&");
  const expected = hmacSha256Hex(salt, dataToHash);
  const provided = String(payload["pp_SecureHash"] || "").toUpperCase();
  if (expected === provided) return true;

  const map: Record<string, string> = {};
  for (const k in payload)
    if (k !== "pp_SecureHash" && k.startsWith("pp_"))
      map[k] = String(payload[k]);
  const canonical = Object.keys(map)
    .sort()
    .map((k) => `${k}=${map[k]}`)
    .join("&");
  const alt = hmacSha256Hex(salt, canonical);
  return alt === provided;
}

export const walletRoutes = {
  startJazzCash: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId as string;
      const { amount } = req.body || {};
      const amt = Number(amount);
      if (!(amt > 0)) return res.status(400).json({ error: "invalid amount" });
      const { Checkout } = await import("./models");
      const checkout = await Checkout.create({
        userId,
        amount: amt,
        method: "jazzcash",
        status: "pending",
        meta: {},
      });
      const configured =
        !!process.env.JAZZCASH_MERCHANT_ID &&
        !!process.env.JAZZCASH_PASSWORD &&
        !!process.env.JAZZCASH_INTEGRITY_SALT &&
        !!process.env.JAZZCASH_RETURN_URL;
      if (!configured)
        return res
          .status(501)
          .json({ error: "JazzCash not configured", checkoutId: checkout._id });

      const { endpoint, params } = buildJazzCashParams({
        amount: amt,
        checkoutId: String(checkout._id),
        userId,
      });
      checkout.meta = {
        ...(checkout.meta || {}),
        txnRefNo: params.pp_TxnRefNo,
        billRef: params.pp_BillReference,
        amountPaisa: params.pp_Amount,
      };
      await checkout.save();

      res.json({ checkoutId: checkout._id, endpoint, params });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,

  jazzcashIPN: (async (req, res) => {
    try {
      await connectDB();
      const body = (req as any).body || {};
      if (!verifyJazzCashHash(body))
        return res.status(400).send("INVALID_HASH");

      const { Checkout } = await import("./models");
      const billRef = String(body.pp_BillReference || "");
      if (!billRef) return res.status(400).send("MISSING_BILL_REF");

      const checkout = await Checkout.findById(
        new mongoose.Types.ObjectId(billRef),
      );
      if (!checkout) return res.status(404).send("CHECKOUT_NOT_FOUND");

      const responseCode = String(body.pp_ResponseCode || "");
      const success = responseCode === "000";

      checkout.meta = { ...(checkout.meta || {}), ipn: body };
      if (success && checkout.status !== "succeeded") {
        checkout.status = "succeeded";
        await checkout.save();
        const amount = Number(checkout.amount);
        await User.updateOne(
          { _id: checkout.userId },
          { $inc: { walletBalance: amount } },
        );
        await Transaction.create({
          userId: checkout.userId,
          type: "deposit",
          amount,
          meta: {
            method: "jazzcash",
            txnRefNo: body.pp_TxnRefNo,
            billRef: body.pp_BillReference,
          },
        });
        return res.status(200).send("OK");
      } else if (!success && checkout.status !== "failed") {
        checkout.status = "failed";
        await checkout.save();
        return res.status(200).send("FAILED");
      }

      await checkout.save();
      return res.status(200).send("OK");
    } catch (e: any) {
      res.status(500).send("ERROR");
    }
  }) as RequestHandler,

  jazzcashReturn: (async (req, res) => {
    try {
      await connectDB();
      const body = (req as any).body || {};
      const { Checkout } = await import("./models");
      const billRef = String(body.pp_BillReference || "");
      const responseCode = String(body.pp_ResponseCode || "");
      const responseMessage = String(body.pp_ResponseMessage || "");
      const rrn = String(body.pp_RetreivalReferenceNo || "");

      if (billRef) {
        try {
          const checkout = await Checkout.findById(
            new mongoose.Types.ObjectId(billRef),
          );
          if (checkout) {
            const ok = verifyJazzCashHash(body);
            const success = responseCode === "000";
            checkout.meta = { ...(checkout.meta || {}), return: body };
            if (ok && success && checkout.status !== "succeeded") {
              checkout.status = "succeeded";
              await checkout.save();
              const amount = Number(checkout.amount);
              await User.updateOne(
                { _id: checkout.userId },
                { $inc: { walletBalance: amount } },
              );
              await Transaction.create({
                userId: checkout.userId,
                type: "deposit",
                amount,
                meta: {
                  method: "jazzcash",
                  txnRefNo: body.pp_TxnRefNo,
                  billRef: body.pp_BillReference,
                },
              });
            } else if (ok && !success && checkout.status !== "failed") {
              checkout.status = "failed";
              await checkout.save();
            } else {
              await checkout.save();
            }
          }
        } catch {}
      }

      const q = new URLSearchParams({
        rcode: responseCode,
        rmsg: responseMessage,
        rrn,
      });
      res.redirect(`/wallet?${q.toString()}`);
    } catch {
      res.redirect("/wallet?rcode=ERR&rmsg=Payment%20processing%20error");
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
      const checkout = await Checkout.create({
        userId,
        amount: amt,
        method: "easypaisa",
        status: "pending",
        meta: {},
      });
      const configured = !!process.env.EASYPAY_MERCHANT_ID;
      if (!configured)
        return res.status(501).json({
          error: "EasyPaisa not configured",
          checkoutId: checkout._id,
        });
      res.json({ checkoutId: checkout._id });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,

  transactions: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId as string;
      const tx = await Transaction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
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
      const q =
        me.role === "sub"
          ? { assignedToUserId: userId }
          : { ownerUserId: userId };
      const numbers = await NumberModel.find(q).select("phoneNumber").lean();
      const planKey = String(me.plan || "free");
      const planRent = PLAN_PRICES[planKey] ?? 0;
      const numbersRent = numbers.length * NUMBER_PRICE;
      const total = planRent + numbersRent;
      const perNumber = numbers.map((n) => ({
        phoneNumber: n.phoneNumber,
        monthly: NUMBER_PRICE,
      }));
      res.json({ plan: planKey, planRent, numbersRent, total, perNumber });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,
};
