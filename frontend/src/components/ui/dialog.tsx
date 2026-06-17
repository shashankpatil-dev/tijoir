"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function Dialog({
  children,
  description,
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(13,34,64,0.4)] px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-xl rounded-xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] sm:max-w-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
          <div className="space-y-1">
            <h2 className="text-[18px] font-semibold leading-7 text-[var(--color-ink-strong)]">
              {title}
            </h2>
            {description ? (
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          <Button onClick={onClose} size="sm" type="button" variant="ghost">
            Close
          </Button>
        </div>
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      </div>
    </div>
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
    <Dialog description={description} onClose={onClose} open={open} title={title}>
      <div className="flex justify-end gap-3">
        <Button onClick={onClose} type="button" variant="secondary">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          type="button"
          variant={tone === "danger" ? "danger" : "primary"}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
