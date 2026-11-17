import type { DecisionTextDiff, DiffRuleChange, DiffValueChange } from '../decisionTextDiff';
import type { SentenceRule } from '../sentenceTypes';
import { EDITABLE_TABLE, type EditableTable, wordedRules } from './editableSentences.fixtures';
import type {
  FixturePick,
  FixturePolicy,
  FixtureTotal,
  SentenceColumns,
} from './sentences.fixtures';

type TableRule = EditableTable['rules'][number];

const ageRule = (rowId: string, from: number, risk: string): TableRule => ({
  rowId,
  outcomes: { risk },
  conditions: [
    { inputId: 'age', operator: 'is between', values: [`${from}`, `${from + 4}`], joiner: ' and ' },
  ],
});

/** The table after the change: twenty-four rules over age, income, channel and the new region. */
export const DIFF_TABLE: EditableTable = {
  ...EDITABLE_TABLE,
  inputs: [...EDITABLE_TABLE.inputs, { id: 'region', name: 'region' }],
  rules: [
    ...[0, 1, 2, 3, 4, 5].map((index) => ageRule(`a${index + 1}`, index * 3, '"high"')),
    ageRule('r1', 18, '"high"'),
    ageRule('r2', 23, '"high"'),
    {
      rowId: 'r3',
      outcomes: { risk: '"review"' },
      conditions: [
        { inputId: 'region', operator: 'is', values: ['"EU"'], joiner: ', ' },
        { inputId: 'income', operator: 'is at most', values: ['20000'], joiner: ', ' },
      ],
    },
    ageRule('r4', 28, '"standard"'),
    {
      rowId: 'r5',
      outcomes: { risk: '"review"' },
      conditions: [
        { inputId: 'age', operator: 'is less than', values: ['30'], joiner: ', ' },
        { inputId: 'channel', operator: 'is one of', values: ['"web"', '"branch"'], joiner: ', ' },
      ],
    },
    ageRule('r6', 33, '"standard"'),
    ageRule('r7', 38, '"standard"'),
    ageRule('r8', 43, '"standard"'),
    ageRule('r9', 48, '"standard"'),
    ageRule('r10', 53, '"standard"'),
    {
      rowId: 'r11',
      outcomes: { risk: '"standard"' },
      conditions: [
        { inputId: 'age', operator: 'is greater than', values: ['58'], joiner: ', ' },
        { inputId: 'channel', operator: 'is', values: ['"app"'], joiner: ', ' },
      ],
    },
    ageRule('r12', 63, '"review"'),
    ...[0, 1, 2, 3, 4, 5].map((index) => ageRule(`r${index + 13}`, 75 + index * 5, '"review"')),
  ],
};

export const DIFF_RULES: SentenceRule[] = wordedRules(DIFF_TABLE);

export const DIFF_COLUMNS: SentenceColumns = {
  inputs: DIFF_TABLE.inputs,
  outputs: DIFF_TABLE.outputs,
};

export const DIFF_POLICY: FixturePick = { kind: 'policy', policy: 'unique' };

/** A diff in the fixtures' hit policies. */
export type FixtureDiff = DecisionTextDiff<FixturePolicy, FixtureTotal>;

/** The old table's rule for ages 70 to 74, which the change removed. */
const REMOVED_RULE: SentenceRule = {
  rowId: 'x1',
  heading: [
    { kind: 'output', columnId: 'risk', text: 'risk' },
    ' is ',
    { kind: 'value', columnId: 'risk', index: 0, text: '"review"' },
  ],
  lead: [
    'when ',
    { kind: 'input', columnId: 'age', text: 'age' },
    ' is between ',
    { kind: 'value', columnId: 'age', index: 0, text: '70' },
    ' and ',
    { kind: 'value', columnId: 'age', index: 1, text: '74' },
  ],
  lines: [],
};

