import { type ClassValue, clsx } from 'clsx';
import type * as React from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with proper precedence
 * Uses clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely get a nested value from an object using dot notation
 */
export function get(obj: unknown, path: string, defaultValue?: unknown): unknown {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result == null) {
      return defaultValue;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return result !== undefined ? result : defaultValue;
}

/**
 * Deep equality check for objects and primitives
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(objA[key], objB[key])) return false;
  }

  return true;
}

type AnyRef<T> = React.Ref<T> | React.Ref<unknown> | undefined;

/** Sets `ref` to `node`, returning the cleanup a React 19 callback ref may give. */
function setRef<T>(ref: AnyRef<T>, node: T | null): unknown {
  if (typeof ref === 'function') return ref(node);
  if (ref) (ref as React.MutableRefObject<T | null>).current = node;
  return undefined;
}

/**
 * One callback ref that sets every given ref. When any of them returns a cleanup, so does this
 * one, which runs those cleanups and resets the refs that returned none, as React would.
 */
export function composeRefs<T>(...refs: AnyRef<T>[]): React.RefCallback<T> {
  return (node) => {
    const cleanups = refs.map((ref) => setRef(ref, node));
    if (!cleanups.some((cleanup) => typeof cleanup === 'function')) return;
    return () => {
      refs.forEach((ref, index) => {
        const cleanup = cleanups[index];
        if (typeof cleanup === 'function') cleanup();
        else setRef(ref, null);
      });
    };
  };
}
