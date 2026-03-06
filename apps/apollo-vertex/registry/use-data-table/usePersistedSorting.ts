import type { OnChangeFn, SortingState } from "@tanstack/react-table";

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

  const onSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const newSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting)
        : updaterOrValue;
    setSorting(newSorting);
  };

  return { sorting, onSortingChange };
}
