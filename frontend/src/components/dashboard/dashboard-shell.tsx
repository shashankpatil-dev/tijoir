"use client";

import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { SkeletonBlock } from "@/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  group: "primary" | "team";
  badge?: string;
};

export function DashboardShell({
  activeItemId,
  children,
  items,
  onSelect,
  sidebarHeader,
  sidebarFooter,
  topbarTitle,
  topbarActions,
}: {
  activeItemId: string;
  children: ReactNode;
  items: DashboardNavItem[];
  onSelect: (item: DashboardNavItem) => void;
  sidebarHeader?: ReactNode;
  sidebarFooter?: ReactNode;
  topbarTitle?: ReactNode;
  topbarActions?: ReactNode;
}) {
  const primaryItems = items.filter((item) => item.group === "primary");
  const teamItems = items.filter((item) => item.group === "team");

  return (
    <SidebarProvider
      className="min-h-screen bg-(--color-dashboard-bg) text-(--color-ink)"
      defaultOpen
    >
      <Sidebar
        className="border-r border-[color-mix(in_srgb,var(--color-sidebar-foreground)_10%,transparent)]"
        collapsible="icon"
      >
        <SidebarHeader className="gap-0 px-3 py-4">
          {sidebarHeader}
        </SidebarHeader>

        <SidebarContent className="px-2 py-2">
          <SidebarGroup className="px-0 py-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {primaryItems.map((item) => (
                  <DashboardSidebarNavButton
                    active={item.id === activeItemId}
                    item={item}
                    key={item.id}
                    onSelect={onSelect}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {teamItems.length ? (
            <>
              <SidebarSeparator className="my-3" />
              <SidebarGroup className="px-0 py-0">
                <SidebarGroupLabel className="px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/55">
                  Team
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    {teamItems.map((item) => (
                      <DashboardSidebarNavButton
                        active={item.id === activeItemId}
                        item={item}
                        key={item.id}
                        onSelect={onSelect}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          ) : null}
        </SidebarContent>

        {sidebarFooter ? (
          <SidebarFooter className="border-t border-[color-mix(in_srgb,var(--color-sidebar-foreground)_10%,transparent)] px-3 py-4">
            {sidebarFooter}
          </SidebarFooter>
        ) : null}

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-screen min-w-0 w-auto flex-1 overflow-x-hidden bg-(--color-dashboard-bg)">
        <header className="sticky top-0 z-30 border-b border-(--color-dashboard-border) bg-white/92 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger aria-label="Open menu" className="md:hidden" />
              <div className="min-w-0">{topbarTitle}</div>
            </div>
            <div className="flex items-center gap-2">
              {topbarActions}
            </div>
          </div>
        </header>

        <main className="min-w-0 max-w-full px-4 py-4 sm:px-6 xl:px-8 xl:py-5">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DashboardSidebarNavButton({
  active,
  item,
  onSelect,
}: {
  active: boolean;
  item: DashboardNavItem;
  onSelect: (item: DashboardNavItem) => void;
}) {
  const Icon = item.icon;

  return (
    <SidebarMenuItem className="px-2">
      {active ? (
        <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-sidebar-primary" />
      ) : null}
      <SidebarMenuButton
        className={cn(
          "h-11 rounded-xl px-3 text-sidebar-foreground/75 hover:bg-white/8 hover:text-white",
          active && "bg-white/12 font-semibold text-white",
        )}
        isActive={active}
        onClick={() => onSelect(item)}
        tooltip={item.label}
      >
        <Icon
          className={cn(
            "size-4",
            active ? "text-sidebar-primary" : "text-sidebar-foreground/65",
          )}
        />
        <span>{item.label}</span>
        {item.badge ? (
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/90">
            {item.badge}
          </span>
        ) : null}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function DashboardSectionHeader({
  actions,
  description,
  title,
}: {
  actions?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1.5">
        <h1 className="text-[28px] font-semibold leading-tight text-(--color-ink-strong)">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-muted">
            {description}
          </p>
        ) : null}
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
      className={`rounded-2xl border border-(--color-dashboard-border) bg-white p-4 shadow-(--shadow-card) sm:p-5 ${className}`}
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
          <h2 className="text-[18px] font-semibold leading-7 text-(--color-ink-strong)">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-muted">
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
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <p className="text-[28px] font-semibold leading-tight text-(--color-ink-strong)">{value}</p>
        <p className="text-sm leading-5 text-muted">{note}</p>
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
    <div className="rounded-xl border border-dashed border-(--color-border-strong) bg-(--color-surface) px-5 py-8 text-center">
      <p className="text-base font-semibold text-(--color-ink-strong)">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">
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
          className="rounded-xl border border-border bg-(--color-surface) p-4"
          key={item.label}
        >
          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {item.label}
          </dt>
          <dd className="mt-2 text-sm leading-6 text-(--color-ink-strong)">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function DefinitionRows({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="divide-y divide-border rounded-xl border border-border bg-(--color-surface)">
      {items.map((item) => (
        <div
          className="grid gap-2 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-start"
          key={item.label}
        >
          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {item.label}
          </dt>
          <dd className="text-sm leading-6 text-(--color-ink-strong)">{item.value}</dd>
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
          className="rounded-xl border border-border bg-(--color-surface) p-4"
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
          className="rounded-xl border border-border bg-(--color-surface) p-4"
          key={index}
        >
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-3 h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
