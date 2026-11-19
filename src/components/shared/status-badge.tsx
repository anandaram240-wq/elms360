import * as React from "react";
import {
  Check,
  X,
  Clock,
  Minus,
  Slash,
  HelpCircle,
  Pencil,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type LeaveStatus =
  | "APPROVED"
  | "REJECTED"
  | "PENDING"
  | "PENDING_MANAGER"
  | "PENDING_HR"
  | "PENDING_DEPT_HEAD"
  | "WITHDRAWN"
  | "CANCELLED"
  | "CANCELLED_BY_EMPLOYEE"
  | "CANCELLED_BY_HR"
  | "CLARIFICATION_REQUESTED"
  | "DRAFT";

export interface LeaveStatusBadgeProps {
  status: LeaveStatus | string;
  className?: string;
}

export function LeaveStatusBadge({ status, className }: LeaveStatusBadgeProps) {
  const normalized = status.toUpperCase();

  // 1. APPROVED
  if (normalized === "APPROVED") {
    return (
      <Badge
        className={cn(
          "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1 font-medium",
          className
        )}
      >
        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Approved</span>
      </Badge>
    );
  }

  // 2. REJECTED
  if (normalized === "REJECTED") {
    return (
      <Badge
        className={cn(
          "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 flex items-center gap-1 font-medium",
          className
        )}
      >
        <X className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
        <span>Rejected</span>
      </Badge>
    );
  }

  // 3. PENDING_*
  if (normalized.startsWith("PENDING")) {
    const formatted = normalized
      .replace("PENDING_", "")
      .replace("_", " ")
      .toLowerCase();

    const label = normalized === "PENDING" ? "Pending" : `Pending (${formatted})`;

    return (
      <Badge
        className={cn(
          "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1 font-medium capitalize",
          className
        )}
      >
        <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span>{label}</span>
      </Badge>
    );
  }

  // 4. WITHDRAWN
  if (normalized === "WITHDRAWN") {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1 font-medium",
          className
        )}
      >
        <Minus className="h-3.5 w-3.5 text-slate-500" />
        <span>Withdrawn</span>
      </Badge>
    );
  }

  // 5. CANCELLED*
  if (normalized.startsWith("CANCELLED")) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1 font-medium",
          className
        )}
      >
        <Slash className="h-3.5 w-3.5 text-slate-500" />
        <span>Cancelled</span>
      </Badge>
    );
  }

  // 6. CLARIFICATION_REQUESTED
  if (normalized === "CLARIFICATION_REQUESTED") {
    return (
      <Badge
        className={cn(
          "bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 flex items-center gap-1 font-medium",
          className
        )}
      >
        <HelpCircle className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
        <span>Clarification Requested</span>
      </Badge>
    );
  }

  // 7. DRAFT
  if (normalized === "DRAFT") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-dashed text-muted-foreground flex items-center gap-1 font-medium",
          className
        )}
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Draft</span>
      </Badge>
    );
  }

  // Default fallback
  return (
    <Badge variant="outline" className={cn("capitalize", className)}>
      {status.toLowerCase().replace(/_/g, " ")}
    </Badge>
  );
}
