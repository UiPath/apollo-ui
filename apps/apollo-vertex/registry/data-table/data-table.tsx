"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
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
import { useReactTableCompat } from "@/hooks/useReactTableCompat";
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
  enableColumnResizing?: boolean;
  toolbarContent?: (table: TanstackTable<TData>) => React.ReactNode;
  noResultsMessage?: string;
  stickyHeader?: boolean;
  expanded?: ExpandedState;
  onExpandedChange?: OnChangeFn<ExpandedState>;
  renderExpandedRow?: (row: Row<TData>) => React.ReactNode;
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
  enableColumnResizing = false,
  toolbarContent,
  noResultsMessage,
  stickyHeader = false,
  expanded,
  onExpandedChange,
  renderExpandedRow,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();

  const isRowSelectionEnabled = !!(rowSelection && onRowSelectionChange);

  const table = useReactTableCompat({
    data,
    columns,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange,
    onColumnOrderChange,
    ...(isRowSelectionEnabled && { onRowSelectionChange }),
    onGlobalFilterChange,
    onPaginationChange,
    ...(onExpandedChange ? { onExpandedChange } : {}),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(renderExpandedRow
      ? { getExpandedRowModel: getExpandedRowModel() }
      : {}),
    ...(globalFilterFn ? { globalFilterFn } : {}),
    ...(enableColumnResizing && {
      columnResizeMode: "onChange" as const,
    }),
    enableColumnResizing,
    enableRowSelection: isRowSelectionEnabled,
    autoResetPageIndex: false,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnOrder,
      ...(isRowSelectionEnabled && { rowSelection }),
      globalFilter,
      pagination,
      ...(expanded ? { expanded } : {}),
    },
  });

  const columnSizeVars = () => {
    if (!enableColumnResizing) return {};
    const headers = table.getFlatHeaders();
    const colSizes: Record<string, number> = {};
    for (const header of headers) {
      colSizes[`--header-${header.id}-size`] = header.getSize();
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
    }
    return colSizes;
  };

  const rows = table.getRowModel().rows;

  return (
    <div data-slot="data-table" className={cn("space-y-4", className)}>
      <DataTableToolbar
        table={table}
        enableSearch={enableSearch}
        enableViewOptions={enableViewOptions}
        customContent={toolbarContent?.(table)}
      />

      <div
        className={cn(
          "rounded-md border",
          stickyHeader ? "overflow-auto" : "overflow-hidden",
        )}
      >
        <Table
          className={cn(enableColumnResizing && "table-fixed")}
          style={
            enableColumnResizing
              ? { ...columnSizeVars(), width: table.getTotalSize() }
              : {}
          }
        >
          <TableHeader
            className={stickyHeader ? "sticky top-0 z-10 bg-background" : ""}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      enableColumnResizing && "relative group pr-2",
                    )}
                    style={
                      enableColumnResizing
                        ? {
                            width: `calc(var(--header-${header.id}-size) * 1px)`,
                          }
                        : {}
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    {enableColumnResizing && (
                      <div
                        data-slot="column-resizer"
                        onDoubleClick={() => header.column.resetSize()}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          "absolute top-0 right-0 z-10 h-full w-2 cursor-col-resize select-none touch-none",
                          "after:absolute after:top-0 after:right-0 after:h-full after:w-0.5",
                          "after:opacity-0 group-hover:after:opacity-100 after:transition-opacity",
                          header.column.getIsResizing()
                            ? "after:bg-primary after:opacity-100"
                            : "after:bg-border",
                        )}
                      />
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
                <React.Fragment key={row.id}>
                  <TableRow
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
                      <TableCell
                        key={cell.id}
                        style={
                          enableColumnResizing
                            ? {
                                width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                              }
                            : {}
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {renderExpandedRow && row.getIsExpanded() && (
                    <TableRow data-state="expanded">
                      <TableCell colSpan={row.getVisibleCells().length}>
                        {renderExpandedRow(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
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
