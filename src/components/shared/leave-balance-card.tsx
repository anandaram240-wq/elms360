import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface LeaveBalanceCardProps {
  leaveTypeName: string;
  color?: string;
  available: number;
  total: number;
  used?: number;
  pending?: number;
  unit?: string;
  className?: string;
}

export function LeaveBalanceCard({
  leaveTypeName,
  color = "#2563EB",
  available,
  total,
  used,
  pending = 0,
  unit = "days",
  className,
}: LeaveBalanceCardProps) {
  const calculatedUsed = used !== undefined ? used : Math.max(0, total - available);
  const usedPercentage = total > 0 ? Math.min(100, Math.round((calculatedUsed / total) * 100)) : 0;

  return (
    <Card
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      <CardContent className="p-5">
        {/* Header with Leave Type Name & Indicator Dot */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate max-w-[160px]">
              {leaveTypeName}
            </h4>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {usedPercentage}% used
          </span>
        </div>

        {/* Numbers: Available / Total */}
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {available}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-normal">
              / {total} {unit}
            </span>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            Active Quota
          </span>
        </div>

        {/* Apple-style thin Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${usedPercentage}%`,
              backgroundColor: color,
            }}
          />
        </div>

        {/* Sub-breakdown footer */}
        <div className="mt-3.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
          <span>Used: <strong className="font-semibold text-slate-700 dark:text-slate-300">{calculatedUsed} {unit}</strong></span>
          {pending > 0 && (
            <span className="text-amber-700 dark:text-amber-400 font-medium">
              Pending: {pending} {unit}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
