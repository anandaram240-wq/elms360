import * as React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
    period?: string;
  };
  className?: string;
  badge?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  change,
  className,
  badge,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white transition-all duration-150 hover:border-slate-300 hover:shadow-card",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </p>
          <div className="flex items-center gap-2">
            {badge && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {badge}
              </span>
            )}
            {Icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
                <Icon className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
            {value}
          </span>
        </div>

        {(change || description) && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
            {change && (
              <span
                className={cn(
                  "inline-flex items-center font-medium rounded-full px-2 py-0.5",
                  change.type === "increase"
                    ? "text-emerald-800 bg-[#DCFCE7]"
                    : change.type === "decrease"
                    ? "text-red-800 bg-[#FEE2E2]"
                    : "text-slate-700 bg-slate-100"
                )}
              >
                {change.type === "increase" ? (
                  <ArrowUpRight className="mr-0.5 h-3 w-3" />
                ) : change.type === "decrease" ? (
                  <ArrowDownRight className="mr-0.5 h-3 w-3" />
                ) : null}
                {change.value > 0 ? `${change.value}%` : ""}
              </span>
            )}
            {description && <span className="truncate">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
