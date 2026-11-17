import type {
  SentenceBandColumn,
  SentenceCellId,
  SentenceLine,
  SentenceNameToken,
  SentencePart,
  SentenceRule,
  SentenceValueId,
} from '../sentenceTypes';
import type { HeldValues, RangeEnds, ValueCommit, ValueFieldData } from '../valueTypes';
import {
  FIXTURE_OPERATOR_WORDS,
  type FixtureOffer,
  type FixtureOperator,
  type FixtureType,
} from './hostVocabulary';
import { fixtureTypeOf, type SentenceColumns } from './sentences.fixtures';

/** A column of the story table. */
type EditableColumn = SentenceBandColumn<FixtureType>;

/** An input of the story table, and the decision that produces it when another one does. */
type EditableInput = EditableColumn &
  Pick<Extract<SentenceNameToken, { kind: 'input' }>, 'producedBy'>;

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
  inputs: EditableInput[];
  outputs: EditableColumn[];
  rules: EditableRule[];
  nextId: number;
}

const inputToken = (input: EditableInput): SentenceNameToken => ({
  kind: 'input',
  columnId: input.id,
  text: input.name,
  producedBy: input.producedBy,
});

const outputToken = (output: EditableColumn): SentenceNameToken => ({
  kind: 'output',
  columnId: output.id,
  text: output.name,
});

const conditionParts = (input: EditableInput, condition: EditableCondition): SentencePart[] => [
  inputToken(input),
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
      outputToken(output),
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

/** The table's inputs and outputs. */
export const tableColumns = ({ inputs, outputs }: EditableTable): SentenceColumns => ({
  inputs,
  outputs,
});

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

const offer = (operator: FixtureOperator, shape: FixtureOffer['shape']): FixtureOffer => ({
  operator,
  label: FIXTURE_OPERATOR_WORDS[operator],
  shape,
});

/** The operators the fixture host offers each condition. */
export const FIXTURE_OFFERS: readonly FixtureOffer[] = [
  offer('=', 'single'),
  offer('!=', 'single'),
  offer('<', 'single'),
  offer('<=', 'single'),
  offer('>', 'single'),
  offer('>=', 'single'),
  offer('between', 'range'),
  offer('oneOf', 'list'),
  offer('noneOf', 'list'),
  offer('isEmpty', 'valueless'),
];

const operatorOfWords = (words: string): FixtureOffer | undefined =>
  FIXTURE_OFFERS.find((candidate) => candidate.label === words);

/** The table with a condition's committed operator, values and range ends written, the condition added when the rule has none. */
export const tableWithCondition = (
  table: EditableTable,
  target: SentenceValueId,
  commit: Extract<ValueCommit<FixtureOperator>, { kind: 'single' | 'range' | 'list' | 'valueless' }>
): EditableTable =>
  mapRule(table, target.rowId, (rule) => {
    const valuesOf = (): { values: string[]; ends?: RangeEnds } => {
      switch (commit.kind) {
        case 'single':
          return { values: [commit.value] };
        case 'range':
          return { values: [commit.low, commit.high], ends: commit.ends };
        case 'list':
          return { values: [...commit.values] };
        case 'valueless':
          return { values: [] };
      }
    };
    const { values, ends } = valuesOf();
    const written: EditableCondition = {
      inputId: target.columnId,
      operator: FIXTURE_OPERATOR_WORDS[commit.operator],
      values,
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

/** The table with a commit written, as the fixture host writes each kind. */
export const tableWithCommit = (
  table: EditableTable,
  target: SentenceValueId,
  commit: ValueCommit<FixtureOperator>
): EditableTable => {
  switch (commit.kind) {
    case 'outcome':
      return tableWithValue(table, target, commit.value);
    case 'expression':
      return tableWithExpression(table, target, commit.text);
    default:
      return tableWithCondition(table, target, commit);
  }
};

/** What the fixture host's popover edits for a cell: an outcome, a `matches` condition as its expression, or a condition by operator. */
export const editableValueField = (
  table: EditableTable,
  { rowId, columnId }: SentenceCellId
): ValueFieldData<FixtureOperator> => {
  if (isOutput(table, columnId)) return { kind: 'outcome', allowedValues: [] };
  const condition = table.rules
    .find((rule) => rule.rowId === rowId)
    ?.conditions.find((candidate) => candidate.inputId === columnId);
  const expression = condition ? condition.values.join(condition.joiner) : '';
  const offer = condition ? operatorOfWords(condition.operator) : FIXTURE_OFFERS[0];
  if (!condition || !offer) {
    return condition
      ? { kind: 'expression', allowedValues: [], expression }
      : {
          kind: 'condition',
          allowedValues: [],
          expression,
          operators: FIXTURE_OFFERS,
          held: { shape: 'single', operator: '=', value: '' },
        };
  }
  const { operator, shape } = offer;
  const [first = '', second = ''] = condition.values;
  const held: HeldValues<FixtureOperator> =
    shape === 'range'
      ? {
          shape,
          operator,
          low: first,
          high: second,
          ends: condition.ends ?? { lowInclusive: true, highInclusive: true },
        }
      : shape === 'list'
        ? { shape, operator, values: condition.values }
        : shape === 'valueless'
          ? { shape, operator }
          : { shape, operator, value: first };
  return { kind: 'condition', allowedValues: [], expression, operators: FIXTURE_OFFERS, held };
};

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

/** The table with a new input column, and that column's id. */
export const tableWithNewInput = (table: EditableTable): [EditableTable, string] => {
  const id = `input-${table.nextId}`;
  return [
    {
      ...table,
      nextId: table.nextId + 1,
      inputs: [
        ...table.inputs,
        { id, name: `Input ${table.inputs.length + 1}`, type: fixtureTypeOf(id) },
      ],
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

/** The table with the rule at `from` moved to `to`, kept inside the table. */
export const tableWithMovedRule = (
  table: EditableTable,
  from: number,
  to: number
): EditableTable => {
  const rule = table.rules[from];
  const at = Math.max(0, Math.min(table.rules.length - 1, to));
  if (!rule || at === from) return table;
  const rules = table.rules.filter((candidate) => candidate !== rule);
  rules.splice(at, 0, rule);
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
    { id: 'age', name: 'age', type: fixtureTypeOf('age') },
    { id: 'income', name: 'income', producedBy: 'net-income', type: fixtureTypeOf('income') },
    { id: 'channel', name: 'channel', producedBy: 'sales-channel', type: fixtureTypeOf('channel') },
  ],
  outputs: [{ id: 'risk', name: 'risk', type: fixtureTypeOf('risk') }],
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

/** `count` rules cycling through the editable table's, each with its own id, after one rule whose channel lists `values` values and one with a condition on each of `inputs` more inputs. */
export const manyRulesTable = (count: number, values: number, inputs: number): EditableTable => {
  const extra = Array.from(
    { length: inputs },
    (_, index): EditableColumn => ({
      id: `input-${index + 1}`,
      name: `Input ${index + 1}`,
      type: fixtureTypeOf(`input-${index + 1}`),
    })
  );
  return {
    ...EDITABLE_TABLE,
    inputs: [...EDITABLE_TABLE.inputs, ...extra],
    nextId: inputs + 1,
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
      {
        rowId: 'many-inputs',
        outcomes: { risk: '"review"' },
        conditions: extra.map((input, index) => ({
          inputId: input.id,
          operator: 'is',
          values: [`${index + 1}`],
          joiner: ', ',
        })),
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
  };
};
