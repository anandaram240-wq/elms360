import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

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
        "rounded-xl border border-[#E5E7EB] bg-white transition-all duration-150 hover:border-[#D1D5DB] shadow-subtle",
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
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#111827] truncate max-w-[160px]">
              {leaveTypeName}
            </h4>
          </div>
          <span className="text-xs font-medium text-[#64748B]">
            {usedPercentage}% used
          </span>
        </div>

        {/* Numbers: Available / Total */}
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-3xl font-bold tracking-tight text-[#111827] tabular-nums">
              {available}
            </span>
            <span className="text-xs text-[#64748B] ml-1.5 font-normal">
              / {total} {unit}
            </span>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
            Available Quota
          </span>
        </div>

        {/* Apple-style thin Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F1F3F5]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${usedPercentage}%`,
              backgroundColor: usedPercentage > 85 ? "#DC2626" : color,
            }}
          />
        </div>

        {/* Sub-breakdown footer */}
        <div className="mt-3.5 flex items-center justify-between text-xs text-[#64748B] border-t border-[#F1F3F5] pt-2.5">
          <span>Used: <strong className="font-semibold text-[#111827]">{calculatedUsed} {unit}</strong></span>
          {pending > 0 ? (
            <span className="text-[#92400E] font-medium">
              Pending: <strong>{pending} {unit}</strong>
            </span>
          ) : (
            <span className="text-[#166534] font-medium">
              Ready to apply
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
