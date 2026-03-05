import type { OnChangeFn } from "@tanstack/react-table";
import { useCallback } from "react";

import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";

const STORAGE_PREFIX = "entity-table-";

export interface UsePersistedColumnOrderOptions {
  storageKey: string;
  defaultColumnOrder: string[];
}

export function usePersistedColumnOrder({
  storageKey,
  defaultColumnOrder,
}: UsePersistedColumnOrderOptions) {
  const [columnOrder, setColumnOrder] = useLocalStorage<string[]>(
    `${STORAGE_PREFIX}order-${storageKey}`,
    defaultColumnOrder,
  );

  const onColumnOrderChange: OnChangeFn<string[]> = useCallback(
    (updaterOrValue) => {
      const newOrder =
        typeof updaterOrValue === "function"
          ? updaterOrValue(columnOrder)
          : updaterOrValue;
      setColumnOrder(newOrder);
    },
    [columnOrder, setColumnOrder],
  );

  return { columnOrder, onColumnOrderChange };
}
