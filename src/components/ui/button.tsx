import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#2563EB] text-white shadow-subtle hover:bg-[#1D4ED8] active:bg-[#1E40AF]",
        destructive:
          "bg-[#DC2626] text-white shadow-subtle hover:bg-[#B91C1C] active:bg-[#991B1B]",
        outline:
          "border border-[#E5E7EB] bg-white text-[#334155] shadow-xs hover:bg-[#F1F3F5] hover:text-[#111827] active:bg-[#E5E7EB]",
        secondary:
          "bg-[#F1F3F5] text-[#111827] hover:bg-[#E5E7EB] active:bg-[#D1D5DB]",
        ghost:
          "text-[#475569] hover:bg-[#F1F3F5] hover:text-[#111827]",
        link:
          "text-[#2563EB] underline-offset-4 hover:underline p-0 h-auto font-normal",
      },
      size: {
        default: "h-9 px-4 py-2 text-xs sm:text-sm",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-sm sm:text-base font-semibold",
        icon: "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
