import type { DecisionTextLabels } from '../DecisionText';
import type { SentenceHeader } from '../DecisionTextHeader';
import type {
  SentenceBand,
  SentenceLine,
  SentencePart,
  SentenceRule,
  SentenceToken,
} from '../sentenceTypes';

const token = (columnId: string, kind: SentenceToken['kind'], text: string): SentenceToken => ({
  columnId,
  kind,
  text,
});

/** A column's name token and a maker for its value tokens. */
const column = (
  columnId: string,
  kind: 'input' | 'output',
  name: string
): [SentenceToken, (text: string) => SentenceToken] => [
  token(columnId, kind, name),
  (text) => token(columnId, 'value', text),
];

const line = (name: SentenceToken, ...parts: SentencePart[]): SentenceLine => ({
  columnId: name.columnId,
  parts: [name, ...parts],
});

const band = (id: string, label: string, names: readonly SentenceToken[]): SentenceBand => ({
  id,
  label,
  columns: names.map(({ columnId, text }) => ({ id: columnId, name: text })),
});

/** Values as `{first}, {second}`. */
export const valueList = (value: (text: string) => SentenceToken, texts: readonly string[]) =>
  texts.flatMap((text, index): SentencePart[] =>
    index === 0 ? [value(text)] : [', ', value(text)]
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
      age('60'),
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
      line(SCORE, ' is between ', score('700'), ' and ', score('850')),
      line(DEBT, ' is greater than ', debt('0'), ' and less than ', debt('0.4')),
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
      line(SCORE, ' is greater than ', score('600'), ' and at most ', score('700')),
      line(DEBT, ' is at least ', debt('0.4'), ' and less than ', debt('0.6')),
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

export const DECISION_TEXT_LABELS: DecisionTextLabels = {
  emptyRules: 'No rules yet',
  markStatus: (tone, message) => {
    const status = tone === 'error' ? 'Error' : 'Warning';
    return message ? `${status}: ${message}` : status;
  },
  moreValues: (count) => `+${count.toLocaleString('en-US')} more`,
  conditionVerdict: (matched) => (matched ? 'Matched' : 'Not matched'),
  cell: (column, values, position) => `${column} ${values}, rule ${position}`,
  emptyValue: 'empty',
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
