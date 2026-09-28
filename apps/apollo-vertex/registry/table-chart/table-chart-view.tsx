import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow as TableRowComponent,
} from "@/components/ui/table";
import type { PrimitiveValue } from "@/lib/charts-core";

export interface TableChartColumn {
  id: string;
  label: string;
  align: "left" | "right";
  format: (value: PrimitiveValue) => string;
}

export interface TableChartSort {
  field: string;
  direction: "asc" | "desc";
}

export interface TableChartProps {
  columns: TableChartColumn[];
  rows: Array<Record<string, PrimitiveValue>>;
  sort?: TableChartSort | null;
  onSortChange?: (sort: TableChartSort | null) => void;
}

export function TableChart({
  columns,
  rows,
  sort,
  onSortChange,
}: TableChartProps) {
  const { t } = useTranslation();

  const [sorting, setSorting] = useState<SortingState>(() =>
    sort ? [{ id: sort.field, desc: sort.direction === "desc" }] : [],
  );

  const columnDefs = useMemo<ColumnDef<Record<string, PrimitiveValue>>[]>(
    () =>
      columns.map((column) => ({
        accessorFn: (row) => row[column.id],
        id: column.id,
        header: ({ column: tanstackColumn }) => {
          const isSorted = tanstackColumn.getIsSorted();
          const ariaLabel =
            isSorted === "asc"
              ? t("sort_by_column_sorted_ascending", { column: column.label })
              : isSorted === "desc"
                ? t("sort_by_column_sorted_descending", {
                    column: column.label,
                  })
                : t("sort_by_column", { column: column.label });
          return (
            <button
              type="button"
              className={`flex items-center gap-2 cursor-pointer select-none hover:text-foreground ${
                column.align === "right"
                  ? "justify-end w-full"
                  : "justify-start"
              }`}
              onClick={() => tanstackColumn.toggleSorting()}
              aria-label={ariaLabel}
            >
              <span>{column.label}</span>
              {isSorted && (
                <span className="text-xs">
                  {isSorted === "asc" ? "↑" : "↓"}
                </span>
              )}
            </button>
          );
        },
        cell: ({ getValue }) => {
          const value = getValue<PrimitiveValue>();
          return (
            <div
              className={column.align === "right" ? "text-right" : "text-left"}
            >
              {column.format(value)}
            </div>
          );
        },
      })),
    [columns, t],
  );

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      setSorting(newSorting);

      const next = newSorting[0];
      onSortChange?.(
        next ? { field: next.id, direction: next.desc ? "desc" : "asc" } : null,
      );
    },
    state: { sorting },
  });

  return (
    <div className="w-full h-full overflow-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRowComponent key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRowComponent>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRowComponent key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRowComponent>
            ))
          ) : (
            <TableRowComponent>
              <TableCell
                colSpan={columnDefs.length}
                className="h-24 text-center"
              >
                {t("no_results")}
              </TableCell>
            </TableRowComponent>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
