"use client";

import * as React from "react";
import Link from "next/link";
import {
  Menu,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const statusConfig = {
    connected: {
      color: "bg-emerald-500",
      text: "Connected (Real-time sync active)",
      icon: Wifi,
    },
    reconnecting: {
      color: "bg-amber-500 animate-pulse",
      text: "Reconnecting to server...",
      icon: Wifi,
    },
    disconnected: {
      color: "bg-red-500",
      text: "Disconnected from server",
      icon: WifiOff,
    },
  }[connectionStatus];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      {/* Left side: Hamburger button + Page Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="lg:hidden h-9 w-9 text-muted-foreground"
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
          {title}
        </h1>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Connection status indicator */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-full text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-colors">
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 rounded-full ring-2 ring-background",
                    statusConfig.color
                  )}
                />
                <span className="hidden md:inline capitalize text-[11px] font-medium text-muted-foreground">
                  {connectionStatus}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{statusConfig.text}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Global Search Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 text-muted-foreground h-9 px-3 w-40 lg:w-60 justify-start"
        >
          <Search className="h-4 w-4" />
          <span className="text-xs truncate">Search leave, employees...</span>
          <kbd className="pointer-events-none ml-auto hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSearch}
          className="sm:hidden h-9 w-9 text-muted-foreground"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications bell */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenNotifications}
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadNotificationsCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm"
            >
              {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
            </Badge>
          )}
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full p-0 ring-offset-background hover:ring-2 hover:ring-ring"
            >
              <Avatar className="h-9 w-9">
                {user.avatarUrl && (
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-foreground truncate">
                  {user.name}
                </p>
                {user.email && (
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user.email}
                  </p>
                )}
                {user.role && (
                  <Badge variant="secondary" className="w-fit text-[10px] mt-1">
                    {user.role}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/employee/profile" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onSignOut}
              className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
