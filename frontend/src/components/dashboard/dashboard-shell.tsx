"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { SkeletonBlock } from "@/components/ui/skeleton";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    function closeOnResize() {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    }

    window.addEventListener("resize", closeOnResize);
    return () => window.removeEventListener("resize", closeOnResize);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-dashboard-bg)] text-[var(--color-ink)]">
      {sidebarOpen ? (
        <button
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-[rgba(13,34,64,0.3)] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}
      <div className="grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside
          className={`fixed left-0 top-0 z-50 h-screen w-[280px] -translate-x-full overflow-y-auto border-r border-white/10 bg-[var(--color-sidebar)] px-4 py-4 text-white transition-transform duration-200 lg:sticky lg:z-auto lg:w-auto lg:translate-x-0 lg:px-5 lg:py-5 ${
            sidebarOpen ? "translate-x-0" : ""
          }`}
        >
          <div className="space-y-5 lg:sticky lg:top-5">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold">
                  Tj
                </div>
                <div>
                  <p className="text-sm font-semibold">Tijoir</p>
                  <p className="text-xs text-blue-100/75">Secrets and external access</p>
                </div>
              </div>
              <button
                className="rounded-xl px-2 py-1 text-sm text-blue-100/75 hover:bg-white/10 lg:hidden"
                onClick={() => setSidebarOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <nav className="space-y-2">
              {items.map((item) => {
                const selected = item.id === activeItemId;
                return (
                  <button
                    className={`w-full rounded-xl px-4 py-3 text-left transition ${
                      selected
                        ? "bg-white/12 text-white"
                        : "text-blue-100/78 hover:bg-white/8"
                    }`}
                    key={item.id}
                    onClick={() => {
                      onSelect(item.id);
                      setSidebarOpen(false);
                    }}
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
              <div className="rounded-xl bg-white/8 p-4 text-sm text-blue-100/85">
                {sidebarFooter}
              </div>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-[var(--color-dashboard-border)] bg-white/92 backdrop-blur">
            <div className="flex flex-col gap-3 px-4 py-3.5 sm:px-6 xl:flex-row xl:items-center xl:justify-between xl:px-8">
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-3">
                  <button
                    className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-brand)] hover:bg-[var(--color-surface)] lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                    type="button"
                  >
                    Menu
                  </button>
                  <Badge tone="brand">Organization workspace</Badge>
                </div>
                {userMeta}
              </div>
              <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                {topbarActions}
              </div>
            </div>
          </header>

          <main className="px-4 py-4 sm:px-6 xl:px-8 xl:py-5">{children}</main>
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
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1.5">
        <h1 className="text-[28px] font-semibold leading-tight text-[var(--color-ink-strong)]">
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
      className={`rounded-xl border border-[var(--color-dashboard-border)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-5 ${className}`}
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
      <div className="space-y-3.5">
        <div>
          <h2 className="text-[18px] font-semibold leading-7 text-[var(--color-ink-strong)]">
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
      <div className="space-y-1.5">
        <p className="text-[13px] font-medium text-[var(--color-muted)]">{label}</p>
        <p className="text-[28px] font-semibold leading-tight text-[var(--color-ink-strong)]">{value}</p>
        <p className="text-sm leading-5 text-[var(--color-muted)]">{note}</p>
      </div>
    </SurfaceCard>
  );
}

export function StatCardSkeleton() {
  return (
    <SurfaceCard className="p-4">
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-8 w-14" />
        <SkeletonBlock className="h-4 w-32" />
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
    <div className="rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-8 text-center">
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
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          key={item.label}
        >
          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            {item.label}
          </dt>
          <dd className="mt-2 text-sm leading-6 text-[var(--color-ink-strong)]">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function DetailListSkeleton({
  items = 6,
}: {
  items?: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: items }).map((_, index) => (
        <div
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          key={index}
        >
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-3 h-4 w-36" />
        </div>
      ))}
    </div>
  );
}

export function SurfaceNoteListSkeleton({
  rows = 3,
}: {
  rows?: number;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          key={index}
        >
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-3 h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
