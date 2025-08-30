import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free Trial",
    price: "$0",
    features: [
      "No sub-accounts",
      "Trial phone number",
      "Limit 10 SMS to 1 receiver ID",
    ],
  },
  {
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
    name: "Enterprise",
    price: "$49/mo",
    features: [
      "5 sub-accounts",
      "4 phone numbers included",
      "Buy extra numbers: $2.50/mo",
      "1000 SMS included, then $0.01/SMS",
    ],
  },
];

export default function Pricing() {
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {plans.map((p) => (
        <Card key={p.name}>
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
            <Button className="mt-6 w-full">Choose</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
