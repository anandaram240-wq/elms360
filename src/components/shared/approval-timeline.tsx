import * as React from "react";
import { format } from "date-fns";
import { Check, X, Clock, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export type ApprovalAction =
  | "APPROVED"
  | "REJECTED"
  | "PENDING"
  | "CLARIFICATION_REQUESTED"
  | "SKIPPED";

export interface TimelineStep {
  id: string;
  actorName: string;
  actorRole?: string;
  actorAvatar?: string;
  action: ApprovalAction;
  comments?: string;
  timestamp?: string | Date;
  isCurrent?: boolean;
}

export interface ApprovalTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function ApprovalTimeline({ steps, className }: ApprovalTimelineProps) {
  const getStatusColor = (action: ApprovalAction) => {
    switch (action) {
      case "APPROVED":
        return {
          icon: Check,
          bg: "bg-emerald-500",
          border: "border-emerald-500",
          ring: "ring-emerald-100 dark:ring-emerald-950",
          badgeVariant: "success" as const,
        };
      case "REJECTED":
        return {
          icon: X,
          bg: "bg-destructive",
          border: "border-destructive",
          ring: "ring-rose-100 dark:ring-rose-950",
          badgeVariant: "destructive" as const,
        };
      case "CLARIFICATION_REQUESTED":
        return {
          icon: HelpCircle,
          bg: "bg-sky-500",
          border: "border-sky-500",
          ring: "ring-sky-100 dark:ring-sky-950",
          badgeVariant: "default" as const,
        };
      case "PENDING":
      default:
        return {
          icon: Clock,
          bg: "bg-amber-500",
          border: "border-amber-500",
          ring: "ring-amber-100 dark:ring-amber-950",
          badgeVariant: "warning" as const,
        };
    }
  };

  return (
    <div className={cn("flow-root", className)}>
      <ul role="list" className="-mb-8">
        {steps.map((step, stepIdx) => {
          const config = getStatusColor(step.action);
          const Icon = config.icon;
          const isLast = stepIdx === steps.length - 1;

          return (
            <li key={step.id}>
              <div className="relative pb-8">
                {/* Connecting line */}
                {!isLast && (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-border"
                    aria-hidden="true"
                  />
                )}

                <div className="relative flex items-start space-x-3">
                  {/* Status Node Icon */}
                  <div className="relative">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-white ring-4",
                        config.bg,
                        config.ring,
                        step.isCurrent && "ring-8 ring-primary/20 animate-pulse"
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Step Details */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {step.actorAvatar && (
                            <AvatarImage src={step.actorAvatar} alt={step.actorName} />
                          )}
                          <AvatarFallback className="text-[10px] font-semibold bg-muted">
                            {step.actorName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-semibold text-foreground">
                          {step.actorName}
                        </p>
                        {step.actorRole && (
                          <span className="text-xs text-muted-foreground">
                            ({step.actorRole})
                          </span>
                        )}
                        {step.isCurrent && (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary text-[10px] font-medium px-1.5"
                          >
                            Current Step
                          </Badge>
                        )}
                      </div>

                      {step.timestamp && (
                        <time className="text-xs text-muted-foreground">
                          {typeof step.timestamp === "string"
                            ? step.timestamp
                            : format(step.timestamp, "MMM d, yyyy · h:mm a")}
                        </time>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Action:
                      </span>
                      <Badge variant={config.badgeVariant} className="text-xs py-0">
                        {step.action.replace("_", " ")}
                      </Badge>
                    </div>

                    {step.comments && (
                      <div className="mt-2 text-xs text-foreground bg-muted/50 rounded-md p-2.5 border border-border">
                        <p className="italic">"{step.comments}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
