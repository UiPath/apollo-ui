import type { Meta, StoryObj } from '@storybook/react';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DIFF_COLUMNS,
  DIFF_POLICY,
  DIFF_RULES,
  EVERY_STATE_DIFF,
  EVERYTHING_CHANGED_DIFF,
  HIT_POLICY_DIFF,
  largeDiffTable,
  REMOVED_COLUMN_DIFF,
} from './__fixtures__/diffSentences.fixtures';
import {
  EDITABLE_TABLE,
  type EditableTable,
  EMPTY_TABLE,
  manyRulesTable,
  wordedRules,
} from './__fixtures__/editableSentences.fixtures';
import {
  type AggregationOffers,
  ALL_TOTALS_OFFERED,
  FIXTURE_COLUMN_TYPES,
  FIXTURE_VOCABULARY,
  type FixtureDiff,
  type FixtureEdit,
  type FixtureMode,
  type FixturePolicy,
  type FixtureProps,
  type FixtureTable,
  fixtureHitPolicies,
  policyOf,
} from './__fixtures__/hostVocabulary';
import {
  MULTI_SENTENCE_COLUMNS,
  MULTI_SENTENCE_POLICY,
  manySentenceRules,
  SUM_REFUSED_OFFERS,
} from './__fixtures__/sentences.fixtures';
import {
  type HostMode,
  NUMERIC_INPUTS,
  storyColumnsOf,
  storyModeOf,
  storyTableOf,
  storyTableProps,
} from './__fixtures__/storyTableHost';
import { DecisionText } from './DecisionText';
import type { Mark, RowMark, TableMarks } from './marks';
import { valueTokenOf } from './sentenceParts';
import { selectedColumnOf } from './sentenceSelection';
import type { SentenceCellId, SentenceRule, SentenceSelection } from './sentenceTypes';
import type { ExpressionEditorProps } from './valueTypes';

const selectionText = (selection: SentenceSelection | null) =>
  selection ? [selection.rowId, selectedColumnOf(selection) ?? 'rule'].join(' / ') : 'none';

const cellText = (cell: SentenceCellId | null) =>
  cell ? `${cell.rowId} / ${cell.columnId}` : 'none';

interface StoryCaptionProps {
  children: React.ReactNode;
}

const StoryCaption = ({ children }: StoryCaptionProps) => (
  <p className="text-xs text-foreground-de-emp">{children}</p>
);

const NO_MARKS: TableMarks = { rows: new Map(), columns: new Map() };

/** Every hit policy, with Collect's totals, by the story control's name. */
const POLICIES = {
  First: policyOf('FIRST'),
  Unique: policyOf('UNIQUE'),
  Priority: policyOf('PRIORITY'),
  Any: policyOf('ANY'),
  Collect: policyOf('COLLECT'),
  'Collect · Sum': { kind: 'total', policy: 'COLLECT', total: 'SUM' },
  'Collect · Minimum': { kind: 'total', policy: 'COLLECT', total: 'MIN' },
  'Collect · Maximum': { kind: 'total', policy: 'COLLECT', total: 'MAX' },
  'Collect · Count': { kind: 'total', policy: 'COLLECT', total: 'COUNT' },
  'Rule order': policyOf('RULE ORDER'),
  'Output order': policyOf('OUTPUT ORDER'),
} satisfies Record<string, FixturePolicy>;

const TOTALS = { 'Sum refused': SUM_REFUSED_OFFERS, 'All offered': ALL_TOTALS_OFFERED };

/** The host's validation, as the grid's host marks its cells: a number input holding text, and an empty outcome. */
const validationMarks = (table: EditableTable): TableMarks => {
  const rows = new Map<string, RowMark>();
  for (const rule of table.rules) {
    const cells: Record<string, Mark> = {};
    for (const condition of rule.conditions) {
      if (
        NUMERIC_INPUTS.has(condition.inputId) &&
        condition.operator !== 'matches' &&
        condition.values.some((value) => Number.isNaN(Number(value)))
      ) {
        cells[condition.inputId] = { tone: 'error', title: 'Not a number', glyph: true };
      }
    }
    for (const output of table.outputs) {
      if (!rule.outcomes[output.id]) {
        cells[output.id] = { tone: 'warning', title: `No ${output.name} set`, glyph: true };
      }
    }
    if (Object.keys(cells).length > 0) rows.set(rule.rowId, { cells });
  }
  return { rows, columns: new Map() };
};

