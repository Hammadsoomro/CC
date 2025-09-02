import type { RequestHandler } from "express";
import { connectDB } from "./db";
import { Message, NumberModel, Transaction, User } from "./models";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export const analyticsRoutes = {
  overview: (async (req, res) => {
    try {
      await connectDB();
      const userId = (req as any).userId as string;
      const me = await User.findById(userId).lean();
      if (!me) return res.status(401).json({ error: "Unauthorized" });

      const numQuery = me.role === "sub" ? { assignedToUserId: userId } : { ownerUserId: userId };
      const numbers = await NumberModel.find(numQuery).select("_id phoneNumber").lean();
      const numberIds = numbers.map((n) => n._id);

      const walletBalance = me.walletBalance ?? 0;
      const numbersCount = numbers.length;

      const totalSent = await Message.countDocuments({ numberId: { $in: numberIds }, direction: "outbound" });

      const since = new Date();
      since.setDate(since.getDate() - 29);
      const seriesAgg = await Message.aggregate([
        { $match: { numberId: { $in: numberIds }, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);
      const map: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        map[key] = 0;
      }
      for (const r of seriesAgg) map[r._id] = r.count;
      const series = Object.entries(map).map(([date, messages]) => ({ date, messages }));

      const recent = await Message.find({ numberId: { $in: numberIds } })
        .sort({ createdAt: -1 })
        .limit(20)
        .select("from to body direction createdAt")
        .lean();

      res.json({ walletBalance, numbersCount, totalSent, series, recent });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  }) as RequestHandler,
};
