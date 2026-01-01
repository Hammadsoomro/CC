import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdsRail } from "@/components/layout/AdsRail";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Users, TrendingUp, Phone, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";

interface TeamMember {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  plan?: string;
}

export default function Dashboard() {
  const [data, setData] = useState<any>({
    walletBalance: 0,
    numbersCount: 0,
    totalSent: 0,
    recent: [],
  });
  const [summary, setSummary] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("jwt");
      const r = await fetch("/api/analytics/overview", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (r.ok) setData(await r.json());

      const s = await fetch("/api/wallet/summary", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (s.ok) setSummary(await s.json());

      const t = await fetch("/api/sub-accounts", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (t.ok) {
        const td = await t.json();
        setTeamMembers(td.users || []);
      }

      const mockChartData = [
        { day: "Mon", sent: 12, received: 8 },
        { day: "Tue", sent: 19, received: 14 },
        { day: "Wed", sent: 15, received: 11 },
        { day: "Thu", sent: 25, received: 18 },
        { day: "Fri", sent: 22, received: 16 },
        { day: "Sat", sent: 18, received: 12 },
        { day: "Sun", sent: 10, received: 7 },
      ];
      setChartData(mockChartData);
    })();
  }, []);

  const getMemberName = (member: TeamMember) => {
    if (member.firstName && member.lastName) {
      return `${member.firstName} ${member.lastName}`;
    }
    return member.email;
  };

  return (
    <div className="p-6 bg-zinc-50 dark:bg-slate-900">
      <div className="flex items-start gap-4">
        <AdsRail position="left" />
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your SMS platform overview.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Wallet Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${data.walletBalance?.toFixed?.(2) ?? "0.00"}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {summary?.total
                    ? `$${summary.total.toFixed(2)}/month`
                    : "No expenses"}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Owned Numbers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data.numbersCount ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Active phone numbers
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Total SMS Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.totalSent ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-2">All time</p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{teamMembers.length}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Sub-accounts
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SMS Activity (7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sent"
                    stroke="#3b82f6"
                    name="Sent SMS"
                  />
                  <Line
                    type="monotone"
                    dataKey="received"
                    stroke="#10b981"
                    name="Received SMS"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

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
                        <span
                          className={`inline-flex h-6 shrink-0 items-center rounded-full px-2 text-xs font-medium ${
                            m.direction === "outbound"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {m.direction === "outbound" ? "Sent" : "Received"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate">
                            {m.direction === "outbound"
                              ? `You → ${m.to}`
                              : `${m.from} → You`}
                          </div>
                          <div className="truncate text-muted-foreground">
                            {m.body}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No recent messages.
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">This Month</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span>Plan</span>
                  <span>${summary?.planRent?.toFixed?.(2) ?? "0.00"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Numbers</span>
                  <span>${summary?.numbersRent?.toFixed?.(2) ?? "0.00"}</span>
                </div>
                <div className="flex items-center justify-between font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>${summary?.total?.toFixed?.(2) ?? "0.00"}</span>
                </div>
                <div className="mt-3 h-2 w-full rounded bg-zinc-200">
                  <div
                    className="h-2 rounded bg-blue-600"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          ((summary?.planRent ?? 0) /
                            Math.max(1, summary?.total ?? 1)) *
                            100,
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {teamMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{getMemberName(member)}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                      <div className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {member.plan || "Free"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild>
                <a href="/conversation">New Message</a>
              </Button>
              <Button asChild variant="secondary">
                <a href="/buy-numbers">Buy Number</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/wallet">Add Funds</a>
              </Button>
            </CardContent>
          </Card>
        </div>
        <AdsRail position="right" />
      </div>
    </div>
  );
}
