import { Button } from "@/components/ui/button";

export function SharePreviewItem({
  label,
  onCopy,
  value,
}: {
  label: string;
  onCopy: () => void;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 break-all text-sm leading-6 text-[var(--color-ink-strong)]">
        {value}
      </p>
      <Button className="mt-4" onClick={onCopy} type="button" variant="secondary">
        Copy
      </Button>
    </div>
  );
}
