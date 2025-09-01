import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { handleDemo } from "./routes/demo";
import { authRoutes, requireAuth } from "./auth";
import { numberRoutes } from "./signalwire";
import { contactRoutes } from "./contacts";
import { accountRoutes } from "./account";
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
  app.post("/api/numbers/assign", requireAuth, numberRoutes.assign);
  app.post("/api/numbers/unassign", requireAuth, numberRoutes.unassign);

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
  app.post("/api/wallet/checkout-session", requireAuth, accountRoutes.createCheckoutSession);
  app.post("/api/wallet/transfer", requireAuth, accountRoutes.transferToSub);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  return app;
}
