import { useMemo, useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { EmptyState } from "@/components/dashboard/dashboard-shell";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, ChevronUp, MoreHorizontal } from "lucide-react";

export type DataTableColumn<T> = {
  key: string;
  label: string;
  className?: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | null | undefined;
  render: (row: T) => ReactNode;
};

export type DataTableRowAction<T> = {
  label: string;
  onClick: (row: T) => void;
  destructive?: boolean;
  disabled?: boolean;
};

export function DataTable<T>({
  containerClassName = "",
  columns,
  data,
  emptyDescription,
  emptyTitle,
  loading = false,
  onRowClick,
  rowKey,
  rowActions,
  selectedRowKey,
}: {
  containerClassName?: string;
  columns: DataTableColumn<T>[];
  data: T[];
  emptyDescription: string;
  emptyTitle: string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  rowActions?: (row: T) => DataTableRowAction<T>[];
  selectedRowKey?: string | null;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const tableColumns = useMemo<ColumnDef<T>[]>(
    () => [
      ...columns.map((column) => ({
        accessorFn: (row: T) => column.sortValue?.(row) ?? rowKey(row),
        cell: ({ row }: { row: { original: T } }) => {
          const content = column.render(row.original);
          return content === null || content === undefined || content === "" ? "—" : content;
        },
        enableSorting: column.sortable ?? false,
        header: ({ column: tableColumn }: { column: { getCanSort: () => boolean; getIsSorted: () => false | "asc" | "desc"; toggleSorting: (desc?: boolean) => void } }) => {
          if (!tableColumn.getCanSort()) {
            return column.label;
          }

          const sorted = tableColumn.getIsSorted();
          return (
            <button
              className="inline-flex items-center gap-1 text-left"
              onClick={() => tableColumn.toggleSorting(sorted === "asc")}
              type="button"
            >
              <span>{column.label}</span>
              {sorted === "asc" ? (
                <ChevronUp className="size-3.5" />
              ) : sorted === "desc" ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5 opacity-40" />
              )}
            </button>
          );
        },
        id: column.key,
        meta: {
          className: column.className,
        },
      })),
      ...(rowActions
        ? [
            {
              cell: ({ row }: { row: { original: T } }) => {
                const actions = rowActions(row.original);

                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label="Row actions"
                        onClick={(event) => event.stopPropagation()}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {actions.map((action) => (
                        <DropdownMenuItem
                          disabled={action.disabled}
                          key={action.label}
                          onSelect={() => action.onClick(row.original)}
                          variant={action.destructive ? "destructive" : "default"}
                        >
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              },
              enableSorting: false,
              header: "",
              id: "__actions__",
            } as ColumnDef<T>,
          ]
        : []),
      ...(!rowActions && onRowClick
        ? [
            {
              cell: () => <ChevronRight className="size-4 text-[var(--color-muted)]" />,
              enableSorting: false,
              header: "",
              id: "__row_indicator__",
            } as ColumnDef<T>,
          ]
        : []),
    ],
    [columns, onRowClick, rowActions, rowKey],
  );

  const table = useReactTable({
    columns: tableColumns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (loading) {
    return <SkeletonTable columns={columns.length} />;
  }

  if (!data.length) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />;
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white ${containerClassName}`.trim()}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-[var(--color-surface)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="border-[var(--color-border)] hover:bg-transparent" key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className="bg-[var(--color-surface)] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)] sm:px-4"
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const key = rowKey(row.original);
              const selected = selectedRowKey === key;

              return (
                <TableRow
                  className={`border-[var(--color-border)] ${onRowClick ? "cursor-pointer hover:bg-[var(--color-surface)]" : ""} ${selected ? "bg-[var(--color-brand-soft)]/55" : "bg-white"}`}
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as { className?: string } | undefined;
                    return (
                      <TableCell
                        className={`px-3 py-3.5 align-top text-[13px] leading-5 text-[var(--color-ink)] sm:px-4 ${meta?.className || ""}`}
                        key={cell.id}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
