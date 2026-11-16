/** One row of the minimap: a decision holding rules and further decisions, a rule, or a link to a decision listed elsewhere. */
export interface MinimapItem {
  id: string;
  kind: 'decision' | 'rule' | 'reference';
  /** What the search matches and the row shows. */
  label: string;
  /** Trailing text after the label, such as a decision's rule count. */
  meta?: string;
  /** The row's accessible name, when it says more than `label`. */
  ariaLabel?: string;
  /** A reference's decision, where picking it goes. */
  targetId?: string;
  children?: readonly MinimapItem[];
}

/** A row as the list draws it, in reading order. */
export interface MinimapRow {
  item: MinimapItem;
  /** How many decisions it hangs under. */
  depth: number;
  /** The row matched the query itself, rather than being kept for a match beneath it. */
  match: boolean;
}

const includes = (text: string, needle: string): boolean => text.toLowerCase().includes(needle);

/** The rows in reading order narrowed to `query`: a match keeps the decisions above it, and a decision that matches keeps its rules. */
export const minimapRows = (items: readonly MinimapItem[], query: string): MinimapRow[] => {
  const needle = query.trim().toLowerCase();
  const visit = (item: MinimapItem, depth: number, parentMatched: boolean): MinimapRow[] => {
    const match = needle !== '' && includes(item.label, needle);
    if (item.kind !== 'decision') {
      return needle === '' || match || (parentMatched && item.kind === 'rule')
        ? [{ item, depth, match }]
        : [];
    }
    const below = (item.children ?? []).flatMap((child) => visit(child, depth + 1, match));
    if (needle !== '' && !match && below.length === 0) return [];
    return [{ item, depth, match }, ...below];
  };
  return items.flatMap((item) => visit(item, 0, false));
};

/** Where `query` sits in `text`, for highlighting; null when it does not. */
export const matchRange = (text: string, query: string): { start: number; end: number } | null => {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  const start = text.toLowerCase().indexOf(needle);
  return start < 0 ? null : { start, end: start + needle.length };
};