/** Every state at once: rules added, changed, removed and moved, values added, changed and removed, columns added, changed and removed, and the hit policy. */
export const EVERY_STATE_DIFF: Omit<FixtureDiff, 'mode'> = {
  rules: [
    { rowId: 'r3', change: 'add' },
    { rowId: 'r5', change: 'update' },
    { rowId: 'r9', change: 'update', movedFrom: 13 },
    { rowId: 'r11', change: 'update' },
  ],
  values: [
    { kind: 'value', rowId: 'r5', columnId: 'age', index: 0, change: 'update', previous: '25' },
    {
      kind: 'value',
      rowId: 'r5',
      columnId: 'channel',
      index: 1,
      change: 'update',
      previous: '"app"',
    },
    {
      kind: 'value',
      rowId: 'r5',
      columnId: 'channel',
      index: 2,
      change: 'delete',
      previous: '"kiosk"',
    },
    {
      kind: 'cell',
      rowId: 'r5',
      columnId: 'income',
      change: 'delete',
      previous: 'is greater than 40000',
    },
    { kind: 'cell', rowId: 'r5', columnId: 'risk', change: 'update', previous: '"standard"' },
    { kind: 'cell', rowId: 'r11', columnId: 'channel', change: 'add' },
  ],
  removedRules: [{ rule: REMOVED_RULE, after: 'r12' }],
  columns: [
    { columnId: 'region', change: 'add' },
    { columnId: 'channel', change: 'update' },
  ],
  removedColumns: [
    { column: { id: 'segment', name: 'segment', type: 'text' }, kind: 'input', after: 'income' },
  ],
  hitPolicy: { before: { kind: 'policy', policy: 'first' }, after: DIFF_POLICY },
};

/** Every rule changed or new, and the old table's first rule removed. */
export const EVERYTHING_CHANGED_DIFF: Omit<FixtureDiff, 'mode'> = {
  rules: DIFF_RULES.map(
    ({ rowId }, index): DiffRuleChange => ({
      rowId,
      change: index % 3 === 0 ? 'add' : 'update',
    })
  ),
  values: DIFF_RULES.flatMap(({ rowId }, index): DiffValueChange[] =>
    index % 3 === 0
      ? []
      : [{ kind: 'cell', rowId, columnId: 'risk', change: 'update', previous: '"low"' }]
  ),
  removedRules: [{ rule: REMOVED_RULE, after: null }],
};

/** A removed input, shown struck in its band where it stood. */
export const REMOVED_COLUMN_DIFF: Omit<FixtureDiff, 'mode'> = {
  removedColumns: EVERY_STATE_DIFF.removedColumns,
  values: [
    { kind: 'cell', rowId: 'r4', columnId: 'segment', change: 'delete', previous: 'is "retail"' },
  ],
};

/** Only the hit policy changed. */
export const HIT_POLICY_DIFF: Omit<FixtureDiff, 'mode'> = {
  hitPolicy: { before: { kind: 'policy', policy: 'first' }, after: DIFF_POLICY },
};

/** `count` rules cycling through the age rules, with five of them changed. */
export const largeDiffTable = (
  count: number
): { rules: SentenceRule[]; diff: Omit<FixtureDiff, 'mode'> } => {
  const rules = wordedRules({
    ...DIFF_TABLE,
    rules: Array.from({ length: count }, (_, index) =>
      ageRule(`row-${index + 1}`, 18 + (index % 50), index % 2 === 0 ? '"standard"' : '"high"')
    ),
  });
  const changed = [
    Math.floor(count * 0.1),
    Math.floor(count * 0.35),
    Math.floor(count * 0.6),
    Math.floor(count * 0.61),
    Math.floor(count * 0.9),
  ];
  return {
    rules,
    diff: {
      rules: changed.map(
        (index): DiffRuleChange => ({ rowId: `row-${index + 1}`, change: 'update' })
      ),
      values: changed.map(
        (index): DiffValueChange => ({
          kind: 'cell',
          rowId: `row-${index + 1}`,
          columnId: 'risk',
          change: 'update',
          previous: '"review"',
        })
      ),
    },
  };
};
