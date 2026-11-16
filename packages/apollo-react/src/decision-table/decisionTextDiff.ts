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

/** An added or changed rule of `rules`; `movedFrom` is its 1-based number before, when it moved. */
export interface DiffRuleChange {
  rowId: SentenceRule['rowId'];
  change: Exclude<DiffChange, 'delete'>;
  movedFrom?: number;
}

/** A value's change, or its cell's without `index`; `previous` is its old text, or a condition's words after its column's name when the rule no longer words it; a removed value shows before the value now at its `index`, else after the cell's last. */
export type DiffValueChange = SentenceCellId &
  Partial<Pick<SentenceValueId, 'index'>> &
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

/** A condition line the rule's card does not word: a removed one's column name then its old text, or an added one's column name. */
export interface RemovedLine {
  columnId: string;
  change: Extract<DiffChange, 'add' | 'delete'>;
  parts: readonly SentencePart[];
}

/** A rule card's change, its after-state number (null when removed), its tokens' changes and its removed conditions. */
export interface RuleDiff {
  change: DiffChange | undefined;
  movedFrom: number | undefined;
  number: number | null;
  tokens: ReadonlyMap<SentenceToken, TokenDiff>;
  removedLines: readonly RemovedLine[];
}

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

/** `kept` with each removed item under the item its `after` names, in the order given; an unknown or circular `after` puts it first. */
export const withRemoved = <T>(
  kept: readonly T[],
  removed: readonly { item: T; after: string | null }[],
  idOf: (item: T) => string
): { item: T; removed: boolean }[] => {
  const ids = new Set([...kept, ...removed.map(({ item }) => item)].map(idOf));
  const followers = new Map<string | null, T[]>();
  for (const { item, after } of removed) {
    const key = after !== null && ids.has(after) && after !== idOf(item) ? after : null;
    followers.set(key, [...(followers.get(key) ?? []), item]);
  }
  const placed: { item: T; removed: boolean }[] = [];
  const seen = new Set<T>();
  const emitFollowers = (key: string | null) => {
    const stack: T[] = [];
    const push = (from: string | null) => {
      for (const follower of [...(followers.get(from) ?? [])].reverse()) stack.push(follower);
    };
    push(key);
    for (let item = stack.pop(); item !== undefined; item = stack.pop()) {
      if (seen.has(item)) continue;
      seen.add(item);
      placed.push({ item, removed: true });
      push(idOf(item));
    }
  };
  emitFollowers(null);
  for (const item of kept) {
    placed.push({ item, removed: false });
    emitFollowers(idOf(item));
  }
  const unplaced = removed.filter(({ item }) => !seen.has(item));
  return [...unplaced.map(({ item }) => ({ item, removed: true })), ...placed];
};

const valuesByRow = (values: readonly DiffValueChange[]) => {
  const byRow = new Map<string, Map<string, DiffValueChange[]>>();
  for (const value of values) {
    const row = byRow.get(value.rowId) ?? new Map<string, DiffValueChange[]>();
    row.set(value.columnId, [...(row.get(value.columnId) ?? []), value]);
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

/** Each value token's change by token, and a struck line for each changed column the rule no longer shows. */
const tokenDiffsOf = (
  rule: SentenceRule,
  values: ReadonlyMap<string, readonly DiffValueChange[]>,
  nameOf: (columnId: string) => SentenceNameToken
): Pick<RuleDiff, 'tokens' | 'removedLines'> => {
  const tokens = valueTokens(rule);
  const diffs = new Map<SentenceToken, TokenDiff>();
  const removedLines: RemovedLine[] = [];
  const add = (token: SentenceToken, change: Partial<TokenDiff>) => {
    const current = diffs.get(token) ?? { change: undefined, before: [], after: [] };
    diffs.set(token, {
      change: change.change ?? current.change,
      before: [...current.before, ...(change.before ?? [])],
      after: [...current.after, ...(change.after ?? [])],
    });
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
      const texts = changes.flatMap(struckOf);
      if (texts.length > 0) {
        const token: SentenceValueToken = {
          kind: 'value',
          columnId,
          index: 0,
          text: texts.map(({ text }) => text).join(', '),
        };
        removedLines.push({ columnId, change: 'delete', parts: [nameOf(columnId), ' ', token] });
      }
      if (changes.some((value) => value.change === 'add')) {
        removedLines.push({ columnId, change: 'add', parts: [nameOf(columnId)] });
      }
      continue;
    }
    for (const value of changes) {
      const struck = struckOf(value);
      const own = value.change === 'delete' ? undefined : value.change;
      if (value.index === undefined) {
        for (const token of cellTokens) add(token, { change: own });
        add(first, { before: struck });
        continue;
      }
      const token = cellTokens.find((candidate) => candidate.index === value.index);
      if (token) add(token, { change: own, before: struck });
      else add(last, { change: struck.length > 0 ? undefined : own, after: struck });
    }
  }
  return { tokens: diffs, removedLines };
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
  const placed = withRemoved(
    rules,
    (diff.removedRules ?? []).map(({ rule, after }) => ({ item: rule, after })),
    (rule) => rule.rowId
  );
  let number = 0;
  const keptIds = new Set(rules.map(({ rowId }) => rowId));
  const shownIds = new Set<string>();
  const all = placed.map(({ item, removed }) => {
    let rowId = item.rowId;
    while (shownIds.has(rowId) || (removed && keptIds.has(rowId)))
      rowId = `${REMOVED_PREFIX}${rowId}`;
    shownIds.add(rowId);
    const rule = rowId === item.rowId ? item : { ...item, rowId };
    const ruleChange = removed ? undefined : ruleChanges.get(item.rowId);
    const rowValues = values.get(rowId) ?? NO_VALUES;
    const change: DiffChange | undefined = removed
      ? 'delete'
      : (ruleChange?.change ?? (rowValues.size > 0 ? 'update' : undefined));
    if (!removed) number += 1;
    const { tokens, removedLines } =
      rowValues.size > 0
        ? tokenDiffsOf(rule, rowValues, nameOf)
        : { tokens: NO_TOKENS, removedLines: [] };
    const ruleDiff: RuleDiff = {
      change,
      movedFrom: ruleChange?.movedFrom,
      number: removed ? null : number,
      tokens,
      removedLines,
    };
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
      let rowId = `${FOLD_PREFIX}${first.rule.rowId}`;
      while (shownIds.has(rowId)) rowId = `${FOLD_PREFIX}${rowId}`;
      shownIds.add(rowId);
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
      (diff.removedColumns ?? [])
        .filter((removed) => removed.kind === kind)
        .map(({ column, after }) => ({ item: column, after })),
      (column) => column.id
    ).map(({ item, removed }) => {
      if (removed) changes.set(item.id, 'delete');
      return item;
    });
  return { inputs: bandOf(inputs, 'input'), outputs: bandOf(outputs, 'output'), changes };
};
