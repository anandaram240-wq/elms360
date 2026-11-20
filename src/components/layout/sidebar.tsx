"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarCheck,
  Calendar as CalendarIcon,
  PieChart,
  Bell,
  User,
  CheckSquare,
  Users,
  CalendarRange,
  UserCheck,
  History,
  Building2,
  GitBranch,
  FileSpreadsheet,
  Clock,
  BarChart3,
  FileText,
  Settings,
  ShieldCheck,
  Key,
  Lock,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type Role = "EMPLOYEE" | "MANAGER" | "HR" | "ADMIN";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  section?: string;
}

export const ROLE_NAVIGATION: Record<Role, NavItem[]> = {
  EMPLOYEE: [
    { title: "Overview", href: "/employee/dashboard", icon: LayoutDashboard },
    { title: "Apply Leave", href: "/employee/apply-leave", icon: CalendarPlus },
    { title: "My Leaves", href: "/employee/my-leaves", icon: CalendarCheck },
    { title: "Leave Balance", href: "/employee/leave-balance", icon: PieChart },
    { title: "Leave Calendar", href: "/employee/leave-calendar", icon: CalendarIcon },
    { title: "Notifications", href: "/employee/notifications", icon: Bell },
    { title: "My Profile", href: "/employee/profile", icon: User },
  ],
  MANAGER: [
    { title: "Overview", href: "/manager/dashboard", icon: LayoutDashboard },
    { title: "Pending Approvals", href: "/manager/approvals", icon: CheckSquare, badge: "Pending" },
    { title: "All Requests", href: "/manager/history", icon: History },
    { title: "Team Members", href: "/manager/team", icon: Users },
    { title: "Team Calendar", href: "/manager/team-calendar", icon: CalendarRange },
    { title: "Delegations", href: "/manager/delegations", icon: UserCheck },
    { title: "Notifications", href: "/manager/notifications", icon: Bell },
  ],
  HR: [
    { title: "Overview", href: "/hr/dashboard", icon: LayoutDashboard },
    { title: "Employees", href: "/hr/employees", icon: Users },
    { title: "Departments", href: "/hr/departments", icon: Building2 },
    { title: "Leave Requests", href: "/hr/approvals", icon: CheckSquare, badge: "Pending" },
    { title: "Policies & Types", href: "/hr/policies", icon: FileSpreadsheet },
    { title: "Holiday Calendar", href: "/hr/holidays", icon: CalendarIcon },
    { title: "Reports & Ledger", href: "/hr/reports", icon: BarChart3 },
    { title: "Audit Logs", href: "/hr/audit-logs", icon: FileText },
    { title: "Settings", href: "/hr/settings", icon: Settings },
  ],
  ADMIN: [
    { title: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Organizations", href: "/admin/organizations", icon: Building },
    { title: "Users", href: "/admin/users", icon: Users },
    { title: "Roles", href: "/admin/roles", icon: ShieldCheck },
    { title: "Permissions", href: "/admin/permissions", icon: Key },
    { title: "Security", href: "/admin/security", icon: Lock },
    { title: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
    { title: "System Settings", href: "/admin/system-settings", icon: Settings },
  ],
};

export interface SidebarProps {
  role?: Role;
  navItems?: NavItem[];
  user?: {
    name: string;
    email?: string;
    avatarUrl?: string;
    role: string;
  };
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onSignOut?: () => void;
  pendingApprovalsCount?: number;
}

export function Sidebar({
  role = "EMPLOYEE",
  navItems,
  user = { name: "Ananda K", role: "EMPLOYEE" },
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  onSignOut,
  pendingApprovalsCount = 0,
}: SidebarProps) {
  const pathname = usePathname();

  const items = navItems || ROLE_NAVIGATION[role] || ROLE_NAVIGATION.EMPLOYEE;

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-[#E5E7EB] bg-white text-[#111827] transition-all duration-180 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          "w-64"
        )}
      >
        {/* Top Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#E5E7EB] px-4">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white font-bold text-sm shadow-[0_1px_3px_rgba(37,99,235,0.25)]">
              E
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold tracking-tight text-[#111827] text-sm truncate">
                  ELMS 360
                </span>
                <span className="text-[11px] font-medium text-[#64748B] truncate">
                  ABC Technologies
                </span>
              </div>
            )}
          </Link>
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="hidden lg:flex h-7 w-7 text-[#64748B] hover:text-[#111827] hover:bg-[#F1F3F5] rounded-lg"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Navigation Group Header */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-4 pt-4 pb-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              {role === "HR" ? "HR Administration" : role === "MANAGER" ? "Manager Workbench" : role === "ADMIN" ? "System Admin" : "Leave Management"}
            </p>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(`${item.href}/`));

            const isPendingApprovals =
              item.title.toLowerCase().includes("approval") ||
              item.title.toLowerCase().includes("approvals");

            const badgeValue =
              isPendingApprovals && pendingApprovalsCount > 0
                ? pendingApprovalsCount
                : item.badge;

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-120",
                  isActive
                    ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                    : "text-[#475569] hover:bg-[#F1F3F5] hover:text-[#111827]",
                  isCollapsed && !isMobileOpen ? "justify-center px-0" : ""
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-[#2563EB]"
                      : "text-[#64748B] group-hover:text-[#111827]"
                  )}
                />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="flex-1 truncate">{item.title}</span>
                )}
                {(!isCollapsed || isMobileOpen) && badgeValue !== undefined && (
                  <span
                    className={cn(
                      "ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full",
                      isActive
                        ? "bg-[#2563EB] text-white"
                        : "bg-[#FEF3C7] text-[#92400E]"
                    )}
                  >
                    {badgeValue}
                  </span>
                )}
              </Link>
            );

            if (isCollapsed && !isMobileOpen) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2 bg-white text-[#111827] border border-[#E5E7EB] shadow-dropdown">
                    {item.title}
                    {badgeValue !== undefined && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] font-semibold">
                        {badgeValue}
                      </span>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </div>

        {/* Bottom User Profile Section */}
        <div className="border-t border-[#E5E7EB] p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg p-2 bg-[#F8FAFC] border border-[#E5E7EB]",
              isCollapsed && !isMobileOpen ? "justify-center px-0" : ""
            )}
          >
            <Link
              href="/employee/profile"
              className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity"
              title="View profile"
            >
              <Avatar className="h-8 w-8 border border-[#E5E7EB] shrink-0">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold">
                  {(user?.name || "User")
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {(!isCollapsed || isMobileOpen) && (
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-semibold text-[#111827]">
                    {user?.name || "Employee"}
                  </p>
                  <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider">
                    {user?.role || "EMPLOYEE"}
                  </span>
                </div>
              )}
            </Link>
            {(!isCollapsed || isMobileOpen) && onSignOut && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSignOut}
                title="Sign out"
                className="h-7 w-7 text-[#64748B] hover:text-[#991B1B] hover:bg-[#FEE2E2] rounded-lg"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
