import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Search,
  Send,
  MoreVertical,
  Plus,
  Phone,
  Pin,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Contact {
  _id: string;
  phoneNumber: string;
  name?: string;
  pinned?: boolean;
  folder?: string;
}

interface Message {
  _id: string;
  from: string;
  to: string;
  body: string;
  direction: "inbound" | "outbound";
  status?: string;
  createdAt: string;
}

interface AvailableNumber {
  _id: string;
  phoneNumber: string;
}

export default function Conversation() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageBody, setMessageBody] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>(
    [],
  );
  const [selectedFromNumber, setSelectedFromNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [editName, setEditName] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initSocket();
    loadContacts();
    loadAvailableNumbers();
    loadFromNumber();
  }, []);

  const initSocket = async () => {
    try {
      const token = localStorage.getItem("jwt");
      const socket = io(window.location.origin, {
        auth: { token },
      });

      socket.on("connect", () => {
        setSocketConnected(true);
      });

      socket.on("sms:new", (data) => {
        if (
          selectedContact &&
          (data.from === selectedContact.phoneNumber ||
            data.to === selectedContact.phoneNumber)
        ) {
          setMessages((prev) => [...prev, data.message]);
        }
        playNotificationSound();
        showBrowserNotification(data);
      });

      socket.on("disconnect", () => {
        setSocketConnected(false);
      });

      socketRef.current = socket;
    } catch (e) {
      console.error("Socket connection error:", e);
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
    );
    audio.play().catch(() => {});
  };

  const showBrowserNotification = (data: any) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("New SMS", {
        body: `From ${data.from}: ${data.message.body}`,
        icon: "/favicon.ico",
      });
    }
  };

  const loadContacts = async () => {
    try {
      const data = await api<{ contacts: Contact[] }>(
        "/api/conversations/contacts",
      );
      setContacts(data.contacts || []);
    } catch (e) {
      toast.error("Failed to load contacts");
    }
  };

  const loadAvailableNumbers = async () => {
    try {
      const data = await api<{ numbers: AvailableNumber[] }>(
        "/api/conversations/available-numbers",
      );
      setAvailableNumbers(data.numbers || []);
      if (data.numbers && data.numbers.length > 0) {
        setSelectedFromNumber(data.numbers[0].phoneNumber);
      }
    } catch (e) {
      toast.error("Failed to load available numbers");
    }
  };

  const loadFromNumber = () => {
    const saved = localStorage.getItem("fromNumber");
    if (saved) setSelectedFromNumber(saved);
  };

  const loadConversation = async (contact: Contact) => {
    try {
      setSelectedContact(contact);
      setLoading(true);
      const data = await api<{ messages: Message[] }>(
        `/api/conversations/${contact.phoneNumber}`,
      );
      setMessages(data.messages || []);
    } catch (e) {
      toast.error("Failed to load conversation");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageBody.trim() || !selectedContact || !selectedFromNumber) {
      toast.error("Select a contact and sending number");
      return;
    }

    try {
      const newMsg = await api<{ message: Message }>(
        "/api/conversations/send",
        {
          method: "POST",
          body: JSON.stringify({
            to: selectedContact.phoneNumber,
            body: messageBody,
            fromNumber: selectedFromNumber,
          }),
        },
      );

      setMessages((prev) => [...prev, newMsg.message]);
      setMessageBody("");
    } catch (e: any) {
      toast.error(e.message || "Failed to send message");
    }
  };

  const upsertContact = async () => {
    if (!newContactPhone) {
      toast.error("Phone number required");
      return;
    }

    try {
      await api("/api/conversations/contact", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber: newContactPhone,
          name: newContactName,
        }),
      });

      loadContacts();
      setShowAddContact(false);
      setNewContactName("");
      setNewContactPhone("");
      toast.success("Contact added");
    } catch (e) {
      toast.error("Failed to add contact");
    }
  };

  const updateContact = async (
    contactId: string,
    updates: Partial<Contact>,
  ) => {
    try {
      await api(`/api/conversations/contact/${contactId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      loadContacts();
      if (selectedContact && selectedContact._id === contactId) {
        setSelectedContact({ ...selectedContact, ...updates });
      }
      toast.success("Contact updated");
    } catch (e) {
      toast.error("Failed to update contact");
    }
  };

  const deleteContact = async (contactId: string) => {
    try {
      await api(`/api/conversations/contact/${contactId}`, {
        method: "DELETE",
      });

      loadContacts();
      if (selectedContact && selectedContact._id === contactId) {
        setSelectedContact(null);
      }
      toast.success("Contact deleted");
    } catch (e) {
      toast.error("Failed to delete contact");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredContacts = contacts.filter(
    (c) =>
      c.phoneNumber.includes(searchTerm) ||
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const pinnedContacts = filteredContacts.filter((c) => c.pinned);
  const unpinnedContacts = filteredContacts.filter((c) => !c.pinned);

  const getContactDisplayName = (contact: Contact) => {
    return contact.name || contact.phoneNumber;
  };

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex gap-0">
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Messages</h2>
            <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="Name (optional)"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                  />
                  <Input
                    placeholder="Phone number"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={upsertContact} className="w-full">
                    Add Contact
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {pinnedContacts.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                Pinned
              </div>
              {pinnedContacts.map((contact) => (
                <ContactItem
                  key={contact._id}
                  contact={contact}
                  isSelected={selectedContact?._id === contact._id}
                  onSelect={() => loadConversation(contact)}
                  onEdit={(name) => {
                    setContactToEdit(contact);
                    setEditName(name || "");
                  }}
                  onPin={(pinned) => updateContact(contact._id, { pinned })}
                  onDelete={() => deleteContact(contact._id)}
                  onMove={(folder) => updateContact(contact._id, { folder })}
                />
              ))}
            </div>
          )}

          <Tabs defaultValue="contacts" className="w-full">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="contacts" className="flex-1">
                Contacts
              </TabsTrigger>
              <TabsTrigger value="sales" className="flex-1">
                Sales
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="m-0">
              {unpinnedContacts
                .filter((c) => c.folder !== "sales")
                .map((contact) => (
                  <ContactItem
                    key={contact._id}
                    contact={contact}
                    isSelected={selectedContact?._id === contact._id}
                    onSelect={() => loadConversation(contact)}
                    onEdit={(name) => {
                      setContactToEdit(contact);
                      setEditName(name || "");
                    }}
                    onPin={(pinned) => updateContact(contact._id, { pinned })}
                    onDelete={() => deleteContact(contact._id)}
                    onMove={(folder) => updateContact(contact._id, { folder })}
                  />
                ))}
            </TabsContent>

            <TabsContent value="sales" className="m-0">
              {unpinnedContacts
                .filter((c) => c.folder === "sales")
                .map((contact) => (
                  <ContactItem
                    key={contact._id}
                    contact={contact}
                    isSelected={selectedContact?._id === contact._id}
                    onSelect={() => loadConversation(contact)}
                    onEdit={(name) => {
                      setContactToEdit(contact);
                      setEditName(name || "");
                    }}
                    onPin={(pinned) => updateContact(contact._id, { pinned })}
                    onDelete={() => deleteContact(contact._id)}
                    onMove={(folder) => updateContact(contact._id, { folder })}
                  />
                ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedContact ? (
          <>
            <div className="h-14 border-b bg-white flex items-center justify-between px-4 shadow-sm">
              <div>
                <h3 className="font-semibold">
                  {getContactDisplayName(selectedContact)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {socketConnected ? "Connected" : "Offline"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedFromNumber}
                  onChange={(e) => {
                    setSelectedFromNumber(e.target.value);
                    localStorage.setItem("fromNumber", e.target.value);
                  }}
                  className="text-xs border rounded px-2 py-1"
                >
                  {availableNumbers.map((n) => (
                    <option key={n._id} value={n.phoneNumber}>
                      {n.phoneNumber}
                    </option>
                  ))}
                </select>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditName(selectedContact.name || "")}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Contact</DialogTitle>
                    </DialogHeader>
                    <Input
                      placeholder="Contact name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <select
                      value={selectedContact.folder || "contacts"}
                      onChange={(e) =>
                        updateContact(selectedContact._id, {
                          folder: e.target.value,
                        })
                      }
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="contacts">Contacts</option>
                      <option value="sales">Sales</option>
                    </select>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => deleteContact(selectedContact._id)}
                        className="text-red-600"
                      >
                        Delete
                      </Button>
                      <Button
                        onClick={() => {
                          updateContact(selectedContact._id, {
                            name: editName || undefined,
                          });
                        }}
                      >
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No messages yet</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${
                      msg.direction === "outbound"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.direction === "outbound"
                          ? "bg-blue-500 text-white"
                          : "bg-white border"
                      }`}
                    >
                      <p className="text-sm">{msg.body}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="h-20 border-t bg-white p-4 flex items-end gap-2">
              <Input
                placeholder="Type a message..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                className="flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <p>Select a contact to start messaging</p>
              <Button
                size="sm"
                variant="outline"
                onClick={requestNotificationPermission}
              >
                Enable Notifications
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContactItem({
  contact,
  isSelected,
  onSelect,
  onEdit,
  onPin,
  onDelete,
  onMove,
}: {
  contact: Contact;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (name?: string) => void;
  onPin: (pinned: boolean) => void;
  onDelete: () => void;
  onMove: (folder: string) => void;
}) {
  return (
    <div
      className={`border-b px-4 py-3 cursor-pointer hover:bg-gray-100 flex items-center justify-between ${
        isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">
          {contact.name || contact.phoneNumber}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {contact.phoneNumber}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(contact.name)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPin(!contact.pinned)}>
            {contact.pinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              onMove(contact.folder === "sales" ? "contacts" : "sales")
            }
          >
            Move to {contact.folder === "sales" ? "Contacts" : "Sales"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete()} className="text-red-600">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
