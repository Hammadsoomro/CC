import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Settings() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/profile", { credentials: "include" });
        if (!r.ok) return;
        const d = await r.json();
        setFirstName(d.user.firstName || "");
        setLastName(d.user.lastName || "");
        setPhone(d.user.phone || "");
      } catch {}
    })();
  }, []);

  const save = async () => {
    const res = await fetch("/api/profile", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName, lastName, phone }) });
    if (res.ok) toast.success("Saved"); else toast.error("Failed to save");
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fn">First name</Label>
            <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ln">Last name</Label>
            <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="ph">Phone</Label>
            <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button onClick={save}>Save</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" variant="outline" onClick={() => nav("/pricing")}>Manage Plan</Button>
          <Button className="w-full" variant="outline" onClick={() => nav("/sub-accounts")}>Sub-Accounts</Button>
          <Button className="w-full" variant="outline" onClick={() => nav("/wallet")}>Wallet</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Add Existing Number</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="num">Phone number (E.164 or local)</Label>
            <Input id="num" placeholder="+1 249 444 0933" onKeyDown={(e) => { if (e.key === 'Enter') (document.getElementById('addNumBtn') as HTMLButtonElement)?.click(); }} />
          </div>
          <div>
            <Label htmlFor="cty">Country</Label>
            <Input id="cty" placeholder="US" defaultValue="US" />
          </div>
          <Button id="addNumBtn" onClick={async () => {
            const phone_number = (document.getElementById('num') as HTMLInputElement)?.value?.trim();
            const country = (document.getElementById('cty') as HTMLInputElement)?.value?.trim() || 'US';
            if (!phone_number) { toast.error('Enter a phone number'); return; }
            const token = localStorage.getItem('jwt');
            const r = await fetch('/api/numbers/add-existing', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ phone_number, country }) });
            const d = await r.json().catch(() => ({}));
            if (r.ok) { toast.success('Number added to your account'); } else { toast.error(d.error || 'Failed to add number'); }
          }}>Add Number</Button>
        </CardContent>
      </Card>
    </div>
  );
}
