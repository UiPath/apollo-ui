import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { CursorCoordinates, TipTapRange } from '../components/input/tiptap';
import { type DrillDownState, useResourcePickerState } from '../hooks/use-resource-picker-state';
import { type AutopilotChatResourceItem, type AutopilotChatResourceItemSelector } from '../service';
import { useResourceData } from './resource-data-provider';

export type { DrillDownState };

/**
 * Type guard to check if a resource item is a selector (has nested resources).
 */
export function isResourceSelector(
  item: AutopilotChatResourceItem | AutopilotChatResourceItemSelector
): item is AutopilotChatResourceItemSelector {
  return 'hasNestedResources' in item && item.hasNestedResources === true;
}

const PICKER_VERTICAL_OFFSET = 8;
const SEARCH_DEBOUNCE_MS = 150;

export interface AutopilotChatResourcePickerContextType {
  isOpen: boolean;
  anchorPosition: CursorCoordinates | null;
  query: string;
  displayedItems: AutopilotChatResourceItem[];
  drillDown: DrillDownState | null;
  loading: boolean;
  loadingMore: boolean;
  searchInProgress: boolean;
  hasMore: boolean;
  error: string | null;
  previousDisplayCount: number;
  open: (range: TipTapRange, coords: CursorCoordinates) => void;
  close: () => void;
  setQuery: (query: string, range: TipTapRange) => void;
  handleItemClick: (item: AutopilotChatResourceItem | AutopilotChatResourceItemSelector) => void;
  goBackOrClose: () => void;
  retryLoad: () => void;
  loadMore: () => void;
}

const AutopilotChatResourcePickerContext =
  createContext<AutopilotChatResourcePickerContextType | null>(null);

interface AutopilotChatResourcePickerProviderProps {
  children: React.ReactNode;
  onResourceSelect: (resource: AutopilotChatResourceItem, range?: TipTapRange) => void;
  onDrillDown?: () => void;
}

