import type { ReactNode } from "react";

export function InlineMessage({
  title,
  body,
  tone = "neutral",
}: {
  title: string;
  body: string;
  tone?: "neutral" | "success" | "error" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-900"
        : tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)]";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6">{body}</p>
    </div>
  );
}

export function LoadingScreen({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] px-4">
      <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-white p-8 text-center shadow-[var(--shadow-card)]">
        <Spinner />
        <h1 className="mt-5 text-2xl font-semibold text-[var(--color-ink-strong)]">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{body}</p>
      </div>
    </div>
  );
}

export function BusyOverlay({
  title,
  body,
  visible,
}: {
  title: string;
  body: string;
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(13,34,64,0.35)] px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <Spinner />
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink-strong)]">
              {title}
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[var(--color-dashboard-border)] bg-white p-6 shadow-[var(--shadow-card)]">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-ink-strong)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Spinner() {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-brand)] border-t-transparent" />
    </span>
  );
}
