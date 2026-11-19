import * as React from "react";
import {
  Check,
  X,
  Clock,
  Minus,
  HelpCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type LeaveStatus =
  | "APPROVED"
  | "REJECTED"
  | "PENDING"
  | "PENDING_MANAGER_APPROVAL"
  | "PENDING_HR_APPROVAL"
  | "PENDING_ADDITIONAL_APPROVAL"
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
  const normalized = (status || "").toUpperCase();

  // 1. APPROVED
  if (normalized === "APPROVED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
          className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
        <Check className="h-3 w-3 text-emerald-700 dark:text-emerald-300 stroke-[2.5]" />
        <span>Approved</span>
      </span>
    );
  }

  // 2. REJECTED
  if (normalized === "REJECTED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-200/80 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
          className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400" />
        <X className="h-3 w-3 text-red-700 dark:text-red-300 stroke-[2.5]" />
        <span>Rejected</span>
      </span>
    );
  }

  // 3. PENDING (Manager, HR, or general)
  if (
    normalized.startsWith("PENDING") ||
    normalized === "PENDING_MANAGER_APPROVAL" ||
    normalized === "PENDING_HR_APPROVAL" ||
    normalized === "PENDING_ADDITIONAL_APPROVAL"
  ) {
    const label = normalized.includes("HR")
      ? "Pending HR"
      : normalized.includes("MANAGER")
      ? "Pending Manager"
      : "Pending";

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
          className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
        <Clock className="h-3 w-3 text-amber-700 dark:text-amber-300 stroke-[2]" />
        <span>{label}</span>
      </span>
    );
  }

  // 4. CLARIFICATION REQUESTED
  if (normalized === "CLARIFICATION_REQUESTED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
          className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
        <HelpCircle className="h-3 w-3 text-blue-700 dark:text-blue-300" />
        <span>Clarification Requested</span>
      </span>
    );
  }

  // 5. WITHDRAWN
  if (normalized === "WITHDRAWN") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
          className
        )}
      >
        <Minus className="h-3 w-3 text-slate-500" />
        <span>Withdrawn</span>
      </span>
    );
  }

  // 6. CANCELLED
  if (normalized.startsWith("CANCELLED")) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
          className
        )}
      >
        <AlertCircle className="h-3 w-3 text-slate-500" />
        <span>Cancelled</span>
      </span>
    );
  }

  // 7. DRAFT / Default
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
        className
      )}
    >
      <FileText className="h-3 w-3 text-slate-400" />
      <span>{status || "Draft"}</span>
    </span>
  );
}
