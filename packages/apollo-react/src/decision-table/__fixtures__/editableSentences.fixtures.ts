import type {
  SentenceBand,
  SentenceCellId,
  SentenceLine,
  SentenceNameToken,
  SentencePart,
  SentenceRule,
  SentenceValueId,
} from '../sentenceTypes';
import type { RangeEnds, ValueCommit } from '../ValuePopover';

/** A column of the story table, and the decision that produces it when another one does. */
type EditableColumn = Pick<SentenceBand['columns'][number], 'id' | 'name'> &
  Pick<SentenceNameToken, 'decisionId'>;

/** One condition of a rule: its input, its operator words, its values, what joins them, and a range's ends. */
interface EditableCondition {
  inputId: string;
  operator: string;
  values: string[];
  joiner: string;
  ends?: RangeEnds;
}

/** One rule of the story table: its outcome per output and its conditions. */
interface EditableRule {
  rowId: string;
  outcomes: Readonly<Record<string, string>>;
  conditions: EditableCondition[];
}

/** A small decision table a story host edits and words back into sentences. */
export interface EditableTable {
  inputs: EditableColumn[];
  outputs: EditableColumn[];
  rules: EditableRule[];
  nextId: number;
}

const nameToken = (kind: SentenceNameToken['kind'], column: EditableColumn): SentenceNameToken => ({
  kind,
  columnId: column.id,
  text: column.name,
  decisionId: column.decisionId,
});

const conditionParts = (input: EditableColumn, condition: EditableCondition): SentencePart[] => [
  nameToken('input', input),
  ` ${condition.operator} `,
  ...condition.values.flatMap((text, index): SentencePart[] => [
    ...(index === 0 ? [] : [condition.joiner]),
    { kind: 'value', columnId: input.id, index, text },
  ]),
];

/** The rule's conditions in input order, each with its input. */
const orderedConditions = (table: EditableTable, rule: EditableRule) =>
  table.inputs.flatMap((input) => {
    const condition = rule.conditions.find((candidate) => candidate.inputId === input.id);
    return condition ? [{ input, condition }] : [];
  });

/** The table's rules, worded: up to two conditions in the lead, more as lines. */
export const wordedRules = (table: EditableTable): SentenceRule[] =>
  table.rules.map((rule) => {
    const conditions = orderedConditions(table, rule);
    const heading = table.outputs.flatMap((output, index): SentencePart[] => [
      ...(index === 0 ? [] : [' · ']),
      nameToken('output', output),
      ' is ',
      { kind: 'value', columnId: output.id, index: 0, text: rule.outcomes[output.id] ?? '' },
    ]);
    if (conditions.length === 0) {
      return { rowId: rule.rowId, heading, lead: ['in every case'], lines: [] };
    }
    if (conditions.length <= 2) {
      const lead = conditions.flatMap(({ input, condition }, index): SentencePart[] => [
        index === 0 ? 'when ' : ' and ',
        ...conditionParts(input, condition),
      ]);
      return { rowId: rule.rowId, heading, lead, lines: [] };
    }
    const lines = conditions.map(
      ({ input, condition }): SentenceLine => ({
        columnId: input.id,
        parts: conditionParts(input, condition),
      })
    );
    return { rowId: rule.rowId, heading, lead: ['when all of these are true:'], lines };
  });

/** The table's inputs and outputs as bands. */
export const tableBands = (table: EditableTable): SentenceBand[] => [
  { id: 'inputs', label: 'Inputs', columns: table.inputs },
  { id: 'outputs', label: 'Outputs', columns: table.outputs },
];

/** Whether a column of the table is one of its outputs. */
export const isOutput = (table: EditableTable, columnId: string): boolean =>
  table.outputs.some((output) => output.id === columnId);

const mapRule = (
  table: EditableTable,
  rowId: string,
  change: (rule: EditableRule) => EditableRule
): EditableTable => ({
  ...table,
  rules: table.rules.map((rule) => (rule.rowId === rowId ? change(rule) : rule)),
});

