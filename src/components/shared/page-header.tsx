import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode; // Optional action buttons slot
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 pb-6 border-b border-[#E5E7EB] sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[#64748B] max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
