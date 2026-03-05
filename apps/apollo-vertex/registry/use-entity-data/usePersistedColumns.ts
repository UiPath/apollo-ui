import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY_PREFIX = "entity-table-columns-";

function getStoredColumns(key: string): string[] | null {
  const stored = localStorage.getItem(key);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  }

  return null;
}

function saveColumns(key: string, columns: string[]): void {
  localStorage.setItem(key, JSON.stringify(columns));
}

export interface UsePersistedColumnsProps {
  storageKey: string;
  defaultColumns: string[];
  availableColumns?: string[];
}

export function usePersistedColumns({
  storageKey,
  defaultColumns,
  availableColumns,
}: UsePersistedColumnsProps): [string[], (columns: string[]) => void] {
  const fullKey = `${STORAGE_KEY_PREFIX}${storageKey}`;
  const isInitialMount = useRef(true);
  const prevAvailableColumnsRef = useRef<string[] | undefined>(
    availableColumns,
  );

  const [visibleColumns, setVisibleColumnsState] = useState<string[]>(() => {
    const stored = getStoredColumns(fullKey) ?? defaultColumns;
    return availableColumns
      ? stored.filter((key) => availableColumns.includes(key))
      : stored;
  });

  const availableColumnsStr = availableColumns
    ? JSON.stringify(availableColumns)
    : null;
  const prevAvailableColumnsStr = prevAvailableColumnsRef.current
    ? JSON.stringify(prevAvailableColumnsRef.current)
    : null;

  if (availableColumnsStr !== prevAvailableColumnsStr) {
    prevAvailableColumnsRef.current = availableColumns;

    const filtered = availableColumns
      ? visibleColumns.filter((key) => availableColumns.includes(key))
      : visibleColumns;

    if (filtered.length !== visibleColumns.length) {
      setVisibleColumnsState(filtered);
    }
  }

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveColumns(fullKey, visibleColumns);
  }, [fullKey, visibleColumns]);

  const setVisibleColumns = useCallback((columns: string[]) => {
    setVisibleColumnsState(columns);
  }, []);

  return [visibleColumns, setVisibleColumns];
}
