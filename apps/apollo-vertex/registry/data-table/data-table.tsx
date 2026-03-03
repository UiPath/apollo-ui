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
  type Row,
  type SortingState,
  type Table as TanstackTable,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import { useTranslation } from "react-i18next";

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
import { DataTableSearch } from "./data-table-search";
import { DataTableSkeleton } from "./data-table-skeleton";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTableViewOptions } from "./data-table-view-options";

// ---------------------------------------------------------------------------
// Filter functions
// ---------------------------------------------------------------------------

// biome-ignore lint/suspicious/noExplicitAny: generic filter function used across table instances
const dataTableGlobalFilterFn: FilterFn<any> = (
  row,
  _columnId,
  filterValue,
) => {
  if (!filterValue) return true;

  const searchStr = filterValue.toLowerCase();

  return row.getVisibleCells().some(
    (cell: {
      getValue: () => unknown;
      column: {
        columnDef: {
          meta?: {
            getFilterValue?: (value: unknown, row: Row<unknown>) => string;
          };
        };
      };
    }) => {
      const value = cell.getValue();
      const meta = cell.column.columnDef.meta as
        | { getFilterValue?: (value: unknown, row: Row<unknown>) => string }
        | undefined;
      const displayValue = meta?.getFilterValue
        ? meta.getFilterValue(value, row)
        : String(value ?? "");
      return displayValue.toLowerCase().includes(searchStr);
    },
  );
};

// biome-ignore lint/suspicious/noExplicitAny: generic filter function used across table instances
const dataTableFacetedFilterFn: FilterFn<any> = (
  row,
  columnId,
  filterValue,
) => {
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
  initialColumnVisibility?: VisibilityState;
  initialSorting?: SortingState;
  initialPageSize?: number;
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
  initialColumnVisibility = {},
  initialSorting = [],
  initialPageSize = 10,
  globalFilterFn,
  enableSearch = true,
  enableViewOptions = true,
  toolbarContent,
  noResultsMessage,
}: DataTableProps<TData, TValue>) {
  "use no memo";
  const { t } = useTranslation();
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialColumnVisibility);
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(globalFilterFn ? { globalFilterFn } : {}),
    autoResetPageIndex: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize: initialPageSize },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  const showToolbar = enableSearch || enableViewOptions || toolbarContent;

  return (
    <div data-slot="data-table" className={cn("space-y-4", className)}>
      {showToolbar && (
        <DataTableToolbar>
          <div className="flex items-center gap-2">
            {enableSearch && <DataTableSearch table={table} />}
            {toolbarContent?.(table)}
          </div>
          {enableViewOptions && <DataTableViewOptions table={table} />}
        </DataTableToolbar>
      )}

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
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    onRowClick
                      ? "cursor-pointer hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 transition-all border-l-2 border-transparent hover:border-l-primary"
                      : ""
                  }
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
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
