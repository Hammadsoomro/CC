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
  const [depositOpen, setDepositOpen] = useState(false);

  const load = async () => {
    const r = await fetch("/api/auth/me", { credentials: "include" });
    if (r.ok) setMe((await r.json()).user);
    const token = localStorage.getItem("jwt");
    const s = await fetch("/api/sub-accounts", { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (s.ok) setSubs((await s.json()).subs || []);
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
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
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
          <CardTitle>Add Funds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">Deposit</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deposit to Wallet</DialogTitle>
                  <DialogDescription>Pay securely using Visa or Mastercard via Stripe Checkout.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div>
                    <Label htmlFor="amount">Amount (USD)</Label>
                    <Input id="amount" type="number" min={1} step="0.01" placeholder="25.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Cards accepted:</span>
                    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">Visa</span>
                    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">Mastercard</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={deposit} disabled={!Number(amount)}>Pay with card</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="text-xs text-muted-foreground">Sub-accounts cannot deposit funds.</div>
          </div>
        </CardContent>
      </Card>
      {me?.role === "main" && (
        <Card className="lg:col-span-3">
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
