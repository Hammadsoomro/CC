import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

async function api<T>(url: string, init?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
  const res = await fetch(url, { credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(init || {}) });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Request failed ${res.status}`);
  }
  try { return (await res.json()) as T; } catch { return undefined as unknown as T; }
}

export default function Admin() {
  const nav = useNavigate();
  const [me, setMe] = useState<any>(null);
  const [tab, setTab] = useState<string>("users");

  useEffect(() => {
    (async () => {
      try {
        const md = await api<{ user: any }>("/api/auth/me");
        setMe(md.user);
        if (md.user.role !== "admin") nav("/dashboard");
      } catch {
        nav("/login");
      }
    })();
  }, [nav]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="numbers">Numbers</TabsTrigger>
          <TabsTrigger value="send">Send SMS</TabsTrigger>
        </TabsList>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="numbers"><NumbersTab /></TabsContent>
        <TabsContent value="send"><SendTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [delta, setDelta] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const d = await api<{ users: any[] }>("/api/admin/users");
      setUsers(d.users);
    } catch (e: any) { setError(String(e.message || e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onRowClick = async (id: string) => {
    try {
      const d = await api<{ user: any; owned: any[]; assigned: any[]; transactions: any[] }>(`/api/admin/users/${id}`);
      setSelected(d);
    } catch (e: any) { setError(String(e.message || e)); }
  };

  const adjust = async () => {
    try {
      const amt = Number(delta);
      if (!Number.isFinite(amt) || amt === 0) throw new Error("Enter a non-zero amount");
      await api(`/api/admin/users/${selected.user.id}/wallet`, { method: "POST", body: JSON.stringify({ delta: amt, reason }) });
      setDelta(""); setReason("");
      await onRowClick(selected.user.id);
      await load();
    } catch (e: any) { setError(String(e.message || e)); }
  };

  const delUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try { await api(`/api/admin/users/${id}`, { method: "DELETE" }); setSelected(null); await load(); }
    catch (e: any) { setError(String(e.message || e)); }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card className="xl:col-span-2">
        <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
        <CardContent>
          {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
          <Button onClick={load} disabled={loading} variant="outline" size="sm" className="mb-2">Refresh</Button>
          <Table>
            <TableCaption>Users</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Numbers</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="cursor-pointer" onClick={() => onRowClick(u.id)}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>${(u.walletBalance ?? 0).toFixed(2)}</TableCell>
                  <TableCell>{u.plan}</TableCell>
                  <TableCell>{u.numbersOwned}</TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); delUser(u.id); }}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent>
          {selected ? (
            <div className="space-y-4">
              <div>
                <div className="font-medium">{selected.user.email}</div>
                <div className="text-sm text-muted-foreground">Role: {selected.user.role}</div>
                <div className="text-sm text-muted-foreground">Wallet: ${(selected.user.walletBalance ?? 0).toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Plan: {selected.user.plan}</div>
                <div className="text-sm text-muted-foreground">Created: {new Date(selected.user.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium mb-1">Adjust Wallet</div>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <Label htmlFor="delta">Amount (+/-)</Label>
                    <Input id="delta" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="e.g. 100 or -50" />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="optional" />
                  </div>
                  <Button onClick={adjust}>Apply</Button>
                </div>
              </div>
              <div>
                <div className="font-medium">Owned Numbers</div>
                <ul className="text-sm list-disc ml-4">
                  {selected.owned.map((n: any) => (<li key={n._id}>{n.phoneNumber}</li>))}
                </ul>
              </div>
              <div>
                <div className="font-medium">Assigned Numbers</div>
                <ul className="text-sm list-disc ml-4">
                  {selected.assigned.map((n: any) => (<li key={n._id}>{n.phoneNumber}</li>))}
                </ul>
              </div>
              <div>
                <div className="font-medium">Recent Transactions</div>
                <ul className="text-sm list-disc ml-4 max-h-40 overflow-auto">
                  {selected.transactions.map((t: any) => (
                    <li key={t._id}>{new Date(t.createdAt).toLocaleString()} - {t.type} - ${t.amount.toFixed(2)}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Select a user to view details</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NumbersTab() {
  const [numbers, setNumbers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [assignUser, setAssignUser] = useState<string>("");
  const [selectedNumber, setSelectedNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const dn = await api<{ numbers: any[] }>("/api/admin/numbers");
      setNumbers(dn.numbers);
      const du = await api<{ users: any[] }>("/api/admin/users");
      setUsers(du.users);
    } catch (e: any) { setError(String(e.message || e)); }
  };

  useEffect(() => { load(); }, []);

  const doAssign = async () => {
    if (!selectedNumber || !assignUser) return;
    try {
      await api("/api/admin/numbers/assign", { method: "POST", body: JSON.stringify({ phoneNumber: selectedNumber, assignedToUserId: assignUser }) });
      await load();
    } catch (e: any) { setError(String(e.message || e)); }
  };

  const doUnassign = async () => {
    if (!selectedNumber) return;
    try { await api("/api/admin/numbers/unassign", { method: "POST", body: JSON.stringify({ phoneNumber: selectedNumber }) }); await load(); }
    catch (e: any) { setError(String(e.message || e)); }
  };

  const doTransfer = async () => {
    if (!selectedNumber || !assignUser) return;
    try { await api("/api/admin/numbers/transfer-ownership", { method: "POST", body: JSON.stringify({ phoneNumber: selectedNumber, newOwnerUserId: assignUser }) }); await load(); }
    catch (e: any) { setError(String(e.message || e)); }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card className="xl:col-span-2">
        <CardHeader><CardTitle>All Numbers</CardTitle></CardHeader>
        <CardContent>
          {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
          <Button variant="outline" size="sm" className="mb-2" onClick={load}>Refresh</Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {numbers.map((n) => (
                <TableRow key={n.id} className="cursor-pointer" onClick={() => setSelectedNumber(n.phoneNumber)}>
                  <TableCell>{n.phoneNumber}</TableCell>
                  <TableCell>{n.ownerEmail || n.ownerUserId}</TableCell>
                  <TableCell>{n.assignedEmail || "-"}</TableCell>
                  <TableCell>{n.country || "-"}</TableCell>
                  <TableCell>{new Date(n.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Assign / Transfer</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label>Selected Number</Label>
              <Input value={selectedNumber} onChange={(e) => setSelectedNumber(e.target.value)} placeholder="+15551234567" />
            </div>
            <div>
              <Label>Select User</Label>
              <Select value={assignUser} onValueChange={setAssignUser}>
                <SelectTrigger><SelectValue placeholder="Choose user" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (<SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={doAssign}>Assign</Button>
              <Button onClick={doUnassign} variant="outline">Unassign</Button>
              <Button onClick={doTransfer} variant="secondary">Transfer Ownership</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SendTab() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const send = async () => {
    setStatus(null);
    try {
      await api("/api/admin/messages/send", { method: "POST", body: JSON.stringify({ from, to, body }) });
      setStatus("Sent");
    } catch (e: any) { setStatus(String(e.message || e)); }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Send SMS from any number</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>From</Label>
            <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="+15551234567" />
          </div>
          <div>
            <Label>To</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="+15557654321" />
          </div>
          <div className="md:col-span-3">
            <Label>Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          </div>
          <div className="md:col-span-3 flex items-center gap-3">
            <Button onClick={send}>Send</Button>
            {status && <div className="text-sm text-muted-foreground">{status}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
