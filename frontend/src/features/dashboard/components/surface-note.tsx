export function SurfaceNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">{value}</p>
    </div>
  );
}