/** The host's selection once its rule or cell is gone: the rule, or nothing. */
const liveSelection = (
  rules: readonly SentenceRule[],
  selected: SentenceSelection | null
): SentenceSelection | null => {
  const rule = selected && rules.find((candidate) => candidate.rowId === selected.rowId);
  if (!selected || !rule) return null;
  if (selected.kind === 'rule') return selected;
  return valueTokenOf(rule, { rowId: rule.rowId, columnId: selected.columnId, index: 0 })
    ? selected
    : { kind: 'rule', rowId: rule.rowId };
};

const sameSelection = (left: SentenceSelection | null, right: SentenceSelection | null) =>
  left?.rowId === right?.rowId && selectedColumnOf(left) === selectedColumnOf(right);

interface TableHostProps {
  initialTable: EditableTable;
  caption: string;
  mode?: HostMode;
  policy?: FixturePolicy;
  offers?: AggregationOffers;
  validate?: boolean;
  marks?: TableMarks;
  headerMark?: FixtureProps['headerMark'];
  renderEditor?: FixtureEdit['renderEditor'];
  frameClassName?: string;
}

/** A host that owns the table, its hit policy and the selection, words the table back after every write, and refuses a condition left without a value. */
const TableHost = ({
  initialTable,
  caption,
  mode = 'edit',
  policy = POLICIES.Unique,
  offers = SUM_REFUSED_OFFERS,
  validate = false,
  marks: fixedMarks,
  headerMark,
  renderEditor,
  frameClassName = 'h-[600px]',
}: TableHostProps) => {
  const [host, setHost] = useState(() => storyTableOf(initialTable, policy));
  const { table, columnEdits } = host;
  const [selected, setSelected] = useState<SentenceSelection | null>(null);
  const [hovered, setHovered] = useState<SentenceCellId | null>(null);
  const [openedDecision, setOpenedDecision] = useState<string | null>(null);
  const [moreProperties, setMoreProperties] = useState<string | null>(null);
  const rules = useMemo(() => wordedRules(table), [table]);
  const columns = useMemo(() => storyColumnsOf({ table, columnEdits }), [table, columnEdits]);
  const marks = useMemo(
    () => fixedMarks ?? (validate ? validationMarks(table) : NO_MARKS),
    [fixedMarks, table, validate]
  );
  const viewTable = useMemo<FixtureTable>(
    () => ({ hitPolicy: host.policy, ...columns, rules }),
    [host.policy, columns, rules]
  );

  useEffect(() => setHost((current) => ({ ...current, policy })), [policy]);

  useEffect(() => {
    setSelected((current) => {
      const live = liveSelection(rules, current);
      return sameSelection(live, current) ? current : live;
    });
  }, [rules]);

  const wired = storyTableProps({
    state: host,
    onChange: setHost,
    onSelect: setSelected,
    onMoreProperties: setMoreProperties,
    renderEditor,
  });

  return (
    <div className={`flex flex-col gap-2 ${frameClassName}`}>
      <DecisionText
        hitPolicies={fixtureHitPolicies(offers)}
        columnTypes={FIXTURE_COLUMN_TYPES}
        table={viewTable}
        mode={storyModeOf(mode, selected, setSelected, wired)}
        ariaLabel="Rules"
        dataTestId="decision-text"
        numbered
        marks={marks}
        headerMark={headerMark}
        onCellHover={setHovered}
        onOpenDecision={setOpenedDecision}
      />
      <StoryCaption>
        Selected: {selectionText(selected)} · Hovered: {cellText(hovered)} · Opened decision:{' '}
        {openedDecision ?? 'none'} · More properties: {moreProperties ?? 'none'}
      </StoryCaption>
      <StoryCaption>{caption}</StoryCaption>
    </div>
  );
};

