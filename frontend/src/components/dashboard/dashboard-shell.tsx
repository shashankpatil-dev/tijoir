import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export type DashboardNavItem = {
  id: string;
  label: string;
  note: string;
  badge?: string;
};

export function DashboardShell({
  activeItemId,
  children,
  items,
  onSelect,
  sidebarFooter,
  topbarActions,
  userMeta,
}: {
  activeItemId: string;
  children: ReactNode;
  items: DashboardNavItem[];
  onSelect: (id: string) => void;
  sidebarFooter?: ReactNode;
  topbarActions?: ReactNode;
  userMeta?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-dashboard-bg)] text-[var(--color-ink)]">
      <div className="grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-r border-white/10 bg-[var(--color-sidebar)] px-4 py-5 text-white lg:px-5">
          <div className="sticky top-5 space-y-5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold">
                Tj
              </div>
              <div>
                <p className="text-sm font-semibold">Tijoir Console</p>
                <p className="text-xs text-blue-100/75">Vault and vendor access</p>
              </div>
            </div>

            <nav className="space-y-2">
              {items.map((item) => {
                const selected = item.id === activeItemId;
                return (
                  <button
                    className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                      selected
                        ? "bg-white/12 text-white"
                        : "text-blue-100/78 hover:bg-white/8"
                    }`}
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{item.label}</p>
                      {item.badge ? (
                        <span className="rounded-full bg-white/12 px-2 py-0.5 text-[11px] font-semibold">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-blue-100/70">{item.note}</p>
                  </button>
                );
              })}
            </nav>

            {sidebarFooter ? (
              <div className="rounded-2xl bg-white/8 p-4 text-sm text-blue-100/85">
                {sidebarFooter}
              </div>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-[var(--color-dashboard-border)] bg-white/92 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between xl:px-8">
              <div className="min-w-0 space-y-2">
                <Badge tone="brand">Organization workspace</Badge>
                {userMeta}
              </div>
              <div className="flex flex-wrap items-center gap-3">{topbarActions}</div>
            </div>
          </header>

          <main className="px-4 py-5 sm:px-6 xl:px-8 xl:py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function DashboardSectionHeader({
  actions,
  description,
  title,
}: {
  actions?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--color-ink-strong)]">
          {title}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-[var(--color-dashboard-border)] bg-white p-5 shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </section>
  );
}

export function PageSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <SurfaceCard>
      <div className="space-y-5">
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
        {children}
      </div>
    </SurfaceCard>
  );
}

export function StatCard({
  label,
  note,
  value,
}: {
  label: string;
  note: string;
  value: string;
}) {
  return (
    <SurfaceCard className="p-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--color-muted)]">{label}</p>
        <p className="text-3xl font-semibold text-[var(--color-ink-strong)]">{value}</p>
        <p className="text-sm leading-6 text-[var(--color-muted)]">{note}</p>
      </div>
    </SurfaceCard>
  );
}

export function EmptyState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-10 text-center">
      <p className="text-base font-semibold text-[var(--color-ink-strong)]">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
        {description}
      </p>
    </div>
  );
}

export function DetailList({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          key={item.label}
        >
          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            {item.label}
          </dt>
          <dd className="mt-2 text-sm text-[var(--color-ink-strong)]">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
