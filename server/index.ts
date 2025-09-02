import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { handleDemo } from "./routes/demo";
import { authRoutes, requireAuth } from "./auth";
import { numberRoutes } from "./signalwire";
import { contactRoutes } from "./contacts";
import { accountRoutes } from "./account";
import { messageRoutes } from "./messages";
import { listSubAccounts } from "./routes/subaccounts";

export function createServer() {
  const app = express();
  app.set("trust proxy", 1);

  // Middleware
  app.use(cors({ credentials: true, origin: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health
  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Auth
  app.post("/api/auth/signup", authRoutes.signup);
  app.post("/api/auth/login", authRoutes.login);
  app.post("/api/auth/logout", authRoutes.logout);
  app.get("/api/auth/me", authRoutes.me);

  // Numbers (protected)
  app.get("/api/numbers/search", requireAuth, numberRoutes.search);
  app.post("/api/numbers/purchase", requireAuth, numberRoutes.purchase);
  app.get("/api/numbers", requireAuth, numberRoutes.myNumbers);
  app.post("/api/messages/send", requireAuth, messageRoutes.send);
  app.get("/api/messages/history", requireAuth, messageRoutes.history);
  app.post("/api/messages/incoming", messageRoutes.incoming);
  app.post("/api/numbers/assign", requireAuth, numberRoutes.assign);
  app.post("/api/numbers/unassign", requireAuth, numberRoutes.unassign);
  app.post("/api/numbers/add-existing", requireAuth, numberRoutes.addExisting);

  // Contacts (protected)
  app.get("/api/contacts", requireAuth, contactRoutes.list);
  app.post("/api/contacts", requireAuth, contactRoutes.create);
  app.patch("/api/contacts/:id", requireAuth, contactRoutes.update);
  app.delete("/api/contacts/:id", requireAuth, contactRoutes.remove);

  // Account + Wallet (protected)
  app.get("/api/profile", requireAuth, accountRoutes.profileGet);
  app.post("/api/profile", requireAuth, accountRoutes.profileUpdate);
  app.get("/api/sub-accounts", requireAuth, listSubAccounts);
  app.post("/api/sub-accounts", requireAuth, accountRoutes.subCreate);
  app.patch("/api/sub-accounts/:id", requireAuth, accountRoutes.subUpdate);
  app.delete("/api/sub-accounts/:id", requireAuth, accountRoutes.subDelete);
  app.post("/api/wallet/checkout-session", requireAuth, accountRoutes.createCheckoutSession);
  app.post("/api/wallet/payment-intent", requireAuth, accountRoutes.createPaymentIntent);
  app.post("/api/wallet/confirm", requireAuth, accountRoutes.confirmDeposit);
  app.post("/api/wallet/transfer", requireAuth, accountRoutes.transferToSub);
  app.post("/api/plans/choose", requireAuth, accountRoutes.choosePlan);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Global error handler to avoid crashing overlay
  app.use((err: any, _req, res, _next) => {
    const msg = String(err?.message || err || "Server Error");
    res.status(500).json({ error: msg });
  });

  return app;
}
