import React from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Wallet,
  MessageSquare,
  Home,
  Settings,
  Users,
  ShoppingCart,
  ShieldQuestion,
  HandCoins,
  Phone,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useEffect, useState } from "react";

export default function AppShell() {
  const [me, setMe] = useState<any>(null);
  const [numbers, setNumbers] = useState<any[]>([]);
  const [fromNumber, setFromNumber] = useState<string | undefined>(
    () => localStorage.getItem("fromNumber") || undefined,
  );
  const location = useLocation();
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("jwt");
        const r = await fetch("/api/auth/me", {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (r.status === 401) throw new Error("unauth");
        const { user } = await r.json();
        setMe(user);
        const n = await fetch("/api/numbers", {
          credentials: "include",
          headers: (() => {
            const t = localStorage.getItem("jwt");
            return t ? { Authorization: `Bearer ${t}` } : {};
          })(),
        });
        if (n.ok) {
          const d = await n.json();
          setNumbers(d.numbers || []);
        }
      } catch {
        window.location.href = "/";
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const n = await fetch("/api/numbers", {
          credentials: "include",
          headers: (() => {
            const t = localStorage.getItem("jwt");
            return t ? { Authorization: `Bearer ${t}` } : {};
          })(),
        });
        if (n.ok) {
          const d = await n.json();
          setNumbers(d.numbers || []);
        }
      } catch {}
    })();
  }, [location.pathname]);

  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/messages/stream");
      es.addEventListener("message", async (ev: MessageEvent) => {
        setUnread((u) => u + 1);
        try { const { toast } = await import("sonner"); toast.success("New SMS received"); } catch {}
        window.dispatchEvent(new CustomEvent("sms:new", { detail: (() => { try { return JSON.parse(ev.data); } catch { return {}; } })() }));
      });
    } catch {}
    return () => { try { es?.close(); } catch {} };
  }, []);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link to="/dashboard" className="px-2 py-1.5 text-sm font-semibold text-left hover:underline">
            Connectlify
          </Link>
          <SidebarSeparator />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/dashboard"
                      className={({ isActive }) =>
                        isActive ? "data-[active=true]" : undefined
                      }
                    >
                      <Home className="mr-2" />
                      <span>Dashboard</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/conversation"
                      className={({ isActive }) =>
                        isActive ? "data-[active=true]" : undefined
                      }
                    >
                      <MessageSquare className="mr-2" />
                      <span>Conversations</span>
                      {unread > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center rounded-full bg-rose-600 text-white text-[10px] px-1.5 h-4 min-w-4">{unread}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/wallet"
                      className={({ isActive }) =>
                        isActive ? "data-[active=true]" : undefined
                      }
                    >
                      <HandCoins className="mr-2" />
                      <span>Wallet</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {me?.role === "main" && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to="/buy-numbers"
                          className={({ isActive }) =>
                            isActive ? "data-[active=true]" : undefined
                          }
                        >
                          <Phone className="mr-2" />
                          <span>Buy Numbers</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to="/sub-accounts"
                          className={({ isActive }) =>
                            isActive ? "data-[active=true]" : undefined
                          }
                        >
                          <Users className="mr-2" />
                          <span>Sub-Accounts</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/pricing"
                      className={({ isActive }) =>
                        isActive ? "data-[active=true]" : undefined
                      }
                    >
                      <ListOrdered className="mr-2" />
                      <span>Pricing</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {me?.role === "admin" && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/admin"
                        className={({ isActive }) =>
                          isActive ? "data-[active=true]" : undefined
                        }
                      >
                        <Settings className="mr-2" />
                        <span>Admin</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/settings"
                      className={({ isActive }) =>
                        isActive ? "data-[active=true]" : undefined
                      }
                    >
                      <Settings className="mr-2" />
                      <span>Settings</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/privacy"
                  className={({ isActive }) =>
                    isActive ? "data-[active=true]" : undefined
                  }
                >
                  <ShieldQuestion className="mr-2" />
                  <span>Privacy Policy</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/terms"
                  className={({ isActive }) =>
                    isActive ? "data-[active=true]" : undefined
                  }
                >
                  <Settings className="mr-2" />
                  <span>Terms & Conditions</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-zinc-50 dark:bg-slate-900 px-4">
          <SidebarTrigger />
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.preventDefault();
              const btn = document.querySelector(
                "[data-sidebar=trigger]",
              ) as HTMLButtonElement | null;
              btn?.click();
            }}
          >
            Hide
          </button>
          <Link to="/dashboard" className="font-semibold">
            Connectlify
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-sm">
              Wallet:{" "}
              <span className="font-semibold">
                ${me?.walletBalance?.toFixed?.(2) ?? "0.00"}
              </span>
            </div>
            <Select
              value={fromNumber}
              onValueChange={(v) => {
                setFromNumber(v);
                localStorage.setItem("fromNumber", v);
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select sending number" />
              </SelectTrigger>
              <SelectContent>
                {numbers.length === 0 ? (
                  <SelectItem value="none">No Numbers</SelectItem>
                ) : (
                  numbers.map((n) => (
                    <SelectItem key={n._id} value={n.phoneNumber}>
                      {n.phoneNumber}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button asChild variant="outline" size="sm">
              <Link to="/settings">Settings</Link>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                try {
                  await fetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "include",
                  });
                } catch {}
                localStorage.removeItem("jwt");
                window.location.href = "/";
              }}
            >
              Logout
            </Button>
          </div>
        </header>
        <div className="min-h-[calc(100svh-3.5rem)]">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
