import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useEffect, useState } from "react";

export default function BuyNumbers() {
  const [country, setCountry] = useState("US");
  const [results, setResults] = useState<any[]>([]);

  const search = async () => {
    const res = await fetch(`/api/numbers/search?country=${country}`, { credentials: "include" });
    const data = await res.json();
    setResults(data.data || data.items || data.phone_numbers || []);
  };
  const purchase = async (phone_number: string) => {
    const res = await fetch(`/api/numbers/purchase`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone_number }) });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Purchase failed");
    } else {
      alert("Purchased");
    }
  };

  useEffect(() => {
    search();
  }, []);

  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Buy New Number</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">US $2.50/month, Canada $2.50/month. Only main accounts can buy numbers.</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Select value={country} onValueChange={(v) => setCountry(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States ($2.50/mo)</SelectItem>
                  <SelectItem value="CA">Canada ($2.50/mo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={search}>Search Available</Button>
          </div>
          <div className="mt-4 space-y-2">
            {results.length === 0 && <div className="text-sm text-muted-foreground">No results yet.</div>}
            {results.map((r: any) => (
              <div key={r.phone_number || r.number || r.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="text-sm font-medium">{r.phone_number || r.number}</div>
                <Button size="sm" onClick={() => purchase(r.phone_number || r.number)}>Buy $2.50/mo</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
