export function SurfaceNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-(--color-surface) p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-(--color-ink)">{value}</p>
    </div>
  );
}