const meta: Meta = {
  title: 'Decision Text',
  parameters: { layout: 'padded' },
};
export default meta;

const ERRORS_TABLE: EditableTable = {
  ...EDITABLE_TABLE,
  rules: [
    {
      rowId: 'e1',
      outcomes: { risk: '"high"' },
      conditions: [
        { inputId: 'age', operator: 'is less than', values: ['"25"'], joiner: ', ' },
        { inputId: 'channel', operator: 'is', values: ['"kiosk"'], joiner: ', ' },
      ],
    },
    {
      rowId: 'e2',
      outcomes: { risk: '' },
      conditions: [
        { inputId: 'age', operator: 'is between', values: ['25', '60'], joiner: ' and ' },
      ],
    },
    {
      rowId: 'e3',
      outcomes: { risk: '"review"' },
      conditions: [{ inputId: 'age', operator: 'is at most', values: ['30'], joiner: ', ' }],
    },
    {
      rowId: 'e4',
      outcomes: { risk: '"standard"' },
      conditions: [
        { inputId: 'age', operator: 'is greater than', values: ['60'], joiner: ', ' },
        { inputId: 'income', operator: 'is greater than', values: ['40000'], joiner: ', ' },
      ],
    },
    {
      rowId: 'e5',
      outcomes: { risk: '"high"' },
      conditions: [
        { inputId: 'age', operator: 'is greater than', values: ['60'], joiner: ', ' },
        { inputId: 'income', operator: 'is at most', values: ['40000'], joiner: ', ' },
      ],
    },
    { rowId: 'e6', outcomes: { risk: '"review"' }, conditions: [] },
  ],
};

const ERRORS_MARKS: TableMarks = {
  rows: new Map<string, RowMark>([
    [
      'e1',
      {
        cells: {
          age: {
            tone: 'error',
            glyph: true,
            title: 'Type mismatch: age is a number, "25" is text',
          },
          channel: { tone: 'warning', glyph: true, title: '"kiosk" is not an allowed channel' },
        },
      },
    ],
    [
      'e2',
      {
        tone: 'error',
        glyph: true,
        title: 'Set a risk.',
        cells: { risk: { tone: 'error', glyph: true, title: 'Set a risk.' } },
      },
    ],
    ['e3', { tone: 'warning', glyph: true, title: 'Overlaps rule 2' }],
    [
      'e4',
      {
        tone: 'success',
        cells: {
          age: { matched: true, title: 'age: 67' },
          income: { matched: true, title: 'income: 52000' },
        },
      },
    ],
    [
      'e5',
      {
        cells: {
          age: { tone: 'success', matched: true, title: 'age: 67' },
          income: { tone: 'error', matched: false, title: 'income: 52000' },
        },
      },
    ],
    ['e6', { dim: true, title: 'Not evaluated' }],
  ]),
  columns: new Map([
    ['income', { tone: 'warning', glyph: true, title: 'income has no allowed values' }],
  ]),
};

/** The story's expression editor: a monospace input in its own shadow root, as a host's code editor would mount. */
const ShadowExpressionEditor = ({ value, ariaLabel, onChange, onReady }: ExpressionEditorProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const opened = useRef({ value, ariaLabel, onChange, onReady });
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const { value, ariaLabel, onChange, onReady } = opened.current;
    const input = document.createElement('input');
    input.value = value;
    input.setAttribute('aria-label', ariaLabel);
    input.setAttribute('data-testid', 'decision-text-host-editor');
    input.style.cssText = 'width: 100%; font-family: monospace; padding: 4px 8px';
    input.addEventListener('input', () => onChange(input.value));
    (host.shadowRoot ?? host.attachShadow({ mode: 'open' })).append(input);
    onReady({ focus: () => input.focus() });
    return () => {
      onReady(null);
      input.remove();
    };
  }, []);
  return <div ref={hostRef} className="overflow-hidden rounded-md border border-input" />;
};

const renderExpressionEditor = (props: ExpressionEditorProps) => (
  <ShadowExpressionEditor {...props} />
);

