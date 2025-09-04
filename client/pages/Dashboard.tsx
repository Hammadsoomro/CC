import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdsRail } from "@/components/layout/AdsRail";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState<any>({ walletBalance: 0, numbersCount: 0, totalSent: 0, recent: [] });
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("jwt");
      const r = await fetch("/api/analytics/overview", { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (r.ok) setData(await r.json());
      const s = await fetch("/api/wallet/summary", { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (s.ok) setSummary(await s.json());
    })();
  }, []);

  return (
    <div className="p-6 bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      <div className="flex items-start gap-4">
        <AdsRail position="left" />
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <CardHeader>
                <CardTitle className="text-base">Wallet Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${data.walletBalance?.toFixed?.(2) ?? "0.00"}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              <CardHeader>
                <CardTitle className="text-base">Owned Numbers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.numbersCount ?? 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
              <CardHeader>
                <CardTitle className="text-base">Total Sent SMS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.totalSent ?? 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white">
              <CardHeader>
                <CardTitle className="text-base">Quick Tip</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm opacity-90">Use the sidebar selector to change your sending number.</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recent?.length ? (
                  <ul className="text-sm space-y-2">
                    {data.recent.map((m: any, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={`inline-flex h-6 shrink-0 items-center rounded-full px-2 text-xs font-medium ${m.direction === 'outbound' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {m.direction === 'outbound' ? 'Sent' : 'Received'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{m.direction === 'outbound' ? `You → ${m.to}` : `${m.from} → You`}</div>
                          <div className="truncate text-muted-foreground">{m.body}</div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground">No recent messages.</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">This Month</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex items-center justify-between"><span>Plan</span><span>${summary?.planRent?.toFixed?.(2) ?? '0.00'}</span></div>
                <div className="flex items-center justify-between"><span>Numbers</span><span>${summary?.numbersRent?.toFixed?.(2) ?? '0.00'}</span></div>
                <div className="flex items-center justify-between font-semibold border-t pt-2"><span>Total</span><span>${summary?.total?.toFixed?.(2) ?? '0.00'}</span></div>
                <div className="mt-3 h-2 w-full rounded bg-zinc-200">
                  <div className="h-2 rounded bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, ((summary?.planRent ?? 0) / Math.max(1, summary?.total ?? 1)) * 100))}%` }} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild><a href="/buy-numbers">Buy Number</a></Button>
              <Button asChild variant="secondary"><a href="/wallet">Add Funds</a></Button>
              <Button asChild variant="outline"><a href="/conversation">New Message</a></Button>
            </CardContent>
          </Card>
        </div>
        <AdsRail position="right" />
      </div>
    </div>
  );
}
