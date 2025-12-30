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
    <div className="p-6 space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="twilio">Twilio</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        </TabsContent>

        <TabsContent value="twilio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Twilio Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {twilioConnected ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">✓ Twilio Connected</p>
                  {twilioPhoneNumber && (
                    <p className="text-sm text-green-700 mt-1">Phone: {twilioPhoneNumber}</p>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={disconnectTwilio}
                    disabled={twilioLoading}
                    className="mt-3"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Connect your Twilio account to send and receive SMS messages. Your credentials will be available to all your sub-accounts.
                  </p>
                  <div>
                    <Label htmlFor="sid">Account SID</Label>
                    <Input
                      id="sid"
                      type="password"
                      placeholder="Enter your Twilio Account SID"
                      value={twilioAccountSid}
                      onChange={(e) => setTwilioAccountSid(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="token">Auth Token</Label>
                    <Input
                      id="token"
                      type="password"
                      placeholder="Enter your Twilio Auth Token"
                      value={twilioAuthToken}
                      onChange={(e) => setTwilioAuthToken(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      placeholder="e.g., +1234567890"
                      value={twilioPhoneNumber}
                      onChange={(e) => setTwilioPhoneNumber(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={saveTwilio}
                      disabled={twilioLoading || !twilioAccountSid || !twilioAuthToken}
                    >
                      {twilioLoading ? "Saving..." : "Connect Twilio"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={testTwilio}
                      disabled={twilioLoading || !twilioAccountSid || !twilioAuthToken}
                    >
                      {twilioLoading ? "Testing..." : "Test Connection"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
