"use client";

import type {
  ColumnFiltersState,
  OnChangeFn,
  RowData,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import type { DataTableColumnDef } from "@/lib/table-features";

import { useColumnVisibility } from "./useColumnVisibility";
import { usePersistedColumnOrder } from "./usePersistedColumnOrder";
import { usePersistedPageSize } from "./usePersistedPageSize";
import { usePersistedSorting } from "./usePersistedSorting";

export interface UseDataTableOptions<TData extends RowData> {
  data: TData[];
  columns: DataTableColumnDef<TData>[];
  isLoading?: boolean;
  storageKey: string;
  defaultColumnOrder?: string[];
  defaultVisibleColumns?: string[];
  sortingControl?: {
    sorting: SortingState;
    onSortingChange: (sorting: SortingState) => void;
  };
  // When set, the search string comes from the caller instead of hook state.
  globalFilterControl?: {
    globalFilter: string;
    onGlobalFilterChange: (globalFilter: string) => void;
  };
  onColumnVisibilityToggle?: (
    columnId: string,
    visible: boolean,
    visibleCount: number,
  ) => void;
  paginationControl?: {
    pageIndex: number;
    onPageIndexChange: (pageIndex: number) => void;
    onPageIndexOutOfRange?: (pageIndex: number) => void;
  };
}

export function useDataTable<TData extends RowData>({
  data,
  columns,
  isLoading = false,
  storageKey,
  defaultColumnOrder: defaultColumnOrderProp,
  defaultVisibleColumns: defaultVisibleColumnsProp,
  sortingControl,
  globalFilterControl,
  onColumnVisibilityToggle,
  paginationControl,
}: UseDataTableOptions<TData>) {
  const allColumnKeys = columns
    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- tanstack ColumnDef doesn't expose accessorKey in its type union
    .map((col) => ("accessorKey" in col ? (col.accessorKey as string) : col.id))
    .filter((key): key is string => key != null);

  const defaultColumnOrder = defaultColumnOrderProp ?? allColumnKeys;
  const defaultVisibleColumns = defaultVisibleColumnsProp ?? allColumnKeys;

  const { columnVisibility, onColumnVisibilityChange } = useColumnVisibility({
    storageKey,
    allColumnKeys,
    defaultVisibleColumns,
  });

  const persistedSorting = usePersistedSorting({ storageKey });
  const sorting = sortingControl?.sorting ?? persistedSorting.sorting;
  const onSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    if (sortingControl) {
      const nextSorting =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sortingControl.sorting)
          : updaterOrValue;
      sortingControl.onSortingChange(nextSorting);
      return;
    }
    persistedSorting.onSortingChange(updaterOrValue);
  };

  const { columnOrder, onColumnOrderChange } = usePersistedColumnOrder({
    storageKey,
    defaultColumnOrder,
  });

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [uncontrolledGlobalFilter, setUncontrolledGlobalFilter] = useState("");
  const globalFilter =
    globalFilterControl?.globalFilter ?? uncontrolledGlobalFilter;
  const onGlobalFilterChange: OnChangeFn<string> = (updaterOrValue) => {
    if (!globalFilterControl) {
      setUncontrolledGlobalFilter(updaterOrValue);
      return;
    }
    const nextFilter =
      typeof updaterOrValue === "function"
        ? updaterOrValue(globalFilter)
        : updaterOrValue;
    globalFilterControl.onGlobalFilterChange(nextFilter);
  };
  const { pagination, onPaginationChange } = usePersistedPageSize({
    storageKey,
    paginationControl,
  });

  return {
    data,
    isLoading,
    columns,
    sorting,
    onSortingChange,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnFilters,
    onColumnFiltersChange: setColumnFilters,
    rowSelection,
    onRowSelectionChange: setRowSelection,
    globalFilter,
    onGlobalFilterChange,
    pagination,
    onPaginationChange,
    onColumnVisibilityToggle,
    onPageIndexOutOfRange: paginationControl?.onPageIndexOutOfRange,
  };
}
