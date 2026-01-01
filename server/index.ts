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
import { analyticsRoutes } from "./analytics";
import { adminRoutes, requireAdmin, ensureAdminUser } from "./admin";
import { walletRoutes } from "./wallet";
import { passwordRequestRoutes } from "./password-request";
import { twilioRoutes } from "./routes/twilio";
import { conversationRoutes } from "./routes/conversations";

export function createServer() {
  const app = express();
  app.set("trust proxy", 1);

  // Middleware
  const defaultOrigins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://connectlify.netlify.app",
  ];
  const extra = (process.env.ALLOWED_ORIGINS || "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const allowed = new Set([...defaultOrigins, ...extra]);
  app.use(cors({ credentials: true, origin: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/health/db", async (_req, res) => {
    try {
      const { connectDB } = await import("./db");
      await connectDB();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  // Auth
  app.post("/api/auth/signup", authRoutes.signup);
  app.post("/api/auth/login", authRoutes.login);
  app.post("/api/auth/logout", authRoutes.logout);
  app.get("/api/auth/me", authRoutes.me);

  // Public password-change request
  app.post("/api/password-requests", passwordRequestRoutes.create);

  // Ensure admin user exists if env configured
  ensureAdminUser().catch(() => {});

  // Numbers (protected)
  app.get("/api/numbers/search", requireAuth, numberRoutes.search);
  app.post("/api/numbers/purchase", requireAuth, numberRoutes.purchase);
  app.get("/api/numbers", requireAuth, numberRoutes.myNumbers);
  app.post("/api/messages/send", requireAuth, messageRoutes.send);
  app.get("/api/messages/history", requireAuth, messageRoutes.history);
  app.post("/api/messages/incoming", messageRoutes.incoming);
  app.get("/api/messages/stream", requireAuth, messageRoutes.stream);
  app.post("/api/numbers/assign", requireAuth, numberRoutes.assign);
  app.post("/api/numbers/unassign", requireAuth, numberRoutes.unassign);
  app.post("/api/numbers/add-existing", requireAuth, numberRoutes.addExisting);

  // Conversations (protected)
  app.get("/api/conversations/contacts", requireAuth, conversationRoutes.listContacts);
  app.get(
    "/api/conversations/:phone",
    requireAuth,
    conversationRoutes.getConversation,
  );
  app.post(
    "/api/conversations/contact",
    requireAuth,
    conversationRoutes.upsertContact,
  );
  app.patch(
    "/api/conversations/contact/:contactId",
    requireAuth,
    conversationRoutes.updateContact,
  );
  app.delete(
    "/api/conversations/contact/:contactId",
    requireAuth,
    conversationRoutes.deleteContact,
  );
  app.post(
    "/api/conversations/send",
    requireAuth,
    conversationRoutes.sendMessage,
  );
  app.get(
    "/api/conversations/available-numbers",
    requireAuth,
    conversationRoutes.getAvailableNumbers,
  );

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
  app.post(
    "/api/wallet/checkout-session",
    requireAuth,
    accountRoutes.createCheckoutSession,
  );
  app.post(
    "/api/wallet/payment-intent",
    requireAuth,
    accountRoutes.createPaymentIntent,
  );
  app.post("/api/wallet/confirm", requireAuth, accountRoutes.confirmDeposit);
  app.post("/api/wallet/transfer", requireAuth, accountRoutes.transferToSub);
  app.post("/api/plans/choose", requireAuth, accountRoutes.choosePlan);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Analytics
  app.get("/api/analytics/overview", requireAuth, analyticsRoutes.overview);

  // Twilio credentials
  app.get("/api/twilio/credentials", requireAuth, twilioRoutes.getCredentials);
  app.post(
    "/api/twilio/credentials",
    requireAuth,
    twilioRoutes.saveCredentials,
  );
  app.post("/api/twilio/disconnect", requireAuth, twilioRoutes.disconnect);
  app.post("/api/twilio/test", requireAuth, twilioRoutes.testConnection);

  // Wallet extras
  app.get("/api/wallet/transactions", requireAuth, walletRoutes.transactions);
  app.get("/api/wallet/summary", requireAuth, walletRoutes.summary);
  app.post(
    "/api/wallet/jazzcash/start",
    requireAuth,
    walletRoutes.startJazzCash,
  );
  app.post(
    "/api/wallet/easypaisa/start",
    requireAuth,
    walletRoutes.startEasyPaisa,
  );
  app.post("/api/wallet/jazzcash/ipn", walletRoutes.jazzcashIPN);
  app.post("/api/wallet/jazzcash/return", walletRoutes.jazzcashReturn);

  // Admin routes
  app.get("/api/admin/users", requireAdmin, adminRoutes.users);
  app.get("/api/admin/users/:id", requireAdmin, adminRoutes.userDetail);
  app.post(
    "/api/admin/users/:id/wallet",
    requireAdmin,
    adminRoutes.walletAdjust,
  );
  app.post(
    "/api/admin/users/:id/password",
    requireAdmin,
    adminRoutes.setUserPassword,
  );
  app.post("/api/admin/users/:id/plan", requireAdmin, adminRoutes.setUserPlan);
  app.delete("/api/admin/users/:id", requireAdmin, adminRoutes.deleteUser);
  app.get("/api/admin/numbers", requireAdmin, adminRoutes.numbers);
  app.post("/api/admin/numbers/assign", requireAdmin, adminRoutes.assignNumber);
  app.post(
    "/api/admin/numbers/unassign",
    requireAdmin,
    adminRoutes.unassignNumber,
  );
  app.post(
    "/api/admin/numbers/transfer-ownership",
    requireAdmin,
    adminRoutes.transferOwnership,
  );
  app.post("/api/admin/messages/send", requireAdmin, adminRoutes.sendMessage);
  app.get(
    "/api/admin/password-requests",
    requireAdmin,
    adminRoutes.listPasswordRequests,
  );
  app.post(
    "/api/admin/password-requests/:id/approve",
    requireAdmin,
    adminRoutes.approvePasswordRequest,
  );
  app.post(
    "/api/admin/password-requests/:id/reject",
    requireAdmin,
    adminRoutes.rejectPasswordRequest,
  );

  // Global error handler to avoid crashing overlay
  app.use((err: any, _req, res, _next) => {
    const msg = String(err?.message || err || "Server Error");
    res.status(500).json({ error: msg });
  });

  return app;
}
