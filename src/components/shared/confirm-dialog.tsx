"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  trigger?: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  isOpen,
  onOpenChange,
  onClose,
  trigger,
  title,
  description,
  confirmLabel,
  confirmText,
  cancelLabel = "Cancel",
  variant = "destructive",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const resolvedOpen = isOpen !== undefined ? isOpen : open !== undefined ? open : internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && onClose) {
      onClose();
    }
    if (onOpenChange) {
      onOpenChange(nextOpen);
    }
    setInternalOpen(nextOpen);
  };

  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    await onConfirm();
    handleOpenChange(false);
  };

  const finalConfirmText = confirmText || confirmLabel || "Continue";

  return (
    <AlertDialog open={resolvedOpen} onOpenChange={handleOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="rounded-2xl border border-[#E5E7EB] bg-white text-[#111827] shadow-modal">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-bold text-[#111827]">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-[#64748B] leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-2">
          <AlertDialogCancel
            disabled={isLoading}
            onClick={() => handleOpenChange(false)}
            className="text-xs h-9 border-[#E5E7EB] text-[#475569] hover:bg-[#F1F3F5]"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAction}
            disabled={isLoading}
            className={cn(
              "text-xs h-9 font-semibold",
              variant === "destructive"
                ? "bg-[#991B1B] hover:bg-[#7F1D1D] text-white"
                : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
            )}
          >
            {isLoading ? "Processing..." : finalConfirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
