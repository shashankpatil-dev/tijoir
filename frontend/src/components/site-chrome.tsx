import Link from "next/link";
import type { ReactNode } from "react";

export function SiteHeader({
  rightContent,
}: {
  rightContent?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3" href="/">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-brand) text-sm font-semibold text-white">
            Tj
          </div>
          <div>
            <p className="text-base font-semibold text-(--color-ink-strong)">
              Tijoir
            </p>
            <p className="text-sm text-muted">
              Secure vendor credential exchange
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {rightContent ?? (
            <>
              <Link
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-(--color-ink) transition hover:border-(--color-brand)"
                href="/login"
              >
                Login
              </Link>
              <Link
                className="rounded-xl bg-(--color-brand) px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-(--color-brand-strong)"
                href="/signup"
              >
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function PageIntro({
  badge,
  title,
  description,
}: {
  badge: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-4">
      <span className="inline-flex rounded-full border border-(--color-brand-soft) bg-(--color-brand-soft) px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-(--color-brand-strong)">
        {badge}
      </span>
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight text-(--color-ink-strong) sm:text-5xl">
          {title}
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-muted">
          {description}
        </p>
      </div>
    </div>
  );
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  aside: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,var(--color-surface)_48%,#edf4ff_100%)] text-(--color-ink)">
      <SiteHeader />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-12">
        <div className="space-y-5">
          <PageIntro badge={eyebrow} description={description} title={title} />
          <div className="space-y-4">{aside}</div>
        </div>

        <section className="rounded-3xl border border-border bg-white p-6 shadow-(--shadow-card) sm:p-8">
          {children}
        </section>
      </section>
    </main>
  );
}

export function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-(--color-ink)">{label}</span>
      <input
        className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-(--color-brand) focus:ring-4 focus:ring-(--color-brand-ring)"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        type={type}
        value={value}
      />
    </label>
  );
}

export function PrimaryButton({
  children,
  busy,
  disabled,
}: {
  children: ReactNode;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      className="w-full rounded-2xl bg-(--color-brand) px-4 py-3 text-sm font-semibold text-white transition hover:bg-(--color-brand-strong) disabled:cursor-not-allowed disabled:opacity-60"
      disabled={busy || disabled}
      type="submit"
    >
      {children}
    </button>
  );
}

export function StatusPanel({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-(--color-surface) p-4">
      <p className="text-sm font-semibold text-(--color-ink)">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}
