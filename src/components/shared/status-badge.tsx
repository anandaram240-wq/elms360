import * as React from "react";
import {
  Check,
  X,
  Clock,
  HelpCircle,
  AlertCircle,
  FileText,
  Minus,
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
  showIcon?: boolean;
}

export function LeaveStatusBadge({
  status,
  className,
  showIcon = true,
}: LeaveStatusBadgeProps) {
  const normalized = (status || "").toUpperCase();

  // 1. APPROVED (#DCFCE7 / #166534)
  if (normalized === "APPROVED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#166534] border border-[#bbf7d0]",
          className
        )}
      >
        {showIcon && <Check className="h-3 w-3 stroke-[2.5]" />}
        <span>Approved</span>
      </span>
    );
  }

  // 2. REJECTED (#FEE2E2 / #991B1B)
  if (normalized === "REJECTED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#991B1B] border border-[#fecaca]",
          className
        )}
      >
        {showIcon && <X className="h-3 w-3 stroke-[2.5]" />}
        <span>Rejected</span>
      </span>
    );
  }

  // 3. PENDING (#FEF3C7 / #92400E)
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
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#fde68a]",
          className
        )}
      >
        {showIcon && <Clock className="h-3 w-3 stroke-[2]" />}
        <span>{label}</span>
      </span>
    );
  }

  // 4. CLARIFICATION REQUESTED (#F3E8FF / #6B21A8)
  if (normalized === "CLARIFICATION_REQUESTED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3E8FF] text-[#6B21A8] border border-[#e9d5ff]",
          className
        )}
      >
        {showIcon && <HelpCircle className="h-3 w-3 stroke-[2]" />}
        <span>Clarification</span>
      </span>
    );
  }

  // 5. WITHDRAWN / CANCELLED / DRAFT (#F1F5F9 / #334155)
  if (
    normalized === "WITHDRAWN" ||
    normalized.startsWith("CANCELLED") ||
    normalized === "DRAFT"
  ) {
    const label = normalized.startsWith("CANCELLED")
      ? "Cancelled"
      : normalized === "WITHDRAWN"
      ? "Withdrawn"
      : "Draft";

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#334155] border border-[#e2e8f0]",
          className
        )}
      >
        {showIcon && (
          normalized === "DRAFT" ? (
            <FileText className="h-3 w-3" />
          ) : (
            <Minus className="h-3 w-3 stroke-[2]" />
          )
        )}
        <span>{label}</span>
      </span>
    );
  }

  // Fallback Neutral
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#334155] border border-[#e2e8f0]",
        className
      )}
    >
      <span>{status || "Unknown"}</span>
    </span>
  );
}
