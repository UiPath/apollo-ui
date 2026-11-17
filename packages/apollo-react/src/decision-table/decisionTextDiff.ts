import type {
  SentenceBandColumn,
  SentenceCellId,
  SentenceNameToken,
  SentencePart,
  SentenceRule,
  SentenceToken,
  SentenceValueId,
  SentenceValueToken,
} from './sentenceTypes';

/** A change, in the Business Rules table diff's words. */
export type DiffChange = 'add' | 'update' | 'delete';

/** An added or changed rule of `rules`; a changed one's `movedFrom` is its 1-based number before, when it moved. */
export type DiffRuleChange =
  | { rowId: SentenceRule['rowId']; change: 'add' }
  | { rowId: SentenceRule['rowId']; change: 'update'; movedFrom?: number };

/** A whole cell's change, or one value's; `previous` is its old text, or a condition's words after its column's name when the rule no longer words it; a removed value shows before the value now at its `index`, else after the cell's last. */
export type DiffValueChange = (
  | ({ kind: 'cell' } & SentenceCellId)
  | ({ kind: 'value' } & SentenceValueId)
) &
  ({ change: 'add' } | { change: 'update' | 'delete'; previous: string });

/** A removed rule, shown under the rule `after` names, or first when null. */
export interface DiffRemovedRule {
  rule: SentenceRule;
  after: SentenceRule['rowId'] | null;
}

/** An added or changed input or output. */
export interface DiffColumnChange {
  columnId: SentenceBandColumn['id'];
  change: Exclude<DiffChange, 'delete'>;
}

/** A removed input or output, shown in its band under the column `after` names, or first when null. */
export interface DiffRemovedColumn {
  column: SentenceBandColumn;
  kind: SentenceNameToken['kind'];
  after: SentenceBandColumn['id'] | null;
}

/** What changed between two versions of the table, shown on the after-state `rules`. */
export interface DecisionTextDiff {
  /** `compact` folds runs of unchanged rules; `full` shows every rule. */
  mode: 'compact' | 'full';
  rules?: readonly DiffRuleChange[];
  values?: readonly DiffValueChange[];
  removedRules?: readonly DiffRemovedRule[];
  columns?: readonly DiffColumnChange[];
  removedColumns?: readonly DiffRemovedColumn[];
  hitPolicy?: { before: string; after: string };
}

/** The view's diff strings. */
export interface DiffLabels {
  /** A rule's, column's or value's change as read aloud, e.g. "Added". */
  changeStatus: (change: DiffChange) => string;
  /** A moved rule's old place, e.g. "Moved from rule 2". */
  movedFrom: (number: number) => string;
  /** Read before a changed value's old text, e.g. "was". */
  previousValue: string;
  /** Read before a changed value's new text, e.g. "now". */
  currentValue: string;
  /** A folded run's button, e.g. "12 unchanged rules". */
  unchangedRules: (count: number) => string;
  /** A folded run's hover, e.g. "Show rules 4–15". */
  showRules: (from: number, to: number) => string;
}

/** Unchanged rules kept in view on each side of a change. */
export const DIFF_CONTEXT_RULES = 2;

/** The shortest run of unchanged rules compact mode folds. */
export const DIFF_MIN_FOLDED = 3;

const FOLD_PREFIX = 'fold:';

const REMOVED_PREFIX = 'removed:';

const DUPLICATE_PREFIX = 'duplicate:';

/** A value's struck old text, shown before or after a value token. */
export interface StruckValue {
  text: string;
  change: Exclude<DiffChange, 'add'>;
}

/** How a token shows its change: its own wash, and the old values struck around it. */
export interface TokenDiff {
  change: DiffChange | undefined;
  before: readonly StruckValue[];
  after: readonly StruckValue[];
}

/** A cell the rule's card does not word: a removed one's column name then its old text, or an added one's column name. */
export interface RemovedLine {
  columnId: string;
  change: Extract<DiffChange, 'add' | 'delete'>;
  parts: readonly SentencePart[];
}

/** A removed or added line's React key, unique within its rule. */
export const removedLineKey = ({ columnId, change }: RemovedLine) => `${change}:${columnId}`;

