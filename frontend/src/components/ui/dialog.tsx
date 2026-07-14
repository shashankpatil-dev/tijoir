"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Dialog({
  children,
  description,
  onClose,
  open,
  title,
}: {
  children: React.ReactNode;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  return (
    <DialogPrimitive.Root onOpenChange={(value) => (!value ? onClose() : undefined)} open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-[rgba(13,34,64,0.4)] backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[71] flex w-[min(100%-2rem,48rem)] max-h-[calc(100vh-4rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
            <div className="space-y-1">
              <DialogPrimitive.Title className="text-[18px] font-semibold leading-7 text-[var(--color-ink-strong)]">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-sm leading-6 text-[var(--color-muted)]">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close asChild>
              <Button aria-label="Close dialog" size="icon-sm" type="button" variant="ghost">
                <X />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function ConfirmDialog({
  confirmLabel = "Confirm",
  description,
  onClose,
  onConfirm,
  open,
  title,
  tone = "danger",
}: {
  confirmLabel?: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
  tone?: "danger" | "primary";
}) {
  return (
    <AlertDialogPrimitive.Root
      onOpenChange={(value) => (!value ? onClose() : undefined)}
      open={open}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-[rgba(13,34,64,0.4)] backdrop-blur-sm" />
        <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[71] w-[min(100%-2rem,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)] outline-none">
          <AlertDialogPrimitive.Title className="text-[18px] font-semibold leading-7 text-[var(--color-ink-strong)]">
            {title}
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            {description}
          </AlertDialogPrimitive.Description>
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialogPrimitive.Cancel asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <Button
                onClick={onConfirm}
                type="button"
                variant={tone === "danger" ? "danger" : "primary"}
              >
                {confirmLabel}
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

export function DialogFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mt-6 flex justify-end gap-3", className)}>{children}</div>;
}
