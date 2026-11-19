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
    { title: "Dashboard", href: "/employee", icon: LayoutDashboard },
    { title: "Apply Leave", href: "/employee/apply", icon: CalendarPlus },
    { title: "My Leaves", href: "/employee/leaves", icon: CalendarCheck },
    { title: "Calendar", href: "/employee/calendar", icon: CalendarIcon },
    { title: "Leave Balance", href: "/employee/balance", icon: PieChart },
    { title: "Notifications", href: "/employee/notifications", icon: Bell },
    { title: "Profile", href: "/employee/profile", icon: User },
  ],
  MANAGER: [
    { title: "Dashboard", href: "/manager", icon: LayoutDashboard },
    { title: "Approvals", href: "/manager/approvals", icon: CheckSquare, badge: "Pending" },
    { title: "Team", href: "/manager/team", icon: Users },
    { title: "Team Calendar", href: "/manager/calendar", icon: CalendarRange },
    { title: "Delegations", href: "/manager/delegations", icon: UserCheck },
    { title: "History", href: "/manager/history", icon: History },
  ],
  HR: [
    { title: "Dashboard", href: "/hr", icon: LayoutDashboard },
    { title: "Employees", href: "/hr/employees", icon: Users },
    { title: "Departments", href: "/hr/departments", icon: Building2 },
    { title: "Leave Requests", href: "/hr/requests", icon: CalendarCheck },
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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r bg-card text-card-foreground transition-all duration-300 ease-in-out",
          // Mobile state
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Width based on collapse
          isCollapsed ? "lg:w-20" : "lg:w-64",
          "w-64"
        )}
      >
        {/* Top Header / Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-600 text-white font-bold shadow-md">
              ABC
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-foreground text-base">
                  ABC Technologies
                </span>
                <span className="text-xs font-semibold text-primary">
                  ELMS 360
                </span>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="hidden lg:flex h-8 w-8 text-muted-foreground hover:text-foreground"
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
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  isCollapsed && !isMobileOpen ? "justify-center px-0" : ""
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="flex-1 truncate">{item.title}</span>
                )}
                {(!isCollapsed || isMobileOpen) && badgeValue !== undefined && (
                  <Badge
                    variant={isActive ? "secondary" : "default"}
                    className={cn(
                      "ml-auto text-xs px-1.5 py-0.2",
                      isActive
                        ? "bg-primary-foreground text-primary"
                        : "bg-navy-600 text-white"
                    )}
                  >
                    {badgeValue}
                  </Badge>
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
                      <Badge variant="secondary" className="text-xs px-1.5">
                        {badgeValue}
                      </Badge>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </div>

        {/* Bottom Section */}
        <div className="border-t p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg p-2 bg-muted/40",
              isCollapsed && !isMobileOpen ? "justify-center px-0" : ""
            )}
          >
            <Avatar className="h-9 w-9 border border-border">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
              <AvatarFallback className="bg-navy-100 text-navy-800 text-xs font-semibold">
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
                <p className="truncate text-xs font-semibold text-foreground">
                  {user.name}
                </p>
                <Badge
                  variant="outline"
                  className="mt-0.5 text-[10px] px-1.5 py-0 uppercase font-medium"
                >
                  {user.role}
                </Badge>
              </div>
            )}
            {(!isCollapsed || isMobileOpen) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSignOut}
                title="Sign out"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
