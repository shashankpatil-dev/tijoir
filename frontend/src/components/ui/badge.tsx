import type { ReactNode } from "react";

type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "brand";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : tone === "info"
            ? "border-sky-200 bg-sky-50 text-sky-800"
            : tone === "brand"
              ? "border-[var(--color-brand-soft)] bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]"
              : "border-[var(--color-border)] bg-white text-[var(--color-ink)]";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass}`}
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
