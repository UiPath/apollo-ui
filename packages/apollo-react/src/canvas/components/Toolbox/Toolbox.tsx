import { Column, useNavigationStack } from "@uipath/uix/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header } from "./Header";
import { type ListItem, ListView } from "./ListView";
import { SearchBox } from "./SearchBox";
import { AnimatedContainer, AnimatedContent } from "./Toolbox.styles";

type AnimationDirection = "forward" | "back";

const TRANSITION_DURATION = 150;

export interface ToolboxProps<T> {
  title: string;
  initialItems: ListItem<T>[];
  loading?: boolean;
  onClose: () => void;
  onItemSelect: (item: ListItem<T>) => Promise<void> | void;
  onItemHover?: (item: ListItem<T>) => void;
  onBack?: () => void;
  onSearch?: (
    query: string,
    isTopLevelSearch: boolean,
    { currentItems, category }: { currentItems?: ListItem<T>[]; category?: string }
  ) => Promise<ListItem<T>[]>;
}

function searchLeafItems<T>(items: ListItem<T>[], query: string): ListItem<T>[] {
  const results: ListItem<T>[] = [];

  for (const item of items) {
    if (typeof item.children === "function") {
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

export function Toolbox<T>({ onClose, onBack, onItemSelect, onSearch, onItemHover, title, initialItems, loading }: ToolboxProps<T>) {
  const [items, setItems] = useState<ListItem<T>[]>(initialItems);
  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [isSearchingInitialItems, setIsSearchingInitialItems] = useState(true);
  const [searchedItems, setSearchedItems] = useState<ListItem<T>[]>([]);
  const [currentParentItem, setCurrentParentItem] = useState<ListItem<T> | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<AnimationDirection>("forward");

  const navigationStack = useNavigationStack<{ items: ListItem<T>[]; parentItem: ListItem<T> | null }>();

  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const searchIdRef = useRef(0);

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
    setSearch("");
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
        setSearch("");
        return;
      }

      setSearch(query);
      searchIdRef.current += 1;
      const currentRequestId = searchIdRef.current;

      setSearchLoading(true);
      const result = onSearch ? await onSearch(query, !navigationStack.canGoBack, { currentItems: items }) : searchLeafItems(items, query);

      // Only update if this is still the latest request
      if (currentRequestId === searchIdRef.current) {
        setSearchedItems(result);
        setSearchLoading(false);
        setIsSearchingInitialItems(false);
      }
    },
    [onSearch, items, navigationStack.canGoBack]
  );

  const handleBackTransition = useCallback(() => {
    startTransition("back");

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
      const nestedItems = typeof item.children === "function" ? await item.children(item.id, item.name) : item.children;
      navigationStack.push({
        title: currentParentItem?.name || title,
        data: { items, parentItem: currentParentItem },
      });
      setItems(nestedItems);
      setCurrentParentItem(item);
      clearSearch();
      startTransition("forward");
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

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isSearching) {
          searchIdRef.current += 1;
          startTransition("back");
          clearSearch();
        } else if (navigationStack.canGoBack) {
          handleBackTransition();
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSearching, navigationStack.canGoBack, onClose, clearSearch, startTransition, handleBackTransition]);

  return (
    <Column px={20} py={12} gap={12} w={320} h={440}>
      <Header title={currentParentItem?.name || title} onBack={handleBackTransition} showBackButton={navigationStack.canGoBack} />

      <SearchBox value={search} onChange={handleSearch} clear={clearSearch} placeholder="Search" />

      <AnimatedContainer>
        <AnimatedContent entering={isTransitioning} direction={animationDirection}>
          <ListView
            isLoading={childrenLoading || searchLoading || loading}
            items={isSearching && !isSearchingInitialItems ? searchedItems : items}
            emptyStateMessage={isSearching ? "No matching nodes found" : "No nodes found"}
            enableSections={!isSearching}
            onItemClick={handleItemSelect}
            onItemHover={onItemHover}
          />
        </AnimatedContent>
      </AnimatedContainer>
    </Column>
  );
}
