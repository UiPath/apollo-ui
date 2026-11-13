import type { DecisionTextEditLabels, DecisionTextLabels } from '../DecisionText';
import type { SentenceHeader } from '../DecisionTextHeader';
import type { PolicyGroup } from '../PolicyPicker';
import type {
  SentenceBand,
  SentenceLine,
  SentenceNameToken,
  SentencePart,
  SentenceRule,
  SentenceValueToken,
} from '../sentenceTypes';

/** Makes a cell's value token from its text and its place among the cell's values. */
type ValueMaker = (text: string, index?: number) => SentenceValueToken;

/** A column's name token and a maker for its value tokens. */
const column = (
  columnId: string,
  kind: SentenceNameToken['kind'],
  name: string
): [SentenceNameToken, ValueMaker] => [
  { kind, columnId, text: name },
  (text, index = 0) => ({ kind: 'value', columnId, index, text }),
];

const line = (name: SentenceNameToken, ...parts: SentencePart[]): SentenceLine => ({
  columnId: name.columnId,
  parts: [name, ...parts],
});

const band = (id: string, label: string, names: readonly SentenceNameToken[]): SentenceBand => ({
  id,
  label,
  columns: names.map(({ columnId, text }) => ({ id: columnId, name: text })),
});

/** Values as `{first}, {second}`. */
export const valueList = (value: ValueMaker, texts: readonly string[]) =>
  texts.flatMap((text, index): SentencePart[] =>
    index === 0 ? [value(text, index)] : [', ', value(text, index)]
  );

const [AGE, age] = column('age', 'input', 'age');
const [INCOME, income] = column('income', 'input', 'income');
const [RISK, risk] = column('risk', 'output', 'risk');

/** The grid story's table (age, income → risk), worded. */
export const GRID_SENTENCE_RULES: SentenceRule[] = [
  {
    rowId: 'r1',
    heading: [RISK, ' is ', risk('"high"')],
    lead: [
      'when ',
      AGE,
      ' is less than ',
      age('25'),
      ' and ',
      INCOME,
      ' is at most ',
      income('40000'),
    ],
    lines: [],
  },
  {
    rowId: 'r2',
    heading: [RISK, ' is ', risk('"standard"')],
    lead: [
      'when ',
      AGE,
      ' is between ',
      age('25'),
      ' and ',
      age('60', 1),
      ' and ',
      INCOME,
      ' is greater than ',
      income('40000'),
    ],
    lines: [],
  },
  {
    rowId: 'r3',
    heading: [RISK, ' is ', risk('"review"')],
    lead: ['when ', AGE, ' is greater than ', age('60')],
    lines: [],
  },
];

/** The grid story's inputs and outputs. */
export const GRID_SENTENCE_BANDS: SentenceBand[] = [
  band('inputs', 'Inputs', [AGE, INCOME]),
  band('outputs', 'Outputs', [RISK]),
];

/** The grid story's hit policy, Unique. */
export const GRID_SENTENCE_HEADER: SentenceHeader = {
  label: 'Unique',
  hint: 'Exactly one rule may match. Overlaps are errors.',
};

/** The hit policies a host offers in the header, with Sum refused as for a text output. */
export const HIT_POLICY_GROUPS: readonly PolicyGroup[] = [
  {
    id: 'single',
    label: 'One result',
    options: [
      { value: 'UNIQUE', code: 'U', label: 'Unique', hint: GRID_SENTENCE_HEADER.hint },
      { value: 'FIRST', code: 'F', label: 'First', hint: 'Stops at the first matching rule.' },
      {
        value: 'COLLECT-TOTAL',
        label: 'Collect and total',
        options: [
          {
            value: 'COLLECT:SUM',
            code: 'C+',
            label: 'Sum',
            disabledReason: 'Needs a number output.',
          },
          { value: 'COLLECT:MIN', code: 'C<', label: 'Minimum' },
          { value: 'COLLECT:MAX', code: 'C>', label: 'Maximum' },
        ],
      },
    ],
  },
  {
    id: 'multiple',
    label: 'Several results',
    options: [{ value: 'COLLECT', code: 'C', label: 'Collect', hint: 'Returns the matches.' }],
  },
];

const [SCORE, score] = column('score', 'input', 'Credit Score');
const [DEBT, debt] = column('debt', 'input', 'Debt Ratio');
export const [COUNTRY, country] = column('country', 'input', 'Country');
const [START, start] = column('start', 'input', 'Start Date');
export const [CHANNEL, channel] = column('channel', 'input', 'Channel');
const [DECISION, decision] = column('decision', 'output', 'Decision');
const [LIMIT, limit] = column('limit', 'output', 'Credit Limit');
const [REASON, reason] = column('reason', 'output', 'Reason');

const outputs = (result: string, amount: string, why: string): SentencePart[] => [
  ...[DECISION, ' is ', decision(result), ' · '],
  ...[LIMIT, ' is ', limit(amount), ' · '],
  ...[REASON, ' is ', reason(why)],
];

