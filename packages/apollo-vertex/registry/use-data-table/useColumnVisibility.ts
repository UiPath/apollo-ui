"use client";

import type { ColumnVisibilityState, OnChangeFn } from "@tanstack/react-table";

import { usePersistedColumns } from "./usePersistedColumns";

const visibleColumnsToVisibilityState = (
  visibleColumns: string[],
  allColumnKeys: string[],
): ColumnVisibilityState => {
  const state: ColumnVisibilityState = {};
  for (const key of allColumnKeys) {
    if (!visibleColumns.includes(key)) {
      state[key] = false;
    }
  }
  return state;
};

const visibilityStateToVisibleColumns = (
  visibilityState: ColumnVisibilityState,
  allColumnKeys: string[],
): string[] => {
  // oxlint-disable-next-line typescript-eslint(no-unnecessary-boolean-literal-compare) -- undefined means visible; !== false is intentional
  return allColumnKeys.filter((key) => visibilityState[key] !== false);
};
export interface UseColumnVisibilityOptions {
  storageKey: string;
  allColumnKeys: string[];
  defaultVisibleColumns: string[];
}

export function useColumnVisibility({
  storageKey,
  allColumnKeys,
  defaultVisibleColumns,
}: UseColumnVisibilityOptions) {
  const [visibleColumns, setVisibleColumns] = usePersistedColumns({
    storageKey,
    defaultColumns: defaultVisibleColumns,
    availableColumns: allColumnKeys,
  });

  const columnVisibility = visibleColumnsToVisibilityState(
    visibleColumns,
    allColumnKeys,
  );

  const onColumnVisibilityChange: OnChangeFn<ColumnVisibilityState> = (
    updaterOrValue,
  ) => {
    const newVisibility =
      typeof updaterOrValue === "function"
        ? updaterOrValue(columnVisibility)
        : updaterOrValue;
    setVisibleColumns(
      visibilityStateToVisibleColumns(newVisibility, allColumnKeys),
    );
  };

  return { columnVisibility, onColumnVisibilityChange };
}