/** A rule card's change, its after-state number (null when removed), its tokens' changes, and the outputs and inputs it does not word. */
export type RuleDiff = {
  tokens: ReadonlyMap<SentenceToken, TokenDiff>;
  removedOutcomes: readonly RemovedLine[];
  removedLines: readonly RemovedLine[];
} & (
  | { change: 'delete'; number: null }
  | { change: 'add' | undefined; number: number }
  | { change: 'update'; number: number; movedFrom: number | undefined }
);

/** A folded run of unchanged rules, by its first rule's id and its first and last numbers. */
export interface DiffFold {
  firstRowId: string;
  count: number;
  from: number;
  to: number;
}

export type DiffRow = { kind: 'rule'; diff: RuleDiff } | { kind: 'fold'; fold: DiffFold };

/** The rules the list shows in diff mode, with what each row shows by row id. */
export interface DiffRows {
  rules: readonly SentenceRule[];
  rows: ReadonlyMap<string, DiffRow>;
}

const NO_VALUES: ReadonlyMap<string, readonly DiffValueChange[]> = new Map();

const NO_TOKENS: RuleDiff['tokens'] = new Map();

/** A kept item, or the removed one at `index` of the removed list. */
export type Placed<K, R> = { kind: 'kept'; item: K } | { kind: 'removed'; item: R; index: number };

const pushTo = <Key, Value>(map: Map<Key, Value[]>, key: Key, value: Value) => {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
};

/** `kept` with each removed item under the kept item its `after` names, else under the first removed item of that id, in the order given; a null, unknown or own `after` puts it first, and a circular run goes before those. */
export const withRemoved = <K, R extends { after: string | null }>(
  kept: readonly K[],
  removed: readonly R[],
  keptId: (item: K) => string,
  removedId: (item: R) => string
): Placed<K, R>[] => {
  const keptIds = new Set(kept.map(keptId));
  const firstRemoved = new Map<string, number>();
  removed.forEach((item, index) => {
    const id = removedId(item);
    if (!firstRemoved.has(id)) firstRemoved.set(id, index);
  });
  const underKept = new Map<string, number[]>();
  const underRemoved = new Map<number, number[]>();
  const first: number[] = [];
  removed.forEach(({ after }, index) => {
    const parent = after === null ? undefined : firstRemoved.get(after);
    if (after !== null && keptIds.has(after)) pushTo(underKept, after, index);
    else if (parent !== undefined && parent !== index) pushTo(underRemoved, parent, index);
    else first.push(index);
  });
  const visited = new Set<number>();
  const walk = (roots: readonly number[], into: Placed<K, R>[]) => {
    const stack = [...roots].reverse();
    for (let index = stack.pop(); index !== undefined; index = stack.pop()) {
      const item = removed[index];
      if (!item || visited.has(index)) continue;
      visited.add(index);
      into.push({ kind: 'removed', item, index });
      const children = underRemoved.get(index) ?? [];
      for (let child = children.length - 1; child >= 0; child -= 1) {
        const next = children[child];
        if (next !== undefined) stack.push(next);
      }
    }
  };
  const placed: Placed<K, R>[] = [];
  walk(first, placed);
  for (const item of kept) {
    placed.push({ kind: 'kept', item });
    const id = keptId(item);
    walk(underKept.get(id) ?? [], placed);
    underKept.delete(id);
  }
  const circular: Placed<K, R>[] = [];
  removed.forEach((_, index) => walk([index], circular));
  return [...circular, ...placed];
};

/** `base`, lengthened until no id in `ids` starts with it. */
const freePrefix = (base: string, ids: readonly string[]) => {
  let prefix = base;
  while (ids.some((id) => id.startsWith(prefix))) prefix = `${prefix}~`;
  return prefix;
};

const valuesByRow = (values: readonly DiffValueChange[]) => {
  const byRow = new Map<string, Map<string, DiffValueChange[]>>();
  for (const value of values) {
    const row = byRow.get(value.rowId) ?? new Map<string, DiffValueChange[]>();
    pushTo(row, value.columnId, value);
    byRow.set(value.rowId, row);
  }
  return byRow;
};