/** The table with one value written: an outcome, a condition's value, or a new `is` condition. */
export const tableWithValue = (
  table: EditableTable,
  target: SentenceValueId,
  text: string
): EditableTable =>
  mapRule(table, target.rowId, (rule) => {
    if (isOutput(table, target.columnId)) {
      return { ...rule, outcomes: { ...rule.outcomes, [target.columnId]: text } };
    }
    const existing = rule.conditions.find((condition) => condition.inputId === target.columnId);
    if (!existing) {
      return text === ''
        ? rule
        : {
            ...rule,
            conditions: [
              ...rule.conditions,
              { inputId: target.columnId, operator: 'is', values: [text], joiner: ', ' },
            ],
          };
    }
    const values = existing.values.map((value, index) => (index === target.index ? text : value));
    return {
      ...rule,
      conditions: rule.conditions.map((condition) =>
        condition === existing ? { ...condition, values } : condition
      ),
    };
  });

/** The table with a condition's committed values, operator and range ends written, the condition added when the rule has none. */
export const tableWithCondition = (
  table: EditableTable,
  target: SentenceValueId,
  { values, operator, ends }: ValueCommit
): EditableTable =>
  mapRule(table, target.rowId, (rule) => {
    const written: EditableCondition = {
      inputId: target.columnId,
      operator: operator ?? 'is',
      values: [...values],
      joiner: ends ? ' and ' : ', ',
      ends,
    };
    const held = rule.conditions.some((condition) => condition.inputId === target.columnId);
    return {
      ...rule,
      conditions: held
        ? rule.conditions.map((condition) =>
            condition.inputId === target.columnId ? written : condition
          )
        : [...rule.conditions, written],
    };
  });

/** The table with one value written as an expression: an outcome as is, a condition as `matches` it. */
export const tableWithExpression = (
  table: EditableTable,
  target: SentenceValueId,
  text: string
): EditableTable =>
  isOutput(table, target.columnId)
    ? tableWithValue(table, target, text)
    : mapRule(table, target.rowId, (rule) => ({
        ...rule,
        conditions: [
          ...rule.conditions.filter((condition) => condition.inputId !== target.columnId),
          { inputId: target.columnId, operator: 'matches', values: [text], joiner: ', ' },
        ],
      }));

/** The table with one cell cleared: an outcome emptied, or a condition removed. */
export const tableWithoutCell = (table: EditableTable, cell: SentenceCellId): EditableTable =>
  mapRule(table, cell.rowId, (rule) =>
    isOutput(table, cell.columnId)
      ? { ...rule, outcomes: { ...rule.outcomes, [cell.columnId]: '' } }
      : {
          ...rule,
          conditions: rule.conditions.filter((condition) => condition.inputId !== cell.columnId),
        }
  );

/** The inputs a rule has no condition for. */
export const unusedInputs = (table: EditableTable, rowId: string): EditableColumn[] => {
  const rule = table.rules.find((candidate) => candidate.rowId === rowId);
  return table.inputs.filter(
    (input) => !rule?.conditions.some((condition) => condition.inputId === input.id)
  );
};

/** The table with a new input column, and that column's id. */
export const tableWithNewInput = (table: EditableTable): [EditableTable, string] => {
  const id = `input-${table.nextId}`;
  return [
    {
      ...table,
      nextId: table.nextId + 1,
      inputs: [...table.inputs, { id, name: `Input ${table.inputs.length + 1}` }],
    },
    id,
  ];
};

const ruleIndexOf = (table: EditableTable, rowId: string): number =>
  table.rules.findIndex((rule) => rule.rowId === rowId);

const withRules = (
  table: EditableTable,
  index: number,
  remove: number,
  ...added: EditableRule[]
): EditableTable => {
  const rules = [...table.rules];
  rules.splice(index, remove, ...added);
  return { ...table, rules, nextId: table.nextId + added.length };
};

