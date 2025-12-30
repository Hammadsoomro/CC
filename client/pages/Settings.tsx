import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const nav = useNavigate();
  const [role, setRole] = useState<string>("main");
  const [activeTab, setActiveTab] = useState("profile");

  const [twilioConnected, setTwilioConnected] = useState(false);
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState("");
  const [twilioLoading, setTwilioLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/profile", { credentials: "include" });
        if (r.ok) {
          const d = await r.json();
          setFirstName(d.user.firstName || "");
          setLastName(d.user.lastName || "");
          setPhone(d.user.phone || "");
        }
        const token = localStorage.getItem("jwt");
        const me = await fetch("/api/auth/me", { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (me.ok) {
          const md = await me.json();
          setRole(md.user.role || "main");
        }

        const creds = await fetch("/api/twilio/credentials", { credentials: "include" });
        if (creds.ok) {
          const d = await creds.json();
          setTwilioConnected(d.connected || false);
          setTwilioPhoneNumber(d.phoneNumber || "");
        }
      } catch {}
    })();
  }, []);

  const save = async () => {
    const res = await fetch("/api/profile", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName, lastName, phone }) });
    if (res.ok) toast.success("Saved"); else toast.error("Failed to save");
  };

  const saveTwilio = async () => {
    if (!twilioAccountSid || !twilioAuthToken) {
      toast.error("Account SID and Auth Token are required");
      return;
    }

    setTwilioLoading(true);
    try {
      const res = await fetch("/api/twilio/credentials", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountSid: twilioAccountSid, authToken: twilioAuthToken, phoneNumber: twilioPhoneNumber })
      });
      if (res.ok) {
        toast.success("Twilio credentials saved");
        setTwilioConnected(true);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save credentials");
      }
    } catch (e) {
      toast.error("Failed to save credentials");
    } finally {
      setTwilioLoading(false);
    }
  };

  const testTwilio = async () => {
    setTwilioLoading(true);
    try {
      const res = await fetch("/api/twilio/test", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Valid! Account: ${data.accountFriendlyName}`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Invalid credentials");
      }
    } catch (e) {
      toast.error("Failed to test credentials");
    } finally {
      setTwilioLoading(false);
    }
  };

  const disconnectTwilio = async () => {
    if (!confirm("Are you sure you want to disconnect Twilio?")) return;

    setTwilioLoading(true);
    try {
      const res = await fetch("/api/twilio/disconnect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (res.ok) {
        toast.success("Twilio disconnected");
        setTwilioConnected(false);
        setTwilioAccountSid("");
        setTwilioAuthToken("");
        setTwilioPhoneNumber("");
      } else {
        toast.error("Failed to disconnect");
      }
    } catch (e) {
      toast.error("Failed to disconnect");
    } finally {
      setTwilioLoading(false);
    }
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
          {role === "main" && (
            <Button className="w-full" variant="outline" onClick={() => nav("/sub-accounts")}>Sub-Accounts</Button>
          )}
          <Button className="w-full" variant="outline" onClick={() => nav("/wallet")}>Wallet</Button>
        </CardContent>
      </Card>
    </div>
  );
}
