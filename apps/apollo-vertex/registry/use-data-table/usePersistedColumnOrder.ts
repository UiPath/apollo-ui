"use client";

import { useLocalStorage } from "@mantine/hooks";
import type { OnChangeFn } from "@tanstack/react-table";
import { ENTITY_TABLE_STORAGE_PREFIX } from "@/lib/constants";

export interface UsePersistedColumnOrderOptions {
  storageKey: string;
  defaultColumnOrder: string[];
}

export function usePersistedColumnOrder({
  storageKey,
  defaultColumnOrder,
}: UsePersistedColumnOrderOptions) {
  const [columnOrder, setColumnOrder] = useLocalStorage<string[]>({
    key: `${ENTITY_TABLE_STORAGE_PREFIX}order-${storageKey}`,
    defaultValue: defaultColumnOrder,
  });

  const onColumnOrderChange: OnChangeFn<string[]> = (updaterOrValue) => {
    const newOrder =
      typeof updaterOrValue === "function"
        ? updaterOrValue(columnOrder)
        : updaterOrValue;
    setColumnOrder(newOrder);
  };

  return { columnOrder, onColumnOrderChange };
}
