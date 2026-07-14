import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

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
    <div className="relative w-full md:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" />
      <Input
        className="h-11 rounded-xl border-[var(--color-border)] bg-white pl-9 pr-10"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {value ? (
        <button
          aria-label="Clear search"
          className="absolute right-3 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink-strong)]"
          onClick={() => onChange("")}
          type="button"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
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
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger className="h-11 w-full rounded-xl border-[var(--color-border)] bg-white md:w-auto md:min-w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
      </SelectContent>
    </Select>
  );
}

export function PaginationControls({
  currentPage,
  itemLabel,
  onPageChange,
  onPageSizeChange,
  pageCount,
  pageSize = 6,
  pageSizeOptions = [6, 12, 24],
  totalItems,
}: {
  currentPage: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageCount: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  totalItems: number;
}) {
  const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  if (pageCount <= 1) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        {totalItems} {itemLabel}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 pt-1 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <p className="text-sm text-[var(--color-muted)]">
          {startItem}-{endItem} of {totalItems} {itemLabel}
        </p>
        {onPageSizeChange ? (
          <Select onValueChange={(value) => onPageSizeChange(Number(value))} value={String(pageSize)}>
            <SelectTrigger className="h-9 w-[110px] rounded-xl border-[var(--color-border)] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
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
