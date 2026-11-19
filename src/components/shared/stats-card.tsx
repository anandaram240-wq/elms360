import * as React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  change?: {
    value: number; // percentage or numerical change
    type: "increase" | "decrease" | "neutral";
    period?: string; // e.g. "vs last month"
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
    <Card className={cn("overflow-hidden border transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground truncate">
            {title}
          </p>
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">
            {value}
          </span>
        </div>

        {(change || description) && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            {change && (
              <span
                className={cn(
                  "inline-flex items-center font-semibold rounded px-1.5 py-0.5",
                  change.type === "increase"
                    ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : change.type === "decrease"
                    ? "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400"
                    : "text-slate-600 bg-slate-50 dark:bg-slate-900"
                )}
              >
                {change.type === "increase" && (
                  <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
                )}
                {change.type === "decrease" && (
                  <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
                )}
                {change.type === "neutral" && (
                  <Minus className="mr-0.5 h-3.5 w-3.5" />
                )}
                {change.value > 0 ? `+${change.value}%` : `${change.value}%`}
              </span>
            )}
            <span>{change?.period || description}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
