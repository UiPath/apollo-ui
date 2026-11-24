// Internal: not exported from the package index.

import { createContext, useContext } from 'react';

/** Space-joins the ids that are set, or `undefined` when none is. */
export function joinIds(...ids: (string | false | undefined)[]): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined;
}

/**
 * Prefix put on every DOM id a form derives from a field name. `MetadataForm` gives each instance
 * its own, so two forms over the same schema (a panel and its expanded dialog) do not share ids.
 * Empty outside a form, which keeps a standalone `FieldControl`'s id at `field.name`.
 */
export const FieldIdScopeContext = createContext('');

export interface FieldIds {
  /** The focusable control's id, which the label's `htmlFor` points at. */
  controlId: string;
  labelId: string;
  errorId: string;
}

/** Field-name ids scoped to the enclosing form. */
export function fieldIds(scope: string, name: string): FieldIds {
  const controlId = `${scope}${name}`;
  return { controlId, labelId: `${controlId}-label`, errorId: `${controlId}-error` };
}

export function useFieldIds(name: string): FieldIds {
  return fieldIds(useContext(FieldIdScopeContext), name);
}
