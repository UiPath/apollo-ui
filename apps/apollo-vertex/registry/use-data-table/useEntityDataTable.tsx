import { type Collection, useLiveQuery } from "@tanstack/react-db";
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

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

export interface UseEntityDataOptions<
  TRecord extends EntityRecord = EntityRecord,
> {
  entity: VssEntity;
  collection: Collection<TRecord>;
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

export function useEntityData<TRecord extends EntityRecord = EntityRecord>({
  entity,
  collection,
  storageKey: storageKeyProp,
  initialVisibleColumnCount = 8,
  systemFields = ["Id"],
  columnOrder: columnOrderProp,
  extraColumns,
  columnOverrides,
}: UseEntityDataOptions<TRecord>) {
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
