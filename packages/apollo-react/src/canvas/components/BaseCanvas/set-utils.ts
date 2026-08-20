/**
 * Shared set helpers for the canvas context stores.
 *
 * Deliberately not re-exported from `index.ts`: these back the identity
 * stability that `useSyncExternalStore` relies on, and are not public API.
 */

/**
 * Shared empty-set sentinel, so an empty store keeps a stable reference.
 *
 * Not frozen: `Object.freeze` seals own properties, and a `Set`'s contents live
 * in an internal slot, so it neither blocks `add` nor throws. `ReadonlySet` is
 * the only guarantee here, and it is compile-time only.
 */
export const EMPTY_SET: ReadonlySet<string> = new Set<string>();

/** Compare two sets by contents. Two `undefined` inputs count as equal. */
export function setsEqual(a?: ReadonlySet<string>, b?: ReadonlySet<string>): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.size !== b.size) return false;

  for (const value of a) {
    if (!b.has(value)) return false;
  }

  return true;
}
