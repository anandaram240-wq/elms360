"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useElmsStore } from "@/lib/store/elms-store";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

export interface HeaderProps {
  title?: string;
  onOpenMobileMenu?: () => void;
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  connectionStatus?: ConnectionStatus;
  user?: {
    name: string;
    email?: string;
    avatarUrl?: string;
    role?: string;
  };
  onSignOut?: () => void;
}

export function Header({
  title = "Dashboard",
  onOpenMobileMenu,
  onOpenSearch,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  connectionStatus = "connected",
  user = { name: "Ananda K", email: "ananda@abctech.com", role: "EMPLOYEE" },
  onSignOut,
}: HeaderProps) {
  const pathname = usePathname();

  let storeRealtimeStatus = "IDLE";
  let storeLastEvent: any = null;
  try {
    const store = useElmsStore();
    storeRealtimeStatus = store?.realtimeStatus ?? "IDLE";
    storeLastEvent = store?.lastRealtimeEvent ?? null;
  } catch {}

  const isLive = storeRealtimeStatus === "SUBSCRIBED";
  const isReconnecting =
    storeRealtimeStatus === "RECONNECTING" ||
    storeRealtimeStatus === "CONNECTING" ||
    connectionStatus === "reconnecting";

  // Generate clean breadcrumb labels
  const segments = pathname.split("/").filter(Boolean);
  const portalSection = segments[0] ? segments[0].toUpperCase() : "PORTAL";
  const pageLabel = segments[1]
    ? segments[1]
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Overview";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E5E7EB] bg-white px-4 sm:px-6">
      {/* Left side: Hamburger button + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="lg:hidden h-8 w-8 text-[#64748B] hover:text-[#111827] rounded-lg"
          aria-label="Open mobile menu"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Clean Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] truncate">
          <span className="font-semibold text-[#111827] hidden sm:inline">
            {portalSection}
          </span>
          <ChevronRight className="h-3 w-3 text-[#94A3B8] hidden sm:inline" />
          <span className="font-semibold text-[#111827] sm:text-sm text-xs truncate">
            {title || pageLabel}
          </span>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Authoritative PostgreSQL Realtime Sync Indicator */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F1F3F5] border border-[#E5E7EB] text-[11px] font-medium text-[#334155]"
          title={
            storeLastEvent
              ? `Last realtime event: ${storeLastEvent.type} (${new Date(storeLastEvent.ts).toLocaleTimeString()})`
              : "PostgreSQL Realtime Synchronization Active"
          }
        >
          {isLive ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]" />
              </span>
              <span className="font-semibold text-[#15803D]">Live</span>
              <span className="text-[#CBD5E1]">|</span>
              <span className="text-[#64748B]">PostgreSQL</span>
            </>
          ) : isReconnecting ? (
            <>
              <span className="h-2 w-2 rounded-full bg-[#D97706] animate-pulse" />
              <span className="text-[#B45309]">Reconnecting...</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-[#166534]" />
              <span>PostgreSQL Authoritative</span>
            </>
          )}
        </div>

        {/* Dev-only Realtime Diagnostic Badge */}
        {process.env.NODE_ENV !== "production" && storeRealtimeStatus !== "IDLE" && (
          <div
            className="hidden xl:flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200"
            title="Development diagnostic indicator"
          >
            RT:{storeRealtimeStatus}
          </div>
        )}

        {/* Notifications Icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenNotifications}
          className="relative h-8 w-8 text-[#64748B] hover:text-[#111827] hover:bg-[#F1F3F5] rounded-lg"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2563EB] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2563EB]" />
            </span>
          )}
        </Button>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 h-8 rounded-full hover:bg-[#F1F3F5]"
            >
              <Avatar className="h-7 w-7 border border-[#E5E7EB]">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold">
                  {(user?.name || "U")
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold text-[#111827] hidden sm:inline max-w-[120px] truncate">
                {user.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-dropdown text-[#111827]"
          >
            <DropdownMenuLabel className="px-3 py-2">
              <p className="text-xs font-semibold text-[#111827] truncate">{user.name}</p>
              {user.email && (
                <p className="text-[11px] font-normal text-[#64748B] truncate">{user.email}</p>
              )}
              <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB]">
                {user.role || "EMPLOYEE"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#E5E7EB]" />
            <DropdownMenuItem asChild className="rounded-lg text-xs hover:bg-[#F1F3F5] cursor-pointer">
              <Link href="/employee/profile" className="flex items-center gap-2 w-full px-3 py-2 text-[#334155]">
                <User className="h-3.5 w-3.5 text-[#64748B]" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg text-xs hover:bg-[#F1F3F5] cursor-pointer">
              <Link href="/employee/my-leaves" className="flex items-center gap-2 w-full px-3 py-2 text-[#334155]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#64748B]" />
                <span>My Applications</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#E5E7EB]" />
            <DropdownMenuItem
              onClick={onSignOut}
              className="rounded-lg text-xs text-[#991B1B] hover:bg-[#FEE2E2] hover:text-[#991B1B] px-3 py-2 cursor-pointer flex items-center gap-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
