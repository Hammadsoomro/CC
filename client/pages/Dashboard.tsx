import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdsRail } from "@/components/layout/AdsRail";

import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, Bar, BarChart } from "recharts";

export default function Dashboard() {
  const [data, setData] = useState<any>({ walletBalance: 0, numbersCount: 0, totalSent: 0, series: [], recent: [] });

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("jwt");
      const r = await fetch("/api/analytics/overview", { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (r.ok) setData(await r.json());
    })();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-start gap-4">
        <AdsRail position="left" />
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Wallet Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${data.walletBalance?.toFixed?.(2) ?? "0.00"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Owned Numbers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.numbersCount ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Total Sent SMS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalSent ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recent?.length ? (
                  <ul className="text-xs space-y-1">
                    {data.recent.map((m: any, i: number) => (
                      <li key={i} className="truncate">{m.direction === "outbound" ? "You →" : "← You"} {m.to || m.from}: {m.body}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground">No activity yet</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="h-[360px]">
            <CardHeader>
              <CardTitle className="text-base">Messages (last 30 days)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" hide />
                  <YAxis allowDecimals={false} />
                  <RTooltip />
                  <Line type="monotone" dataKey="messages" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="h-[360px]">
            <CardHeader>
              <CardTitle className="text-base">Daily Volume</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.series} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" hide />
                  <YAxis allowDecimals={false} />
                  <RTooltip />
                  <Bar dataKey="messages" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <AdsRail position="right" />
      </div>
    </div>
  );
}
