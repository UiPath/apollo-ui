/** A decision's rule count as its row shows it and says it. */
export interface MinimapCount {
  /** Trailing text after the label. */
  meta: string;
  ariaLabel: string;
}

/** One row of the minimap: a decision holding rules and further decisions, a rule, or a link to a decision listed elsewhere. */
export type MinimapItem =
  | {
      kind: 'decision';
      decisionId: string;
      label: string;
      /** Null when the decision's rules are not counted. */
      count: MinimapCount | null;
      children: readonly MinimapItem[];
    }
  | { kind: 'rule'; decisionId: string; rowId: string; label: string }
  | {
      kind: 'reference';
      referenceId: string;
      label: string;
      ariaLabel: string;
      /** Where picking it goes. */
      targetId: string;
    };

/** A row as the list draws it, in reading order. */
export interface MinimapRow {
  item: MinimapItem;
  /** Its place in the whole outline, unique among the rows and kept while the query changes. */
  key: number;
  /** How many decisions it hangs under. */
  depth: number;
  /** The row matched the query itself, rather than being kept for a match beneath it. */
  match: boolean;
}

/** Whether `item` is the decision the reader is on. */
export const isCurrent = (item: MinimapItem, currentDecisionId: string | null): boolean =>
  item.kind === 'decision' && item.decisionId === currentDecisionId;

const includes = (text: string, needle: string): boolean => text.toLowerCase().includes(needle);

/** The rows in reading order narrowed to `query`: a match keeps the decisions above it, and a decision that matches keeps its rules. */
export const minimapRows = (items: readonly MinimapItem[], query: string): MinimapRow[] => {
  const needle = query.trim().toLowerCase();
  let next = 0;
  const visit = (item: MinimapItem, depth: number, parentMatched: boolean): MinimapRow[] => {
    const key = next++;
    const match = needle !== '' && includes(item.label, needle);
    if (item.kind !== 'decision') {
      return needle === '' || match || (parentMatched && item.kind === 'rule')
        ? [{ item, key, depth, match }]
        : [];
    }
    const below = item.children.flatMap((child) => visit(child, depth + 1, match));
    if (needle !== '' && !match && below.length === 0) return [];
    return [{ item, key, depth, match }, ...below];
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
