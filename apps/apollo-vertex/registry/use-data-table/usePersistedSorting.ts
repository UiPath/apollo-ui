"use client";

import { useLocalStorage } from "@mantine/hooks";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import { ENTITY_TABLE_STORAGE_PREFIX } from "@/lib/constants";

export interface UsePersistedSortingOptions {
  storageKey: string;
}

export function usePersistedSorting({
  storageKey,
}: UsePersistedSortingOptions) {
  const [sorting, setSorting] = useLocalStorage<SortingState>({
    key: `${ENTITY_TABLE_STORAGE_PREFIX}sorting-${storageKey}`,
    defaultValue: [],
  });

  const onSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const newSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting)
        : updaterOrValue;
    setSorting(newSorting);
  };

  return { sorting, onSortingChange };
}
