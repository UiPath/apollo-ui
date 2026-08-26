/** A plain, non-selectable row: a label and an optional count. */
export interface RailRow {
  label: string;
  count?: number;
}

/** A selectable row. Its id is the value the rail reports back on change. */
export interface RailNavItem<T extends string> extends RailRow {
  id: T;
}

/**
 * Discriminated on `interactive` so only selectable sections carry ids typed as
 * the rail's value. That keeps a static section (the AP tab's "Status" list,
 * whose rows are not filters) from widening the onChange type and forcing a
 * cast at the call site.
 */
export type RailSection<T extends string = string> =
  | { heading: string; interactive: true; items: RailNavItem<T>[] }
  | { heading: string; interactive?: false; items: RailRow[] };
