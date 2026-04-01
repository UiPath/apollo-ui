import { useNavigationStack } from '@uipath/apollo-react/canvas/hooks';
import { Column } from '@uipath/apollo-react/canvas/layouts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useListRef } from 'react-window';
import { Header } from './Header';
import { type ListItem, ListView, type ListViewHandle, type RenderItem } from './ListView';
import { SearchBox } from './SearchBox';
import { AnimatedContainer, AnimatedContent } from './Toolbox.styles';

type AnimationDirection = 'forward' | 'back';

const TRANSITION_DURATION = 150;
const SEARCH_BAR_INDEX = -1;

/**
 * BFS for item by id.
 */
function findItemById<T>(items: ListItem<T>[], id: string): ListItem<T> | null {
  const queue: ListItem<T>[] = [...items];
  const visited = new Set<string>(items.map((item) => item.id));
  let qIndex = 0;

  while (qIndex < queue.length) {
    // biome-ignore lint/style/noNonNullAssertion: Just checked index bounds above.
    const item = queue[qIndex++]!;

    if (item.id === id) {
      return item;
    }

    if (!item.children || typeof item.children === 'function') {
      continue;
    }

    for (const child of item.children) {
      if (!visited.has(child.id)) {
        visited.add(child.id);
        queue.push(child);
      }
    }
  }

  return null;
}

export type ToolboxSearchHandler<T = any> = (
  query: string,
  isTopLevelSearch: boolean,
  { currentItems, category }: { currentItems?: ListItem<T>[]; category?: string }
) => Promise<ListItem<T>[]>;

export interface ToolboxProps<T> {
  title: string;
  initialItems: ListItem<T>[];
  loading?: boolean;
  onClose: () => void;
  onItemSelect: (item: ListItem<T>) => Promise<void> | void;
  onItemHover?: (item: ListItem<T>) => void;
  onBack?: () => void;
  onSearch?: ToolboxSearchHandler<T>;
}

function getNextSelectableIndex(
  renderedItems: RenderItem<ListItem>[],
  currentIndex: number,
  direction: 'up' | 'down'
): number {
  const numericDirection = direction === 'up' ? -1 : 1;
  let next = currentIndex + numericDirection;
  while (next >= 0 && next < renderedItems.length) {
    if (renderedItems[next]?.type === 'item') return next;
    next += numericDirection;
  }
  return SEARCH_BAR_INDEX;
}

function getFirstSelectableIndex(renderedItems: RenderItem<ListItem>[]): number {
  for (let i = 0; i < renderedItems.length; i++) {
    if (renderedItems[i]?.type === 'item') return i;
  }
  return SEARCH_BAR_INDEX;
}

function getLastSelectableIndex(renderedItems: RenderItem<ListItem>[]): number {
  for (let i = renderedItems.length - 1; i >= 0; i--) {
    if (renderedItems[i]?.type === 'item') return i;
  }
  return SEARCH_BAR_INDEX;
}

function searchLeafItems<T>(items: ListItem<T>[], query: string): ListItem<T>[] {
  const results: ListItem<T>[] = [];

  for (const item of items) {
    if (typeof item.children === 'function') {
      // Skip dynamically fetched children in default search.
      continue;
    }

    if (!item.children && item.name.toLowerCase().includes(query.toLowerCase())) {
      results.push(item);
    } else if (item.children) {
      results.push(...searchLeafItems(item.children, query));
    }
  }
  return results;
}

