import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useStorageState } from "./useStorageState";

describe("useStorageState", () => {
  const key = "testKey";
  const initialValue = "initialValue";
  const storageType = "localStorage";
  const prefix = "ui";
  const prefixedKey = `${prefix}-${key}`;

  beforeEach(() => {
    localStorage.clear();
  });

  it("should return initial value if no stored value exists", () => {
    const { result } = renderHook(() => useStorageState(key, initialValue, storageType, prefix));
    expect(result.current[0]).toBe(initialValue);
  });

  it("should return stored value if it exists", () => {
    localStorage.setItem(prefixedKey, JSON.stringify("storedValue"));
    const { result } = renderHook(() => useStorageState(key, initialValue, storageType, prefix));
    expect(result.current[0]).toBe("storedValue");
  });

  it("should update value and store it", () => {
    const { result } = renderHook(() => useStorageState(key, initialValue, storageType, prefix));
    act(() => {
      result.current[1]("newValue");
    });
    expect(result.current[0]).toBe("newValue");
    expect(localStorage.getItem(prefixedKey)).toBe(JSON.stringify("newValue"));
  });

  it("should handle JSON parse errors gracefully", () => {
    localStorage.setItem(prefixedKey, "invalidJSON");
    const { result } = renderHook(() => useStorageState(key, initialValue, storageType, prefix));
    expect(result.current[0]).toBe(initialValue);
  });
});
