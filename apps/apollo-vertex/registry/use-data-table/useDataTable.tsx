import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
} from "@tanstack/react-table";
import { useState } from "react";

import { useColumnVisibility } from "./useColumnVisibility";
import { usePersistedColumnOrder } from "./usePersistedColumnOrder";
import { usePersistedSorting } from "./usePersistedSorting";

export interface UseDataTableOptions<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  isLoading?: boolean;
  storageKey: string;
  defaultColumnOrder?: string[];
  defaultVisibleColumns?: string[];
}

export function useDataTable<TData>({
  data,
  columns,
  isLoading = false,
  storageKey,
  defaultColumnOrder: defaultColumnOrderProp,
  defaultVisibleColumns: defaultVisibleColumnsProp,
}: UseDataTableOptions<TData>) {
  const allColumnKeys = columns
    .map((col) => ("accessorKey" in col ? (col.accessorKey as string) : col.id))
    .filter((key): key is string => key != null);

  const defaultColumnOrder = defaultColumnOrderProp ?? allColumnKeys;
  const defaultVisibleColumns = defaultVisibleColumnsProp ?? allColumnKeys;

  const { columnVisibility, onColumnVisibilityChange } = useColumnVisibility({
    storageKey,
    allColumnKeys,
    defaultVisibleColumns,
  });

  const { sorting, onSortingChange } = usePersistedSorting({ storageKey });

  const { columnOrder, onColumnOrderChange } = usePersistedColumnOrder({
    storageKey,
    defaultColumnOrder,
  });

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
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
    onGlobalFilterChange: setGlobalFilter,
    pagination,
    onPaginationChange: setPagination,
  };
}
