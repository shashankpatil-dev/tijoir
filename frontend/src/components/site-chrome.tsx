import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

export function SiteLogo({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <Link className="flex items-center gap-3" href="/">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--color-brand) text-sm font-semibold text-white">
        Tj
      </div>
      <div>
        <p className="text-base font-semibold text-(--color-ink-strong)">Tijoir</p>
        {subtitle ? (
          <p className="text-sm text-muted">Secure secret sharing</p>
        ) : null}
      </div>
    </Link>
  );
}

export function SiteHeader({
  rightContent,
}: {
  rightContent?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <SiteLogo />
        <div className="flex items-center gap-3">
          {rightContent ?? (
            <>
              <Link
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-(--color-ink) transition hover:border-(--color-brand)"
                href="/login"
              >
                Log in
              </Link>
              <Link
                className="rounded-xl bg-(--color-brand) px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-(--color-brand-strong)"
                href="/signup"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <SiteLogo subtitle={false} />
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <Link className="transition hover:text-(--color-ink-strong)" href="/login">
            Log in
          </Link>
          <Link className="transition hover:text-(--color-ink-strong)" href="/signup">
            Get started
          </Link>
          <Link className="transition hover:text-(--color-ink-strong)" href="/access">
            Open a shared link
          </Link>
        </div>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} Tijoir. Secrets stay encrypted, shared on your terms.
        </p>
      </div>
    </footer>
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
        <p className="max-w-2xl text-lg leading-8 text-muted">{description}</p>
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
      {/* Minimal chrome: just a logo home-link — no nav, no footer (focused auth page). */}
      <div className="mx-auto flex max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        <SiteLogo subtitle={false} />
      </div>

      <section className="mx-auto grid w-full max-w-5xl items-start gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-14 lg:px-8">
        {/* Branded aside */}
        <div className="hidden lg:sticky lg:top-16 lg:block">
          <span className="inline-flex rounded-full border border-(--color-brand-soft) bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-(--color-brand-strong)">
            {eyebrow}
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-(--color-ink-strong) lg:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-base leading-7 text-muted">{description}</p>
          <div className="mt-8">{aside}</div>
        </div>

        {/* Form card */}
        <section className="w-full rounded-2xl border border-border bg-white p-6 shadow-(--shadow-card) sm:p-8">
          {children}
        </section>
      </section>
    </main>
  );
}

export function AuthTrustList({
  items,
}: {
  items: Array<{ icon: ComponentType<{ className?: string }>; text: string }>;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li className="flex items-start gap-3" key={item.text}>
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-(--color-brand-strong) shadow-(--shadow-card)">
              <Icon className="size-4" />
            </span>
            <p className="text-sm leading-6 text-(--color-ink)">{item.text}</p>
          </li>
        );
      })}
    </ul>
  );
}

export function AuthFormHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-(--color-brand-soft) text-(--color-brand-strong)">
        <Icon className="size-5" />
      </span>
      <div>
        <h2 className="text-2xl font-semibold text-(--color-ink-strong)">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>
    </div>
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
        className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-(--color-brand) focus:ring-4 focus:ring-(--color-brand-ring)"
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
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-(--color-brand) px-4 py-3 text-sm font-semibold text-white transition hover:bg-(--color-brand-strong) disabled:cursor-not-allowed disabled:opacity-60"
      disabled={busy || disabled}
      type="submit"
    >
      {busy ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : null}
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
    <div className="rounded-xl border border-border bg-(--color-surface) p-4">
      <p className="text-sm font-semibold text-(--color-ink)">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}
