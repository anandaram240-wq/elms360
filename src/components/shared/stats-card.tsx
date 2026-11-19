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
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  change,
  className,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {title}
          </p>
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {value}
          </span>
        </div>

        {(change || description) && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {change && (
              <span
                className={cn(
                  "inline-flex items-center font-medium rounded-full px-2 py-0.5",
                  change.type === "increase"
                    ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : change.type === "decrease"
                    ? "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400"
                    : "text-slate-600 bg-slate-50 dark:bg-slate-800"
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
