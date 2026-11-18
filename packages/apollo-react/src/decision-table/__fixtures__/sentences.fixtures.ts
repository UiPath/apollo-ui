import { Hash, Type as TextGlyph } from 'lucide-react';
import { createElement } from 'react';
import type { ColumnTypeOption } from '../columnTypes';
import type { HitPolicyCatalog, HitPolicyPick } from '../hitPolicyMenu';
import type {
  DecisionTextTable,
  SentenceBandColumn,
  SentenceLine,
  SentenceNameToken,
  SentencePart,
  SentenceRule,
  SentenceValueToken,
} from '../sentenceTypes';
import type { OperatorOffer } from '../valueTypes';

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

/** A view's input and output columns. */
export type SentenceColumns = Pick<
  DecisionTextTable<unknown, unknown, FixtureType>,
  'inputs' | 'outputs'
>;

/** The fixtures' column types; the host's list lacks dates. */
export type FixtureType = 'text' | 'number' | 'date';

/** The column types a host offers. */
export const COLUMN_TYPES: readonly ColumnTypeOption<FixtureType>[] = [
  { type: 'text', label: 'Text', icon: createElement(TextGlyph), example: '"web", "app"' },
  { type: 'number', label: 'Number', icon: createElement(Hash), example: '10, 20' },
];

/** The fixtures' operators: at least one per value shape, and one no offer lists. */
export type FixtureOperator = '<' | '>' | '!=' | 'between' | 'oneOf' | 'noneOf' | 'isEmpty';
export type FixtureOffer = OperatorOffer<FixtureOperator>;

/** Each fixture operator's words. */
export const OPERATOR_WORDS: Readonly<Record<FixtureOperator, string>> = {
  '<': 'is less than',
  '>': 'is greater than',
  '!=': 'is not',
  between: 'is between',
  oneOf: 'is one of',
  noneOf: 'is none of',
  isEmpty: 'is empty',
};

/** An offer of an operator in its words. */
export const offerOf = (operator: FixtureOperator, shape: FixtureOffer['shape']): FixtureOffer => ({
  operator,
  label: OPERATOR_WORDS[operator],
  shape,
});

/** No inputs and no outputs, so no bands. */
export const NO_COLUMNS: SentenceColumns = { inputs: [], outputs: [] };

const columnsOf = (names: readonly SentenceNameToken[]): SentenceBandColumn<FixtureType>[] =>
  names.map(({ columnId, text }) => ({ id: columnId, name: text, type: 'text' }));

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
export const GRID_SENTENCE_COLUMNS: SentenceColumns = {
  inputs: columnsOf([AGE, INCOME]),
  outputs: columnsOf([RISK]),
};

/** The fixtures' hit policies, and the totals Collect takes. */
export type FixturePolicy = 'unique' | 'first' | 'collect';
export type FixtureTotal = 'sum' | 'min';
export type FixturePick = HitPolicyPick<FixturePolicy, FixtureTotal>;

/** The hit policies a host offers in the header, with Sum refused as for a text output. */
export const HIT_POLICIES: HitPolicyCatalog<FixturePolicy, FixtureTotal> = [
  {
    label: 'One result',
    entries: [
      {
        kind: 'policy',
        policy: 'unique',
        code: 'U',
        label: 'Unique',
        hint: 'Exactly one rule may match. Overlaps are errors.',
      },
      {
        kind: 'totals',
        policy: 'collect',
        label: 'Collect and total',
        hint: 'Totals the matches.',
        totals: [
          {
            total: 'sum',
            code: 'C+',
            label: 'Sum',
            hint: 'Adds the matches.',
            offer: { kind: 'refused', reason: 'Needs a number output.' },
          },
          {
            total: 'min',
            code: 'C<',
            label: 'Minimum',
            hint: 'Returns the smallest match.',
            offer: { kind: 'offered' },
          },
        ],
      },
    ],
  },
  {
    label: 'In order',
    entries: [
      {
        kind: 'policy',
        policy: 'first',
        code: 'F',
        label: 'First',
        hint: 'Stops at the first matching rule.',
      },
      {
        kind: 'policy',
        policy: 'collect',
        code: 'C',
        label: 'Collect',
        hint: 'Returns the matches as a list.',
      },
    ],
  },
];

/** The grid story's hit policy, Unique. */
export const GRID_SENTENCE_POLICY: FixturePick = { kind: 'policy', policy: 'unique' };

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
export const MULTI_SENTENCE_COLUMNS: SentenceColumns = {
  inputs: columnsOf([SCORE, DEBT, COUNTRY, START, CHANNEL]),
  outputs: columnsOf([DECISION, LIMIT, REASON]),
};

/** The Collect hit policy. */
export const MULTI_SENTENCE_POLICY: FixturePick = { kind: 'policy', policy: 'collect' };

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
export const manyColumns = (count: number): SentenceColumns => ({
  ...MULTI_SENTENCE_COLUMNS,
  inputs: columnsOf(Array.from({ length: count }, (_, index) => generatedInput(index)[0])),
});
