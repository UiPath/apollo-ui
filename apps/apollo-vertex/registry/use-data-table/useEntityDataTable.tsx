import { useLiveQuery } from "@tanstack/react-db";
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
} from "@tanstack/react-table";
import { useSolution } from "@uipath/vs-core";
import { useMemo, useState } from "react";

import { ENTITY_TABLE_STORAGE_PREFIX } from "@/lib/constants";
import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";

import { useColumnVisibility } from "./useColumnVisibility";
import type { Column } from "./useEntityColumns";
import { useEntityColumns } from "./useEntityColumns";
import { usePersistedColumnOrder } from "./usePersistedColumnOrder";
import { usePersistedSorting } from "./usePersistedSorting";

export type EntityRecord = Record<string, unknown>;

export type ColumnDefWithAccessorKey<T> = ColumnDef<T, unknown> & {
  accessorKey: string;
};

export interface VssEntity {
  id?: string;
  name: string;
  fields: Array<{
    isHiddenField: boolean;
    name: string;
    displayName: string;
    fieldDataType: {
      name: string;
    };
  }>;
}

export interface ExtraColumn<TRecord extends EntityRecord = EntityRecord> {
  column: Column;
  position: "start" | "end";
  definition: ColumnDefWithAccessorKey<TRecord>;
}

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
  if (!solution) {
    throw new Error(
      "useEntityDataTable requires a SolutionProvider. Wrap your component tree with <SolutionProvider>.",
    );
  }

  const collection = solution.api.collections.entities[entity.name];
  if (!collection) {
    throw new Error(
      `useEntityDataTable: no collection found for entity "${entity.name}". Ensure the entity is configured in your solution.`,
    );
  }

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

  const defaultColumnOrder = useMemo(
    () => allColumns.map((col) => col.key),
    [allColumns],
  );

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
