import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import { useCallback } from "react";

import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";

const STORAGE_PREFIX = "entity-table-";

export interface UsePersistedSortingOptions {
  storageKey: string;
}

export function usePersistedSorting({
  storageKey,
}: UsePersistedSortingOptions) {
  const [sorting, setSorting] = useLocalStorage<SortingState>(
    `${STORAGE_PREFIX}sorting-${storageKey}`,
    [],
  );

  const onSortingChange: OnChangeFn<SortingState> = useCallback(
    (updaterOrValue) => {
      const newSorting =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;
      setSorting(newSorting);
    },
    [sorting, setSorting],
  );

  return { sorting, onSortingChange };
}
