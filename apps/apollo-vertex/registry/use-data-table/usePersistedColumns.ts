import { ENTITY_TABLE_COLUMNS_STORAGE_PREFIX } from "@/lib/constants";
import { useLocalStorage } from "@/registry/use-local-storage/use-local-storage";

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
  const fullKey = `${ENTITY_TABLE_COLUMNS_STORAGE_PREFIX}${storageKey}`;

  const [rawColumns, setRawColumns] = useLocalStorage<string[]>(
    fullKey,
    defaultColumns,
  );

  const visibleColumns = availableColumns
    ? rawColumns.filter((key) => availableColumns.includes(key))
    : rawColumns;

  return [visibleColumns, setRawColumns];
}
