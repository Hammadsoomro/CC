import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useEffect, useState } from "react";

export default function SubAccounts() {
  const [subs, setSubs] = useState<any[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const load = async () => {
    const token = localStorage.getItem("jwt");
    const res = await fetch("/api/sub-accounts", { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (res.ok) setSubs((await res.json()).subs || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!email || !password || password !== confirmPassword) { alert("Check fields"); return; }
    const token = localStorage.getItem("jwt");
    const res = await fetch("/api/sub-accounts", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ email, password, firstName, lastName }) });
    if (res.ok) { setFirstName(""); setLastName(""); setEmail(""); setPassword(""); setConfirmPassword(""); load(); } else { const d = await res.json().catch(() => ({})); alert(d.error || "Failed to create sub-account"); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Sub-Accounts</h2>
        <div className="flex flex-wrap gap-2">
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="first name" className="border rounded-md h-9 px-2 bg-background" />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="last name" className="border rounded-md h-9 px-2 bg-background" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" className="border rounded-md h-9 px-2 bg-background" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" className="border rounded-md h-9 px-2 bg-background" />
          <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="confirm password" type="password" className="border rounded-md h-9 px-2 bg-background" />
          <Button onClick={create}>Add Sub-Account</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manage sub-accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Assigned Numbers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map((s) => (
                <TableRow key={s._id}>
                  <TableCell>{s.firstName || s.lastName ? `${s.firstName || ''} ${s.lastName || ''}`.trim() : '—'}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>${s.walletBalance?.toFixed?.(2) ?? '0.00'}</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell className="text-right">
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="destructive" size="sm">Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>Only main accounts can create and manage sub-accounts.</TableCaption>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
