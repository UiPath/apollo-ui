"use client";

import {
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type ExpandedState,
  flexRender,
  type OnChangeFn,
  type PaginationState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Updater,
  useTable,
} from "@tanstack/react-table";
import * as React from "react";
import {
  type DataTableColumnDef,
  type DataTableFilterFn,
  type DataTableInstance,
  type DataTableRow,
  dataTableFeatures,
} from "@/lib/table-features";
import { useVertexTranslation } from "@/lib/vertex-translation";

declare module "@tanstack/react-table" {
  // oxlint-disable-next-line no-unused-vars -- TFeatures and TValue are required by the TanStack Table module augmentation signature
  interface ColumnMeta<TFeatures, TData extends RowData, TValue> {
    displayName?: string;
    getFilterValue?: (value: unknown, row: DataTableRow<TData>) => string;
    overflowVisible?: boolean;
    /** Right-align with tabular digits so amounts line up. */
    numeric?: boolean;
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
import { DataTableDataRow } from "./data-table-data-row";
import { DataTableExpandAllToggle } from "./data-table-expand-toggle";
import { DataTablePagination } from "./data-table-pagination";
import {
  DataTableScrollShadow,
  useScrollShadow,
} from "./data-table-scroll-shadow";
import { DataTableSkeleton } from "./data-table-skeleton";
import { DataTableToolbar } from "./data-table-toolbar";

const GLASS_CLASSES =
  "bg-white/55 border border-white/80 rounded-2xl backdrop-blur-sm shadow-[0_2px_16px_2px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:bg-white/[0.055] dark:border-white/[0.03] dark:shadow-[0_2px_16px_2px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.04)]";

interface DataTableProps<TData extends RowData, TValue = unknown> {
  columns: DataTableColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
  isRowClickable?: (row: TData) => boolean;
  getRowHref?: (row: TData) => string | undefined;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  columnVisibility: ColumnVisibilityState;
  onColumnVisibilityChange: OnChangeFn<ColumnVisibilityState>;
  columnOrder: string[];
  onColumnOrderChange: OnChangeFn<string[]>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  globalFilter: string;
  onGlobalFilterChange: OnChangeFn<string>;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onPageIndexOutOfRange?: (pageIndex: number) => void;
  // Server-driven mode: the parent already sorted, filtered, and paged the
  // rows, so the table renders `data` as-is and sizes the pager from `rowCount`.
  manualPagination?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  rowCount?: number;
  getRowId?: (
    originalRow: TData,
    index: number,
    parent?: DataTableRow<TData>,
  ) => string;
  globalFilterFn?: DataTableFilterFn<TData>;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  enableViewOptions?: boolean;
  enableColumnResizing?: boolean;
  toolbarContent?: (table: DataTableInstance<TData>) => React.ReactNode;
  onColumnVisibilityToggle?: (
    columnId: string,
    visible: boolean,
    visibleCount: number,
  ) => void;
  noResultsMessage?: React.ReactNode;
  stickyHeader?: boolean;
  expanded?: ExpandedState;
  onExpandedChange?: OnChangeFn<ExpandedState>;
  renderExpandedRow?: (row: DataTableRow<TData>) => React.ReactNode;
  getRowClassName?: (row: TData) => string;
  skeletonColumnWidths?: string[];
  plain?: boolean;
}

function DataTable<TData extends RowData, TValue = unknown>({
  columns,
  data,
  className,
  isLoading = false,
  onRowClick,
  isRowClickable,
  getRowHref,
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
  onPageIndexOutOfRange,
  manualPagination,
  manualSorting,
  manualFiltering,
  rowCount,
  getRowId,
  globalFilterFn,
  enableSearch = true,
  searchPlaceholder,
  enableViewOptions = true,
  enableColumnResizing = false,
  toolbarContent,
  onColumnVisibilityToggle,
  noResultsMessage,
  stickyHeader = false,
  expanded,
  onExpandedChange,
  renderExpandedRow,
  getRowClassName,
  skeletonColumnWidths,
  plain = false,
}: DataTableProps<TData, TValue>) {
  const { t } = useVertexTranslation();

  const isRowSelectionEnabled = !!(rowSelection && onRowSelectionChange);
  const isPaginationEnabled = !!(pagination && onPaginationChange);

  const resetPageIndex = () => {
    onPaginationChange?.((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );
  };

  const table = useTable({
    features: dataTableFeatures,
    data,
    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- useTable types every column value as unknown; callers still name TValue
    columns: columns as DataTableColumnDef<TData>[],
    onSortingChange,
    onColumnFiltersChange: (updater) => {
      onColumnFiltersChange(updater);
      resetPageIndex();
    },
    onColumnVisibilityChange,
    onColumnOrderChange,
    ...(isRowSelectionEnabled && { onRowSelectionChange }),
    onGlobalFilterChange: (updater: Updater<string>) => {
      onGlobalFilterChange(updater);
      resetPageIndex();
    },
    ...(isPaginationEnabled && { onPaginationChange }),
    // The paginated row model is always registered. Skip slicing when the
    // caller did not opt into pagination, or when the parent pages the rows.
    manualPagination: manualPagination ?? !isPaginationEnabled,
    ...(manualSorting != null && { manualSorting }),
    ...(manualFiltering != null && { manualFiltering }),
    ...(rowCount != null && { rowCount }),
    ...(onExpandedChange ? { onExpandedChange } : {}),
    ...(getRowId ? { getRowId } : {}),
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
      globalFilter,
      ...(isRowSelectionEnabled && { rowSelection }),
      ...(isPaginationEnabled && { pagination }),
      ...(expanded ? { expanded } : {}),
    },
  });

  const lastPageIndex = Math.max(0, table.getPageCount() - 1);
  const requestedPageIndex = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (isLoading) return;

    if (!pagination || pagination.pageIndex <= lastPageIndex) {
      requestedPageIndex.current = null;
      return;
    }
    if (requestedPageIndex.current === lastPageIndex) return;

    requestedPageIndex.current = lastPageIndex;

    if (onPageIndexOutOfRange) {
      onPageIndexOutOfRange(lastPageIndex);
      return;
    }

    onPaginationChange?.((previous) => ({
      ...previous,
      pageIndex: lastPageIndex,
    }));
  }, [
    isLoading,
    lastPageIndex,
    onPageIndexOutOfRange,
    onPaginationChange,
    pagination,
  ]);

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
  // When rows are expandable and the consumer includes a dedicated expand
  // column (id "expand"), render an expand/collapse-all toggle in its header.
  const isExpandable = !!renderExpandedRow;
  const { containerRef, canScrollLeft, canScrollRight } = useScrollShadow();