const TABLES = { rules: EDITABLE_TABLE, empty: EMPTY_TABLE } as const;

const MODE_CAPTIONS: Record<HostMode, string> = {
  read: 'Read: the rules only, nothing selects or edits.',
  select: 'Select: click a value or a rule to select it, arrows move, nothing edits.',
  edit: "Edit: click a value, a column or a rule's ⋯ to edit; Add rule adds an empty rule and selects it.",
};

interface RulesArgs {
  mode: HostMode;
  hitPolicy: keyof typeof POLICIES;
  totals: keyof typeof TOTALS;
  table: keyof typeof TABLES;
  validate: boolean;
  editor: 'popover' | 'host';
}

export const Default: StoryObj<RulesArgs> = {
  args: {
    mode: 'edit',
    hitPolicy: 'Unique',
    totals: 'Sum refused',
    table: 'rules',
    validate: false,
    editor: 'popover',
  },
  argTypes: {
    mode: {
      control: 'select',
      options: ['read', 'select', 'edit'],
      description: 'What the host wires: rules only, then selection, then editing.',
    },
    hitPolicy: {
      control: 'select',
      options: Object.keys(POLICIES),
      description: "The table's hit policy, which the header shows and Edit's picker changes.",
    },
    totals: {
      control: 'inline-radio',
      options: Object.keys(TOTALS),
      description: "Which of Collect's totals the picker offers, in Edit.",
    },
    table: { control: 'inline-radio', options: Object.keys(TABLES) },
    validate: { control: 'boolean', description: 'Mark invalid values after every write.' },
    editor: {
      control: 'inline-radio',
      options: ['popover', 'host'],
      description:
        "Under Edit expression: the popover's text field, or the host's editor in a shadow root.",
    },
  },
  render: ({ mode, hitPolicy, totals, table, validate, editor }) => (
    <TableHost
      key={table}
      initialTable={TABLES[table]}
      mode={mode}
      policy={POLICIES[hitPolicy]}
      offers={TOTALS[totals]}
      validate={validate}
      renderEditor={editor === 'host' ? renderExpressionEditor : undefined}
      caption={MODE_CAPTIONS[mode]}
    />
  ),
};

export const Errors: StoryObj = {
  render: () => (
    <TableHost
      initialTable={ERRORS_TABLE}
      marks={ERRORS_MARKS}
      headerMark={{ tone: 'error', glyph: true, title: 'Unique: rules 2 and 3 overlap' }}
      caption="Validation and run marks on values, rules, a column and the header; hover a glyph for its message."
    />
  ),
};

const LARGE_TABLE = manyRulesTable(50_000, 10_000, 50);

export const LargeTable: StoryObj = {
  render: () => (
    <TableHost
      initialTable={LARGE_TABLE}
      validate
      caption={`${LARGE_TABLE.rules.length.toLocaleString('en-US')} rules over ${LARGE_TABLE.inputs.length} inputs, windowed, on the same editing stack.`}
    />
  ),
};

/** A validation warning on a changed value, so both marks show. */
const DIFF_MARKS: TableMarks = {
  rows: new Map([
    ['r5', { cells: { age: { tone: 'warning', glyph: true, title: 'Overlaps rule 4' } } }],
  ]),
  columns: new Map(),
};

const LARGE_DIFF = largeDiffTable(300);

interface DiffScenario {
  rules?: readonly SentenceRule[];
  changes: Omit<FixtureDiff, 'mode'>;
  marks?: TableMarks;
  caption: string;
}

