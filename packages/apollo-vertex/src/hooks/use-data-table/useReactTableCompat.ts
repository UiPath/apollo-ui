"use client";

import { type Table, useReactTable } from "@tanstack/react-table";

/**
 * React Compiler compatibility wrapper for useReactTable.
 *
 * useReactTable returns a mutable object with a stable reference. The React
 * Compiler caches values by reference, so child components that receive the
 * table instance never see a "change" and skip re-renders. Spreading into a
 * new object on every render gives children a fresh reference while keeping
 * all methods intact (they are closures, not prototype methods).
 *
 * @see https://github.com/facebook/react/pull/31820
 */
export function useReactTableCompat<TData>(
  options: Parameters<typeof useReactTable<TData>>[0],
): Table<TData> {
  // eslint-disable-next-line no-warning-comments
  // TODO: Remove after upgrading to @tanstack/react-table v9 (React Compiler compatible)
  // codeql[js/unknown-directive] - valid React Compiler directive
  "use no memo";
  return { ...useReactTable(options) } as Table<TData>;
}
