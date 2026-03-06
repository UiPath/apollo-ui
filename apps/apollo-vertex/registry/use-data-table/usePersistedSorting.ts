import type { OnChangeFn, SortingState } from "@tanstack/react-table";

import { ENTITY_TABLE_STORAGE_PREFIX } from "@/lib/constants";
import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";

export interface UsePersistedSortingOptions {
  storageKey: string;
}

export function usePersistedSorting({
  storageKey,
}: UsePersistedSortingOptions) {
  const [sorting, setSorting] = useLocalStorage<SortingState>(
    `${ENTITY_TABLE_STORAGE_PREFIX}sorting-${storageKey}`,
    [],
  );

  const onSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const newSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting)
        : updaterOrValue;
    setSorting(newSorting);
  };

  return { sorting, onSortingChange };
}
