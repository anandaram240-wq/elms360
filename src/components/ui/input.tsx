import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm text-[#111827] shadow-xs transition-colors placeholder:text-[#94A3B8] focus-visible:outline-none focus-visible:border-[#2563EB] focus-visible:ring-1 focus-visible:ring-[#2563EB] disabled:cursor-not-allowed disabled:opacity-40",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
