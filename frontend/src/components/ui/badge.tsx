import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "brand";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-[var(--color-border)] bg-white text-[var(--color-ink)]",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-rose-200 bg-rose-50 text-rose-800",
  brand:
    "border-[var(--color-brand-soft)] bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]",
};

export function Badge({
  children,
  className = "",
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(value: string): BadgeTone {
  switch (value) {
    case "ACTIVE":
    case "VIEW_UNTIL_REVOKED":
      return "success";
    case "CONSUMED":
      return "info";
    case "EXPIRED":
    case "VIEW_ONCE":
      return "warning";
    case "REVOKED":
    case "ROTATION_NOTIFY_ONLY":
      return "danger";
    default:
      return "neutral";
  }
}
