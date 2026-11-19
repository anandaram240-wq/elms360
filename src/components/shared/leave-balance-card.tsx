import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface LeaveBalanceCardProps {
  leaveTypeName: string;
  color?: string; // hex or tailwind color class
  available: number;
  total: number;
  used?: number;
  pending?: number;
  unit?: string; // 'days' or 'hours'
  className?: string;
}

export function LeaveBalanceCard({
  leaveTypeName,
  color = "#4a6cf7",
  available,
  total,
  used,
  pending = 0,
  unit = "days",
  className,
}: LeaveBalanceCardProps) {
  // If used is not explicitly provided, calculate used = total - available
  const calculatedUsed = used !== undefined ? used : Math.max(0, total - available);
  const usedPercentage = total > 0 ? Math.min(100, Math.round((calculatedUsed / total) * 100)) : 0;

  return (
    <Card className={cn("overflow-hidden border transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-5">
        {/* Header with Leave Type Name & Color Dot */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: color }}
            />
            <h4 className="font-semibold text-sm text-foreground truncate max-w-[150px]">
              {leaveTypeName}
            </h4>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {usedPercentage}% used
          </span>
        </div>

        {/* Numbers: Available / Total */}
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-3xl font-extrabold text-foreground">
              {available}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              / {total} {unit}
            </span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            {available} available
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <Progress value={usedPercentage} className="h-2" />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Used: {calculatedUsed} {unit}</span>
            {pending > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Pending: {pending} {unit}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
