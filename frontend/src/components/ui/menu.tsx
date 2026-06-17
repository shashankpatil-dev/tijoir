"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function Menu({
  align = "right",
  buttonClassName = "",
  children,
  label,
}: {
  align?: "left" | "right";
  buttonClassName?: string;
  children: ReactNode;
  label: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-brand)] hover:bg-[var(--color-surface)] ${buttonClassName}`.trim()}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        type="button"
      >
        {label}
      </button>
      {open ? (
        <div
          className={`absolute top-[calc(100%+0.5rem)] z-50 min-w-[220px] rounded-2xl border border-[var(--color-border)] bg-white p-2 shadow-[var(--shadow-card)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="space-y-1">{children}</div>
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex w-full items-start rounded-xl px-3 py-2.5 text-left text-sm leading-5 text-[var(--color-ink)] transition hover:bg-[var(--color-surface)]"
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      type="button"
    >
      {children}
    </button>
  );
}

export function MenuDivider() {
  return <div className="my-1 border-t border-[var(--color-border)]" />;
}

export function MenuHint({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium leading-5 text-[var(--color-ink-strong)]">{label}</p>
      <p className="text-xs leading-5 text-[var(--color-muted)]">{text}</p>
    </div>
  );
}
