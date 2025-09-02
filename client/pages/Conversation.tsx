import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import ContactsPanel, { ContactItem } from "@/components/conversation/ContactsPanel";

export default function Conversation() {
  const [message, setMessage] = useState("");
  const [current, setCurrent] = useState<ContactItem | null>(null);
  const [history, setHistory] = useState<{ fromMe: boolean; body: string; time: string }[]>([]);

  const send = async () => {
    const token = localStorage.getItem("jwt");
    const from = localStorage.getItem("fromNumber") || undefined;
    if (!current || !message.trim()) return;
    const res = await fetch("/api/messages/send", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ to: current.phoneNumber, body: message, from }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      import("sonner").then(({ toast }) => toast.error(data.error || "Failed to send"));
      return;
    }
    const now = new Date().toISOString();
    setHistory((h) => [...h, { fromMe: true, body: message, time: now }]);
    setMessage("");
  };

  return (
    <div className="h-[calc(100svh-3.5rem)] grid grid-cols-12">
      <aside className="col-span-3 border-r flex flex-col">
        <ContactsPanel onSelect={setCurrent} />
      </aside>
      <section className="col-span-9 flex flex-col">
        <div className="border-b p-3 text-sm text-muted-foreground">{current ? `Conversation with ${current.name || current.phoneNumber}` : "Select a contact"}</div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {!current && <div className="text-sm text-muted-foreground">No conversation selected.</div>}
            {history.map((m, i) => (
              <div key={i} className={`max-w-[65%] ${m.fromMe ? 'ml-auto text-right' : ''}`}>
                <div className={`rounded-lg p-2 ${m.fromMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{m.body}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t p-3 flex items-center gap-2">
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message" onKeyDown={async (e) => { if (e.key === 'Enter' && message.trim() && current) { await send(); } }} />
          <Button onClick={async () => current && (await send())} disabled={!current}>Send</Button>
        </div>
      </section>
    </div>
  );
}