  return (
    <div data-slot="data-table" className={cn("space-y-4 min-w-0", className)}>
      <DataTableToolbar
        table={table}
        enableSearch={enableSearch}
        searchPlaceholder={searchPlaceholder}
        enableViewOptions={enableViewOptions}
        customContent={toolbarContent?.(table)}
        onColumnVisibilityToggle={onColumnVisibilityToggle}
      />

      <div
        ref={containerRef}
        className={cn(
          !plain && GLASS_CLASSES,
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
                      header.column.columnDef.meta?.numeric &&
                        "text-right [&_[data-slot=data-table-column-header]]:w-full [&_[data-slot=data-table-column-header]]:justify-end",
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
                    {!header.isPlaceholder &&
                    isExpandable &&
                    header.column.id === "expand" &&
                    rows.length > 0 ? (
                      <DataTableExpandAllToggle table={table} />
                    ) : header.isPlaceholder ? null : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
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
                <DataTableDataRow
                  key={row.id}
                  row={row}
                  onRowClick={onRowClick}
                  isRowClickable={isRowClickable}
                  getRowHref={getRowHref}
                  getRowClassName={getRowClassName}
                  enableColumnResizing={enableColumnResizing}
                  renderExpandedRow={renderExpandedRow}
                />
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
      {isPaginationEnabled && <DataTablePagination table={table} />}
    </div>
  );
}
export { DataTable };
export type { DataTableProps };
/** @public */
export { DataTableColumnHeader } from "./data-table-column-header";
