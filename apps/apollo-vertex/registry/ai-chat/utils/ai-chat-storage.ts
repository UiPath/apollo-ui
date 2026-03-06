export function getStorage(type: "session" | "local" | "none"): Storage | null {
  if (typeof window === "undefined" || type === "none") return null;
  return type === "session" ? sessionStorage : localStorage;
}

export function loadFromStorage<T>(
  storage: Storage | null,
  key: string,
  defaultValue: T,
): T {
  if (!storage) return defaultValue;
  try {
    const stored = storage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch {
    // Storage read failed — return default
  }
  return defaultValue;
}

export function saveToStorage<T>(
  storage: Storage | null,
  key: string,
  value: T,
): void {
  if (!storage) return;
  try {
    if (Array.isArray(value) && (value as unknown[]).length === 0) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Storage write failed — ignore
  }
}
