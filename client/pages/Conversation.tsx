import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

export default function Conversation() {
  const [message, setMessage] = useState("");

  return (
    <div className="h-[calc(100svh-3.5rem)] grid grid-cols-12">
      <aside className="col-span-3 border-r flex flex-col">
        <div className="p-3 font-semibold">Contacts</div>
        <ScrollArea className="flex-1">
          <ul className="p-2 space-y-1">
            <li className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted cursor-pointer">
              <span className="truncate">+1 555-0001</span>
              <Badge>2</Badge>
            </li>
            <li className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted cursor-pointer">
              <span className="truncate">+1 555-0002</span>
              <Badge variant="secondary">0</Badge>
            </li>
          </ul>
        </ScrollArea>
      </aside>
      <section className="col-span-9 flex flex-col">
        <div className="border-b p-3 text-sm text-muted-foreground">Conversation with +1 555-0001</div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            <div className="max-w-[65%] rounded-lg bg-muted p-2">Hello</div>
            <div className="max-w-[65%] rounded-lg bg-primary text-primary-foreground p-2 ml-auto">Hi there</div>
          </div>
        </ScrollArea>
        <div className="border-t p-3 flex items-center gap-2">
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message" onKeyDown={(e) => { if (e.key === 'Enter' && message.trim()) { setMessage(""); } }} />
          <Button onClick={() => setMessage("")}>Send</Button>
        </div>
      </section>
    </div>
  );
}
