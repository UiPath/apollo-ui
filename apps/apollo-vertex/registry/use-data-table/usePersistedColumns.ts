import { useState } from "react";

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

  const [rawColumns, setRawColumns] = useState<string[]>(
    () => getStoredColumns(fullKey) ?? defaultColumns,
  );

  const visibleColumns = availableColumns
    ? rawColumns.filter((key) => availableColumns.includes(key))
    : rawColumns;

  const setVisibleColumns = (columns: string[]) => {
    setRawColumns(columns);
    localStorage.setItem(fullKey, JSON.stringify(columns));
  };

  return [visibleColumns, setVisibleColumns];
}
