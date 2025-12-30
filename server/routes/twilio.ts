import { RequestHandler } from "express";
import { User } from "../models";
import { connectDB } from "../db";

export const twilioRoutes = {
  getCredentials: (async (req, res) => {
    await connectDB();
    try {
      const userId = (req as any).userId;
      let user = await User.findById(userId).lean();

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role === "sub" && user.parentUserId) {
        user = await User.findById(user.parentUserId).lean();
      }

      if (!user || !user.twilioAccountSid) {
        return res.json({
          connected: false,
          accountSid: null,
          phoneNumber: null,
        });
      }

      res.json({
        connected: true,
        accountSid: user.twilioAccountSid,
        phoneNumber: user.twilioPhoneNumber || null,
      });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,

  saveCredentials: (async (req, res) => {
    await connectDB();
    try {
      const userId = (req as any).userId;
      const { accountSid, authToken, phoneNumber } = req.body;

      if (!accountSid || !authToken) {
        return res
          .status(400)
          .json({ error: "Account SID and Auth Token are required" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role !== "main" && user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "Only main account can add Twilio credentials" });
      }

      user.twilioAccountSid = accountSid;
      user.twilioAuthToken = authToken;
      user.twilioPhoneNumber = phoneNumber || undefined;
      await user.save();

      res.json({
        success: true,
        message: "Twilio credentials saved successfully",
      });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,

  disconnect: (async (req, res) => {
    await connectDB();
    try {
      const userId = (req as any).userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role !== "main" && user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "Only main account can disconnect Twilio" });
      }

      user.twilioAccountSid = undefined;
      user.twilioAuthToken = undefined;
      user.twilioPhoneNumber = undefined;
      await user.save();

      res.json({
        success: true,
        message: "Twilio credentials disconnected",
      });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,

  testConnection: (async (req, res) => {
    await connectDB();
    try {
      const userId = (req as any).userId;
      let user = await User.findById(userId).lean();

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role === "sub" && user.parentUserId) {
        user = await User.findById(user.parentUserId).lean();
      }

      if (!user?.twilioAccountSid || !user?.twilioAuthToken) {
        return res
          .status(400)
          .json({ error: "No Twilio credentials configured" });
      }

      const accountSid = user.twilioAccountSid;
      const authToken = user.twilioAuthToken;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

      try {
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
            },
          },
        );

        if (!response.ok) {
          return res.status(401).json({ error: "Invalid Twilio credentials" });
        }

        const data = await response.json();
        res.json({
          success: true,
          message: "Twilio credentials are valid",
          accountFriendlyName: data.friendly_name,
        });
      } catch {
        res.status(500).json({ error: "Failed to verify credentials" });
      }
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,
};
