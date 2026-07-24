"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "danger",
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                variant === "danger"
                  ? "bg-red-100 text-red-500"
                  : variant === "warning"
                    ? "bg-amber-100 text-amber-500"
                    : "bg-blue-100 text-blue-500"
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-navy">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1 text-xs text-silver">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#dde4ec] text-slate"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={
              variant === "danger"
                ? "bg-red-500 hover:bg-red-600"
                : variant === "warning"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-teal hover:bg-teal-dark"
            }
          >
            {loading ? "..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