const valueTokens = (rule: SentenceRule): SentenceValueToken[] =>
  [rule.heading, rule.lead, ...rule.lines.map((line) => line.parts)].flatMap((parts) =>
    parts.flatMap((part) => (typeof part !== 'string' && part.kind === 'value' ? [part] : []))
  );

const nameTokenOf = (rule: SentenceRule, columnId: string): SentenceNameToken | undefined =>
  [rule.heading, rule.lead, ...rule.lines.map((line) => line.parts)]
    .flat()
    .find(
      (part): part is SentenceNameToken =>
        typeof part !== 'string' && part.kind !== 'value' && part.columnId === columnId
    );

const struckOf = (value: DiffValueChange): StruckValue[] =>
  value.change === 'add' ? [] : [{ text: value.previous, change: value.change }];

/** Each value token's change by token, and for each changed column the rule no longer shows, a struck outcome for an output or a struck line for an input. */
const tokenDiffsOf = (
  rule: SentenceRule,
  values: ReadonlyMap<string, readonly DiffValueChange[]>,
  nameOf: (columnId: string) => SentenceNameToken
): Pick<RuleDiff, 'tokens' | 'removedOutcomes' | 'removedLines'> => {
  const tokens = valueTokens(rule);
  const diffs = new Map<
    SentenceToken,
    { change: DiffChange | undefined; before: StruckValue[]; after: StruckValue[] }
  >();
  const removedOutcomes: RemovedLine[] = [];
  const removedLines: RemovedLine[] = [];
  const add = (token: SentenceToken, change: Partial<TokenDiff>) => {
    const current = diffs.get(token) ?? { change: undefined, before: [], after: [] };
    current.change = change.change ?? current.change;
    current.before.push(...(change.before ?? []));
    current.after.push(...(change.after ?? []));
    diffs.set(token, current);
  };
  for (const [columnId, changes] of values) {
    const cellTokens = tokens.filter((token) => token.columnId === columnId);
    const [first] = cellTokens;
    const last = cellTokens.at(-1);
    const name = nameTokenOf(rule, columnId);
    if ((!first || !last) && name) {
      for (const value of changes) {
        add(name, {
          change: value.change === 'delete' ? undefined : value.change,
          after: struckOf(value),
        });
      }
      continue;
    }
    if (!first || !last) {
      const column = nameOf(columnId);
      const unworded = column.kind === 'output' ? removedOutcomes : removedLines;
      const texts = changes.flatMap(struckOf);
      if (texts.length > 0) {
        const token: SentenceValueToken = {
          kind: 'value',
          columnId,
          index: 0,
          text: texts.map(({ text }) => text).join(', '),
        };
        unworded.push({ columnId, change: 'delete', parts: [column, ' ', token] });
      }
      if (changes.some((value) => value.change === 'add')) {
        unworded.push({ columnId, change: 'add', parts: [column] });
      }
      continue;
    }
    for (const value of changes) {
      const struck = struckOf(value);
      const own = value.change === 'delete' ? undefined : value.change;
      if (value.kind === 'cell') {
        for (const token of cellTokens) add(token, { change: own });
        add(first, { before: struck });
        continue;
      }
      const token = cellTokens.find((candidate) => candidate.index === value.index);
      if (token) add(token, { change: own, before: struck });
      else add(last, { change: struck.length > 0 ? undefined : own, after: struck });
    }
  }
  return { tokens: diffs, removedOutcomes, removedLines };
};

