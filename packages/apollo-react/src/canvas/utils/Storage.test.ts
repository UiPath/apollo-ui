import { beforeEach, describe, expect, it } from 'vitest';
import { getStoredValue, setStoredValue } from './Storage';

describe('getStoredValue', () => {
  const key = 'testKey';
  const storageType = 'localStorage';
  const prefix = 'ui';
  const prefixedKey = `${prefix}-${key}`;

  beforeEach(() => {
    localStorage.clear();
  });

  it('should return undefined if no stored value exists', () => {
    const value = getStoredValue(key, storageType, prefix);
    expect(value).toBeUndefined();
  });

  it('should return stored value if it exists', () => {
    localStorage.setItem(prefixedKey, JSON.stringify('storedValue'));
    const value = getStoredValue(key, storageType, prefix);
    expect(value).toBe('storedValue');
  });

  it('should handle JSON parse errors gracefully', () => {
    localStorage.setItem(prefixedKey, 'invalidJSON');
    const value = getStoredValue(key, storageType, prefix);
    expect(value).toBeUndefined();
  });
});

describe('setStoredValue', () => {
  const key = 'testKey';
  const value = 'testValue';
  const storageType = 'localStorage';
  const prefix = 'ui';
  const prefixedKey = `${prefix}-${key}`;

  beforeEach(() => {
    localStorage.clear();
  });

  it('should store the value', () => {
    setStoredValue(key, value, storageType, prefix);
    expect(localStorage.getItem(prefixedKey)).toBe(JSON.stringify(value));
  });
});
