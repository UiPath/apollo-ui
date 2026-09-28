import { useCallback, useRef, useState } from 'react';

export interface NavigationStackItem<T = unknown> {
  title: string;
  data: T;
}

export interface NavigationStackService<T = unknown> {
  stack: NavigationStackItem<T>[];
  current: NavigationStackItem<T> | null;
  canGoBack: boolean;
  isEmpty: boolean;
  push: (item: NavigationStackItem<T>) => void;
  pop: () => NavigationStackItem<T> | null;
  clear: () => void;
}

/**
 * A custom hook that provides navigation stack functionality.
 * Useful for managing hierarchical navigation with back/forward capabilities.
 *
 * @param initialItem - Optional initial item to start the stack with
 * @returns NavigationStackService with push, pop, clear operations
 */
export function useNavigationStack<T = unknown>(
  initialItem?: NavigationStackItem<T>
): NavigationStackService<T> {
  const [stack, setStack] = useState<NavigationStackItem<T>[]>(initialItem ? [initialItem] : []);
  const stackRef = useRef<NavigationStackItem<T>[]>(stack);

  stackRef.current = stack;

  const push = useCallback((item: NavigationStackItem<T>) => {
    setStack((prev) => [...prev, item]);
  }, []);

  const pop = useCallback((): NavigationStackItem<T> | null => {
    const currentStack = stackRef.current;

    if (currentStack.length === 0) {
      return null;
    }

    const poppedItem = currentStack.at(-1);

    setStack((prev) => prev.slice(0, -1));

    return poppedItem as NavigationStackItem<T>;
  }, []);

  const clear = useCallback(() => {
    setStack([]);
  }, []);

  const canGoBack = stack.length > 0;
  const current = canGoBack ? (stack.at(-1) as NavigationStackItem<T>) : null;
  const isEmpty = !canGoBack;

  return {
    stack,
    current,
    canGoBack,
    isEmpty,
    push,
    pop,
    clear,
  };
}