/** Each rule's change and number, removed rules in place, and in compact mode each long unchanged run folded unless `expanded` holds its first rule. */
export const diffRowsOf = (
  rules: readonly SentenceRule[],
  diff: DecisionTextDiff,
  nameOf: (columnId: string) => SentenceNameToken,
  expanded: ReadonlySet<string>
): DiffRows => {
  const ruleChanges = new Map((diff.rules ?? []).map((change) => [change.rowId, change]));
  const values = valuesByRow(diff.values ?? []);
  const keptIds = rules.map(({ rowId }) => rowId);
  const removedPrefix = freePrefix(REMOVED_PREFIX, keptIds);
  const foldPrefix = freePrefix(FOLD_PREFIX, keptIds);
  const duplicatePrefix = freePrefix(DUPLICATE_PREFIX, keptIds);
  const seenIds = new Set<string>();
  const shownRules = rules.map((rule, index) => {
    if (!seenIds.has(rule.rowId)) {
      seenIds.add(rule.rowId);
      return { rule, rowId: rule.rowId };
    }
    return { rule: { ...rule, rowId: `${duplicatePrefix}${index}` }, rowId: rule.rowId };
  });
  let number = 0;
  const all = withRemoved(
    shownRules,
    diff.removedRules ?? [],
    ({ rowId }) => rowId,
    ({ rule }) => rule.rowId
  ).map((placed) => {
    if (placed.kind === 'removed') {
      const rule = { ...placed.item.rule, rowId: `${removedPrefix}${placed.index}` };
      const ruleDiff: RuleDiff = {
        change: 'delete',
        number: null,
        tokens: NO_TOKENS,
        removedOutcomes: [],
        removedLines: [],
      };
      return { rule, diff: ruleDiff };
    }
    const { rule, rowId } = placed.item;
    const ruleChange = ruleChanges.get(rowId);
    const rowValues = values.get(rowId) ?? NO_VALUES;
    number += 1;
    const shown =
      rowValues.size > 0
        ? tokenDiffsOf(rule, rowValues, nameOf)
        : { tokens: NO_TOKENS, removedOutcomes: [], removedLines: [] };
    const ruleDiff: RuleDiff =
      ruleChange?.change === 'update' || (!ruleChange && rowValues.size > 0)
        ? { ...shown, change: 'update', number, movedFrom: ruleChange?.movedFrom }
        : { ...shown, change: ruleChange?.change, number };
    return { rule, diff: ruleDiff };
  });
  const rows = new Map<string, DiffRow>();
  const shown: SentenceRule[] = [];
  const show = ({ rule, diff: ruleDiff }: (typeof all)[number]) => {
    rows.set(rule.rowId, { kind: 'rule', diff: ruleDiff });
    shown.push(rule);
  };
  if (diff.mode === 'full') {
    all.forEach(show);
    return { rules: shown, rows };
  }
  const nearChange = all.map(() => false);
  all.forEach(({ diff: ruleDiff }, at) => {
    if (!ruleDiff.change) return;
    const to = Math.min(all.length - 1, at + DIFF_CONTEXT_RULES);
    for (let index = Math.max(0, at - DIFF_CONTEXT_RULES); index <= to; index += 1) {
      nearChange[index] = true;
    }
  });
  const near = (index: number) => nearChange[index] === true;
  let index = 0;
  while (index < all.length) {
    let end = index;
    while (end < all.length && !near(end)) end += 1;
    const run = all.slice(index, end);
    const [first] = run;
    if (first && run.length >= DIFF_MIN_FOLDED && !expanded.has(first.rule.rowId)) {
      const rowId = `${foldPrefix}${first.rule.rowId}`;
      rows.set(rowId, {
        kind: 'fold',
        fold: {
          firstRowId: first.rule.rowId,
          count: run.length,
          from: first.diff.number ?? 0,
          to: run.at(-1)?.diff.number ?? 0,
        },
      });
      shown.push({ rowId, heading: [], lead: [], lines: [] });
    } else {
      run.forEach(show);
    }
    const item = all[end];
    if (item) show(item);
    index = end + 1;
  }
  return { rules: shown, rows };
};

/** The inputs and outputs with the removed ones in place, and each column's change by id. */
export const diffColumnsOf = (
  inputs: readonly SentenceBandColumn[],
  outputs: readonly SentenceBandColumn[],
  diff: DecisionTextDiff
) => {
  const changes = new Map<string, DiffChange>(
    (diff.columns ?? []).map(({ columnId, change }) => [columnId, change])
  );
  const bandOf = (columns: readonly SentenceBandColumn[], kind: DiffRemovedColumn['kind']) =>
    withRemoved(
      columns,
      (diff.removedColumns ?? []).filter((removed) => removed.kind === kind),
      (column) => column.id,
      ({ column }) => column.id
    ).map((placed) => {
      if (placed.kind === 'kept') return placed.item;
      changes.set(placed.item.column.id, 'delete');
      return placed.item.column;
    });
  return { inputs: bandOf(inputs, 'input'), outputs: bandOf(outputs, 'output'), changes };
};
