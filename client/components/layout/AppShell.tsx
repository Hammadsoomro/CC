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
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useEffect, useMemo, useState } from "react";

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
    let onRead: any;
    try {
      es = new EventSource("/api/messages/stream");
      es.addEventListener("message", async (ev: MessageEvent) => {
        let data: any = {};
        try {
          data = JSON.parse(ev.data);
        } catch {}
        if (data?.direction === "inbound") {
          setUnread((u) => u + 1);
          try {
            const { toast } = await import("sonner");
            toast.success("New SMS received");
          } catch {}
        }
        window.dispatchEvent(new CustomEvent("sms:new", { detail: data }));
      });
      onRead = (e: any) => {
        const cnt = Number(e?.detail?.count || 0);
        if (cnt > 0) setUnread((u) => Math.max(0, u - cnt));
      };
      window.addEventListener("sms:read", onRead as any);
    } catch {}
    return () => {
      try {
        es?.close();
      } catch {}
      try {
        window.removeEventListener("sms:read", onRead as any);
      } catch {}
    };
  }, []);

  const displayName = useMemo(() => {
    const f = me?.firstName?.trim?.();
    const l = me?.lastName?.trim?.();
    if (f || l) return [f, l].filter(Boolean).join(" ");
    return me?.email || "User";
  }, [me]);

  const initials = useMemo(() => {
    const base = displayName || me?.email || "U";
    return base
      .split(" ")
      .map((p: string) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [displayName, me]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    localStorage.removeItem("jwt");
    window.location.href = "/";
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link
            to="/dashboard"
            className="px-2 py-1.5 text-sm font-semibold text-left hover:underline"
          >
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
                        <span className="ml-2 inline-flex items-center justify-center rounded-full bg-rose-600 text-white text-[10px] px-1.5 h-4 min-w-4">
                          {unread}
                        </span>
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
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b nav-animated dark:bg-slate-900 px-4">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-full border px-2 py-1 hover:bg-accent">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">
                    {displayName}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium leading-none">
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground leading-none">
                      Tier:{" "}
                      <Badge variant="secondary" className="ml-1 capitalize">
                        {me?.plan || "free"}
                      </Badge>
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-rose-600 focus:text-rose-600"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="secondary" size="sm" onClick={logout}>
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