/** The table with an empty rule inserted at `index`, and that rule's id. */
export const tableWithRuleAt = (table: EditableTable, index: number): [EditableTable, string] => {
  const rowId = `rule-${table.nextId}`;
  return [withRules(table, index, 0, { rowId, outcomes: {}, conditions: [] }), rowId];
};

/** The table with a copy of a rule after it, and the copy's id. */
export const tableWithDuplicate = (
  table: EditableTable,
  rowId: string
): [EditableTable, string] => {
  const index = ruleIndexOf(table, rowId);
  const rule = table.rules[index];
  const copyId = `rule-${table.nextId}`;
  return rule
    ? [withRules(table, index + 1, 0, { ...rule, rowId: copyId }), copyId]
    : [table, rowId];
};

/** The table with a rule's outcomes and conditions emptied. */
export const tableWithClearedRule = (table: EditableTable, rowId: string): EditableTable =>
  mapRule(table, rowId, (rule) => ({ ...rule, outcomes: {}, conditions: [] }));

/** The table with a rule moved by `delta` places, kept inside the table. */
export const tableWithMovedRule = (
  table: EditableTable,
  rowId: string,
  delta: number
): EditableTable => {
  const index = ruleIndexOf(table, rowId);
  const rule = table.rules[index];
  const to = Math.max(0, Math.min(table.rules.length - 1, index + delta));
  if (!rule || to === index) return table;
  const rules = table.rules.filter((candidate) => candidate !== rule);
  rules.splice(to, 0, rule);
  return { ...table, rules };
};

/** The table without a rule. */
export const tableWithoutRule = (table: EditableTable, rowId: string): EditableTable => ({
  ...table,
  rules: table.rules.filter((rule) => rule.rowId !== rowId),
});

/** The grid story's table (age, income and channel to risk), as an editable model. */
export const EDITABLE_TABLE: EditableTable = {
  inputs: [
    { id: 'age', name: 'age' },
    { id: 'income', name: 'income', decisionId: 'net-income' },
    { id: 'channel', name: 'channel', decisionId: 'sales-channel' },
  ],
  outputs: [{ id: 'risk', name: 'risk' }],
  rules: [
    {
      rowId: 'r1',
      outcomes: { risk: '"high"' },
      conditions: [
        { inputId: 'age', operator: 'is less than', values: ['25'], joiner: ', ' },
        { inputId: 'income', operator: 'is at most', values: ['40000'], joiner: ', ' },
      ],
    },
    {
      rowId: 'r2',
      outcomes: { risk: '"standard"' },
      conditions: [
        { inputId: 'age', operator: 'is between', values: ['25', '60'], joiner: ' and ' },
        { inputId: 'income', operator: 'is greater than', values: ['40000'], joiner: ', ' },
        { inputId: 'channel', operator: 'is one of', values: ['"web"', '"app"'], joiner: ', ' },
      ],
    },
    {
      rowId: 'r3',
      outcomes: { risk: '"review"' },
      conditions: [{ inputId: 'age', operator: 'is greater than', values: ['60'], joiner: ', ' }],
    },
  ],
  nextId: 1,
};

/** The table with no rules, as a host starts a new one. */
export const EMPTY_TABLE: EditableTable = { ...EDITABLE_TABLE, rules: [] };

/** `count` rules cycling through the editable table's, each with its own id, after one rule whose channel lists `values` values. */
export const manyRulesTable = (count: number, values: number): EditableTable => ({
  ...EDITABLE_TABLE,
  rules: [
    {
      rowId: 'long-list',
      outcomes: { risk: '"review"' },
      conditions: [
        {
          inputId: 'channel',
          operator: 'is one of',
          values: Array.from({ length: values }, (_, index) => `"Channel ${index + 1}"`),
          joiner: ', ',
        },
      ],
    },
    ...Array.from({ length: count }, (_, index): EditableRule => {
      const source = EDITABLE_TABLE.rules[index % EDITABLE_TABLE.rules.length];
      return {
        rowId: `row-${index}`,
        outcomes: source?.outcomes ?? {},
        conditions: source?.conditions ?? [],
      };
    }),
  ],
});