/** Five inputs and three outputs: every operator form, rules with and without condition lines, and an empty output. */
export const MULTI_SENTENCE_RULES: SentenceRule[] = [
  {
    rowId: 'm1',
    heading: outputs('"approve"', '25000', '"prime"'),
    lead: ['when all of these are true:'],
    lines: [
      line(SCORE, ' is between ', score('700'), ' and ', score('850', 1)),
      line(DEBT, ' is greater than ', debt('0'), ' and less than ', debt('0.4', 1)),
      line(COUNTRY, ' is one of ', ...valueList(country, ['"US"', '"CA"', '"MX"', '"GB"', '"DE"'])),
      line(START, ' is ', start('2026-01-01')),
      line(CHANNEL, ' is ', channel('"web"')),
    ],
  },
  {
    rowId: 'm2',
    heading: outputs('"review"', '5000', ''),
    lead: ['when all of these are true:'],
    lines: [
      line(SCORE, ' is greater than ', score('600'), ' and at most ', score('700', 1)),
      line(DEBT, ' is at least ', debt('0.4'), ' and less than ', debt('0.6', 1)),
      line(COUNTRY, ' is none of ', ...valueList(country, ['"RU"', '"KP"'])),
    ],
  },
  {
    rowId: 'm3',
    heading: outputs('"decline"', '0', '"low score"'),
    lead: [
      'when ',
      SCORE,
      ' is less than ',
      score('600'),
      ' and ',
      CHANNEL,
      ' is not ',
      channel('"branch"'),
    ],
    lines: [],
  },
  {
    rowId: 'm4',
    heading: outputs('"review"', '1000', '"custom rule"'),
    lead: ['when ', SCORE, ' matches ', score('> limitFloor')],
    lines: [],
  },
  {
    rowId: 'm5',
    heading: outputs('"decline"', '0', '"no match"'),
    lead: ['in every case'],
    lines: [],
  },
];

/** Credit Score, Debt Ratio, Country, Start Date and Channel → Decision, Credit Limit and Reason. */
export const MULTI_SENTENCE_BANDS: SentenceBand[] = [
  band('inputs', 'Inputs', [SCORE, DEBT, COUNTRY, START, CHANNEL]),
  band('outputs', 'Outputs', [DECISION, LIMIT, REASON]),
];

/** The Collect hit policy. */
export const MULTI_SENTENCE_HEADER: SentenceHeader = {
  label: 'Collect',
  hint: 'Returns the matches as a list.',
};

export const DECISION_TEXT_LABELS = {
  emptyRules: 'No rules yet',
  markStatus: (tone, message) => {
    const status = tone === 'error' ? 'Error' : 'Warning';
    return message ? `${status}: ${message}` : status;
  },
  moreValues: (count) => `+${count.toLocaleString('en-US')} more`,
  conditionVerdict: (matched) => (matched ? 'Matched' : 'Not matched'),
  cell: (column, values, position) => `${column} ${values}, rule ${position}`,
  emptyValue: 'empty',
  openDecision: (input) => `Open the ${input} decision`,
} satisfies DecisionTextLabels;

export const DECISION_TEXT_EDIT_LABELS: DecisionTextEditLabels = {
  addCondition: (position) => `Add condition to rule ${position}`,
  removeCondition: (column, position) => `Remove ${column} from rule ${position}`,
  clearOutcome: (column, position) => `Clear ${column} in rule ${position}`,
  ruleActions: (position) => `Rule ${position} actions`,
  deleteRule: (position) => `Delete rule ${position}`,
  newCondition: (column, position) => `New ${column} condition, rule ${position}`,
  setValue: 'Set a value',
  operator: 'Operator',
  notAllowed: 'Not one of the allowed values',
  editExpression: 'Edit expression',
  clear: 'Clear',
  rangeLow: 'From',
  rangeHigh: 'To',
  included: 'Included',
  addValue: 'Add value',
  cancel: 'Cancel',
  apply: 'Apply',
  inputColumn: (name) => `Input · ${name}`,
  outputColumn: (name) => `Output · ${name}`,
  columnLabel: 'Label',
  inputExpression: 'Input expression',
  outputName: 'Output name',
  missingInputExpression: 'This input has no expression',
  missingOutputName: 'This output has no name',
  dataType: 'Data type',
  allowedValues: 'Allowed values',
  allowedValuesHint: 'Separate values with commas.',
  moreProperties: 'More properties',
};

const firstRule = (): SentenceRule => {
  const [row] = MULTI_SENTENCE_RULES;
  if (!row) throw new Error('MULTI_SENTENCE_RULES is empty');
  return row;
};

/** `count` rules cycling through `MULTI_SENTENCE_RULES`, each with its own id. */
export const manySentenceRules = (count: number): SentenceRule[] =>
  Array.from({ length: count }, (_, index) => ({
    ...(MULTI_SENTENCE_RULES[index % MULTI_SENTENCE_RULES.length] ?? firstRule()),
    rowId: `row-${index}`,
  }));

/** The first multi row with one `country` line naming `count` values. */
export const longValueListRule = (count: number): SentenceRule => ({
  ...firstRule(),
  rowId: 'long-list',
  lines: [
    line(
      COUNTRY,
      ' is one of ',
      ...valueList(
        country,
        Array.from({ length: count }, (_, index) => `"Country ${index + 1}"`)
      )
    ),
  ],
});

const generatedInput = (index: number) => column(`input-${index}`, 'input', `Input ${index + 1}`);

/** The first multi row with `count` condition lines, one per generated input. */
export const manyLinesRule = (count: number): SentenceRule => ({
  ...firstRule(),
  rowId: 'many-lines',
  lines: Array.from({ length: count }, (_, index) => {
    const [name, value] = generatedInput(index);
    return line(name, ' is ', value(`${index + 1}`));
  }),
});

/** `count` generated input columns, then the multi outputs. */
export const manyColumnBands = (count: number): SentenceBand[] => [
  band(
    'inputs',
    'Inputs',
    Array.from({ length: count }, (_, index) => generatedInput(index)[0])
  ),
  ...MULTI_SENTENCE_BANDS.slice(1),
];
