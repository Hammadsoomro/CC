import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface ContactItem { _id: string; phoneNumber: string; name?: string; pinned?: boolean; favorite?: boolean }

export default function ContactsPanel({ onSelect }: { onSelect: (c: ContactItem) => void }) {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");

  const load = async () => {
    const res = await fetch("/api/contacts", { credentials: "include" });
    const data = await res.json();
    setContacts(data.contacts || []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newPhone.trim()) return;
    await fetch("/api/contacts", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phoneNumber: newPhone, name: newName || undefined }) });
    setNewPhone(""); setNewName("");
    load();
  };

  const update = async (id: string, patch: Partial<ContactItem>) => {
    await fetch(`/api/contacts/${id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    load();
  };
  const remove = async (id: string) => {
    await fetch(`/api/contacts/${id}`, { method: "DELETE", credentials: "include" });
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
                    <DropdownMenuItem onClick={() => {
                      const name = prompt("Edit name", c.name || "");
                      if (name !== null) update(c._id, { name });
                    }}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => remove(c._id)}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
