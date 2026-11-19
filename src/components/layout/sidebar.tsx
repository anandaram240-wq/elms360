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
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}

export const ROLE_NAVIGATION: Record<Role, NavItem[]> = {
  EMPLOYEE: [
    { title: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
    { title: "Apply Leave", href: "/employee/apply-leave", icon: CalendarPlus },
    { title: "My Leaves", href: "/employee/my-leaves", icon: CalendarCheck },
    { title: "Calendar", href: "/employee/leave-calendar", icon: CalendarIcon },
    { title: "Leave Balance", href: "/employee/leave-balance", icon: PieChart },
    { title: "Notifications", href: "/employee/notifications", icon: Bell },
    { title: "Profile", href: "/employee/profile", icon: User },
  ],
  MANAGER: [
    { title: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
    { title: "Approvals", href: "/manager/approvals", icon: CheckSquare, badge: "Pending" },
    { title: "Team", href: "/manager/team", icon: Users },
    { title: "Team Calendar", href: "/manager/team-calendar", icon: CalendarRange },
    { title: "Delegations", href: "/manager/delegations", icon: UserCheck },
    { title: "History", href: "/manager/history", icon: History },
  ],
  HR: [
    { title: "Dashboard", href: "/hr/dashboard", icon: LayoutDashboard },
    { title: "Employees", href: "/hr/employees", icon: Users },
    { title: "Departments", href: "/hr/departments", icon: Building2 },
    { title: "Leave Requests", href: "/hr/leave-requests", icon: CalendarCheck },
    { title: "Approval Workflows", href: "/hr/approval-workflows", icon: GitBranch },
    { title: "Leave Types", href: "/hr/leave-types", icon: FileText },
    { title: "Leave Policies", href: "/hr/leave-policies", icon: FileSpreadsheet },
    { title: "Leave Balances", href: "/hr/leave-balances", icon: PieChart },
    { title: "Holidays", href: "/hr/holidays", icon: CalendarIcon },
    { title: "Work Schedules", href: "/hr/work-schedules", icon: Clock },
    { title: "Reports", href: "/hr/reports", icon: BarChart3 },
    { title: "Audit Logs", href: "/hr/audit-logs", icon: History },
    { title: "Settings", href: "/hr/settings", icon: Settings },
  ],
  ADMIN: [
    { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Organizations", href: "/admin/organizations", icon: Building },
    { title: "Users", href: "/admin/users", icon: Users },
    { title: "Roles", href: "/admin/roles", icon: ShieldCheck },
    { title: "Permissions", href: "/admin/permissions", icon: Key },
    { title: "Security", href: "/admin/security", icon: Lock },
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
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onSignOut?: () => void;
  pendingApprovalsCount?: number;
}

export function Sidebar({
  role = "EMPLOYEE",
  navItems,
  user = { name: "Ananda K", role: "EMPLOYEE" },
  isMobileOpen = false,
  onCloseMobile,
  onSignOut,
  pendingApprovalsCount = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(false);

  React.useEffect(() => {
    const saved = localStorage.getItem("elms360_sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("elms360_sidebar_collapsed", String(next));
      return next;
    });
  };

  const items = navItems || ROLE_NAVIGATION[role] || ROLE_NAVIGATION.EMPLOYEE;

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-white text-slate-900 transition-all duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          "w-64"
        )}
      >
        {/* Top Header / Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4 dark:border-slate-800">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-[0_1px_2px_rgba(37,99,235,0.3)]">
              ABC
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col">
                <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-100 text-sm">
                  ABC Technologies
                </span>
                <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                  ELMS 360
                </span>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="hidden lg:flex h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(`${item.href}/`));

            const badgeValue =
              item.title === "Approvals" && pendingApprovalsCount > 0
                ? pendingApprovalsCount
                : item.badge;

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.15)] dark:bg-blue-950/40 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                  isCollapsed && !isMobileOpen ? "justify-center px-0" : ""
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"
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
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {item.title}
                    {badgeValue !== undefined && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 font-semibold">
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

        {/* Bottom Section - Profile & Sign Out */}
        <div className="border-t border-slate-200/80 p-3 dark:border-slate-800">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl p-2 bg-slate-50/80 border border-slate-200/60 dark:bg-slate-800/60 dark:border-slate-700/60",
              isCollapsed && !isMobileOpen ? "justify-center px-0" : ""
            )}
          >
            <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
              <AvatarFallback className="bg-blue-100 text-blue-800 text-xs font-semibold dark:bg-blue-950 dark:text-blue-300">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {user.name}
                </p>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
            )}
            {(!isCollapsed || isMobileOpen) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSignOut}
                title="Sign out"
                className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
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
