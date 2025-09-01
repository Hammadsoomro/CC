import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

function DepositForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const disabled = !stripe || !elements || !Number(amount) || !name.trim();

  const submit = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("jwt");
      const r = await fetch("/api/wallet/payment-intent", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ amount: Number(amount) }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.clientSecret) { toast.error(d.error || "Failed to start payment"); setLoading(false); return; }
      const result = await stripe.confirmCardPayment(d.clientSecret, { payment_method: { card: elements.getElement(CardElement)!, billing_details: { name } } });
      if (result.error) { toast.error(result.error.message || "Payment failed"); setLoading(false); return; }
      const pi = result.paymentIntent!;
      const rc = await fetch("/api/wallet/confirm", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ paymentIntentId: pi.id }) });
      const rd = await rc.json().catch(() => ({}));
      if (!rc.ok) { toast.error(rd.error || "Failed to credit wallet"); setLoading(false); return; }
      toast.success("Deposit successful");
      window.location.href = "/wallet";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Cardholder name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Card details</Label>
        <div className="rounded-md border p-3 bg-background">
          <CardElement options={{ hidePostalCode: true }} />
        </div>
      </div>
      <div>
        <Label htmlFor="amt">Amount (USD)</Label>
        <Input id="amt" type="number" min={1} step="0.01" placeholder="25.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <Button onClick={submit} disabled={disabled || loading}>{loading ? "Processing..." : "Pay"}</Button>
    </div>
  );
}

export default function Deposit() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  if (!ready) return null;
  return (
    <div className="p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Deposit Funds</CardTitle>
        </CardHeader>
        <CardContent>
          {!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? (
            <div className="text-sm text-red-600">Stripe publishable key missing. Set VITE_STRIPE_PUBLISHABLE_KEY in settings.</div>
          ) : (
            <Elements stripe={stripePromise}>
              <DepositForm />
            </Elements>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
