import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface ContactItem { _id: string; phoneNumber: string; name?: string; pinned?: boolean; favorite?: boolean }

export default function ContactsPanel({ onSelect }: { onSelect: (c: ContactItem) => void }) {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ContactItem | null>(null);
  const [editName, setEditName] = useState("");

  const load = async () => {
    const token = localStorage.getItem("jwt");
    const res = await fetch("/api/contacts", { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const data = await res.json();
    setContacts(data.contacts || []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newPhone.trim()) return;
    const token = localStorage.getItem("jwt");
    await fetch("/api/contacts", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ phoneNumber: newPhone, name: newName || undefined }) });
    setNewPhone(""); setNewName("");
    load();
  };

  const update = async (id: string, patch: Partial<ContactItem>) => {
    const token = localStorage.getItem("jwt");
    await fetch(`/api/contacts/${id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(patch) });
    load();
  };
  const remove = async (id: string) => {
    const token = localStorage.getItem("jwt");
    await fetch(`/api/contacts/${id}`, { method: "DELETE", credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
    load();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2">
        <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Add contact number" />
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name (optional)" />
        <Button onClick={add} className="w-full">Add Contact</Button>
      </div>
      <div className="px-2 text-xs text-muted-foreground">Contacts</div>
      <div className="flex-1 overflow-auto">
        <ul className="p-2 space-y-1">
          {contacts.map((c) => (
            <li key={c._id} className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted">
              <button onClick={() => onSelect(c)} className="flex-1 text-left">
                <div className="font-medium truncate">{c.name || c.phoneNumber}</div>
                <div className="text-xs text-muted-foreground">{c.phoneNumber}</div>
              </button>
              <div className="flex items-center gap-2">
                {c.favorite && <Badge>Fav</Badge>}
                {c.pinned && <Badge variant="secondary">Pin</Badge>}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">⋯</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => update(c._id, { pinned: !c.pinned })}>{c.pinned ? "Unpin" : "Pin"}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => update(c._id, { favorite: !c.favorite })}>{c.favorite ? "Unfavorite" : "Favorite"}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setEditing(c); setEditName(c.name || ""); setEditOpen(true); }}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => remove(c._id)}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit contact</DialogTitle>
            <DialogDescription>Update the display name for this contact.</DialogDescription>
          </DialogHeader>
          <Input placeholder="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <DialogFooter>
            <Button onClick={async () => { if (editing) { await update(editing._id, { name: editName }); setEditOpen(false); setEditing(null); } }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
