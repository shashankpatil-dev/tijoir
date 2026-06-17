import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function TableToolbar({
  actions,
  children,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  title?: string;
}) {
  return (
    <div className="space-y-2">
      {title ? (
        <p className="text-sm font-medium text-[var(--color-ink-strong)]">{title}</p>
      ) : null}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center">
          {children}
        </div>
        {actions ? <div className="flex flex-wrap gap-2.5 lg:justify-end">{actions}</div> : null}
      </div>
    </div>
  );
}

export function SearchInput({
  onChange,
  placeholder,
  value,
}: {
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <input
      className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm leading-5 outline-none transition focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand-ring)] md:max-w-sm"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  );
}

export function FilterSelect({
  onChange,
  options,
  value,
}: {
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <select
      className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm leading-5 outline-none transition focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand-ring)] md:w-auto"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function PaginationControls({
  currentPage,
  itemLabel,
  onPageChange,
  pageCount,
  totalItems,
}: {
  currentPage: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  pageCount: number;
  totalItems: number;
}) {
  if (pageCount <= 1) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        {totalItems} {itemLabel}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 pt-1 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-[var(--color-muted)]">
        Page {currentPage} of {pageCount} · {totalItems} {itemLabel}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          size="sm"
          type="button"
          variant="secondary"
        >
          Previous
        </Button>
        <Button
          disabled={currentPage >= pageCount}
          onClick={() => onPageChange(currentPage + 1)}
          size="sm"
          type="button"
          variant="secondary"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
