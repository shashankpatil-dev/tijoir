import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline";
type ButtonSize = "sm" | "md" | "lg";

export function Button({
  children,
  className = "",
  size = "md",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const variantClass =
    variant === "primary"
      ? "border border-[var(--color-brand)] bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-strong)] hover:border-[var(--color-brand-strong)]"
      : variant === "secondary"
        ? "border border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-brand)] hover:bg-[var(--color-surface)]"
        : variant === "danger"
          ? "border border-rose-200 bg-rose-600 text-white hover:bg-rose-700 hover:border-rose-700"
          : variant === "outline"
            ? "border border-[var(--color-border-strong)] bg-transparent text-[var(--color-ink)] hover:border-[var(--color-brand)] hover:bg-white"
            : "border border-transparent bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-surface)]";

  const sizeClass =
    size === "sm"
      ? "px-3 py-2 text-sm"
      : size === "lg"
        ? "px-5 py-3.5 text-sm"
        : "px-4 py-2.5 text-sm";

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${sizeClass} ${variantClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
