"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sidebar, Role, NavItem } from "@/components/layout/sidebar";
import { Header, ConnectionStatus } from "@/components/layout/header";
import { NotificationPanel, NotificationItem } from "@/components/shared/notification-panel";
import { signOut } from "@/app/actions/auth";

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
  title = "Dashboard",
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
  const router = useRouter();

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
    } else {
      await signOut();
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Component */}
      <Sidebar
        role={role}
        navItems={navItems}
        user={user}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onSignOut={handleSignOut}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-col transition-all duration-300 ease-in-out lg:pl-64">
        {/* Top Header */}
        <Header
          title={title}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadNotificationsCount={unreadNotificationsCount}
          connectionStatus={connectionStatus}
          user={user}
          onSignOut={handleSignOut}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Slide-out Notification Panel */}
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
