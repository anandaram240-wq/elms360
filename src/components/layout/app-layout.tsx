"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sidebar, Role, NavItem } from "@/components/layout/sidebar";
import { Header, ConnectionStatus } from "@/components/layout/header";
import { NotificationPanel, NotificationItem } from "@/components/shared/notification-panel";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

export interface AppLayoutProps {
  children: React.ReactNode;
  role?: Role;
  title?: string;
  navItems?: NavItem[];
  user?: {
    name: string;
    email?: string;
    avatarUrl?: string;
    role: string;
  };
  connectionStatus?: ConnectionStatus;
  notifications?: NotificationItem[];
  unreadNotificationsCount?: number;
  onNotificationClick?: (notification: NotificationItem) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onSignOut?: () => void;
  pendingApprovalsCount?: number;
}

export function AppLayout({
  children,
  role = "EMPLOYEE",
  title = "Overview",
  navItems,
  user = { name: "Ananda K", email: "ananda@abctech.com", role: "EMPLOYEE" },
  connectionStatus = "connected",
  notifications = [],
  unreadNotificationsCount = 0,
  onNotificationClick,
  onMarkAllNotificationsAsRead,
  onSignOut,
  pendingApprovalsCount = 0,
}: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("elms360_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("elms360_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
    } else {
      await signOut();
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#111827]">
      {/* Sidebar */}
      <Sidebar
        role={role}
        navItems={navItems}
        user={user}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onSignOut={handleSignOut}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main App Container */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-180 ease-in-out",
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        {/* Universal Top Header */}
        <Header
          title={title}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadNotificationsCount={unreadNotificationsCount}
          connectionStatus={connectionStatus}
          user={user}
          onSignOut={handleSignOut}
        />

        {/* Page Content Surface */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Slide-out Notification Drawer */}
      <NotificationPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onNotificationClick={onNotificationClick}
        onMarkAllAsRead={onMarkAllNotificationsAsRead}
      />
    </div>
  );
}
