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
    overflowVisible?: boolean;
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
import { DATA_TABLE_ROW_HEIGHT } from "./data-table-row";
import {
  DataTableScrollShadow,
  useScrollShadow,
} from "./data-table-scroll-shadow";
import { DataTableSkeleton } from "./data-table-skeleton";
import { DataTableToolbar } from "./data-table-toolbar";

const GLASS_CLASSES =
  "bg-white/55 border border-white/80 rounded-2xl backdrop-blur-sm shadow-[0_2px_16px_2px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:bg-white/[0.055] dark:border-white/[0.03] dark:shadow-[0_2px_16px_2px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.04)]";

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
  noResultsMessage?: React.ReactNode;
  stickyHeader?: boolean;
  expanded?: ExpandedState;
  onExpandedChange?: OnChangeFn<ExpandedState>;
  renderExpandedRow?: (row: Row<TData>) => React.ReactNode;
  getRowClassName?: (row: TData) => string;
  skeletonColumnWidths?: string[];
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
  getRowClassName,
  skeletonColumnWidths,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();

  const isRowSelectionEnabled = !!(rowSelection && onRowSelectionChange);

  const resetPageIndex = () =>
    onPaginationChange((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );

  const table = useReactTableCompat({
    data,
    columns,
    onSortingChange,
    onColumnFiltersChange: (updater) => {
      onColumnFiltersChange(updater);
      resetPageIndex();
    },
    onColumnVisibilityChange,
    onColumnOrderChange,
    ...(isRowSelectionEnabled && { onRowSelectionChange }),
    onGlobalFilterChange: (updater) => {
      onGlobalFilterChange(updater);
      resetPageIndex();
    },
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
  const { containerRef, canScrollLeft, canScrollRight } = useScrollShadow();

  return (
    <div data-slot="data-table" className={cn("space-y-4 min-w-0", className)}>
      <DataTableToolbar
        table={table}
        enableSearch={enableSearch}
        enableViewOptions={enableViewOptions}
        customContent={toolbarContent?.(table)}
      />

      <div
        ref={containerRef}
        className={cn(
          GLASS_CLASSES,
          "relative min-w-0 overflow-hidden",
          stickyHeader && "overflow-auto",
        )}
      >
        <Table
          className={cn(
            "w-full [&_tr>:first-child]:pl-4 [&_tr>:last-child]:pr-4",
            enableColumnResizing && "table-fixed",
          )}
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
                    style={{
                      ...(header.column.columnDef.maxSize
                        ? { maxWidth: header.column.columnDef.maxSize }
                        : {}),
                      ...(enableColumnResizing
                        ? {
                            width: `calc(var(--header-${header.id}-size) * 1px)`,
                          }
                        : {}),
                    }}
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
                columnWidths={skeletonColumnWidths}
              />
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      `border-b last:border-b-0 ${DATA_TABLE_ROW_HEIGHT}`,
                      onRowClick && "cursor-pointer hover:bg-muted/50",
                      getRowClassName?.(row.original),
                    )}
                    {...(onRowClick && {
                      onClick: () => onRowClick(row.original),
                    })}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          ...(cell.column.columnDef.maxSize
                            ? { maxWidth: cell.column.columnDef.maxSize }
                            : {}),
                          ...(enableColumnResizing
                            ? {
                                width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                              }
                            : {}),
                        }}
                      >
                        <div
                          className={cn(
                            "text-ellipsis whitespace-nowrap text-sm font-normal leading-5 text-foreground",
                            !cell.column.columnDef.meta?.overflowVisible &&
                              "overflow-hidden",
                          )}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget;
                            if (el.scrollWidth > el.clientWidth + 1) {
                              el.title = el.textContent || "";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.title = "";
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                  {renderExpandedRow && row.getIsExpanded() && (
                    <TableRow
                      data-state="expanded"
                      className="hover:bg-transparent"
                    >
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
                  {noResultsMessage ??
                    t("no_results", { defaultValue: "No results." })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <DataTableScrollShadow
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
        />
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
export { DataTable };
export type { DataTableProps };
export { DataTableColumnHeader } from "./data-table-column-header";
