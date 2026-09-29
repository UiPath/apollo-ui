import { useEffect, useRef, useState } from "react";

interface UseFilterDropdownSearchOptions {
  /** Server-side search handler; when omitted, only the local query is tracked */
  onSearchChange?: (query: string) => void;
  debounceMs: number;
}

/**
 * Tracks the search input value and, for server-side search, forwards it to
 * `onSearchChange` debounced. Clearing emits immediately, and a query is never
 * emitted twice in a row.
 */
function useFilterDropdownSearch({
  onSearchChange,
  debounceMs,
}: UseFilterDropdownSearchOptions) {
  const [searchQuery, setSearchQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emittedQueryRef = useRef("");

  const cancelPending = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(
    () => () => {
      if (timerRef.current != null) clearTimeout(timerRef.current);
    },
    [],
  );

  const emit = (query: string) => {
    if (!onSearchChange || emittedQueryRef.current === query) return;
    emittedQueryRef.current = query;
    onSearchChange(query);
  };

  const updateSearch = (query: string) => {
    setSearchQuery(query);
    if (!onSearchChange) return;
    cancelPending();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      emit(query);
    }, debounceMs);
  };

  const resetSearch = () => {
    setSearchQuery("");
    cancelPending();
    emit("");
  };

  return { searchQuery, updateSearch, resetSearch };
}

export { useFilterDropdownSearch };
