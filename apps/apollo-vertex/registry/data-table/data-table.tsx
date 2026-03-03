"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type Row,
  type RowData,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import { useTranslation } from "react-i18next";

declare module "@tanstack/react-table" {
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
import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";

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
      const meta = cell.column.columnDef.meta;
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
// Persisted state helper
// ---------------------------------------------------------------------------

function usePersistedState<T>(
  storageKey: string | undefined,
  subKey: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Stabilize defaultValue reference to prevent useLocalStorage's
  // getSnapshot from being recreated every render, which would cause
  // useSyncExternalStore to re-subscribe and trigger infinite loops
  // when defaultValue is an object/array.
  const defaultRef = React.useRef(defaultValue);

  const [storedValue, setStoredValue] = useLocalStorage<T>(
    `${storageKey ?? "__noop__"}-${subKey}`,
    defaultRef.current,
  );
  const [localValue, setLocalValue] = React.useState<T>(defaultValue);

  // Wrap the localStorage setter to resolve function updaters,
  // since useLocalStorage only accepts plain values.
  const setPersistedValue: React.Dispatch<React.SetStateAction<T>> =
    React.useCallback(
      (action) => {
        const nextValue =
          typeof action === "function"
            ? (action as (prev: T) => T)(storedValue)
            : action;
        setStoredValue(nextValue);
      },
      [storedValue, setStoredValue],
    );

  if (storageKey) {
    return [storedValue, setPersistedValue];
  }
  return [localValue, setLocalValue];
}

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
  initialColumnOrder?: string[];
  initialSorting?: SortingState;
  initialPageSize?: number;
  globalFilterFn?: FilterFn<TData>;
  enableSearch?: boolean;
  enableViewOptions?: boolean;
  toolbarContent?: (table: TanstackTable<TData>) => React.ReactNode;
  noResultsMessage?: string;
  storageKey?: string;
}

function DataTable<TData, TValue>({
  columns,
  data,
  className,
  isLoading = false,
  onRowClick,
  initialColumnVisibility = {},
  initialColumnOrder,
  initialSorting = [],
  initialPageSize = 10,
  globalFilterFn,
  enableSearch = true,
  enableViewOptions = true,
  toolbarContent,
  noResultsMessage,
  storageKey,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();

  // Derive default column order from column definitions
  const defaultColumnOrder = React.useMemo(
    () =>
      initialColumnOrder ??
      columns
        .map((col) => {
          if ("accessorKey" in col && col.accessorKey)
            return String(col.accessorKey);
          if ("id" in col && col.id) return col.id;
          return "";
        })
        .filter(Boolean),
    [columns, initialColumnOrder],
  );

  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    usePersistedState<VisibilityState>(
      storageKey,
      "column-visibility",
      initialColumnVisibility,
    );
  const [columnOrder, setColumnOrder] = usePersistedState<string[]>(
    storageKey,
    "column-order",
    defaultColumnOrder,
  );
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Reconcile stored order with current columns (handles added/removed columns)
  const reconciledOrder = React.useMemo(() => {
    const definedIds = new Set(
      columns
        .map((col) => {
          if ("accessorKey" in col && col.accessorKey)
            return String(col.accessorKey);
          if ("id" in col && col.id) return col.id;
          return "";
        })
        .filter(Boolean),
    );
    const kept = columnOrder.filter((id) => definedIds.has(id));
    const keptSet = new Set(kept);
    const added = [...definedIds].filter((id) => !keptSet.has(id));
    return [...kept, ...added];
  }, [columnOrder, columns]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
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
      columnOrder: reconciledOrder,
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
