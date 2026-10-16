"use client";

import type { OnChangeFn, PaginationState } from "@tanstack/react-table";
import { useState } from "react";

import { ENTITY_TABLE_STORAGE_PREFIX } from "@/lib/constants";
import { useLocalStorage } from "@mantine/hooks";

export interface UsePersistedPageSizeOptions {
  storageKey: string;
  paginationControl?: {
    pageIndex: number;
    onPageIndexChange: (pageIndex: number) => void;
  };
}

export function usePersistedPageSize({
  storageKey,
  paginationControl,
}: UsePersistedPageSizeOptions) {
  const [pageSize, setPageSize] = useLocalStorage<number>({
    key: `${ENTITY_TABLE_STORAGE_PREFIX}page-size-${storageKey}`,
    defaultValue: 10,
  });

  const [pageIndex, setPageIndex] = useState(0);
  const resolvedPageIndex = paginationControl?.pageIndex ?? pageIndex;
  const pagination: PaginationState = {
    pageIndex: resolvedPageIndex,
    pageSize,
  };

  const onPaginationChange: OnChangeFn<PaginationState> = (updaterOrValue) => {
    const newPagination =
      typeof updaterOrValue === "function"
        ? updaterOrValue(pagination)
        : updaterOrValue;
    if (newPagination.pageIndex !== resolvedPageIndex) {
      if (paginationControl) {
        paginationControl.onPageIndexChange(newPagination.pageIndex);
      } else {
        setPageIndex(newPagination.pageIndex);
      }
    }
    if (newPagination.pageSize !== pageSize) {
      setPageSize(newPagination.pageSize);
    }
  };

  return { pagination, onPaginationChange };
}
