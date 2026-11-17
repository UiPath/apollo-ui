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

/** Where `query` sits in `text`, for highlighting and filtering alike; null when it does not. */
export const matchRange = (text: string, query: string): { start: number; end: number } | null => {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  let folded = '';
  const startOf: number[] = [];
  const endOf: number[] = [];
  let offset = 0;
  for (const char of text) {
    const lower = char.toLowerCase();
    for (let i = 0; i < lower.length; i++) {
      startOf.push(offset);
      endOf.push(offset + char.length);
    }
    folded += lower;
    offset += char.length;
  }
  const at = folded.indexOf(needle);
  if (at < 0) return null;
  const start = startOf[at];
  const end = endOf[at + needle.length - 1];
  return start === undefined || end === undefined ? null : { start, end };
};

/** The rows in reading order narrowed to `query`: a match keeps the decisions above it, and a decision that matches keeps its rules. */
export const minimapRows = (items: readonly MinimapItem[], query: string): MinimapRow[] => {
  const needle = query.trim();
  let next = 0;
  const visit = (item: MinimapItem, depth: number, parentMatched: boolean): MinimapRow[] => {
    const key = next++;
    const match = needle !== '' && matchRange(item.label, needle) !== null;
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
