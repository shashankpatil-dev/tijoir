import type { ReactNode } from "react";
import { EmptyState } from "@/components/dashboard/dashboard-shell";
import { SkeletonTable } from "@/components/ui/skeleton";

export type DataTableColumn<T> = {
  key: string;
  label: string;
  className?: string;
  render: (row: T) => ReactNode;
};

export function DataTable<T>({
  columns,
  data,
  emptyDescription,
  emptyTitle,
  loading = false,
  onRowClick,
  rowKey,
  selectedRowKey,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyDescription: string;
  emptyTitle: string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  selectedRowKey?: string | null;
}) {
  if (loading) {
    return <SkeletonTable columns={columns.length} />;
  }

  if (!data.length) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
      <table className="min-w-full border-collapse">
        <thead className="bg-[var(--color-surface)]">
          <tr>
            {columns.map((column) => (
              <th
                className={`px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)] sm:px-4 ${column.className || ""}`}
                key={column.key}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const key = rowKey(row);
            const selected = selectedRowKey === key;
            return (
              <tr
                className={`border-t border-[var(--color-border)] transition ${onRowClick ? "cursor-pointer hover:bg-[var(--color-surface)]" : ""} ${selected ? "bg-[var(--color-brand-soft)]/55" : "bg-white"}`}
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td
                    className={`px-3 py-3 align-top text-sm text-[var(--color-ink)] sm:px-4 ${column.className || ""}`}
                    key={column.key}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
