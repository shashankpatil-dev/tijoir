export function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[var(--color-surface-strong)] ${className}`}
    />
  );
}

export function SkeletonTable({
  columns = 4,
  rows = 5,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
      <div
        className="grid gap-4 border-b border-[var(--color-border)] px-4 py-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonBlock className="h-4" key={index} />
        ))}
      </div>
      <div className="space-y-0">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            className="grid gap-4 border-b border-[var(--color-border)] px-4 py-4 last:border-b-0"
            key={rowIndex}
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <SkeletonBlock className="h-4" key={columnIndex} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
