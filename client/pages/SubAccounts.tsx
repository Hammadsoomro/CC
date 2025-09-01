import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import { useEffect, useMemo, useState } from "react";

export default function SubAccounts() {
  const [subs, setSubs] = useState<any[]>([]);
  const [numbers, setNumbers] = useState<any[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [allowed, setAllowed] = useState<boolean>(false);
  const [assignPick, setAssignPick] = useState<Record<string, string>>({});
  const [transferAmt, setTransferAmt] = useState<Record<string, string>>({});
  const [limits, setLimits] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPass, setEditPass] = useState("");

  const ensureMain = async () => {
    try {
      const token = localStorage.getItem("jwt");
      const r = await fetch("/api/auth/me", { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!r.ok) throw new Error("unauth");
      const d = await r.json();
      if (d?.user?.role !== "main") {
        window.location.href = "/dashboard";
        return;
      }
      setAllowed(true);
    } catch {
      window.location.href = "/login";
    }
  };

  const load = async () => {
    const token = localStorage.getItem("jwt");
    const [resSubs, resNums] = await Promise.all([
      fetch("/api/sub-accounts", { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} }),
      fetch("/api/numbers", { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    ]);
    if (resSubs.ok) {
      const d = await resSubs.json();
      setSubs(d.subs || []);
      const lm: Record<string, string> = {};
      (d.subs || []).forEach((s: any) => { lm[s._id] = s.walletLimit != null ? String(s.walletLimit) : ""; });
      setLimits(lm);
    }
    if (resNums.ok) setNumbers((await resNums.json()).numbers || []);
  };
  useEffect(() => { ensureMain(); }, []);
  useEffect(() => { if (allowed) load(); }, [allowed]);

  const create = async () => {
    if (!email || !password || password !== confirmPassword) { toast.error("Check fields"); return; }
    const token = localStorage.getItem("jwt");
    const res = await fetch("/api/sub-accounts", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ email, password, firstName, lastName }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok) { setFirstName(""); setLastName(""); setEmail(""); setPassword(""); setConfirmPassword(""); toast.success("Sub-account created"); load(); } else { toast.error(d.error || "Failed to create sub-account"); }
  };

  const bySubAssigned = useMemo(() => {
    const map: Record<string, any[]> = {};
    subs.forEach((s) => { map[s._id] = numbers.filter((n) => String(n.assignedToUserId) === String(s._id)); });
    return map;
  }, [subs, numbers]);

  const unassignedNumbers = useMemo(() => numbers.filter((n) => !n.assignedToUserId), [numbers]);

  const doAssign = async (subId: string) => {
    const numberId = assignPick[subId];
    if (!numberId) return;
    const token = localStorage.getItem("jwt");
    const res = await fetch("/api/numbers/assign", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ numberId, subUserId: subId }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok) { setAssignPick({ ...assignPick, [subId]: "" }); toast.success("Assigned"); load(); } else { toast.error(d.error || "Failed to assign"); }
  };

  const doUnassign = async (numberId: string) => {
    const token = localStorage.getItem("jwt");
    const res = await fetch("/api/numbers/unassign", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ numberId }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok) { toast.success("Unassigned"); load(); } else { toast.error(d.error || "Failed to unassign"); }
  };

  const doTransfer = async (subId: string) => {
    const amt = Number(transferAmt[subId]);
    if (!(amt > 0)) return;
    const token = localStorage.getItem("jwt");
    const res = await fetch("/api/wallet/transfer", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ toSubUserId: subId, amount: amt }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok) { setTransferAmt({ ...transferAmt, [subId]: "" }); toast.success("Transferred"); load(); } else { toast.error(d.error || "Transfer failed"); }
  };

  const saveLimit = async (subId: string) => {
    const limitVal = limits[subId];
    const walletLimit = limitVal === "" ? null : Number(limitVal);
    const token = localStorage.getItem("jwt");
    const res = await fetch(`/api/sub-accounts/${subId}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ walletLimit }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok) { toast.success("Saved"); load(); } else { toast.error(d.error || "Failed to save limit"); }
  };

  const doDelete = async (subId: string) => {
    const token = localStorage.getItem("jwt");
    const res = await fetch(`/api/sub-accounts/${subId}`, { method: "DELETE", credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const d = await res.json().catch(() => ({}));
    if (res.ok) { toast.success("Deleted"); load(); } else { toast.error(d.error || "Failed to delete"); }
  };

  const openEdit = (sub: any) => {
    setEditing(sub);
    setEditFirst(sub.firstName || "");
    setEditLast(sub.lastName || "");
    setEditEmail(sub.email || "");
    setEditPass("");
    setEditOpen(true);
  };
  const submitEdit = async () => {
    if (!editing) return;
    const token = localStorage.getItem("jwt");
    const res = await fetch(`/api/sub-accounts/${editing._id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ firstName: editFirst, lastName: editLast, email: editEmail, password: editPass || undefined }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok) { toast.success("Saved"); setEditOpen(false); setEditing(null); load(); } else { toast.error(d.error || "Failed to edit"); }
  };

  if (!allowed) return null;

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
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">${s.walletBalance?.toFixed?.(2) ?? '0.00'}</div>
                      <div className="flex items-center gap-2">
                        <input value={transferAmt[s._id] || ''} onChange={(e) => setTransferAmt({ ...transferAmt, [s._id]: e.target.value })} placeholder="amount" className="border rounded-md h-8 px-2 w-28 bg-background" />
                        <Button size="sm" onClick={() => doTransfer(s._id)}>Transfer</Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Limit</span>
                        <input value={limits[s._id] ?? ''} onChange={(e) => setLimits({ ...limits, [s._id]: e.target.value })} placeholder="no limit" className="border rounded-md h-7 px-2 w-24 bg-background" />
                        <Button size="sm" variant="outline" onClick={() => saveLimit(s._id)}>Save</Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <select value={assignPick[s._id] || ''} onChange={(e) => setAssignPick({ ...assignPick, [s._id]: e.target.value })} className="border rounded-md h-9 px-2 bg-background">
                          <option value="">Select number</option>
                          {unassignedNumbers.map((n) => (
                            <option key={n._id} value={n._id}>{n.phoneNumber}</option>
                          ))}
                        </select>
                        <Button size="sm" onClick={() => doAssign(s._id)} disabled={!assignPick[s._id]}>Assign</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {bySubAssigned[s._id]?.length ? bySubAssigned[s._id].map((n) => (
                          <span key={n._id} className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs">
                            {n.phoneNumber}
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => doUnassign(n._id)}>×</Button>
                          </span>
                        )) : <span className="text-xs text-muted-foreground">None</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Edit</Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" onClick={() => setDeleteId(s._id)}>Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete sub-account?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteId && doDelete(deleteId)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>Only main accounts can create and manage sub-accounts.</TableCaption>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit sub-account</DialogTitle>
            <DialogDescription>Update profile details for this sub-account.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="First name" value={editFirst} onChange={(e) => setEditFirst(e.target.value)} />
            <Input placeholder="Last name" value={editLast} onChange={(e) => setEditLast(e.target.value)} />
            <Input placeholder="Email" className="col-span-2" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            <Input placeholder="New password (optional)" type="password" className="col-span-2" value={editPass} onChange={(e) => setEditPass(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={submitEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
