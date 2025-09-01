import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { RequestHandler } from "express";
import { User } from "./models";
import { connectDB } from "./db";

const COOKIE_NAME = "connectlify_jwt";
const cookieOpts = { httpOnly: true, sameSite: "none" as const, secure: true };

export function signToken(payload: object) {
  const secret = process.env.JWT_SECRET || "dev_secret_change";
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET || "dev_secret_change";
  return jwt.verify(token, secret) as any;
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME] || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : undefined);
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifyToken(token);
    (req as any).userId = decoded.userId;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export const authRoutes = {
  signup: (async (req, res) => {
    await connectDB();
    const { email, password, firstName, lastName, phone } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "email already registered" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, firstName, lastName, phone, role: "main" });
    const token = signToken({ userId: user._id.toString() });
    res.cookie(COOKIE_NAME, token, cookieOpts);
    res.json({ token, user: { id: user._id, email: user.email, firstName, lastName, role: user.role } });
  }) as RequestHandler,
  login: (async (req, res) => {
    await connectDB();
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "invalid credentials" });
    const token = signToken({ userId: user._id.toString() });
    res.cookie(COOKIE_NAME, token, cookieOpts);
    res.json({ token, user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  }) as RequestHandler,
  me: (async (req, res) => {
    await connectDB();
    try {
      const token = req.cookies?.[COOKIE_NAME] || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : undefined);
      if (!token) return res.status(401).json({ error: "Unauthorized" });
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).lean();
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      res.json({ user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, walletBalance: user.walletBalance, plan: user.plan } });
    } catch {
      res.status(401).json({ error: "Unauthorized" });
    }
  }) as RequestHandler,
  logout: (async (_req, res) => {
    res.clearCookie(COOKIE_NAME, cookieOpts);
    res.json({ ok: true });
  }) as RequestHandler,
};
