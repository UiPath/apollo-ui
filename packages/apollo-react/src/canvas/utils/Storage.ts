export type StorageType = "localStorage" | "sessionStorage" | Storage;

/**
 * Resolves the storage object based on the type or instance provided.
 */
function resolveStorage(storageType: StorageType): Storage {
  if (typeof storageType === "string") {
    switch (storageType) {
      case "localStorage":
        return localStorage;
      case "sessionStorage":
        return sessionStorage;
      default:
        throw new Error(`Unsupported storage type: ${storageType}`);
    }
  }
  return storageType; // already a Storage instance
}

export function getStoredValue<T>(key: string, storageType: StorageType = "localStorage", prefix = "ui"): T | undefined {
  const storage = resolveStorage(storageType);
  const prefixedKey = `${prefix}-${key}`;

  try {
    const storedValue = storage?.getItem(prefixedKey);
    return storedValue ? (JSON.parse(storedValue) as T) : undefined;
  } catch (error) {
    console.warn(`Failed to parse stored value for key "${prefixedKey}":`, error);
    return undefined;
  }
}

export function setStoredValue<T>(key: string, value: T, storageType: StorageType = "localStorage", prefix = "ui"): void {
  const storage = resolveStorage(storageType);
  const prefixedKey = `${prefix}-${key}`;

  try {
    storage?.setItem(prefixedKey, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to store value for key "${prefixedKey}":`, error);
  }
}
