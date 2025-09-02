import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

import { useEffect, useState } from "react";

export default function Wallet() {
  const [me, setMe] = useState<any>(null);
  const [amount, setAmount] = useState<string>("");
  const [subs, setSubs] = useState<any[]>([]);
  const [toSub, setToSub] = useState<string>("");
  const [transferAmt, setTransferAmt] = useState<string>("");
  const [summary, setSummary] = useState<any>(null);
  const [tx, setTx] = useState<any[]>([]);

  const load = async () => {
    const r = await fetch("/api/auth/me", { credentials: "include" });
    if (r.ok) setMe((await r.json()).user);
    const token = localStorage.getItem("jwt");
    const [s, wtx] = await Promise.all([
      fetch("/api/sub-accounts", { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} }),
      fetch("/api/wallet/transactions", { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    ]);
    if (s.ok) setSubs((await s.json()).subs || []);
    if (wtx.ok) setTx((await wtx.json()).transactions || []);
    const sum = await fetch("/api/wallet/summary", { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (sum.ok) setSummary(await sum.json());
  };
  useEffect(() => { load(); }, []);

  const deposit = async () => {
    const token = localStorage.getItem("jwt");
    const res = await fetch("/api/wallet/checkout-session", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ amount: Number(amount) }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Unable to create checkout session");
      return;
    }
    if (data.url) window.location.href = data.url;
  };

  const transfer = async () => {
    const token = localStorage.getItem("jwt");
    const res = await fetch("/api/wallet/transfer", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ toSubUserId: toSub, amount: Number(transferAmt) }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok) { toast.success("Transferred"); setTransferAmt(""); load(); } else { toast.error(d.error || "Transfer failed"); }
  };

  return (
    <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">Current Balance</div>
          <div className="text-3xl font-bold">${me?.walletBalance?.toFixed?.(2) ?? "0.00"}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Monthly Rent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">Total this month</div>
          <div className="text-3xl font-bold">${summary?.total?.toFixed?.(2) ?? "0.00"}</div>
          <div className="text-xs text-muted-foreground">Numbers: ${summary?.numbersRent?.toFixed?.(2) ?? "0.00"} | Package: ${summary?.planRent?.toFixed?.(2) ?? "0.00"}</div>
          <div className="mt-2 space-y-1 text-xs">
            {summary?.perNumber?.map((n: any) => (
              <div key={n.phoneNumber} className="flex items-center justify-between">
                <span>{n.phoneNumber}</span>
                <span>${n.monthly.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {tx.length === 0 ? (
            <div className="text-sm text-muted-foreground">No transactions yet.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {tx.map((t: any) => (
                    <tr key={t._id} className="border-t">
                      <td className="py-2 pr-4">{new Date(t.createdAt).toLocaleString()}</td>
                      <td className="py-2 pr-4 capitalize">{t.type}</td>
                      <td className="py-2 pr-4">${Number(t.amount).toFixed(2)}</td>
                      <td className="py-2 pr-4 truncate">{t?.meta?.kind === 'number' ? `Number ${t.meta.phoneNumber}` : t?.meta?.kind === 'plan' ? `Plan ${t.meta.plan}` : t?.meta?.stripePaymentIntentId ? `Stripe ${t.meta.stripePaymentIntentId}` : JSON.stringify(t.meta || {})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {me?.role === "main" && (
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Transfer to Sub-Account</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="sub">Sub-Account</Label>
              <select id="sub" className="w-full border rounded-md h-9 px-2 bg-background" value={toSub} onChange={(e) => setToSub(e.target.value)}>
                <option value="">Select sub-account</option>
                {subs.map((s: any) => (
                  <option key={s._id} value={s._id}>{s.email}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="tamt">Amount</Label>
              <Input id="tamt" type="number" min={1} step="0.01" placeholder="10.00" value={transferAmt} onChange={(e) => setTransferAmt(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <Button onClick={transfer}>Transfer</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
