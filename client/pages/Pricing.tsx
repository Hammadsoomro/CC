import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const plans = [
  {
    key: "starter",
    name: "Starter",
    price: "$9/mo",
    features: [
      "1 sub-account",
      "1 phone number included",
      "Buy extra numbers: $2.50/mo",
      "300 SMS included, then $0.01/SMS",
    ],
  },
  {
    key: "professional",
    name: "Professional",
    price: "$19/mo",
    features: [
      "3 sub-accounts",
      "2 phone numbers included",
      "Buy extra numbers: $2.50/mo",
      "500 SMS included, then $0.01/SMS",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "$49/mo",
    features: [
      "5 sub-accounts",
      "4 phone numbers included",
      "Buy extra numbers: $2.50/mo",
      "1000 SMS included, then $0.01/SMS",
    ],
  },
] as const;

export default function Pricing() {
  const choose = async (planKey: string) => {
    const token = localStorage.getItem("jwt");
    const res = await fetch("/api/plans/choose", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ plan: planKey }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok) toast.success(`Plan changed to ${d.plan}`); else toast.error(d.error || "Failed to choose plan");
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {plans.map((p) => (
        <Card key={p.key}>
          <CardHeader>
            <CardTitle className="text-xl">{p.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{p.price}</div>
            <ul className="mt-4 text-sm text-muted-foreground space-y-2 list-disc pl-5">
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Button className="mt-6 w-full" onClick={() => choose(p.key)}>Choose</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
