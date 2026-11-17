import {
  Braces,
  Calendar,
  CalendarClock,
  CalendarRange,
  Clock,
  Hash,
  Timer,
  ToggleRight,
  Type,
} from 'lucide-react';
import type { ColumnTypeOption } from '../columnTypes';
import type { DecisionTextMode, DecisionTextProps } from '../DecisionText';
import type { DecisionTextDiff } from '../decisionTextDiff';
import type { DecisionTextEdit } from '../decisionTextTypes';
import type { HitPolicyCatalog, HitPolicyOffer, HitPolicyPick } from '../hitPolicyMenu';
import type { RefusalContext } from '../hostValues';
import type { DecisionTextTable } from '../sentenceTypes';
import type { OperatorOffer } from '../valueTypes';

/** How a fixture condition tests its input. */
export type FixtureOperator =
  | '='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'between'
  | 'oneOf'
  | 'noneOf'
  | 'anyOf'
  | 'contains'
  | 'startsWith'
  | 'listContains'
  | 'isEmpty'
  | 'isFilled';

/** A fixture table's hit policy. */
export type FixtureHitPolicy =
  | 'FIRST'
  | 'UNIQUE'
  | 'PRIORITY'
  | 'ANY'
  | 'COLLECT'
  | 'RULE ORDER'
  | 'OUTPUT ORDER';

/** How Collect totals its matches in the fixtures. */
export type FixtureAggregation = 'SUM' | 'MIN' | 'MAX' | 'COUNT';

/** A fixture column's type. */
export type FixtureType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'Any'
  | 'date'
  | 'time'
  | 'date and time'
  | 'days and time duration'
  | 'years and months duration';

/** Why the fixture host refuses a value. */
export type FixtureRefusal =
  | { reason: 'unknown-decision' | 'unknown-rule' | 'malformed-patch' }
  | {
      reason:
        | 'unknown-column'
        | 'duplicate-column'
        | 'value-count'
        | 'not-a-literal'
        | 'unknown-variable'
        | 'operator-not-offered';
      columnId: string;
    }
  | { reason: 'not-feel'; columnId: string; problem: string };

export type FixturePolicy = HitPolicyPick<FixtureHitPolicy, FixtureAggregation>;
export type FixtureTable = DecisionTextTable<FixtureHitPolicy, FixtureAggregation, FixtureType>;
export type FixtureDiff = DecisionTextDiff<FixtureHitPolicy, FixtureAggregation, FixtureType>;
export type FixtureEdit = DecisionTextEdit<FixtureOperator, FixtureType, FixtureRefusal>;
export type FixtureMode = DecisionTextMode<
  FixtureOperator,
  FixtureHitPolicy,
  FixtureAggregation,
  FixtureType,
  FixtureRefusal
>;
export type FixtureOffer = OperatorOffer<FixtureOperator>;

/** A fixture policy without a total. */
export const policyOf = (policy: FixtureHitPolicy): FixturePolicy => ({ kind: 'policy', policy });

/** Each operator's words in the fixture host's sentences and operator select. */
export const FIXTURE_OPERATOR_WORDS: Readonly<Record<FixtureOperator, string>> = {
  '=': 'is',
  '!=': 'is not',
  '<': 'is less than',
  '<=': 'is at most',
  '>': 'is greater than',
  '>=': 'is at least',
  between: 'is between',
  oneOf: 'is one of',
  noneOf: 'is none of',
  anyOf: 'is one of its tests',
  contains: 'contains',
  listContains: 'contains',
  startsWith: 'starts with',
  isEmpty: 'is empty',
  isFilled: 'is filled in',
};

const DEFAULT_VALUES_EXAMPLE = '"Approved", "Denied", "Refer"';

/** The fixture host's column types, with their glyphs and allowed-values examples. */
export const FIXTURE_COLUMN_TYPES: readonly ColumnTypeOption<FixtureType>[] = [
  { type: 'string', label: 'String', icon: <Type />, example: DEFAULT_VALUES_EXAMPLE },
  { type: 'number', label: 'Number', icon: <Hash />, example: '10, 20, (30..40]' },
  { type: 'boolean', label: 'Boolean', icon: <ToggleRight />, example: 'true, false' },
  { type: 'Any', label: 'Object', icon: <Braces />, example: DEFAULT_VALUES_EXAMPLE },
  {
    type: 'date',
    label: 'Date',
    icon: <Calendar />,
    example: 'date("2026-03-15"), date("2026-06-30")',
  },
  {
    type: 'time',
    label: 'Time',
    icon: <Clock />,
    example: 'time("09:00:00"), time("17:30:00")',
  },
  {
    type: 'date and time',
    label: 'Date-time',
    icon: <CalendarClock />,
    example: 'date and time("2026-03-15T09:00:00")',
  },
  {
    type: 'days and time duration',
    label: 'Day and time duration',
    icon: <Timer />,
    example: 'duration("P7D"), duration("P30DT4H")',
  },
  {
    type: 'years and months duration',
    label: 'Year and month duration',
    icon: <CalendarRange />,
    example: 'duration("P1Y"), duration("P2Y6M")',
  },
];

