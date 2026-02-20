import { useNavigationStack } from '@uipath/apollo-react/canvas/hooks';
import { Column } from '@uipath/apollo-react/canvas/layouts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './Header';
import { type ListItem, ListView } from './ListView';
import { SearchBox } from './SearchBox';
import { AnimatedContainer, AnimatedContent } from './Toolbox.styles';

type AnimationDirection = 'forward' | 'back';

const TRANSITION_DURATION = 150;

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
  }>();

  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchIdRef = useRef(0);
  const initialItemsRef = useRef(initialItems);

  const isSearching = useMemo(() => search.length > 0, [search]);

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

  const clearSearch = useCallback(() => {
    setSearch('');
    setSearchedItems([]);
    setSearchLoading(false);
    setIsSearchingInitialItems(true);
  }, []);

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

    if (isSearching) {
      clearSearch();
    }

    onBack?.();
  }, [navigationStack, isSearching, onBack, clearSearch, startTransition]);

  const handleItemSelect = useCallback(
    async (item: ListItem<T>) => {
      if (!item.children) {
        onItemSelect(item);
        return;
      }
      setChildrenLoading(true);
      const nestedItems =
        typeof item.children === 'function'
          ? await item.children(item.id, item.name)
          : item.children;
      navigationStack.push({
        title: currentParentItem?.name || title,
        data: { items, parentItem: currentParentItem },
      });
      setItems(nestedItems);
      setCurrentParentItem(item);
      clearSearch();
      startTransition('forward');
      setChildrenLoading(false);
    },
    [navigationStack, currentParentItem, title, items, clearSearch, startTransition, onItemSelect]
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

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isSearching,
    navigationStack.canGoBack,
    onClose,
    clearSearch,
    startTransition,
    handleBackTransition,
  ]);

  return (
    <Column px={20} py={12} gap={12} w={320} h={440}>
      <Header
        title={currentParentItem?.name || title}
        onBack={handleBackTransition}
        showBackButton={navigationStack.canGoBack}
      />

      <SearchBox value={search} onChange={handleSearch} clear={clearSearch} placeholder="Search" />

      <AnimatedContainer>
        <AnimatedContent entering={isTransitioning} direction={animationDirection}>
          <ListView
            isLoading={childrenLoading || searchLoading || loading}
            items={isSearching && !isSearchingInitialItems ? searchedItems : items}
            emptyStateMessage={isSearching ? 'No matching nodes found' : 'No nodes found'}
            enableSections={!isSearching}
            onItemClick={handleItemSelect}
            onItemHover={onItemHover}
          />
        </AnimatedContent>
      </AnimatedContainer>
    </Column>
  );
}
