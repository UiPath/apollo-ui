import type { OnChangeFn, VisibilityState } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";

import { usePersistedColumns } from "./usePersistedColumns";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function visibleColumnsToVisibilityState(
  visibleColumns: string[],
  allColumnKeys: string[],
): VisibilityState {
  const state: VisibilityState = {};
  for (const key of allColumnKeys) {
    if (!visibleColumns.includes(key)) {
      state[key] = false;
    }
  }
  return state;
}

function visibilityStateToVisibleColumns(
  visibilityState: VisibilityState,
  allColumnKeys: string[],
): string[] {
  return allColumnKeys.filter((key) => visibilityState[key] !== false);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

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

  const columnVisibility = useMemo(
    () => visibleColumnsToVisibilityState(visibleColumns, allColumnKeys),
    [visibleColumns, allColumnKeys],
  );

  const onColumnVisibilityChange: OnChangeFn<VisibilityState> = useCallback(
    (updaterOrValue) => {
      const newVisibility =
        typeof updaterOrValue === "function"
          ? updaterOrValue(columnVisibility)
          : updaterOrValue;
      setVisibleColumns(
        visibilityStateToVisibleColumns(newVisibility, allColumnKeys),
      );
    },
    [columnVisibility, allColumnKeys, setVisibleColumns],
  );

  return { columnVisibility, onColumnVisibilityChange };
}
