import { useCallback, useSyncExternalStore } from "react";

export const SAME_CONTEXT_STORAGE_EVENT_TYPE =
  "same-context-storage-event-type";

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener("storage", cb);
    window.addEventListener(SAME_CONTEXT_STORAGE_EVENT_TYPE, cb);
    return () => {
      window.removeEventListener("storage", cb);
      window.removeEventListener(SAME_CONTEXT_STORAGE_EVENT_TYPE, cb);
    };
  }, []);

  const getSnapshot = useCallback((): T => {
    const contents = localStorage.getItem(key);
    if (contents == null) {
      return defaultValue;
    }
    try {
      return JSON.parse(contents) as T;
    } catch {
      return defaultValue;
    }
  }, [defaultValue, key]);

  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => defaultValue,
  );

  const setNewValue = useCallback(
    (newValue: T) => {
      localStorage.setItem(key, JSON.stringify(newValue));
      window.dispatchEvent(new Event(SAME_CONTEXT_STORAGE_EVENT_TYPE));
    },
    [key],
  );

  return [value, setNewValue];
}