export function Toolbox<T>({
  onClose,
  onBack,
  onItemSelect,
  onSearch,
  onItemHover,
  title,
  initialItems,
  loading,
}: ToolboxProps<T>) {
  const [items, setItems] = useState<ListItem<T>[]>(initialItems);
  const [search, setSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [isSearchingInitialItems, setIsSearchingInitialItems] = useState(true);
  const [searchedItems, setSearchedItems] = useState<ListItem<T>[]>([]);
  const [currentParentItem, setCurrentParentItem] = useState<ListItem<T> | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<AnimationDirection>('forward');

  const navigationStack = useNavigationStack<{
    items: ListItem<T>[];
    parentItem: ListItem<T> | null;
    activeIndex: number;
  }>();

  const [activeIndex, setActiveIndex] = useState(SEARCH_BAR_INDEX);

  const containerRef = useRef<HTMLDivElement>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchIdRef = useRef(0);
  const initialItemsRef = useRef(initialItems);
  const listRef = useListRef(null);
  const listViewRef = useRef<ListViewHandle<ListItem<T>>>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null);

  const isSearching = useMemo(() => search.length > 0, [search]);

  const displayedItems = useMemo(
    () => (isSearching && !isSearchingInitialItems ? searchedItems : items),
    [isSearching, isSearchingInitialItems, searchedItems, items]
  );

  const startTransition = useCallback((direction: AnimationDirection) => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    setIsTransitioning(true);
    setAnimationDirection(direction);

    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, TRANSITION_DURATION);
  }, []);

  const navigateToIndex = useCallback(
    (index: number) => {
      setActiveIndex(index);
      searchInputRef.current?.focus();

      if (index !== SEARCH_BAR_INDEX) {
        requestAnimationFrame(() => {
          listRef.current?.scrollToRow({ index, align: 'auto' });
        });
      }
    },
    [listRef]
  );

  const navigateToFirstItem = useCallback(() => {
    const renderedItems = listViewRef.current?.renderedItems ?? [];
    const firstIndex = getFirstSelectableIndex(renderedItems);
    if (firstIndex !== SEARCH_BAR_INDEX) navigateToIndex(firstIndex);
  }, [navigateToIndex]);

  const clearSearch = useCallback(() => {
    setSearch('');
    setSearchedItems([]);
    setSearchLoading(false);
    setIsSearchingInitialItems(true);
    navigateToIndex(SEARCH_BAR_INDEX);
  }, [navigateToIndex]);

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchLoading(false);
        setSearchedItems([]);
        setIsSearchingInitialItems(true);
        setSearch('');
        return;
      }

      setSearch(query);
      setActiveIndex(SEARCH_BAR_INDEX);
      searchIdRef.current += 1;
      const currentRequestId = searchIdRef.current;

      setSearchLoading(true);
      const result = onSearch
        ? await onSearch(query, !navigationStack.canGoBack, {
            currentItems: items,
            category: currentParentItem?.id,
          })
        : searchLeafItems(items, query);

      // Only update if this is still the latest request
      if (currentRequestId === searchIdRef.current) {
        setSearchedItems(result);
        setSearchLoading(false);
        setIsSearchingInitialItems(false);
      }
    },
    [onSearch, items, navigationStack.canGoBack, currentParentItem?.id]
  );

  const handleBackTransition = useCallback(() => {
    startTransition('back');

    const previousState = navigationStack.pop();

    if (previousState) {
      setItems(previousState.data.items);
      setCurrentParentItem(previousState.data.parentItem);
    }

    // Reset search state without calling clearSearch (which navigates to search bar).
    setSearch('');
    setSearchedItems([]);
    setSearchLoading(false);
    setIsSearchingInitialItems(true);

    const restoredIndex = previousState?.data.activeIndex ?? SEARCH_BAR_INDEX;
    navigateToIndex(restoredIndex);

    onBack?.();
  }, [navigationStack, onBack, startTransition, navigateToIndex]);

  const handleItemSelect = useCallback(
    async (item: ListItem<T>, index?: number) => {
      if (!item.children) {
        onItemSelect(item);
        return;
      }
      setChildrenLoading(true);
      const nestedItems =
        typeof item.children === 'function'
          ? await item.children(item.id, item.name)
          : item.children;
      const savedIndex = isSearching ? SEARCH_BAR_INDEX : (index ?? activeIndex);
      navigationStack.push({
        title: currentParentItem?.name || title,
        data: {
          items,
          parentItem: currentParentItem,
          activeIndex: savedIndex,
        },
      });
      setItems(nestedItems);
      setCurrentParentItem(item);
      clearSearch();
      setActiveIndex(SEARCH_BAR_INDEX);
      startTransition('forward');
      setChildrenLoading(false);
    },
    [
      navigationStack,
      currentParentItem,
      title,
      items,
      activeIndex,
      isSearching,
      clearSearch,
      startTransition,
      onItemSelect,
    ]
  );

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // React to changes in initialItems prop while attempting to preserve navigation state.
  useEffect(() => {
    // We only care about running this when the initialItems prop changes.
    if (initialItems === initialItemsRef.current) return;
    const newInitialItems = initialItems;
    initialItemsRef.current = initialItems;

    // If at root level (no active navigation), safely replace items.
    if (navigationStack.isEmpty) {
      setItems(newInitialItems);
      return;
    }

    // Attempt to update current view.
    if (currentParentItem) {
      const updatedCurrentParent = findItemById(newInitialItems, currentParentItem.id);
      if (updatedCurrentParent?.children && typeof updatedCurrentParent.children !== 'function') {
        // Parent still exists - update current children from new parent.
        setItems(updatedCurrentParent.children);
      }
      if (updatedCurrentParent) {
        setCurrentParentItem(updatedCurrentParent);
      }
      // If parent is missing or has no static children, keep current stale items.
      // User can navigate back when ready.
    }

    // Update the previous views that are held in the navigation stack.
    const updatedStack = navigationStack.stack.map((stackItem) => {
      if (!stackItem.data.parentItem) {
        // Root navigation item - replace with new initial items.
        return {
          ...stackItem,
          data: {
            items: newInitialItems,
            parentItem: null,
            activeIndex: stackItem.data.activeIndex,
          },
        };
      }

      const updatedParentItem = findItemById(newInitialItems, stackItem.data.parentItem.id);
      // Default to existing items in case parent is missing in new items or has dynamic children.
      let updatedItems = stackItem.data.items;
      if (updatedParentItem?.children && typeof updatedParentItem.children !== 'function') {
        // Use static children from updated parent item.
        updatedItems = updatedParentItem.children;
      }

      return {
        ...stackItem,
        data: {
          items: updatedItems,
          parentItem: updatedParentItem,
          activeIndex: stackItem.data.activeIndex,
        },
      };
    });

    if (updatedStack.length > 0) {
      navigationStack.clear();
      for (const updatedStackItem of updatedStack) {
        navigationStack.push(updatedStackItem);
      }
    }
  }, [initialItems, navigationStack, currentParentItem]);

  // Re-run active search when items change so results reflect newly loaded data
  // (e.g. dynamic manifests streaming in while a search query is already entered).
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only re-run when items update, not on search/handleSearch changes
  useEffect(() => {
    if (search) {
      handleSearch(search);
    }
  }, [items]);

  const activeDescendantId = useMemo(() => {
    if (activeIndex < 0) return undefined;
    const renderItem = listViewRef.current?.renderedItems[activeIndex];
    if (renderItem?.type === 'item') return `toolbox-item-${renderItem.item.id}`;
    return undefined;
  }, [activeIndex]);

  const handleNavigationKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isTransitioning) return;

      const renderedItems = listViewRef.current?.renderedItems ?? [];

      const navigateDown = () => {
        if (activeIndex === SEARCH_BAR_INDEX) {
          navigateToFirstItem();
        } else {
          const nextIndex = getNextSelectableIndex(renderedItems, activeIndex, 'down');
          if (nextIndex !== SEARCH_BAR_INDEX) {
            navigateToIndex(nextIndex);
          } else {
            navigateToFirstItem();
          }
        }
      };

      const navigateUp = () => {
        navigateToIndex(getNextSelectableIndex(renderedItems, activeIndex, 'up'));
      };

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          navigateDown();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          navigateUp();
          break;
        }
        case ' ':
        case 'Enter': {
          if (activeIndex === SEARCH_BAR_INDEX) return;

          const renderItem = renderedItems[activeIndex];
          if (renderItem?.type === 'item') {
            e.preventDefault();
            handleItemSelect(renderItem.item);
          }
          break;
        }
        case 'ArrowRight': {
          const renderItem = renderedItems[activeIndex];
          if (renderItem?.type === 'item' && renderItem.item.children) {
            e.preventDefault();
            handleItemSelect(renderItem.item);
          }
          break;
        }
        case 'ArrowLeft': {
          if (!navigationStack.canGoBack || (activeIndex === SEARCH_BAR_INDEX && search.length > 0))
            return;

          e.preventDefault();
          handleBackTransition();
          break;
        }
        case 'Tab': {
          // When on the search bar with text, defer behavior handling to SearchBox
          if (activeIndex === SEARCH_BAR_INDEX && search.length > 0 && !e.shiftKey) {
            break;
          }

          e.preventDefault();

          if (activeIndex === SEARCH_BAR_INDEX && e.shiftKey) {
            break;
          }

          if (e.shiftKey) {
            navigateUp();

            // If the clear button is showing, allow shift+tab to focus it from the search bar
            const nextUp = getNextSelectableIndex(renderedItems, activeIndex, 'up');
            if (nextUp === SEARCH_BAR_INDEX && search.length > 0) {
              clearButtonRef.current?.focus();
            }
          } else {
            navigateDown();
          }
          break;
        }
        case 'Home': {
          if (activeIndex === SEARCH_BAR_INDEX) break;

          e.preventDefault();
          navigateToFirstItem();
          break;
        }
        case 'End': {
          if (activeIndex === SEARCH_BAR_INDEX) break;

          e.preventDefault();
          const lastIndex = getLastSelectableIndex(renderedItems);
          if (lastIndex !== SEARCH_BAR_INDEX) navigateToIndex(lastIndex);
          break;
        }
      }
    },
    [
      search,
      isTransitioning,
      activeIndex,
      navigationStack.canGoBack,
      navigateToIndex,
      navigateToFirstItem,
      handleItemSelect,
      handleBackTransition,
    ]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSearching) {
          searchIdRef.current += 1;
          startTransition('back');
          clearSearch();
        } else if (navigationStack.canGoBack) {
          handleBackTransition();
        } else {
          onClose();
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [
    isSearching,
    navigationStack.canGoBack,
    onClose,
    clearSearch,
    startTransition,
    handleBackTransition,
  ]);

  return (
    <div ref={containerRef} data-testid="toolbox-container">
      <Column px={20} py={12} gap={12} w={320} h={440}>
        <Header
          title={currentParentItem?.name || title}
          onBack={handleBackTransition}
          showBackButton={navigationStack.canGoBack}
        />

        <SearchBox
          value={search}
          onChange={handleSearch}
          clear={clearSearch}
          placeholder="Search"
          inputRef={searchInputRef}
          clearButtonRef={clearButtonRef}
          onNavigationKeyDown={handleNavigationKeyDown}
          navigateToFirstItem={navigateToFirstItem}
          activeDescendantId={activeDescendantId}
        />

        <AnimatedContainer>
          <AnimatedContent entering={isTransitioning} direction={animationDirection}>
            <ListView
              ref={listViewRef}
              isLoading={childrenLoading || searchLoading || loading}
              items={displayedItems}
              activeIndex={activeIndex}
              listRef={listRef}
              emptyStateMessage={isSearching ? 'No matching nodes found' : 'No nodes found'}
              onItemClick={handleItemSelect}
              onItemHover={onItemHover}
              enableSections={!isSearching}
            />
          </AnimatedContent>
        </AnimatedContainer>
      </Column>
    </div>
  );
}