export function AutopilotChatResourcePickerProvider({
  children,
  onResourceSelect,
  onDrillDown,
}: AutopilotChatResourcePickerProviderProps) {
  const {
    hasResources,
    topLevelResources,
    paginatedResources,
    getNestedResources,
    globalSearch,
    onResourceSelected,
  } = useResourceData();
  const { _ } = useLingui();

  const [state, dispatch] = useResourcePickerState();
  const {
    anchorPosition,
    query,
    drillDown,
    loading,
    loadingMore,
    searchInProgress,
    error,
    searchResults,
    searchDone,
    previousDisplayCount,
  } = state;

  const mentionRangeRef = useRef<TipTapRange | null>(null);
  const skipNextCloseRef = useRef(false);

  const isOpen = anchorPosition !== null;
  const searchQuery = useMemo(() => query.trim().toLowerCase(), [query]);

  const errorMessages = useMemo(
    () => ({
      load: _(
        msg({ id: 'autopilot-chat.resource-picker.error', message: 'Failed to load resources' })
      ),
      loadMore: _(
        msg({
          id: 'autopilot-chat.resource-picker.load-more-error',
          message: 'Failed to load more',
        })
      ),
      search: _(
        msg({ id: 'autopilot-chat.resource-picker.search-error', message: 'Search failed' })
      ),
    }),
    [_]
  );

  const open = useCallback(
    (range: TipTapRange, coords: CursorCoordinates) => {
      if (!hasResources) return;
      mentionRangeRef.current = range;
      dispatch({
        type: 'OPEN',
        coords: {
          top: coords.top - PICKER_VERTICAL_OFFSET,
          left: coords.left,
        },
      });
    },
    [hasResources, dispatch]
  );

  const close = useCallback(() => {
    if (skipNextCloseRef.current) {
      skipNextCloseRef.current = false;
      return;
    }
    mentionRangeRef.current = null;
    dispatch({ type: 'CLOSE' });
  }, [dispatch]);

  const setQuery = useCallback(
    (newQuery: string, range: TipTapRange) => {
      if (!hasResources) return;
      mentionRangeRef.current = range;
      dispatch({ type: 'SET_QUERY', query: newQuery });
    },
    [hasResources, dispatch]
  );

  const loadNestedResources = useCallback(
    async (category: AutopilotChatResourceItemSelector) => {
      dispatch({ type: 'LOAD_START' });
      try {
        const result = await getNestedResources(category.id);
        dispatch({
          type: 'DRILL_DOWN_SUCCESS',
          category,
          resources: result.items,
          done: result.done ?? true,
        });
      } catch {
        dispatch({ type: 'LOAD_ERROR', error: errorMessages.load });
      }
    },
    [getNestedResources, errorMessages.load, dispatch]
  );

  const handleItemClick = useCallback(
    (item: AutopilotChatResourceItem | AutopilotChatResourceItemSelector) => {
      if (isResourceSelector(item)) {
        skipNextCloseRef.current = true;
        onDrillDown?.();
        dispatch({ type: 'SET_QUERY', query: '' });
        loadNestedResources(item);
        return;
      }
      onResourceSelected(item);
      onResourceSelect(item, mentionRangeRef.current ?? undefined);
      close();
    },
    [loadNestedResources, onResourceSelect, onResourceSelected, onDrillDown, close, dispatch]
  );

  const goBackOrClose = useCallback(() => {
    if (drillDown) {
      dispatch({ type: 'GO_BACK' });
      return;
    }
    close();
  }, [drillDown, close, dispatch]);

  const retryLoad = useCallback(() => {
    if (drillDown) {
      loadNestedResources(drillDown.category);
    }
  }, [drillDown, loadNestedResources]);

  const loadMore = useCallback(async () => {
    if (!paginatedResources || loadingMore) return;

    const isSearch = !!searchQuery;

    if (isSearch && searchDone) return;
    if (!isSearch && (!drillDown || drillDown.done)) return;

    dispatch({ type: 'LOAD_MORE_START' });

    try {
      const result = isSearch
        ? drillDown
          ? await getNestedResources(drillDown.category.id, {
              searchText: searchQuery,
              skip: searchResults.length,
            })
          : await globalSearch({
              searchText: searchQuery,
              skip: searchResults.length,
            })
        : await getNestedResources(drillDown!.category.id, {
            skip: drillDown!.resources.length,
          });

      dispatch({
        type: 'LOAD_MORE_SUCCESS',
        target: isSearch ? 'search' : 'drillDown',
        items: result.items,
        done: result.done ?? true,
      });
    } catch {
      dispatch({ type: 'LOAD_ERROR', error: errorMessages.loadMore });
    }
  }, [
    paginatedResources,
    loadingMore,
    searchQuery,
    searchDone,
    drillDown,
    searchResults.length,
    getNestedResources,
    globalSearch,
    errorMessages.loadMore,
    dispatch,
  ]);

  const performPaginatedSearch = useCallback(async () => {
    try {
      const result = drillDown
        ? await getNestedResources(drillDown.category.id, { searchText: searchQuery })
        : await globalSearch({ searchText: searchQuery });
      dispatch({
        type: 'SEARCH_SUCCESS',
        results: result.items,
        done: result.done ?? true,
      });
    } catch {
      dispatch({ type: 'LOAD_ERROR', error: errorMessages.search });
    }
  }, [drillDown, searchQuery, getNestedResources, globalSearch, errorMessages.search, dispatch]);

  const performLocalSearch = useCallback(async () => {
    if (drillDown) {
      const filtered = drillDown.resources.filter((item) =>
        item.displayName.toLowerCase().includes(searchQuery)
      );
      dispatch({ type: 'SEARCH_SUCCESS', results: filtered, done: true });
      return;
    }

    const results: AutopilotChatResourceItem[] = [];
    for (const topLevel of topLevelResources) {
      if (topLevel.displayName.toLowerCase().includes(searchQuery)) {
        results.push(topLevel);
      }
      if (topLevel.hasNestedResources) {
        try {
          const result = await getNestedResources(topLevel.id);
          for (const item of result.items) {
            if (item.displayName.toLowerCase().includes(searchQuery)) {
              results.push(item);
            }
          }
        } catch {
          // Skip failed nested searches
        }
      }
    }
    dispatch({ type: 'SEARCH_SUCCESS', results, done: true });
  }, [drillDown, searchQuery, topLevelResources, getNestedResources, dispatch]);

  const displayedItems = useMemo(() => {
    if (searchQuery) return searchResults;
    if (drillDown) return drillDown.resources;
    return topLevelResources;
  }, [searchQuery, searchResults, drillDown, topLevelResources]);

  useEffect(() => {
    if (!searchQuery) {
      dispatch({ type: 'CLEAR_SEARCH' });
      return;
    }

    dispatch({ type: 'SEARCH_START' });

    const debounceTimer = setTimeout(
      paginatedResources ? performPaginatedSearch : performLocalSearch,
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, paginatedResources, performPaginatedSearch, performLocalSearch, dispatch]);

  const hasMore = useMemo(() => {
    if (!paginatedResources) return false;
    if (searchQuery) return !searchDone;
    if (drillDown) return !drillDown.done;
    return false;
  }, [paginatedResources, searchQuery, searchDone, drillDown]);

  const contextValue = useMemo<AutopilotChatResourcePickerContextType>(
    () => ({
      isOpen,
      anchorPosition,
      query,
      displayedItems,
      drillDown,
      loading,
      loadingMore,
      searchInProgress,
      hasMore,
      error,
      previousDisplayCount,
      open,
      close,
      setQuery,
      handleItemClick,
      goBackOrClose,
      retryLoad,
      loadMore,
    }),
    [
      isOpen,
      anchorPosition,
      query,
      displayedItems,
      drillDown,
      loading,
      loadingMore,
      searchInProgress,
      hasMore,
      error,
      previousDisplayCount,
      open,
      close,
      setQuery,
      handleItemClick,
      goBackOrClose,
      retryLoad,
      loadMore,
    ]
  );

  return (
    <AutopilotChatResourcePickerContext.Provider value={contextValue}>
      {children}
    </AutopilotChatResourcePickerContext.Provider>
  );
}

export function useAutopilotChatResourcePicker(): AutopilotChatResourcePickerContextType {
  const context = useContext(AutopilotChatResourcePickerContext);
  if (!context) {
    throw new Error(
      'useAutopilotChatResourcePicker must be used within an AutopilotChatResourcePickerProvider'
    );
  }
  return context;
}
