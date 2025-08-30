import { RequestHandler } from "express";
import { User } from "../models";
import { connectDB } from "../db";

export const listSubAccounts: RequestHandler = async (req, res) => {
  await connectDB();
  const userId = (req as any).userId as string;
  const subs = await User.find({ parentUserId: userId }).lean();
  res.json({ subs });
};
