"use client";

import type { OnChangeFn, PaginationState } from "@tanstack/react-table";
import { useState } from "react";

import { ENTITY_TABLE_STORAGE_PREFIX } from "@/lib/constants";
import { useLocalStorage } from "@mantine/hooks";

export interface UsePersistedPageSizeOptions {
  storageKey: string;
}

export function usePersistedPageSize({
  storageKey,
}: UsePersistedPageSizeOptions) {
  const [pageSize, setPageSize] = useLocalStorage<number>({
    key: `${ENTITY_TABLE_STORAGE_PREFIX}page-size-${storageKey}`,
    defaultValue: 10,
  });

  const [pageIndex, setPageIndex] = useState(0);
  const pagination: PaginationState = { pageIndex, pageSize };

  const onPaginationChange: OnChangeFn<PaginationState> = (updaterOrValue) => {
    const newPagination =
      typeof updaterOrValue === "function"
        ? updaterOrValue(pagination)
        : updaterOrValue;
    setPageIndex(newPagination.pageIndex);
    if (newPagination.pageSize !== pageSize) {
      setPageSize(newPagination.pageSize);
    }
  };

  return { pagination, onPaginationChange };
}
