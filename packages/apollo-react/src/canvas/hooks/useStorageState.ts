import { useCallback, useEffect, useRef, useState } from "react";
import type { StorageType } from "../utils/Storage";
import { getStoredValue, setStoredValue } from "../utils/Storage";

export const useStorageState = <T>(key: string, initialValue: T, storageType: StorageType = "localStorage", prefix = "ui") => {
  const getValue = useCallback(() => {
    const storedValue = getStoredValue<T>(key, storageType, prefix);
    const result: T = storedValue !== undefined ? storedValue : initialValue;
    return result;
  }, [initialValue, key, storageType, prefix]);

  const [value, setValue] = useState<T>(getValue);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setStoredValue(key, value, storageType, prefix);
  }, [value, key, storageType, prefix]);

  const setStoredValueCallback = useCallback(
    (newValue: T | ((prevValue: T) => T)) => {
      setValue((prevValue) => {
        const valueToStore = newValue instanceof Function ? newValue(prevValue) : newValue;
        setStoredValue(key, valueToStore, storageType, prefix);
        return valueToStore;
      });
    },
    [key, storageType, prefix]
  );

  return [value, setStoredValueCallback] as const;
};