/** Whether the fixture host offers each total. */
export type AggregationOffers = Readonly<Record<FixtureAggregation, HitPolicyOffer>>;

/** Every total offered. */
export const ALL_TOTALS_OFFERED: AggregationOffers = {
  SUM: { kind: 'offered' },
  MIN: { kind: 'offered' },
  MAX: { kind: 'offered' },
  COUNT: { kind: 'offered' },
};

/** The fixture host's hit policies: one result's with Collect's totals, then several results'. */
export const fixtureHitPolicies = (
  offers: AggregationOffers
): HitPolicyCatalog<FixtureHitPolicy, FixtureAggregation> => [
  {
    label: 'One result',
    entries: [
      {
        kind: 'policy',
        policy: 'FIRST',
        code: 'F',
        label: 'First',
        hint: 'Stops at the first matching rule, in table order.',
      },
      {
        kind: 'policy',
        policy: 'UNIQUE',
        code: 'U',
        label: 'Unique',
        hint: 'Exactly one rule may match. Overlaps are errors.',
      },
      {
        kind: 'policy',
        policy: 'PRIORITY',
        code: 'P',
        label: 'Priority',
        hint: "Matches the highest-ranked result, prioritized by the outputs' allowed values.",
      },
      {
        kind: 'policy',
        policy: 'ANY',
        code: 'A',
        label: 'Any',
        hint: 'Any number may match, but they must all give the same result.',
      },
      {
        kind: 'totals',
        policy: 'COLLECT',
        label: 'Collect and total',
        hint: 'Combines every match into one value: a sum, minimum, maximum or count.',
        totals: [
          {
            total: 'SUM',
            code: 'C+',
            label: 'Sum',
            hint: 'Adds the matched outputs together.',
            offer: offers.SUM,
          },
          {
            total: 'MIN',
            code: 'C<',
            label: 'Minimum',
            hint: 'Returns the smallest matched output.',
            offer: offers.MIN,
          },
          {
            total: 'MAX',
            code: 'C>',
            label: 'Maximum',
            hint: 'Returns the largest matched output.',
            offer: offers.MAX,
          },
          {
            total: 'COUNT',
            code: 'C#',
            label: 'Count',
            hint: 'Counts the distinct values among the matches.',
            offer: offers.COUNT,
          },
        ],
      },
    ],
  },
  {
    label: 'Several results',
    entries: [
      {
        kind: 'policy',
        policy: 'COLLECT',
        code: 'C',
        label: 'Collect',
        hint: 'Returns the matches as a list.',
      },
      {
        kind: 'policy',
        policy: 'RULE ORDER',
        code: 'R',
        label: 'Rule order',
        hint: 'Returns every match, in the order the rules appear.',
      },
      {
        kind: 'policy',
        policy: 'OUTPUT ORDER',
        code: 'O',
        label: 'Output order',
        hint: "Returns every match, ordered by the outputs' allowed values.",
      },
    ],
  },
];

/** The fixture host's hit policies with every total offered. */
export const FIXTURE_HIT_POLICIES = fixtureHitPolicies(ALL_TOTALS_OFFERED);

/** A fixture refusal worded for the editor, with the refused cell's column and values. */
export const wordFixtureRefusal = (refusal: FixtureRefusal, context: RefusalContext): string => {
  switch (refusal.reason) {
    case 'operator-not-offered':
      return `Not saved: ${context.column} can't be compared that way.`;
    case 'not-feel':
      return `Not saved: ${refusal.problem}`;
    case 'not-a-literal':
      return `Not saved: ${context.values} is not a value ${context.column} can take.`;
    case 'value-count':
      return `Not saved: ${context.column} can't take that number of values.`;
    case 'unknown-variable':
      return `Not saved: ${context.values} is not a variable.`;
    case 'duplicate-column':
      return `Not saved: ${context.column} was changed twice.`;
    case 'unknown-column':
      return 'Not saved: this column no longer exists.';
    case 'unknown-rule':
      return 'Not saved: this rule no longer exists.';
    case 'unknown-decision':
      return 'Not saved: this decision no longer exists.';
    case 'malformed-patch':
      return 'Not saved: the change could not be read.';
  }
};

export type FixtureProps = DecisionTextProps<
  FixtureOperator,
  FixtureHitPolicy,
  FixtureAggregation,
  FixtureType,
  FixtureRefusal
>;

/** What every fixture view takes of the host's words: its hit policies and column types. */
export const FIXTURE_VOCABULARY: Pick<FixtureProps, 'hitPolicies' | 'columnTypes'> = {
  hitPolicies: FIXTURE_HIT_POLICIES,
  columnTypes: FIXTURE_COLUMN_TYPES,
};
