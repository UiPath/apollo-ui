"use client";

import type { OnChangeFn, VisibilityState } from "@tanstack/react-table";

import { usePersistedColumns } from "./usePersistedColumns";

const visibleColumnsToVisibilityState = (
  visibleColumns: string[],
  allColumnKeys: string[],
): VisibilityState => {
  const state: VisibilityState = {};
  for (const key of allColumnKeys) {
    if (!visibleColumns.includes(key)) {
      state[key] = false;
    }
  }
  return state;
};

const visibilityStateToVisibleColumns = (
  visibilityState: VisibilityState,
  allColumnKeys: string[],
): string[] => {
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

  const onColumnVisibilityChange: OnChangeFn<VisibilityState> = (
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
