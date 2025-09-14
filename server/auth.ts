import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { RequestHandler } from "express";
import { User } from "./models";
import { connectDB } from "./db";

const COOKIE_NAME = "connectlify_jwt";
const isProd = process.env.NODE_ENV === "production";
const cookieOpts = {
  httpOnly: true,
  sameSite: (isProd ? "lax" : "lax") as const,
  secure: isProd,
} as const;

function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (s && s.trim()) return s.trim();
  if (isProd) throw new Error("JWT_SECRET is not set");
  return "dev_secret_change";
}

export function signToken(payload: object) {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret) as any;
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token =
      req.cookies?.[COOKIE_NAME] ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined);
    if (token) {
      const decoded = verifyToken(token);
      (req as any).userId = decoded.userId;
      return next();
    }

    // No token -> fallback to admin user if configured (makes app public without login)
    await connectDB();
    const adminEmailRaw = process.env.ADMIN_EMAIL;
    if (!adminEmailRaw) return res.status(401).json({ error: "Unauthorized" });
    const adminEmail = (adminEmailRaw || "").trim().toLowerCase();
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const pwd = process.env.ADMIN_PASSWORD || Math.random().toString(36).slice(2);
      const passwordHash = await bcrypt.hash(pwd, 10);
      admin = await User.create({
        email: adminEmail,
        passwordHash,
        role: "admin",
        firstName: "Admin",
        lastName: "",
      });
    }
    (req as any).userId = String(admin._id);
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export const authRoutes = {
  signup: (async (_req, res) => {
    // Signup disabled when running public mode
    res.status(410).json({ error: "signup disabled" });
  }) as RequestHandler,
  login: (async (_req, res) => {
    // Login disabled when running public mode
    res.status(410).json({ error: "login disabled" });
  }) as RequestHandler,
  me: (async (req, res) => {
    await connectDB();
    try {
      const token =
        req.cookies?.[COOKIE_NAME] ||
        (req.headers.authorization?.startsWith("Bearer ")
          ? req.headers.authorization.split(" ")[1]
          : undefined);
      if (!token) return res.status(401).json({ error: "Unauthorized" });
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).lean();
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      res.json({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          walletBalance: user.walletBalance,
          plan: user.plan,
        },
      });
    } catch {
      res.status(401).json({ error: "Unauthorized" });
    }
  }) as RequestHandler,
  logout: (async (_req, res) => {
    res.clearCookie(COOKIE_NAME, cookieOpts);
    res.json({ ok: true });
  }) as RequestHandler,
};
