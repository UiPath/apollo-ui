"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import { useTranslation } from "react-i18next";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line no-unused-vars -- TValue is required by the TanStack Table module augmentation signature
  interface ColumnMeta<TData extends RowData, TValue> {
    displayName?: string;
    getFilterValue?: (value: unknown, row: Row<TData>) => string;
  }
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableSkeleton } from "./data-table-skeleton";
import { DataTableToolbar } from "./data-table-toolbar";

// ---------------------------------------------------------------------------
// Filter functions
// ---------------------------------------------------------------------------

const dataTableGlobalFilterFn = (
  row: Row<RowData>,
  _columnId: string,
  filterValue: string,
): boolean => {
  if (!filterValue) return true;

  const searchStr = filterValue.toLowerCase();

  return row.getVisibleCells().some((cell) => {
    const value = cell.getValue();
    const meta = cell.column.columnDef.meta;
    const displayValue = meta?.getFilterValue
      ? meta.getFilterValue(value, row)
      : String(value ?? "");
    return displayValue.toLowerCase().includes(searchStr);
  });
};

const dataTableFacetedFilterFn = (
  row: Row<RowData>,
  columnId: string,
  filterValue: unknown,
): boolean => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0)
    return true;
  const cellValue = String(row.getValue(columnId) ?? "");
  return filterValue.includes(cellValue);
};

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: OnChangeFn<VisibilityState>;
  columnOrder: string[];
  onColumnOrderChange: OnChangeFn<string[]>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  globalFilter: string;
  onGlobalFilterChange: OnChangeFn<string>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  globalFilterFn?: FilterFn<TData>;
  enableSearch?: boolean;
  enableViewOptions?: boolean;
  toolbarContent?: (table: TanstackTable<TData>) => React.ReactNode;
  noResultsMessage?: string;
}

function DataTable<TData, TValue>({
  columns,
  data,
  className,
  isLoading = false,
  onRowClick,
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  rowSelection,
  onRowSelectionChange,
  globalFilter,
  onGlobalFilterChange,
  pagination,
  onPaginationChange,
  globalFilterFn,
  enableSearch = true,
  enableViewOptions = true,
  toolbarContent,
  noResultsMessage,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();

  const selectionEnabled = rowSelection != null || onRowSelectionChange != null;

  const effectiveColumns = selectionEnabled
    ? columns
    : columns.filter((col) => col.id !== "select");

  const table = useReactTable({
    data,
    columns: effectiveColumns,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange,
    onColumnOrderChange,
    ...(selectionEnabled && { onRowSelectionChange }),
    onGlobalFilterChange,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(globalFilterFn ? { globalFilterFn } : {}),
    enableRowSelection: selectionEnabled,
    autoResetPageIndex: false,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnOrder,
      ...(selectionEnabled && { rowSelection }),
      globalFilter,
      pagination,
    },
  });

  const rows = table.getRowModel().rows;

  return (
    <div data-slot="data-table" className={cn("space-y-4", className)}>
      <DataTableToolbar
        table={table}
        enableSearch={enableSearch}
        enableViewOptions={enableViewOptions}
        customContent={toolbarContent?.(table)}
      />

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <DataTableSkeleton
                columnCount={table.getVisibleLeafColumns().length}
              />
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    onRowClick
                      ? "cursor-pointer hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 transition-all border-l-2 border-transparent hover:border-l-primary"
                      : ""
                  }
                  {...(onRowClick && {
                    onClick: () => onRowClick(row.original),
                  })}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8 text-muted-foreground"
                >
                  {noResultsMessage ?? t("no_results")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}

export { DataTable, dataTableFacetedFilterFn, dataTableGlobalFilterFn };
export type { DataTableProps };
