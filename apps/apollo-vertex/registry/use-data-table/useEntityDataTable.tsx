import { useLiveQuery } from "@tanstack/react-db";
import type {
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
} from "@tanstack/react-table";
import { useSolution } from "@uipath/vs-core";
import { useState } from "react";

import { ENTITY_TABLE_STORAGE_PREFIX } from "@/lib/constants";
import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";

import type {
  ColumnDefWithAccessorKey,
  EntityRecord,
  ExtraColumn,
  VssEntity,
} from "./types";
import { useColumnVisibility } from "./useColumnVisibility";
import { useEntityColumns } from "./useEntityColumns";
import { usePersistedColumnOrder } from "./usePersistedColumnOrder";
import { usePersistedSorting } from "./usePersistedSorting";

export interface UseEntityDataTableOptions<
  TRecord extends EntityRecord = EntityRecord,
> {
  entity: VssEntity;
  storageKey?: string;
  systemFields?: string[];
  columnOrder?: string[];
  initialVisibleColumnCount?: number;
  extraColumns?: ExtraColumn<TRecord>[];
  columnOverrides?: Record<
    string,
    (
      baseDef: ColumnDefWithAccessorKey<TRecord>,
    ) => ColumnDefWithAccessorKey<TRecord>
  >;
}

export function useEntityDataTable<
  TRecord extends EntityRecord = EntityRecord,
>({
  entity,
  storageKey: storageKeyProp,
  initialVisibleColumnCount = 8,
  systemFields = ["Id"],
  columnOrder: columnOrderProp,
  extraColumns,
  columnOverrides,
}: UseEntityDataTableOptions<TRecord>) {
  const solution = useSolution();
  const collection = solution?.api.collections.entities[entity.name];

  const storageKey = storageKeyProp ?? `entity-${entity.name ?? entity.id}`;
  const { data = [], isLoading } = useLiveQuery((q) =>
    q.from({ entities: collection }),
  );

  const { allColumns, allColumnKeys, columns } = useEntityColumns<TRecord>({
    entity,
    systemFields,
    columnOrder: columnOrderProp,
    extraColumns,
    columnOverrides,
  });

  const defaultVisibleColumns =
    columnOrderProp && columnOrderProp.length > 0
      ? columnOrderProp.filter((key) =>
          allColumns.some((col) => col.key === key),
        )
      : allColumns.slice(0, initialVisibleColumnCount).map((col) => col.key);

  const { columnVisibility, onColumnVisibilityChange } = useColumnVisibility({
    storageKey,
    allColumnKeys,
    defaultVisibleColumns,
  });

  const { sorting, onSortingChange } = usePersistedSorting({ storageKey });

  const defaultColumnOrder = allColumns.map((col) => col.key);

  const { columnOrder, onColumnOrderChange } = usePersistedColumnOrder({
    storageKey,
    defaultColumnOrder,
  });

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useLocalStorage(
    `${ENTITY_TABLE_STORAGE_PREFIX}global-filter-${storageKey}`,
    "",
  );
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
