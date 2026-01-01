import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const REGIONS: Record<string, { code: string; name: string }[]> = {
  US: [
    { code: "AL", name: "Alabama" },
    { code: "AK", name: "Alaska" },
    { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" },
    { code: "CA", name: "California" },
    { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" },
    { code: "DE", name: "Delaware" },
    { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" },
    { code: "HI", name: "Hawaii" },
    { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" },
    { code: "IN", name: "Indiana" },
    { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" },
    { code: "KY", name: "Kentucky" },
    { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" },
    { code: "MD", name: "Maryland" },
    { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" },
    { code: "MN", name: "Minnesota" },
    { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" },
    { code: "MT", name: "Montana" },
    { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" },
    { code: "NH", name: "New Hampshire" },
    { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" },
    { code: "NY", name: "New York" },
    { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" },
    { code: "OH", name: "Ohio" },
    { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" },
    { code: "PA", name: "Pennsylvania" },
    { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" },
    { code: "SD", name: "South Dakota" },
    { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" },
    { code: "UT", name: "Utah" },
    { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" },
    { code: "WA", name: "Washington" },
    { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" },
    { code: "WY", name: "Wyoming" },
    { code: "DC", name: "District of Columbia" },
  ],
  CA: [
    { code: "AB", name: "Alberta" },
    { code: "BC", name: "British Columbia" },
    { code: "MB", name: "Manitoba" },
    { code: "NB", name: "New Brunswick" },
    { code: "NL", name: "Newfoundland and Labrador" },
    { code: "NS", name: "Nova Scotia" },
    { code: "NT", name: "Northwest Territories" },
    { code: "NU", name: "Nunavut" },
    { code: "ON", name: "Ontario" },
    { code: "PE", name: "Prince Edward Island" },
    { code: "QC", name: "Quebec" },
    { code: "SK", name: "Saskatchewan" },
    { code: "YT", name: "Yukon" },
  ],
};

export default function BuyNumbers() {
  const [country, setCountry] = useState("US");
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [allowed, setAllowed] = useState<boolean>(false);
  const [region, setRegion] = useState<string>("");

  const checkRole = async () => {
    try {
      const token = localStorage.getItem("jwt");
      const r = await fetch("/api/auth/me", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) {
        setError("Authentication failed. Please log in again.");
        return;
      }
      const d = await r.json();
      if (d?.user?.role !== "main") {
        setError("Only main accounts can buy numbers");
        return;
      }
      setAllowed(true);
    } catch (e) {
      setError("Failed to verify account access");
    }
  };

  const search = async () => {
    setError("");
    try {
      const token = localStorage.getItem("jwt");
      const qs = new URLSearchParams({ country, ...(region ? { region } : {}) });
      const res = await fetch(`/api/numbers/search?${qs.toString()}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || data.error?.includes("credentials not configured")) {
          setError(
            "Twilio credentials not configured. Please connect Twilio in Settings first.",
          );
        } else {
          setError(
            data.error ||
              "Unable to load available numbers. Please check your Twilio credentials.",
          );
        }
        setResults([]);
        return;
      }
      setResults(Array.isArray(data.numbers) ? data.numbers : []);
    } catch (e) {
      setError("Network error: unable to reach API");
      setResults([]);
    }
  };
  const purchase = async (phone_number: string) => {
    const token = localStorage.getItem("jwt");
    const res = await fetch(`/api/numbers/purchase`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ phone_number }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(d.error || "Purchase failed");
    } else {
      toast.success("Number purchased");
      search();
    }
  };

  useEffect(() => {
    checkRole();
  }, []);

  useEffect(() => {
    if (allowed) search();
  }, [allowed]);

  if (!allowed) {
    return (
      <div className="p-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Buy New Number</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            {!error && (
              <div className="rounded-md bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                  Loading account information...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Buy New Number</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            US $2.50/month, Canada $2.50/month. Only main accounts can buy
            numbers.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select value={country} onValueChange={(v) => { setCountry(v); setRegion(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States ($2.50/mo)</SelectItem>
                  <SelectItem value="CA">Canada ($2.50/mo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={region} onValueChange={(v) => setRegion(v)}>
                <SelectTrigger>
                  <SelectValue placeholder={country === "US" ? "Select state" : "Select province"} />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS[country].map((r) => (
                    <SelectItem key={r.code} value={r.code}>{r.name} ({r.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={search}>Search Available</Button>
          </div>
          <div className="mt-4 space-y-2">
            {error && <div className="text-sm text-red-600">{error}</div>}
            {!error && results.length === 0 && <div className="text-sm text-muted-foreground">No results yet.</div>}
            {results.map((num, i) => (
              <div key={num || i} className="flex items-center justify-between rounded-md border p-3">
                <div className="text-sm font-medium">{num}</div>
                <Button size="sm" onClick={() => purchase(num)}>Buy $2.50/mo</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