const DIFF_SCENARIOS = {
  'every state': {
    changes: EVERY_STATE_DIFF,
    marks: DIFF_MARKS,
    caption:
      'Every change at once: rules added, changed, removed and moved; values added, changed and removed; columns added, changed and removed; the hit policy.',
  },
  'no changes': {
    changes: {},
    caption: 'Nothing changed: compact folds the whole table, full shows it unpainted.',
  },
  'everything changed': {
    changes: EVERYTHING_CHANGED_DIFF,
    caption: 'Every rule added or changed, and the old first rule removed: compact folds nothing.',
  },
  'removed column': {
    changes: REMOVED_COLUMN_DIFF,
    caption:
      "An input removed: its pill stays struck where it stood, and rule 4's condition on it is struck in its card.",
  },
  'hit policy': {
    changes: HIT_POLICY_DIFF,
    caption: 'Only the hit policy changed: the header shows it before and after.',
  },
  'large table': {
    rules: LARGE_DIFF.rules,
    changes: LARGE_DIFF.diff,
    caption:
      '300 rules, 5 changed: in compact, each shown rule keeps its number in the whole table.',
  },
} satisfies Record<string, DiffScenario>;

const DIFF_MODE_CAPTIONS: Record<FixtureDiff['mode'], string> = {
  compact:
    'Compact: two unchanged rules kept each side of a change, longer runs folded; open a fold to show its rules.',
  full: 'Full: every rule, the changed ones painted.',
};

interface DiffArgs {
  mode: FixtureDiff['mode'];
  scenario: keyof typeof DIFF_SCENARIOS;
}

const DiffHost = ({ mode, scenario }: DiffArgs) => {
  const { rules = DIFF_RULES, changes, marks, caption }: DiffScenario = DIFF_SCENARIOS[scenario];
  const table = useMemo(() => ({ ...DIFF_POLICY, ...DIFF_COLUMNS, rules }), [rules]);
  const viewMode = useMemo(
    (): FixtureMode => ({ kind: 'diff', diff: { mode, ...changes } }),
    [mode, changes]
  );
  return (
    <div className="flex h-[640px] flex-col gap-2">
      <DecisionText
        {...FIXTURE_VOCABULARY}
        key={scenario}
        table={table}
        mode={viewMode}
        numbered
        marks={marks}
        ariaLabel="Rules"
        dataTestId="diff"
      />
      <StoryCaption>{DIFF_MODE_CAPTIONS[mode]}</StoryCaption>
      <StoryCaption>{caption}</StoryCaption>
    </div>
  );
};

export const Diff: StoryObj<DiffArgs> = {
  args: { mode: 'full', scenario: 'every state' },
  argTypes: {
    mode: { control: 'inline-radio', options: ['compact', 'full'] },
    scenario: { control: 'select', options: Object.keys(DIFF_SCENARIOS) },
  },
  render: (args) => <DiffHost {...args} />,
};

const STACKED_TABLE: FixtureTable = {
  ...MULTI_SENTENCE_POLICY,
  ...MULTI_SENTENCE_COLUMNS,
  rules: manySentenceRules(300),
};
const STACKED_IDS = ['first', 'second', 'third'] as const;

interface ScrollingArgs {
  scroll: 'self' | 'container';
}

const StackedHost = ({ scroll }: ScrollingArgs) => {
  const [selected, setSelected] = useState<Record<string, SentenceSelection | null>>({});
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setContainer}
      className="h-[600px] scroll-pt-4 overflow-auto border border-border-de-emp"
      data-testid="stacked-scroller"
    >
      {STACKED_IDS.map((id) => (
        <div
          key={id}
          className={scroll === 'self' ? 'flex h-[360px] flex-col' : 'flex flex-col'}
          data-testid={`stacked-${id}`}
        >
          <DecisionText
            {...FIXTURE_VOCABULARY}
            table={STACKED_TABLE}
            mode={{
              kind: 'select',
              selected: selected[id] ?? null,
              onSelect: (next) => setSelected((current) => ({ ...current, [id]: next })),
            }}
            ariaLabel={`Rules of ${id}`}
            dataTestId={`text-${id}`}
            numbered
            scroll={scroll === 'container' ? { container } : 'self'}
          />
        </div>
      ))}
    </div>
  );
};

export const Scrolling: StoryObj<ScrollingArgs> = {
  args: { scroll: 'container' },
  argTypes: {
    scroll: {
      control: 'inline-radio',
      options: ['self', 'container'],
      description: 'Each view in its own frame, or all three in the one container.',
    },
  },
  render: ({ scroll }) => <StackedHost key={scroll} scroll={scroll} />,
};
