export type StorageType = "localStorage" | "sessionStorage";

export function getStoredValue<T>(key: string, storageType: StorageType = "localStorage", prefix = "ui"): T | undefined {
  const storage = storageType === "localStorage" ? localStorage : sessionStorage;
  const prefixedKey = `${prefix}-${key}`;

  try {
    const storedValue = storage?.getItem(prefixedKey);
    return storedValue ? JSON.parse(storedValue) : undefined;
  } catch (error) {
    console.warn(`Failed to parse stored value for key "${prefixedKey}":`, error);
    return undefined;
  }
}

export function setStoredValue<T>(key: string, value: T, storageType: StorageType = "localStorage", prefix = "ui"): void {
  const storage = storageType === "localStorage" ? localStorage : sessionStorage;
  const prefixedKey = `${prefix}-${key}`;

  try {
    storage?.setItem(prefixedKey, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to store value for key "${prefixedKey}":`, error);
  }
}
