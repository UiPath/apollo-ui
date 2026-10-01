import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { cn } from '@/lib';

/**
 * Every user-facing string the Json tree view renders. apollo-wind ships no
 * message catalogs, so hosts that localize pass translated strings through the
 * `strings` prop (or `JsonTreeViewProvider`); anything omitted falls back to
 * `DEFAULT_JSON_TREE_VIEW_STRINGS`.
 */
export interface JsonTreeViewStrings {
  // Tree
  /** Label for the synthesized array-item preview row. */
  arrayItem: string;
  emptySearch: string;
  emptyDefault: string;
  // Row
  expandKey: (key: string) => string;
  collapseKey: (key: string) => string;
  itemCount: (count: number) => string;
  keyCount: (count: number) => string;
  /** Screen-reader text for the required-field marker. */
  requiredMarker: string;
  pathCopied: string;
  copyPathHint: string;
  copyPathFor: (path: string) => string;
  // Row actions
  wrapValue: string;
  unwrapValue: string;
  wrapValueOf: (key: string) => string;
  unwrapValueOf: (key: string) => string;
  editAsJson: string;
  editKeyAsJson: (key: string) => string;
  copyValue: string;
  copyValueOf: (key: string) => string;
  moreActions: string;
  // Values and editors
  unsetValue: string;
  editValueOf: (key: string) => string;
  editJsonOf: (key: string) => string;
  editHint: string;
  toggleHint: string;
  unsetEditHint: string;
  enterNumber: string;
  enterValue: string;
  invalidJson: string;
  apply: string;
  cancel: string;
  // Toolbar
  searchFields: string;
  searchFieldsAction: string;
  clearSearch: string;
  filter: string;
  filterActive: (label: string) => string;
  filterAll: string;
  expandAll: string;
  collapseAll: string;
}

export const DEFAULT_JSON_TREE_VIEW_STRINGS: JsonTreeViewStrings = {
  arrayItem: 'item',
  emptySearch: 'No fields match your search.',
  emptyDefault: 'No fields to display.',
  expandKey: (key) => `Expand ${key}`,
  collapseKey: (key) => `Collapse ${key}`,
  itemCount: (count) => (count === 1 ? '1 item' : `${count} items`),
  keyCount: (count) => (count === 1 ? '1 key' : `${count} keys`),
  requiredMarker: 'required',
  pathCopied: 'Path copied',
  copyPathHint: 'Click to copy this path',
  copyPathFor: (path) => `Copy path for ${path}`,
  wrapValue: 'Wrap value',
  unwrapValue: 'Unwrap value',
  wrapValueOf: (key) => `Wrap value of ${key}`,
  unwrapValueOf: (key) => `Unwrap value of ${key}`,
  editAsJson: 'Edit as JSON',
  editKeyAsJson: (key) => `Edit ${key} as JSON`,
  copyValue: 'Copy value',
  copyValueOf: (key) => `Copy value of ${key}`,
  moreActions: 'More actions',
  unsetValue: 'unset',
  editValueOf: (key) => `Edit value of ${key}`,
  editJsonOf: (key) => `Edit JSON of ${key}`,
  editHint: 'Click to edit',
  toggleHint: 'Click to toggle',
  unsetEditHint: 'Click to set a value',
  enterNumber: 'Enter a number',
  enterValue: 'Enter a value',
  invalidJson: 'Invalid JSON',
  apply: 'Apply',
  cancel: 'Cancel',
  searchFields: 'Search fields and values...',
  searchFieldsAction: 'Search fields and values',
  clearSearch: 'Clear search',
  filter: 'Filter',
  filterActive: (label) => `Filter: ${label}`,
  filterAll: 'All',
  expandAll: 'Expand all',
  collapseAll: 'Collapse all',
};

interface JsonTreeViewSettings {
  strings: JsonTreeViewStrings;
  tooltipContentClassName?: string;
}

const JsonTreeViewSettingsContext = createContext<JsonTreeViewSettings>({
  strings: DEFAULT_JSON_TREE_VIEW_STRINGS,
});

/** Overrides win key by key; an `undefined` override keeps the inherited string. */
function mergeStrings(
  base: JsonTreeViewStrings,
  overrides: Partial<JsonTreeViewStrings>
): JsonTreeViewStrings {
  const merged = { ...base };
  for (const key of Object.keys(overrides) as (keyof JsonTreeViewStrings)[]) {
    const value = overrides[key];
    if (value !== undefined) (merged as Record<string, unknown>)[key] = value;
  }
  return merged;
}

export interface JsonTreeViewProviderProps {
  /** Overrides merged over any outer provider's strings, then the English defaults. */
  strings?: Partial<JsonTreeViewStrings>;
  /** Extra classes for every tooltip panel, added to any outer provider's. */
  tooltipContentClassName?: string;
  children: ReactNode;
}

/**
 * Supplies strings and tooltip styling to every Json tree view part below it,
 * including the toolbar and editors when they are rendered on their own.
 */
export function JsonTreeViewProvider({
  strings,
  tooltipContentClassName,
  children,
}: JsonTreeViewProviderProps) {
  const outer = useContext(JsonTreeViewSettingsContext);
  const value = useMemo(
    () => ({
      strings: strings ? mergeStrings(outer.strings, strings) : outer.strings,
      // Added to, not replacing, an outer provider's classes (e.g. a host's z-index).
      tooltipContentClassName:
        cn(outer.tooltipContentClassName, tooltipContentClassName) || undefined,
    }),
    [outer, strings, tooltipContentClassName]
  );
  return (
    <JsonTreeViewSettingsContext.Provider value={value}>
      {children}
    </JsonTreeViewSettingsContext.Provider>
  );
}

export function useJsonTreeViewStrings(): JsonTreeViewStrings {
  return useContext(JsonTreeViewSettingsContext).strings;
}

export function useJsonTreeViewTooltipClassName(): string | undefined {
  return useContext(JsonTreeViewSettingsContext).tooltipContentClassName;
}
