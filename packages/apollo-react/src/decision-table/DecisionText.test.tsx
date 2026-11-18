import { setupI18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import {
  act,
  cleanup,
  fireEvent,
  type RenderResult,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type React from 'react';
import { useCallback, useLayoutEffect, useState } from 'react';
import { type Mock, onTestFinished, vi } from 'vitest';
import {
  EDITABLE_TABLE,
  type EditableTable,
  tableColumns,
  tableWithNewInput,
  tableWithoutCell,
  tableWithoutRule,
  tableWithValue,
  wordedRules,
} from './__fixtures__/editableSentences.fixtures';
import {
  installEscapeCloseRequest,
  installModalInertness,
  pressOutside,
} from './__fixtures__/modalDialog';
import {
  CHANNEL,
  COUNTRY,
  channel,
  country,
  type FixturePick,
  GRID_SENTENCE_COLUMNS,
  GRID_SENTENCE_POLICY,
  GRID_SENTENCE_RULES,
  HIT_POLICIES,
  longValueListRule,
  MULTI_SENTENCE_COLUMNS,
  MULTI_SENTENCE_POLICY,
  MULTI_SENTENCE_RULES,
  manyColumns,
  manyLinesRule,
  manySentenceRules,
  NO_COLUMNS,
  valueList,
  COLUMN_TYPES,
  type FixtureOffer,
  type FixtureOperator,
  type FixtureType,
  OPERATOR_WORDS,
  offerOf,
} from './__fixtures__/sentences.fixtures';
import {
  type FixtureEdit,
  type FlatTextProps,
  outcomeField,
  textPropsOf,
} from './__fixtures__/textMode';
import type { ColumnEdit, ColumnFieldData } from './ColumnPopover';
import type { ColumnTypeOption } from './columnTypes';
import { EMPTY_VALUE_DASH, FALLBACK_ROW_VIEWPORT_PX } from './constants';
import { DecisionText } from './DecisionText';
import type { CellCommitMove } from './gridTypes';
import type { RowMark, TableMarks } from './marks';
import { valueTokenOf } from './sentenceParts';
import { sentenceRuleOffsets } from './sentenceRuleHeights';
import type {
  SentenceCellId,
  SentencePart,
  SentenceRule,
  SentenceSelection,
  SentenceValueId,
  SentenceValueToken,
} from './sentenceTypes';
import { SENTENCE_RULE_OVERSCAN } from './useRuleWindow';
import type { ExpressionEditorProps, HeldValues, ValueCommit, ValueFieldData } from './valueTypes';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

/** A host's expression editor on the contract: an input that reports its text and hands over its focus. */
const HostInput = ({ value, ariaLabel, onChange, onReady }: ExpressionEditorProps) => {
  const attach = useCallback(
    (input: HTMLInputElement | null) => onReady(input && { focus: () => input.focus() }),
    [onReady]
  );
  return (
    <input
      ref={attach}
      aria-label={ariaLabel}
      data-testid="host-editor"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
};
const hostInput = (props: ExpressionEditorProps) => <HostInput {...props} />;

let uninstallEscape: () => void = () => {};
beforeAll(() => {
  uninstallEscape = installEscapeCloseRequest();
});
afterAll(() => uninstallEscape());

type ViewProps = Partial<FlatTextProps>;

const view = (props: ViewProps = {}) => (
  <DecisionText
    {...textPropsOf({
      rules: MULTI_SENTENCE_RULES,
      ...MULTI_SENTENCE_COLUMNS,
      hitPolicy: MULTI_SENTENCE_POLICY,
      ariaLabel: 'Rules',
      dataTestId: 'nl',
      ...props,
    })}
  />
);
const renderView = (props: ViewProps = {}) => render(view(props));

const card = (rowId: string) => screen.getByTestId(`nl-row-${rowId}`);
const ruleLine = (rowId: string, index: 0 | 1) => card(rowId).firstElementChild?.children[index];
const mountedRows = () => [...document.querySelectorAll<HTMLElement>('li[data-row-id]')];
const rowMarks = (rows: Record<string, RowMark>): TableMarks => ({
  rows: new Map(Object.entries(rows)),
  columns: new Map(),
});
const isHiddenFromReaders = (element: Element) =>
  element.closest('[aria-hidden="true"], [hidden]') !== null;
const valueChip = (rowId: string, columnId: string) => {
  const chip = card(rowId).querySelector<HTMLElement>(
    `[data-kind="value"][data-column-id="${columnId}"]`
  );
  if (!chip) throw new Error(`no ${columnId} value in ${rowId}`);
  return chip;
};
const scrollTo = (px: number) => {
  const frame = screen.getByTestId('nl');
  frame.scrollTop = px;
  fireEvent.scroll(frame);
};

type SelectableProps = Omit<ViewProps, 'selected' | 'diff'> & {
  initial?: SentenceSelection | null;
};

const Selectable = ({ initial = null, onSelect, ...props }: SelectableProps) => {
  const [selected, setSelected] = useState(initial);
  return view({
    rules: GRID_SENTENCE_RULES,
    ...GRID_SENTENCE_COLUMNS,
    hitPolicy: GRID_SENTENCE_POLICY,
    ...props,
    selected,
    onSelect: (next) => {
      onSelect?.(next);
      setSelected(next);
    },
  });
};
const renderSelectable = (props: SelectableProps = {}) => {
  const onSelect = vi.fn();
  const rendered = render(<Selectable onSelect={onSelect} {...props} />);
  return { onSelect, ...rendered };
};
/** Presses a key where focus is, returning whether the view left it unclaimed. */
const press = (key: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(document.activeElement ?? document.body, { key, ...init });
/** The focused stop as `row` (a rule) or `row:column` (a cell), else the focused element's testid. */
const focusedStop = () => {
  const element = document.activeElement;
  if (!(element instanceof HTMLElement)) return null;
  const rowId = element.closest<HTMLElement>('li[data-row-id]')?.dataset.rowId;
  if (rowId && element.dataset.columnId) return `${rowId}:${element.dataset.columnId}`;
  return element.dataset.rowId ?? element.dataset.testid ?? element.tagName;
};
const walk = (...keys: string[]) =>
  keys.map((key) => {
    press(key);
    return focusedStop();
  });
/** Runs a host's answer a moment after the call that asked for it, as a host that saves first does. */
const later = (answer: () => void) => {
  void Promise.resolve().then(answer);
};
const settleLater = () => act(async () => {});
/** A press as Safari on macOS makes one: the pressed control takes no focus, and unless mousedown is prevented the focused element blurs to the body before the click. */
const safariPress = (target: HTMLElement) => {
  const focused = document.activeElement;
  fireEvent.pointerDown(target);
  if (fireEvent.mouseDown(target) && focused instanceof HTMLElement) act(() => focused.blur());
  fireEvent.pointerUp(target);
  fireEvent.mouseUp(target);
  fireEvent.click(target);
};
const rect = (left: number, right: number): DOMRect => ({
  left,
  right,
  x: left,
  width: right - left,
  top: 0,
  bottom: 24,
  y: 0,
  height: 24,
  toJSON: () => ({}),
});

interface EditSpies {
  onSelect: Mock<NonNullable<ViewProps['onSelect']>>;
  onStartEdit: Mock<NonNullable<FixtureEdit['onStartEdit']>>;
  onCommit: Mock<
    (value: SentenceValueId, text: string, move: CellCommitMove, operator?: FixtureOperator) => void
  >;
  onCommitValues: Mock<FixtureEdit['onCommit']>;
  onCancel: Mock<NonNullable<FixtureEdit['onCancel']>>;
  onClearCell: Mock<FixtureEdit['onClearCell']>;
}

interface EditingHostProps extends Omit<SelectableProps, 'initial' | 'onSelect' | 'edit'> {
  spies: EditSpies;
  initial?: SentenceSelection | null;
  initialEditing?: SentenceValueId | null;
  refuse?: boolean;
  renderEditor?: FixtureEdit['renderEditor'];
  valueField?: FixtureEdit['valueField'];
  column?: FixtureEdit['column'];
  inputIds?: FixtureEdit['inputIds'];
}

const EditingHost = ({
  spies,
  initialEditing = null,
  refuse = false,
  renderEditor,
  valueField = outcomeField,
  column,
  inputIds,
  ...props
}: EditingHostProps) => {
  const [editing, setEditing] = useState(initialEditing);
  const [refusals, setRefusals] = useState(0);
  return (
    <Selectable
      {...props}
      onSelect={spies.onSelect}
      edit={{
        ...editWith({ onClearCell: spies.onClearCell }),
        editing,
        renderEditor,
        valueField,
        column,
        inputIds,
        onStartEdit: (value) => {
          spies.onStartEdit(value);
          setEditing(value);
        },
        onCommit: (value, commit, move) => {
          spies.onCommitValues(value, commit, move);
          const text = commit.kind === 'expression' ? commit.text : (valuesOf(commit)[0] ?? '');
          const operator = 'operator' in commit ? commit.operator : undefined;
          if (operator === undefined) spies.onCommit(value, text, move);
          else spies.onCommit(value, text, move, operator);
          if (refuse) setRefusals(refusals + 1);
          else setEditing(null);
        },
        onCancel: () => {
          spies.onCancel();
          setEditing(null);
        },
      }}
    />
  );
};

const renderEditing = (props: Omit<EditingHostProps, 'spies'> = {}, container?: HTMLElement) => {
  const spies: EditSpies = {
    onSelect: vi.fn(),
    onStartEdit: vi.fn(),
    onCommit: vi.fn(),
    onCommitValues: vi.fn(),
    onCancel: vi.fn(),
    onClearCell: vi.fn(),
  };
  const rendered = render(<EditingHost spies={spies} {...props} />, { container });
  return { ...spies, ...rendered };
};

const valueChips = (rowId: string, columnId: string) => [
  ...card(rowId).querySelectorAll<HTMLElement>(`[data-kind="value"][data-column-id="${columnId}"]`),
];
const valueChipAt = (rowId: string, columnId: string, index: number) => {
  const chip = valueChips(rowId, columnId)[index];
  if (!chip) throw new Error(`no ${columnId} value ${index} in ${rowId}`);
  return chip;
};
const secondAge = () => valueChipAt('r2', 'age', 1);
const editor = () => screen.getByTestId('nl-editor') as HTMLInputElement;
const r2Age = (index: number): SentenceValueId => ({ rowId: 'r2', columnId: 'age', index });
const valuesOf = (commit: ValueCommit<FixtureOperator>): readonly string[] => {
  switch (commit.kind) {
    case 'outcome':
    case 'single':
      return [commit.value];
    case 'range':
      return [commit.low, commit.high];
    case 'list':
      return commit.values;
    case 'valueless':
      return [];
    case 'expression':
      throw new Error(`an expression commit, ${commit.text}`);
  }
};
type ConditionField = Extract<ValueFieldData<FixtureOperator>, { kind: 'condition' }>;
const conditionField = (
  operators: readonly FixtureOffer[],
  held: HeldValues<FixtureOperator>,
  more: Partial<Pick<ConditionField, 'expression' | 'allowedValues'>> = {}
): ConditionField => ({
  kind: 'condition',
  allowedValues: [],
  expression: '',
  operators,
  held,
  ...more,
});
const single = (operator: FixtureOperator, value = ''): HeldValues<FixtureOperator> => ({
  shape: 'single',
  operator,
  value,
});
const editWith = (overrides: Partial<FixtureEdit> = {}): FixtureEdit => ({
  editing: null,
  onStartEdit: vi.fn(),
  onCommit: vi.fn(),
  onCancel: vi.fn(),
  onClearCell: vi.fn(),
  onDeleteRule: vi.fn(),
  valueField: outcomeField,
  ...overrides,
});

describe('DecisionText', () => {
  describe('layout', () => {
    it('shows the header label and hint, then each band caption followed by its column names', () => {
      renderView();
      expect(screen.getByTestId('nl-header')).toHaveTextContent(
        'CollectReturns the matches as a list.'
      );
      const bands = screen.getByTestId('nl-bands');
      expect([...bands.querySelectorAll('[data-band-id]')].map((band) => band.textContent)).toEqual(
        [
          'InputsCredit ScoreDebt RatioCountryStart DateChannel',
          'OutputsDecisionCredit LimitReason',
        ]
      );
    });

    it("draws a band column's type glyph before its name, hidden from its accessible name", () => {
      renderView({
        inputs: [{ id: 'score', name: 'Credit Score', type: 'number' }],
        outputs: [],
        columnTypes: [
          { type: 'number', label: 'Number', icon: <svg data-testid="type-icon" />, example: '1' },
        ],
      });
      const column = within(screen.getByTestId('nl-bands')).getByRole('listitem');
      expect(column.firstElementChild).toHaveAttribute('aria-hidden', 'true');
      expect(column.firstElementChild).toContainElement(screen.getByTestId('type-icon'));
      expect(column).toHaveTextContent(/^Credit Score$/);
    });

    it("draws a column's glyph from the host's types, and any value's for a type they lack", () => {
      renderView({
        inputs: [
          { id: 'score', name: 'Credit Score', type: 'number' },
          { id: 'note', name: 'Note', type: 'text' },
          { id: 'start', name: 'Start', type: 'date' },
        ],
      });
      const glyphOf = (columnId: string) =>
        screen
          .getByTestId('nl-bands')
          .querySelector(`[data-column-id="${columnId}"]`)
          ?.querySelector('svg')
          ?.getAttribute('class');
      expect(['score', 'note', 'start'].map(glyphOf)).toEqual([
        'lucide lucide-hash',
        'lucide lucide-type',
        'lucide lucide-braces',
      ]);
    });

    it.each([
      ['no outputs', { outputs: [] }, ['Inputs']],
      ['no inputs', { inputs: [] }, ['Outputs']],
    ])('leaves out the band of a side with %s', (_, columns, captions) => {
      renderView(columns);
      expect(
        [...screen.getByTestId('nl-bands').querySelectorAll('[data-band-id]')].map(
          (band) => band.firstElementChild?.textContent
        )
      ).toEqual(captions);
    });

    it('shows no bands without inputs or outputs', () => {
      renderView(NO_COLUMNS);
      expect(screen.queryByTestId('nl-bands')).toBeNull();
    });

    it('puts a row heading first, then its lead, then one line per condition', () => {
      renderView();
      const row = card('m1');
      expect(
        [...row.querySelectorAll('li')].map((line) => [line.dataset.columnId, line.textContent])
      ).toEqual([
        ['score', 'Credit Score is between 700 and 850'],
        ['debt', 'Debt Ratio is greater than 0 and less than 0.4'],
        ['country', 'Country is one of "US", "CA", "MX", "GB", "DE"'],
        ['start', 'Start Date is 2026-01-01'],
        ['channel', 'Channel is "web"'],
      ]);
      expect(ruleLine('m1', 0)?.textContent).toBe(
        'Decision is "approve" · Credit Limit is 25000 · Reason is "prime"'
      );
      expect(ruleLine('m1', 1)?.textContent).toBe('when all of these are true:');
    });

    it('words a row without lines in its lead alone', () => {
      renderView();
      const row = card('m3');
      expect(row.querySelector('ul')).toBeNull();
      expect(row.textContent).toBe(
        'Decision is "decline" · Credit Limit is 0 · Reason is "low score"' +
          'when Credit Score is less than 600 and Channel is not "branch"'
      );
    });

    it('shows an empty value as the grid shows an empty cell', () => {
      renderView();
      expect(valueChip('m2', 'reason')).toHaveTextContent(EMPTY_VALUE_DASH);
    });

    it('renders its children inside the scroll container', () => {
      renderView({ children: <div data-testid="overlay" /> });
      expect(screen.getByTestId('nl')).toContainElement(screen.getByTestId('overlay'));
    });
  });

  describe('accessibility', () => {
    it('names each row by its heading and lead, and counts it among all rules', () => {
      renderView({ numbered: true });
      const row = card('m3');
      expect(row).toHaveAccessibleName(
        '3 Decision is "decline" · Credit Limit is 0 · Reason is "low score" when Credit Score is less than 600 and Channel is not "branch"'
      );
      expect(row).toHaveAttribute('aria-posinset', '3');
      expect(row).toHaveAttribute('aria-setsize', '5');
    });

    it('names a rule whose lead clamps a list by the values it shows, then its count', () => {
      const [m3] = MULTI_SENTENCE_RULES.slice(2);
      if (!m3) throw new Error('no m3');
      const countries = Array.from({ length: 30 }, (_, index) => `"C${index + 1}"`);
      const lead = ['when ', COUNTRY, ' is one of ', ...valueList(country, countries), ' today'];
      renderView({ rules: [{ ...m3, rowId: 'long-lead', lead }] });
      expect(card('long-lead')).toHaveAccessibleName(
        `Decision is "decline" · Credit Limit is 0 · Reason is "low score" when Country is one of ${countries.slice(0, 20).join(', ')} +10 more today`
      );
    });

    it('numbers and counts a rule deep in the list by its place among all rules', () => {
      const rules = manySentenceRules(2000);
      renderView({ rules, numbered: true });
      act(() => scrollTo(sentenceRuleOffsets(rules)[500] ?? 0));
      const row = card('row-500');
      expect(row).toHaveAttribute('aria-posinset', '501');
      expect(row).toHaveAttribute('aria-setsize', '2000');
      expect(row.firstElementChild?.firstElementChild).toHaveTextContent(/^501$/);
    });

    it("adds the host's class to the view's own, keeping the view's name and tab stop", () => {
      const hostProps: React.HTMLAttributes<HTMLElement> & Record<`data-${string}`, string> = {
        className: 'host-class',
        'aria-label': 'Host',
        tabIndex: -1,
      };
      renderView({ containerProps: hostProps });
      const frame = screen.getByTestId('nl');
      expect(frame).toHaveClass('host-class', 'relative', 'overflow-auto');
      expect(frame).toHaveAccessibleName('Rules');
      expect(frame).toHaveAttribute('tabindex', '0');
    });

    it('labels the scroll region and has no axe violations', async () => {
      const { container } = renderView();
      expect(screen.getByRole('region', { name: 'Rules' })).toBe(screen.getByTestId('nl'));
      expect(await axe(container)).toHaveNoViolations();
    });

    it.each<[string, SentenceSelection | undefined]>([
      ['nothing', undefined],
      ['a rule', { kind: 'rule', rowId: 'r1' }],
      ['a cell', { kind: 'cell', rowId: 'r2', columnId: 'age' }],
    ])('stays read-only without onSelect with %s selected', (_, selected) => {
      renderView({
        rules: GRID_SENTENCE_RULES,
        ...GRID_SENTENCE_COLUMNS,
        hitPolicy: GRID_SENTENCE_POLICY,
        selected,
      });
      const count = (selector: string) => document.querySelectorAll(selector).length;
      expect({
        buttons: screen.queryAllByRole('button').length,
        valuesWithTabindex: count('[data-kind="value"][tabindex]'),
        valuesWithLabel: count('[data-kind="value"][aria-labelledby]'),
        rulesWithTabindex: count('li[data-row-id][tabindex]'),
        hiddenStopLabels: count('li[data-row-id] [hidden]'),
        painted: count('[data-selected]') > 0,
      }).toEqual({
        buttons: 0,
        valuesWithTabindex: 0,
        valuesWithLabel: 0,
        rulesWithTabindex: 0,
        hiddenStopLabels: 0,
        painted: selected !== undefined,
      });
      expect([...document.querySelectorAll('[tabindex]')]).toEqual([screen.getByTestId('nl')]);
      const frame = screen.getByTestId('nl');
      Object.defineProperty(frame, 'clientHeight', { value: 100 });
      vi.spyOn(card('r1'), 'getBoundingClientRect').mockReturnValue({
        ...rect(0, 400),
        top: 20,
        bottom: 370,
      });
      fireEvent.click(within(card('r1')).getByText('when'));
      fireEvent.click(valueChip('r1', 'age'));
      expect([frame.scrollTop, document.activeElement]).toEqual([0, document.body]);
      act(() => frame.focus());
      expect([press('ArrowDown'), press('Escape'), press('Tab')]).toEqual([true, true, true]);
    });
  });

  describe('marks', () => {
    it('paints a value chip with its cell mark exactly as a grid cell carries it', () => {
      renderView({
        marks: rowMarks({
          m3: {
            cells: { score: { tone: 'success', title: 'Evaluated against 720', matched: true } },
          },
        }),
      });
      const chip = valueChip('m3', 'score');
      expect(chip).toHaveAttribute('data-tone', 'success');
      expect(chip).toHaveAttribute('data-mark-title', 'Evaluated against 720');
      expect(chip).toHaveAttribute('data-mark-matched', 'true');
      const name = card('m3').querySelector('[data-kind="input"][data-column-id="score"]');
      expect(name).not.toHaveAttribute('data-tone');
      expect(name).not.toHaveAttribute('data-mark-title');
    });

    it('shows on a condition line whether its run matched it, in place of its bullet', () => {
      renderView({
        marks: rowMarks({
          m1: { cells: { score: { matched: true }, debt: { tone: 'error', matched: false } } },
        }),
      });
      const line = (columnId: string) =>
        card('m1').querySelector<HTMLElement>(`li[data-column-id="${columnId}"]`);
      expect(line('score')).toHaveAttribute('data-matched', 'true');
      expect(line('score')?.querySelector('[data-verdict="matched"]')).not.toBeNull();
      expect(line('debt')).toHaveAttribute('data-matched', 'false');
      expect(line('debt')?.querySelector('[data-verdict="unmatched"]')).not.toBeNull();
      expect(line('country')).not.toHaveAttribute('data-matched');
      expect(line('country')?.querySelector('[data-verdict]')).toBeNull();
      expect(card('m1').querySelectorAll('[data-glyph]')).toHaveLength(0);
    });

    it('reads out a condition line’s run verdict', () => {
      renderView({
        marks: rowMarks({ m1: { cells: { score: { matched: true }, debt: { matched: false } } } }),
      });
      const verdicts = within(card('m1')).getAllByText(/^(Not )?matched$/i);
      expect(verdicts.map((verdict) => verdict.closest('li')?.dataset.columnId)).toEqual([
        'score',
        'debt',
      ]);
      expect(verdicts.map((verdict) => verdict.textContent)).toEqual(['Matched', 'Not matched']);
      expect(verdicts.filter(isHiddenFromReaders)).toEqual([]);
    });

    it('reads out the run verdict of each condition a rule words in its lead, before its input', () => {
      renderView({
        marks: rowMarks({
          m3: { cells: { score: { matched: true }, channel: { matched: false } } },
        }),
      });
      const verdicts = within(card('m3')).getAllByText(/^(Not )?matched$/i);
      expect(
        verdicts.map((verdict) => [
          verdict.textContent,
          verdict.nextElementSibling?.getAttribute('data-column-id'),
        ])
      ).toEqual([
        ['Matched', 'score'],
        ['Not matched', 'channel'],
      ]);
      expect(verdicts.filter(isHiddenFromReaders)).toEqual([]);
      expect(within(ruleLine('m3', 0) as HTMLElement).queryByText(/matched/i)).toBeNull();
    });

    it('names a focused condition stop with its run verdict, in a lead and on a line, and an outcome without one', () => {
      renderSelectable({
        rules: MULTI_SENTENCE_RULES,
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        marks: rowMarks({
          m3: { cells: { score: { matched: true }, channel: { matched: false } } },
          m1: { cells: { score: { matched: true }, decision: { matched: true } } },
        }),
      });
      expect(valueChip('m3', 'score').getAttribute('aria-labelledby')).not.toBeNull();
      expect(valueChip('m3', 'score')).toHaveAccessibleName(/ Matched$/);
      expect(valueChip('m3', 'channel')).toHaveAccessibleName(/ Not matched$/);
      expect(valueChip('m1', 'score')).toHaveAccessibleName(/ Matched$/);
      expect(valueChip('m1', 'decision')).not.toHaveAccessibleName(/matched/i);
      expect(valueChip('m1', 'debt')).not.toHaveAccessibleName(/matched/i);
    });

    it('ends a condition line with its glyph, announced by status and message', () => {
      renderView({
        marks: rowMarks({
          m1: { cells: { debt: { tone: 'error', title: '"-" never matches', glyph: true } } },
        }),
      });
      const [, debtLine] = card('m1').querySelectorAll('li');
      const badge = debtLine?.lastElementChild;
      expect(badge?.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'error');
      expect(badge).toHaveAttribute('data-mark-title', '"-" never matches');
      expect(card('m1')).toHaveAccessibleDescription('Error: "-" never matches');
    });

    const twoMarks = rowMarks({
      m3: {
        cells: {
          score: { tone: 'warning', title: 'Overlaps row 1', glyph: true },
          channel: { tone: 'error', title: 'Not a number', glyph: true },
        },
      },
    });

    it('announces each mark of a line in its own tone, under one glyph of the worst tone', () => {
      renderView({ marks: twoMarks });
      expect(card('m3')).toHaveAccessibleDescription('Warning: Overlaps row 1 Error: Not a number');
      expect(screen.getByText('Warning: Overlaps row 1').closest('[hidden]')).not.toBeNull();
      const glyphs = card('m3').querySelectorAll('[data-glyph]');
      expect(glyphs).toHaveLength(1);
      expect(glyphs[0]).toHaveAttribute('data-glyph', 'error');
      expect(glyphs[0]?.parentElement).toHaveAttribute(
        'data-mark-title',
        'Overlaps row 1\nNot a number'
      );
    });

    it('announces a message two cells of one line share once, apart from another tone or message', () => {
      renderView({
        marks: rowMarks({
          m3: {
            cells: {
              score: { tone: 'warning', title: 'Overlaps row 1', glyph: true },
              channel: { tone: 'warning', title: 'Overlaps row 1', glyph: true },
            },
          },
          m4: {
            cells: {
              decision: { tone: 'warning', title: 'Overlaps row 1', glyph: true },
              limit: { tone: 'error', title: 'Overlaps row 1', glyph: true },
            },
          },
          m2: {
            cells: {
              decision: { tone: 'warning', title: 'Overlaps row 1', glyph: true },
              limit: { tone: 'warning', title: 'Overlaps row 4', glyph: true },
            },
          },
        }),
      });
      expect(card('m3')).toHaveAccessibleDescription('Warning: Overlaps row 1');
      expect(ruleLine('m3', 1)?.querySelector('[data-mark-title]')).toHaveAttribute(
        'data-mark-title',
        'Overlaps row 1'
      );
      expect(card('m4')).toHaveAccessibleDescription(
        'Warning: Overlaps row 1 Error: Overlaps row 1'
      );
      expect(card('m2')).toHaveAccessibleDescription(
        'Warning: Overlaps row 1 Warning: Overlaps row 4'
      );
    });

    it('shows no glyph for a mark without one, or for a success tone', () => {
      renderView({
        marks: rowMarks({
          m3: {
            tone: 'success',
            glyph: true,
            cells: { score: { tone: 'error', title: 'Hover only' } },
          },
        }),
      });
      expect(card('m3').querySelector('[data-glyph]')).toBeNull();
      expect(card('m3')).not.toHaveAttribute('aria-describedby');
    });

    it('tints and dims a marked row, and puts its glyph on the heading line', () => {
      renderView({
        marks: rowMarks({
          m5: { tone: 'warning', title: 'Unreachable', glyph: true },
          m1: { dim: true },
        }),
      });
      expect(card('m5')).toHaveAttribute('data-tone', 'warning');
      expect(card('m1')).toHaveAttribute('data-dim', 'true');
      const headingLine = card('m5').querySelector('[data-mark-title="Unreachable"]');
      expect(headingLine?.querySelector('[data-glyph="warning"]')).not.toBeNull();
      expect(card('m5')).toHaveAccessibleDescription('Warning: Unreachable');
    });

    it('puts the glyph of a cell its sentence leaves out on the heading line, once', () => {
      renderView({
        marks: rowMarks({
          m3: {
            cells: {
              score: { tone: 'warning', title: 'Overlaps row 1', glyph: true },
              debt: { tone: 'error', title: 'Not a number', glyph: true },
            },
          },
        }),
      });
      const heading = ruleLine('m3', 0);
      const lead = ruleLine('m3', 1);
      expect(heading?.querySelector('[data-glyph="error"]')?.parentElement).toHaveAttribute(
        'data-mark-title',
        'Not a number'
      );
      expect(lead?.querySelector('[data-glyph="warning"]')?.parentElement).toHaveAttribute(
        'data-mark-title',
        'Overlaps row 1'
      );
      expect(card('m3').querySelectorAll('[data-glyph]')).toHaveLength(2);
      expect(card('m3')).toHaveAccessibleDescription('Error: Not a number Warning: Overlaps row 1');
    });

    it('marks a band column with its column mark', () => {
      renderView({
        marks: {
          rows: new Map(),
          columns: new Map([['country', { tone: 'error', title: 'No expression', glyph: true }]]),
        },
      });
      const column = screen
        .getByTestId('nl-bands')
        .querySelector<HTMLElement>('[data-column-id="country"]');
      expect(column).toHaveAttribute('data-tone', 'error');
      expect(column).toHaveAttribute('data-mark-title', 'No expression');
      expect(column?.querySelector('[data-glyph="error"]')).not.toBeNull();
      expect(column).toHaveAccessibleDescription('Error: No expression');
    });
  });

  describe('mark tooltip', () => {
    const tooltip = () => screen.queryByTestId('nl-mark-tooltip');
    const scoreMarks = rowMarks({
      m3: { cells: { score: { tone: 'warning', title: 'Overlaps row 1', glyph: true } } },
      m5: { tone: 'warning', title: 'Unreachable', glyph: true },
    });

    it("shows a mark's message while the pointer is on it, and hides it off any mark", async () => {
      renderView({ marks: scoreMarks });
      expect(tooltip()).toBeNull();
      fireEvent.pointerOver(valueChip('m3', 'score'));
      expect(tooltip()).toHaveTextContent('Overlaps row 1');
      fireEvent.pointerOver(valueChip('m1', 'score'));
      await waitFor(() => expect(tooltip()).toBeNull());
    });

    it('keeps the message open while the pointer crosses onto it, and hides it once the pointer rests off any mark', async () => {
      renderView({ marks: scoreMarks });
      fireEvent.pointerOver(valueChip('m3', 'score'));
      fireEvent.pointerOver(card('m3'));
      const shown = tooltip();
      if (!shown) throw new Error('no tooltip');
      fireEvent.pointerOver(shown);
      expect(tooltip()).toHaveTextContent('Overlaps row 1');
      fireEvent.pointerOver(card('m3'));
      await waitFor(() => expect(tooltip()).toBeNull());
    });

    it("shows the header's and a band column's mark on hover", () => {
      renderView({
        headerMark: { tone: 'error', title: 'Collect returns a list', glyph: true },
        marks: {
          rows: new Map(),
          columns: new Map([['country', { tone: 'error', title: 'No expression', glyph: true }]]),
        },
      });
      const headerBadge = screen.getByTestId('nl-header').querySelector('[data-mark-title]');
      if (!headerBadge) throw new Error('header badge');
      fireEvent.pointerOver(headerBadge);
      expect(tooltip()).toHaveTextContent('Collect returns a list');
      const country = screen.getByTestId('nl-bands').querySelector('[data-column-id="country"]');
      if (!country) throw new Error('country column');
      fireEvent.pointerOver(country);
      expect(tooltip()).toHaveTextContent('No expression');
    });

    it("follows the host's change to the mark under the pointer, hiding the message once the mark is gone", async () => {
      const { rerender } = renderView({ marks: scoreMarks });
      fireEvent.pointerOver(valueChip('m3', 'score'));
      expect(tooltip()).toHaveTextContent('Overlaps row 1');
      rerender(
        view({
          marks: rowMarks({
            m3: { cells: { score: { tone: 'warning', title: 'Overlaps row 2', glyph: true } } },
          }),
        })
      );
      await waitFor(() => expect(tooltip()).toHaveTextContent('Overlaps row 2'));
      rerender(view({ marks: rowMarks({}) }));
      await waitFor(() => expect(tooltip()).toBeNull());
      rerender(view({ marks: scoreMarks }));
      await waitFor(() => expect(tooltip()).toHaveTextContent('Overlaps row 1'));
    });

    it("follows the host's change to a mark while the pointer rests on its message", async () => {
      const { rerender } = renderView({ marks: scoreMarks });
      fireEvent.pointerOver(valueChip('m3', 'score'));
      fireEvent.pointerOver(card('m3'));
      const shown = tooltip();
      if (!shown) throw new Error('no tooltip');
      fireEvent.pointerOver(shown);
      rerender(
        view({
          marks: rowMarks({
            m3: { cells: { score: { tone: 'warning', title: 'Overlaps row 2', glyph: true } } },
          }),
        })
      );
      await waitFor(() => expect(tooltip()).toHaveTextContent('Overlaps row 2'));
      rerender(view({ marks: rowMarks({}) }));
      await waitFor(() => expect(tooltip()).toBeNull());
    });

    it("moves the message with the mark under the pointer when the host's change moves it", async () => {
      const { rerender } = renderView({ marks: scoreMarks });
      const marked = valueChip('m3', 'score').closest<HTMLElement>('[data-mark-title]');
      if (!marked) throw new Error('m3 score mark');
      fireEvent.pointerOver(valueChip('m3', 'score'));
      const anchor = document.querySelector<HTMLElement>('span[aria-hidden][data-state]');
      expect(anchor).toHaveStyle({ top: '0px' });
      vi.spyOn(marked, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ y: 40 }));
      rerender(
        view({
          marks: rowMarks({
            m3: { cells: { score: { tone: 'warning', title: 'Overlaps row 1', glyph: true } } },
            m1: { tone: 'warning', title: 'Unreachable', glyph: true },
          }),
        })
      );
      await waitFor(() => expect(anchor).toHaveStyle({ top: '40px' }));
      expect(tooltip()).toHaveTextContent('Overlaps row 1');
    });

    it("follows the host's change to the marks of the focused rule: a new message, none, then a mark added", async () => {
      const shared = {
        rules: MULTI_SENTENCE_RULES,
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        initial: { kind: 'rule', rowId: 'm5' } satisfies SentenceSelection,
      };
      const { rerender } = render(<Selectable {...shared} marks={scoreMarks} />);
      act(() => card('m5').focus());
      expect(tooltip()).toHaveTextContent('Unreachable');
      rerender(
        <Selectable
          {...shared}
          marks={rowMarks({ m5: { tone: 'error', title: 'Never matches', glyph: true } })}
        />
      );
      await waitFor(() => expect(tooltip()).toHaveTextContent('Never matches'));
      rerender(<Selectable {...shared} marks={rowMarks({})} />);
      await waitFor(() => expect(tooltip()).toBeNull());
      rerender(<Selectable {...shared} marks={scoreMarks} />);
      await waitFor(() => expect(tooltip()).toHaveTextContent('Unreachable'));
      expect(document.activeElement).toBe(card('m5'));
    });

    it('keeps a message a scroll hid hidden when the host changes the marks under the pointer and focus', async () => {
      const shared = {
        rules: MULTI_SENTENCE_RULES,
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        initial: { kind: 'rule', rowId: 'm5' } satisfies SentenceSelection,
      };
      const { rerender } = render(<Selectable {...shared} marks={scoreMarks} />);
      act(() => card('m5').focus());
      fireEvent.pointerOver(valueChip('m3', 'score'));
      expect(tooltip()).toHaveTextContent('Overlaps row 1');
      fireEvent.scroll(screen.getByTestId('nl'));
      await waitFor(() => expect(tooltip()).toBeNull());
      rerender(
        <Selectable
          {...shared}
          marks={rowMarks({
            m3: { cells: { score: { tone: 'warning', title: 'Overlaps row 2', glyph: true } } },
            m5: { tone: 'error', title: 'Never matches', glyph: true },
          })}
        />
      );
      await act(() => new Promise((resolve) => setTimeout(resolve)));
      expect(tooltip()).toBeNull();
    });

    it('keeps a message dismissed by Escape dismissed when the host changes its mark', async () => {
      const shared = {
        rules: MULTI_SENTENCE_RULES,
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        initial: { kind: 'rule', rowId: 'm5' } satisfies SentenceSelection,
      };
      const { rerender } = render(<Selectable {...shared} marks={scoreMarks} />);
      act(() => card('m5').focus());
      press('Escape');
      expect(tooltip()).toBeNull();
      rerender(
        <Selectable
          {...shared}
          marks={rowMarks({ m5: { tone: 'error', title: 'Never matches', glyph: true } })}
        />
      );
      await act(() => new Promise((resolve) => setTimeout(resolve)));
      expect(tooltip()).toBeNull();
    });

    it('shows the mark a focused element carries or is described by, without adding to its description', () => {
      renderSelectable({
        rules: MULTI_SENTENCE_RULES,
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        marks: scoreMarks,
        initial: { kind: 'rule', rowId: 'm5' } satisfies SentenceSelection,
      });
      act(() => card('m5').focus());
      expect(tooltip()).toHaveTextContent('Unreachable');
      expect(card('m5')).toHaveAccessibleDescription('Warning: Unreachable');
      act(() => valueChip('m3', 'score').focus());
      expect(tooltip()).toHaveTextContent('Overlaps row 1');
    });

    it("shows every message a focused rule's marks on several lines describe it with", () => {
      renderSelectable({
        rules: MULTI_SENTENCE_RULES,
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        marks: rowMarks({
          m1: {
            cells: {
              debt: { tone: 'error', title: 'Not a number', glyph: true },
              country: { tone: 'warning', title: 'Overlaps row 2', glyph: true },
            },
          },
        }),
        initial: { kind: 'rule', rowId: 'm1' } satisfies SentenceSelection,
      });
      act(() => card('m1').focus());
      expect(tooltip()).toHaveTextContent('Not a number');
      expect(tooltip()).toHaveTextContent('Overlaps row 2');
    });

    it('shows every message of a focused rule whose first mark the pointer is on, until Escape', async () => {
      renderSelectable({
        rules: MULTI_SENTENCE_RULES,
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        marks: rowMarks({
          m1: {
            cells: {
              debt: { tone: 'error', title: 'Not a number', glyph: true },
              country: { tone: 'warning', title: 'Overlaps row 2', glyph: true },
            },
          },
        }),
        initial: { kind: 'rule', rowId: 'm1' } satisfies SentenceSelection,
      });
      const [firstId = ''] = card('m1').getAttribute('aria-describedby')?.split(' ') ?? [];
      const first = document.getElementById(firstId)?.closest('[data-mark-title]');
      if (!first) throw new Error('m1 first badge');
      fireEvent.pointerOver(first);
      expect(tooltip()).not.toHaveTextContent('Overlaps row 2');
      act(() => card('m1').focus());
      expect(tooltip()).toHaveTextContent('Not a number');
      expect(tooltip()).toHaveTextContent('Overlaps row 2');
      await act(() => new Promise((resolve) => setTimeout(resolve)));
      expect(tooltip()).toHaveTextContent('Not a number');
      expect(tooltip()).toHaveTextContent('Overlaps row 2');
      fireEvent.keyDown(card('m1'), { key: 'Escape' });
      fireEvent.pointerOver(first);
      expect(tooltip()).toBeNull();
    });

    it('keeps every message of a focused rule whose first mark the pointer is on when the host changes its marks', async () => {
      const shared = {
        rules: MULTI_SENTENCE_RULES,
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        initial: { kind: 'rule', rowId: 'm1' } satisfies SentenceSelection,
      };
      const marksWith = (country: string) =>
        rowMarks({
          m1: {
            cells: {
              debt: { tone: 'error', title: 'Not a number', glyph: true },
              country: { tone: 'warning', title: country, glyph: true },
            },
          },
        });
      const { rerender } = render(<Selectable {...shared} marks={marksWith('Overlaps row 2')} />);
      const [firstId = ''] = card('m1').getAttribute('aria-describedby')?.split(' ') ?? [];
      const first = document.getElementById(firstId)?.closest('[data-mark-title]');
      if (!first) throw new Error('m1 first badge');
      fireEvent.pointerOver(first);
      act(() => card('m1').focus());
      rerender(<Selectable {...shared} marks={marksWith('Overlaps row 3')} />);
      await waitFor(() => expect(tooltip()).toHaveTextContent('Overlaps row 3'));
      expect(tooltip()).toHaveTextContent('Not a number');
    });

    it('shows the mark a focused rule is described by when the view is in a shadow root', () => {
      const host = document.createElement('div');
      document.body.append(host);
      onTestFinished(() => host.remove());
      const container = document.createElement('div');
      host.attachShadow({ mode: 'open' }).append(container);
      render(
        <Selectable
          rules={MULTI_SENTENCE_RULES}
          {...MULTI_SENTENCE_COLUMNS}
          hitPolicy={MULTI_SENTENCE_POLICY}
          marks={scoreMarks}
          initial={{ kind: 'rule', rowId: 'm5' }}
        />,
        { container }
      );
      const inShadow = within(container);
      act(() => inShadow.getByTestId('nl-row-m5').focus());
      expect(inShadow.queryByTestId('nl-mark-tooltip')).toHaveTextContent('Unreachable');
    });

    it("keeps a focused rule's message once the pointer leaves the view or rests off any mark, back from another mark, until Escape", async () => {
      renderSelectable({
        rules: MULTI_SENTENCE_RULES,
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        marks: scoreMarks,
        initial: { kind: 'rule', rowId: 'm5' } satisfies SentenceSelection,
      });
      const restOffMarks = () => act(() => new Promise((resolve) => setTimeout(resolve, 400)));
      act(() => card('m5').focus());
      expect(tooltip()).toHaveTextContent('Unreachable');
      fireEvent.pointerLeave(screen.getByTestId('nl'));
      expect(tooltip()).toHaveTextContent('Unreachable');
      fireEvent.pointerOver(card('m1'));
      await restOffMarks();
      expect(tooltip()).toHaveTextContent('Unreachable');
      fireEvent.pointerOver(valueChip('m3', 'score'));
      expect(tooltip()).toHaveTextContent('Overlaps row 1');
      fireEvent.pointerLeave(screen.getByTestId('nl'));
      expect(tooltip()).toHaveTextContent('Unreachable');
      fireEvent.keyDown(card('m5'), { key: 'Escape' });
      expect(tooltip()).toBeNull();
      fireEvent.pointerOver(card('m1'));
      fireEvent.pointerLeave(screen.getByTestId('nl'));
      await restOffMarks();
      expect(tooltip()).toBeNull();
    });

    it("keeps a focused rule's message dismissed after Escape once the pointer leaves another mark", () => {
      renderSelectable({
        rules: MULTI_SENTENCE_RULES,
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        marks: scoreMarks,
        initial: { kind: 'rule', rowId: 'm5' } satisfies SentenceSelection,
      });
      act(() => card('m5').focus());
      fireEvent.keyDown(card('m5'), { key: 'Escape' });
      expect(tooltip()).toBeNull();
      fireEvent.pointerOver(valueChip('m3', 'score'));
      expect(tooltip()).toHaveTextContent('Overlaps row 1');
      fireEvent.pointerLeave(screen.getByTestId('nl'));
      expect(tooltip()).toBeNull();
    });

    it('keeps the message of the mark under the pointer when focus moves to a rule with none', () => {
      renderSelectable({
        rules: MULTI_SENTENCE_RULES,
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        marks: scoreMarks,
        initial: { kind: 'rule', rowId: 'm1' } satisfies SentenceSelection,
      });
      fireEvent.pointerOver(valueChip('m3', 'score'));
      expect(tooltip()).toHaveTextContent('Overlaps row 1');
      act(() => card('m1').focus());
      expect(tooltip()).toHaveTextContent('Overlaps row 1');
      act(() => card('m5').focus());
      expect(tooltip()).toHaveTextContent('Unreachable');
    });

    it("brings a focused rule's message back once the pointer rests off any mark after another", async () => {
      renderSelectable({
        rules: MULTI_SENTENCE_RULES,
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        marks: scoreMarks,
        initial: { kind: 'rule', rowId: 'm5' } satisfies SentenceSelection,
      });
      act(() => card('m5').focus());
      fireEvent.pointerOver(valueChip('m3', 'score'));
      expect(tooltip()).toHaveTextContent('Overlaps row 1');
      fireEvent.pointerOver(card('m1'));
      await act(() => new Promise((resolve) => setTimeout(resolve, 400)));
      expect(tooltip()).toHaveTextContent('Unreachable');
    });

    it('hides the message on Escape until another mark is reached', () => {
      renderView({ marks: scoreMarks });
      const score = valueChip('m3', 'score');
      fireEvent.pointerOver(score);
      fireEvent.keyDown(score, { key: 'Escape' });
      expect(tooltip()).toBeNull();
      fireEvent.pointerOver(score);
      expect(tooltip()).toBeNull();
      const heading = card('m5').querySelector('[data-mark-title="Unreachable"]');
      if (!heading) throw new Error('m5 heading');
      fireEvent.pointerOver(heading);
      expect(tooltip()).toHaveTextContent('Unreachable');
    });
  });

  describe('hover', () => {
    it('reports the cell a hovered chip stands for once a re-render rewords it', () => {
      const onCellHover = vi.fn();
      const { rerender } = renderView({ onCellHover });
      fireEvent.pointerOver(valueChip('m3', 'score'));
      const reworded = MULTI_SENTENCE_RULES.map((row) =>
        row.rowId === 'm3'
          ? { ...row, lead: ['when ', CHANNEL, ' is not ', channel('"branch"')] }
          : row
      );
      rerender(view({ onCellHover, rules: reworded }));
      expect(onCellHover.mock.calls).toEqual([
        [{ rowId: 'm3', columnId: 'score' }],
        [{ rowId: 'm3', columnId: 'channel' }],
      ]);
    });

    const scrolled = manySentenceRules(2000);
    it.each<[string, readonly SentenceRule[], (view: RenderResult) => void]>([
      [
        'scrolling unmounts the hovered row',
        scrolled,
        () => act(() => scrollTo(sentenceRuleOffsets(scrolled)[500] ?? 0)),
      ],
      ['it unmounts under the pointer', MULTI_SENTENCE_RULES, ({ unmount }) => unmount()],
    ])('reports null when %s', (_, rules, leave) => {
      const onCellHover = vi.fn();
      const result = renderView({ rules, onCellHover });
      const rowId = rules[0]?.rowId ?? '';
      fireEvent.pointerOver(valueChip(rowId, 'decision'));
      leave(result);
      expect(screen.queryByTestId(`nl-row-${rowId}`)).toBeNull();
      expect(onCellHover).toHaveBeenLastCalledWith(null);
    });

    it("reports the value chip under the pointer by its cell, nothing for a name chip or a band column, and null when it leaves, keeping the host's own pointer handlers", () => {
      const onCellHover = vi.fn();
      const onPointerOver = vi.fn();
      const onPointerOut = vi.fn();
      renderView({ onCellHover, containerProps: { onPointerOver, onPointerOut } });
      const name = card('m3').querySelector('[data-kind="input"][data-column-id="score"]');
      const column = screen.getByTestId('nl-bands').querySelector('[data-column-id="score"]');
      if (!name || !column) throw new Error('chips');
      fireEvent.pointerOver(name);
      fireEvent.pointerOver(column);
      expect(onCellHover).not.toHaveBeenCalled();
      fireEvent.pointerOver(valueChip('m3', 'score'));
      fireEvent.pointerOut(valueChip('m3', 'score'), { relatedTarget: document.body });
      expect(onCellHover.mock.calls).toEqual([[{ rowId: 'm3', columnId: 'score' }], [null]]);
      expect(onPointerOver).toHaveBeenCalledTimes(3);
      expect(onPointerOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('empty state', () => {
    it('keeps the header and bands and offers the add action', () => {
      const onAddRow = vi.fn();
      renderView({ rules: [], onAddRule: onAddRow });
      const empty = screen.getByTestId('nl-empty');
      expect(empty).toHaveTextContent('No rules yet');
      expect(screen.getAllByRole('button', { name: 'Add rule' })).toHaveLength(1);
      fireEvent.click(within(empty).getByRole('button', { name: 'Add rule' }));
      expect(onAddRow).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('nl-header')).toBeInTheDocument();
      expect(screen.getByTestId('nl-bands')).toBeInTheDocument();
    });

    it('leaves focus on the rule the user is on after a click on an add-rule action that adds none', () => {
      const onAdd = vi.fn();
      const props = {
        rules: GRID_SENTENCE_RULES,
        ...GRID_SENTENCE_COLUMNS,
        selected: { kind: 'rule', rowId: 'r1' } satisfies SentenceSelection,
        onSelect: vi.fn(),
        onAddRule: onAdd,
      };
      const { rerender } = render(view(props));
      act(() => card('r1').focus());
      fireEvent.click(screen.getByRole('button', { name: 'Add rule' }), { detail: 1 });
      rerender(view({ ...props, selected: { kind: 'rule', rowId: 'r1' } }));
      expect(onAdd).toHaveBeenCalledTimes(1);
      expect(focusedStop()).toBe('r1');
    });

    it('follows the rules with the add-rule action', () => {
      const onAdd = vi.fn();
      renderView({ onAddRule: onAdd });
      const add = screen.getByRole('button', { name: 'Add rule' });
      const list = card('m5').closest('ul');
      expect(list?.compareDocumentPosition(add)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      fireEvent.click(add);
      expect(onAdd).toHaveBeenCalledTimes(1);
    });

    it('moves focus from the empty state add-rule action to the one after the rule it adds', () => {
      const FirstRuleHost = () => {
        const [rules, setRules] = useState<SentenceRule[]>([]);
        const [selected, setSelected] = useState<SentenceSelection | null>(null);
        const onAdd = () => {
          setRules(manySentenceRules(1));
          setSelected({ kind: 'rule', rowId: 'row-0' });
        };
        return view({
          rules,
          selected,
          onSelect: setSelected,
          onAddRule: onAdd,
        });
      };
      render(<FirstRuleHost />);
      const empty = within(screen.getByTestId('nl-empty')).getByRole('button', {
        name: 'Add rule',
      });
      act(() => empty.focus());
      fireEvent.click(empty);
      expect(card('row-0')).toHaveAttribute('tabindex', '0');
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add rule' }));
    });

    it('keeps focus where it is when rules arrive after an add-rule action that added none', () => {
      const outside = document.body.appendChild(document.createElement('button'));
      onTestFinished(() => outside.remove());
      const onAdd = vi.fn();
      const props = { onAddRule: onAdd, selected: null, onSelect: vi.fn() };
      const { rerender } = render(view({ ...props, rules: [] }));
      fireEvent.click(screen.getByRole('button', { name: 'Add rule' }));
      expect(onAdd).toHaveBeenCalledTimes(1);
      act(() => outside.focus());
      rerender(view({ ...props, rules: manySentenceRules(1) }));
      expect(document.activeElement).toBe(outside);
    });

    it('keeps focus where it is when rules arrive after an add-rule action a host answered a moment later with none', async () => {
      const outside = document.body.appendChild(document.createElement('button'));
      onTestFinished(() => outside.remove());
      const props = {
        onAddRule: vi.fn(),
        selected: null,
        onSelect: vi.fn(),
      };
      const { rerender } = render(view({ ...props, rules: [] }));
      const add = screen.getByRole('button', { name: 'Add rule' });
      act(() => add.focus());
      fireEvent.click(add);
      await settleLater();
      rerender(view({ ...props, rules: [] }));
      act(() => outside.focus());
      rerender(view({ ...props, rules: manySentenceRules(1) }));
      expect(document.activeElement).toBe(outside);
    });

    it.each([
      ['the empty state, adding a rule taller than the view', 0, () => [manyLinesRule(10)], false],
      ['the footer', 3, (count: number) => manySentenceRules(count + 1), false],
      ['the empty state, a moment later', 0, () => [manyLinesRule(10)], true],
      ['the footer, a moment later', 3, (count: number) => manySentenceRules(count + 1), true],
    ])('keeps the focused add-rule action in view after a rule it adds from %s that the host leaves unselected', async (_, initialCount, added, late) => {
      const AddingHost = () => {
        const [rules, setRules] = useState<SentenceRule[]>(() => manySentenceRules(initialCount));
        currentRules = rules;
        const add = () => setRules(added(rules.length));
        return view({
          rules,
          selected: null,
          onSelect: vi.fn(),
          onAddRule: () => (late ? later(add) : add()),
        });
      };
      let currentRules: readonly SentenceRule[] = [];
      const bounds = HTMLElement.prototype.getBoundingClientRect;
      const footerBounds = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
      onTestFinished(() => footerBounds.mockRestore());
      footerBounds.mockImplementation(function (this: HTMLElement) {
        if (!this.hasAttribute('data-add-rule')) return bounds.call(this);
        const listEnd = sentenceRuleOffsets(currentRules).at(-1) ?? 0;
        const top = listEnd - (this.parentElement?.scrollTop ?? 0);
        return { ...rect(0, 400), top, bottom: top + 48 };
      });
      render(<AddingHost />);
      const frame = screen.getByTestId('nl');
      Object.defineProperty(frame, 'clientHeight', { value: 100 });
      const add = screen.getByRole('button', { name: 'Add rule' });
      act(() => add.focus());
      fireEvent.click(add);
      await settleLater();
      const footer = screen.getByRole('button', { name: 'Add rule' });
      expect(document.activeElement).toBe(footer);
      expect(footer.parentElement?.getBoundingClientRect().bottom).toBeLessThanOrEqual(100);
    });
  });

  describe('windowing', () => {
    it('mounts only the viewport and overscan of 20,000 rules, with a spacer for the rest', () => {
      const rules = manySentenceRules(20_000);
      renderView({ rules });
      const mounted = mountedRows();
      expect(mounted.map((row) => row.dataset.rowId)).toEqual(
        Array.from({ length: mounted.length }, (_, index) => `row-${index}`)
      );
      const offsets = sentenceRuleOffsets(rules);
      expect(mounted).toHaveLength(
        offsets.findIndex((top) => top >= FALLBACK_ROW_VIEWPORT_PX) + SENTENCE_RULE_OVERSCAN
      );
      expect(mounted[0]).toHaveAttribute('aria-setsize', '20000');
      const spacer = mounted.at(-1)?.nextElementSibling;
      expect(spacer).toBe(screen.getByTestId('nl-row-spacer'));
      expect(spacer).toHaveAttribute('aria-hidden', 'true');
      expect(spacer).toHaveStyle({
        height: `${(offsets[20_000] ?? 0) - (offsets[mounted.length] ?? 0)}px`,
      });
    });

    it('keeps the mounted rules when the leading spacer appears', () => {
      const rules = manySentenceRules(2000);
      renderView({ rules });
      const before = card('row-15');
      act(() => scrollTo(sentenceRuleOffsets(rules)[12] ?? 0));
      expect(screen.getAllByTestId('nl-row-spacer')).toHaveLength(2);
      expect(card('row-15')).toBe(before);
    });

    it.each([
      [
        'rebuilds its rules on every render',
        (rules: readonly SentenceRule[]) => rules.map((rule) => ({ ...rule })),
        0,
      ],
      [
        'replaces its rules with as many others',
        (rules: readonly SentenceRule[]) =>
          rules.map((rule) => ({ ...rule, rowId: `new-${rule.rowId}` })),
        17,
      ],
    ])('observes the mounted cards again only for new row ids when a host %s', (_, next, observedAgain) => {
      const observed: Element[] = [];
      vi.stubGlobal(
        'ResizeObserver',
        class {
          observe(target: Element) {
            if (target.matches('li[data-row-id]')) observed.push(target);
          }
          unobserve() {}
          disconnect() {}
        }
      );
      onTestFinished(() => {
        vi.unstubAllGlobals();
      });
      const rules = manySentenceRules(200);
      const onSelect = vi.fn();
      const { rerender } = render(view({ rules, selected: null, onSelect }));
      observed.length = 0;
      for (let count = 0; count < 5; count += 1) {
        rerender(view({ rules: next(rules), selected: null, onSelect }));
      }
      expect(observed).toHaveLength(observedAgain);
      expect(mountedRows().filter((row) => !observed.includes(row))).toEqual(
        observedAgain === 0 ? mountedRows() : []
      );
    });

    it('observes the mounted cards again only once the window or the rules change', () => {
      const observed: Element[] = [];
      vi.stubGlobal(
        'ResizeObserver',
        class {
          observe(target: Element) {
            if (target.matches('li[data-row-id]')) observed.push(target);
          }
          unobserve() {}
          disconnect() {}
        }
      );
      onTestFinished(() => {
        vi.unstubAllGlobals();
      });
      const rules = manySentenceRules(2000);
      const onSelect = vi.fn();
      const { rerender } = render(view({ rules, selected: null, onSelect }));
      expect(observed).toEqual(mountedRows());
      rerender(view({ rules, selected: { kind: 'rule', rowId: 'row-1' }, onSelect }));
      rerender(
        view({ rules, selected: { kind: 'cell', rowId: 'row-1', columnId: 'decision' }, onSelect })
      );
      expect(observed).toHaveLength(mountedRows().length);
      act(() => scrollTo(sentenceRuleOffsets(rules)[500] ?? 0));
      expect(mountedRows().filter((row) => !observed.includes(row))).toEqual([]);
      const [first] = manySentenceRules(1);
      if (!first) throw new Error('no rule');
      rerender(view({ rules: [...rules, { ...first, rowId: 'added' }], selected: null, onSelect }));
      act(() => scrollTo(sentenceRuleOffsets(rules)[1990] ?? 0));
      expect(observed).toContain(card('added'));
    });

    it('lays the rules out at the heights their cards measure once a line wraps', () => {
      const observers: ResizeObserverCallback[] = [];
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(callback: ResizeObserverCallback) {
            observers.push(callback);
          }
          observe() {}
          unobserve() {}
          disconnect() {}
        }
      );
      const rules = manySentenceRules(2000);
      renderView({ rules });
      const wrapped = card('row-2');
      const estimate = (sentenceRuleOffsets(rules)[3] ?? 0) - (sentenceRuleOffsets(rules)[2] ?? 0);
      Object.defineProperty(wrapped, 'offsetHeight', { value: estimate + 24 });
      act(() => {
        for (const callback of observers) {
          callback([{ target: wrapped } as unknown as ResizeObserverEntry], {} as ResizeObserver);
        }
      });
      act(() => scrollTo(sentenceRuleOffsets(rules)[500] ?? 0));
      const first = Number(mountedRows()[0]?.dataset.rowId?.replace('row-', ''));
      const [leading] = screen.getAllByTestId('nl-row-spacer');
      vi.unstubAllGlobals();
      expect(leading).toHaveStyle({ height: `${(sentenceRuleOffsets(rules)[first] ?? 0) + 24}px` });
    });
  });

  describe('at scale', () => {
    it('clamps each run of one column to its first 20 values and a count outside the clamp, keeping the words after it on the line and in its title', () => {
      const [first] = MULTI_SENTENCE_RULES;
      if (!first) throw new Error('fixture');
      const run = (value: (text: string) => SentenceValueToken, prefix: string, count: number) =>
        valueList(
          value,
          Array.from({ length: count }, (_, index) => `"${prefix}${index + 1}"`)
        );
      renderView({
        rules: [
          {
            ...first,
            lead: [
              'when ',
              COUNTRY,
              ' is one of ',
              ...run(country, 'C', 10_000),
              ' and ',
              CHANNEL,
              ' is one of ',
              ...run(channel, 'K', 21),
              ' and ',
              { columnId: 'age', kind: 'input', text: 'Age' },
              ' is greater than ',
              { columnId: 'age', kind: 'value', index: 0, text: '18' },
            ],
            lines: [],
          },
        ],
      });
      const leadLine = ruleLine('m1', 1);
      expect(leadLine?.querySelectorAll('[data-kind="value"]')).toHaveLength(41);
      expect(leadLine?.textContent).toMatch(
        /"C20"\+9,980 more and Channel is one of "K1", .*"K20"\+1 more and Age is greater than 18$/
      );
      const counts = [...(leadLine?.querySelectorAll<HTMLElement>('[data-more-values]') ?? [])];
      expect(
        counts.map((count) => [
          count.textContent,
          count.parentElement?.parentElement === leadLine,
          count.previousElementSibling?.textContent?.slice(-5),
        ])
      ).toEqual([
        ['+9,980 more', true, '"C20"'],
        ['+1 more', true, '"K20"'],
      ]);
      expect(counts[0]?.title).toMatch(
        /^"C21", "C22", .*"C40"… and Channel is one of "K1", .*"K20" and Age is greater than 18$/
      );
      expect(counts[1]?.title).toBe('"K21" and Age is greater than 18');
      expect(counts[1]?.nextElementSibling?.textContent).toBe(' and Age is greater than 18');
    });

    it('keeps 50 band columns on one list, named once by its caption', () => {
      renderView({ ...manyColumns(50) });
      const inputs = screen.getByRole('list', { name: 'Inputs' });
      expect(within(inputs).getAllByRole('listitem')).toHaveLength(50);
      expect(inputs.previousElementSibling).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('band lists', () => {
    const observed = new Map<Element, Set<ResizeObserverCallback>>();
    class RecordingResizeObserver {
      readonly #callback: ResizeObserverCallback;
      readonly #targets = new Set<Element>();
      constructor(callback: ResizeObserverCallback) {
        this.#callback = callback;
      }
      observe(target: Element) {
        this.#targets.add(target);
        observed.set(target, (observed.get(target) ?? new Set()).add(this.#callback));
      }
      unobserve(target: Element) {
        this.#targets.delete(target);
        observed.get(target)?.delete(this.#callback);
      }
      disconnect() {
        for (const target of this.#targets) this.unobserve(target);
      }
    }
    const resize = (element: Element) =>
      act(() => {
        for (const callback of observed.get(element) ?? []) callback([], {} as ResizeObserver);
      });
    const setWidths = (element: Element, scrollWidth: number, clientWidth: number) => {
      Object.defineProperty(element, 'scrollWidth', { configurable: true, value: scrollWidth });
      Object.defineProperty(element, 'clientWidth', { configurable: true, value: clientWidth });
    };
    const inputs = () => screen.getByRole('list', { name: 'Inputs' });
    const tabStops = async () => {
      const user = userEvent.setup();
      const stops: string[] = [];
      await user.tab();
      while (document.activeElement !== document.body && stops.length < 5) {
        stops.push(document.activeElement?.getAttribute('aria-label') ?? '');
        await user.tab();
      }
      return stops;
    };

    beforeEach(() => {
      observed.clear();
      vi.stubGlobal('ResizeObserver', RecordingResizeObserver);
    });
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('makes a band list a tab stop only while its columns overflow it', async () => {
      renderView({ ...manyColumns(50) });
      expect(inputs()).not.toHaveAttribute('tabindex');
      expect(await tabStops()).toEqual(['Rules']);
      setWidths(inputs(), 3000, 400);
      resize(inputs());
      expect(inputs()).toHaveAttribute('tabindex', '0');
      expect(await tabStops()).toEqual(['Rules', 'Inputs']);
      setWidths(inputs(), 400, 400);
      resize(inputs());
      expect(inputs()).not.toHaveAttribute('tabindex');
    });

    it('measures a band list again as a column resizes in it or joins it', async () => {
      const { rerender } = renderView();
      setWidths(inputs(), 600, 400);
      const [first] = within(inputs()).getAllByRole('listitem');
      if (!first) throw new Error('no column');
      resize(first);
      expect(inputs()).toHaveAttribute('tabindex', '0');
      setWidths(inputs(), 400, 400);
      const grown = [
        ...MULTI_SENTENCE_COLUMNS.inputs,
        { id: 'age', name: 'Age', type: 'number' as const },
      ];
      await act(async () => rerender(view({ inputs: grown })));
      expect(inputs()).not.toHaveAttribute('tabindex');
      setWidths(inputs(), 700, 400);
      const added = within(inputs()).getAllByRole('listitem').at(-1);
      if (!added) throw new Error('no added column');
      resize(added);
      expect(inputs()).toHaveAttribute('tabindex', '0');
    });

    it("drops a band list's tab stop while its columns are buttons, even as they overflow it", () => {
      renderView({
        ...manyColumns(50),
        selected: null,
        onSelect: vi.fn(),
        edit: editWith({
          column: {
            field: () => ({
              kind: 'input',
              label: 'x',
              expression: 'x',
              type: 'text',
              allowedValues: '',
            }),
            onCommit: vi.fn(),
          },
        }),
      });
      setWidths(inputs(), 3000, 400);
      resize(inputs());
      expect(within(inputs()).getAllByRole('button').length).toBeGreaterThan(0);
      expect(inputs()).not.toHaveAttribute('tabindex');
    });
  });

  describe('selection', () => {
    it('selects a value token by its cell, paints every value of it and focuses the first', () => {
      const { onSelect } = renderSelectable();
      const [first, second] = card('r2').querySelectorAll<HTMLElement>(
        '[data-kind="value"][data-column-id="age"]'
      );
      if (!first || !second) throw new Error('age values');
      fireEvent.click(second, { shiftKey: true });
      expect(onSelect.mock.calls).toEqual([[{ kind: 'cell', rowId: 'r2', columnId: 'age' }]]);
      expect(document.activeElement).toBe(first);
      expect([first, second].map((chip) => chip.dataset.selected)).toEqual(['true', 'true']);
      expect(valueChip('r2', 'income')).not.toHaveAttribute('data-selected');
    });

    it('selects the rule from a name token, an operator word or the row number', () => {
      const { onSelect } = renderSelectable({ numbered: true });
      const name = card('r2').querySelector('[data-kind="input"]');
      const word = within(card('r1')).getByText('when');
      const number = within(card('r3')).getByText('3');
      if (!name) throw new Error('name token');
      for (const target of [name, word, number]) fireEvent.click(target);
      expect(onSelect.mock.calls).toEqual([
        [{ kind: 'rule', rowId: 'r2' }],
        [{ kind: 'rule', rowId: 'r1' }],
        [{ kind: 'rule', rowId: 'r3' }],
      ]);
      expect(focusedStop()).toBe('r3');
    });

    it('selects nothing from the header or a band column', () => {
      const { onSelect } = renderSelectable();
      fireEvent.click(screen.getByTestId('nl-header'));
      fireEvent.click(within(screen.getByTestId('nl-bands')).getByText('income'));
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("selects the clamped run's cell when its count is clicked", () => {
      const { onSelect } = renderSelectable({ rules: [longValueListRule(10_000)] });
      const more = card('long-list').querySelector<HTMLElement>('[data-more-values]');
      if (!more) throw new Error('count');
      fireEvent.click(more);
      expect(onSelect.mock.calls).toEqual([
        [{ kind: 'cell', rowId: 'long-list', columnId: 'country' }],
      ]);
      expect(focusedStop()).toBe('long-list:country');
      expect(more).toHaveAttribute('data-selected', 'true');
      expect(more).not.toHaveAttribute('tabindex');
    });

    it("paints and tab-stops the host's selection without taking focus", () => {
      renderSelectable({ initial: { kind: 'cell', rowId: 'r2', columnId: 'age' } });
      const stops = document.querySelectorAll('li[data-row-id][tabindex="0"], li [tabindex="0"]');
      expect([...stops]).toEqual([valueChip('r2', 'age')]);
      expect(document.activeElement).toBe(document.body);
    });

    it.each<[string, SentenceSelection, string | null]>([
      ['a rule', { kind: 'rule', rowId: 'r2' }, 'r2'],
      [
        'a cell its row has no token for, as its rule',
        { kind: 'cell', rowId: 'r3', columnId: 'income' },
        'r3',
      ],
      ['a row that is gone, as nothing', { kind: 'rule', rowId: 'gone' }, null],
    ])('paints and tab-stops the selection of %s', (_, initial, rowId) => {
      renderSelectable({ initial });
      const rows = rowId === null ? [] : [card(rowId)];
      const stops = document.querySelectorAll('li[data-row-id][tabindex="0"], li [tabindex="0"]');
      expect([...stops]).toEqual(rows);
      expect([...document.querySelectorAll('[data-selected]')]).toEqual(
        rows.map((row) => row.firstElementChild)
      );
    });

    it('follows a selection the host changes', () => {
      const onSelect = vi.fn();
      const { rerender } = render(
        view({ rules: GRID_SENTENCE_RULES, selected: { kind: 'rule', rowId: 'r1' }, onSelect })
      );
      rerender(
        view({
          rules: GRID_SENTENCE_RULES,
          selected: { kind: 'cell', rowId: 'r3', columnId: 'risk' },
          onSelect,
        })
      );
      expect(card('r1')).toHaveAttribute('tabindex', '-1');
      expect(valueChip('r3', 'risk')).toHaveAttribute('tabindex', '0');
    });

    it('names each cell stop by its column, values and row, as a group that Enter and Space leave to the host', () => {
      const onKeyDown = vi.fn();
      renderSelectable({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' } satisfies SentenceSelection,
        containerProps: { onKeyDown },
      });
      expect(valueChip('r2', 'age')).toHaveAttribute('role', 'group');
      expect(valueChip('r2', 'age')).toHaveAccessibleName('age 25 and 60, rule 2');
      expect(screen.queryAllByRole('button')).toEqual([]);
      act(() => valueChip('r2', 'age').focus());
      expect([press('Enter'), press(' ')]).toEqual([true, true]);
      expect(onKeyDown.mock.calls.map(([event]) => event.key)).toEqual(['Enter', ' ']);
      expect(card('r2')).toHaveAccessibleName(
        'risk is "standard" when age is between 25 and 60 and income is greater than 40000'
      );
    });

    it('names each cell stop of an editable view as a button that Enter and Space start editing', () => {
      const { onStartEdit } = renderEditing({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' },
      });
      expect(valueChip('r2', 'age')).toHaveAttribute('role', 'button');
      expect(valueChip('r2', 'age')).toHaveAccessibleName('age 25 and 60, rule 2');
      expect(
        screen
          .getAllByRole('button')
          .flatMap((button) => (button.dataset.stop === '' ? [button.textContent] : []))
      ).toEqual(['"high"', '25', '40000', '"standard"', '25', '40000', '"review"', '60']);
      act(() => valueChip('r2', 'age').focus());
      expect(press(' ')).toBe(false);
      expect(onStartEdit.mock.calls).toEqual([[r2Age(0)]]);
    });

    it('names an empty value by its word, never by the dash it shows', () => {
      const edit = editWith({ editing: { rowId: 'm2', columnId: 'reason', index: 0 } });
      render(
        view({
          selected: { kind: 'cell', rowId: 'm2', columnId: 'reason' },
          onSelect: vi.fn(),
          edit,
        })
      );
      expect(valueChip('m2', 'reason')).toHaveTextContent(EMPTY_VALUE_DASH);
      expect(valueChip('m2', 'reason')).toHaveAccessibleName('Reason empty, rule 2');
      expect(editor()).toHaveAccessibleName('Reason empty, rule 2');
    });

    it('re-renders only the rules a selection leaves and enters', () => {
      const i18n = setupI18n({
        locale: 'en',
        messages: { en: { 'decision-text.cell': '{cell}, rule {position}' } },
      });
      const translate = vi.spyOn(i18n, 't');
      render(
        <I18nProvider i18n={i18n}>
          <Selectable rules={manySentenceRules(2000)} initial={{ kind: 'rule', rowId: 'row-0' }} />
        </I18nProvider>
      );
      act(() => card('row-0').focus());
      translate.mockClear();
      press('ArrowDown');
      const cellPosition = (descriptor: unknown): unknown[] =>
        descriptor instanceof Object &&
        'id' in descriptor &&
        descriptor.id === 'decision-text.cell' &&
        'values' in descriptor &&
        descriptor.values instanceof Object &&
        'position' in descriptor.values
          ? [descriptor.values.position]
          : [];
      const positions = translate.mock.calls.flatMap((args: readonly unknown[]) =>
        cellPosition(args[0])
      );
      expect(positions).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2]);
    });

    it('names a clamped cell by the values it shows and its count', () => {
      renderSelectable({ rules: [longValueListRule(10_000)] });
      const shown = Array.from({ length: 20 }, (_, index) => `"Country ${index + 1}"`).join(', ');
      expect(valueChip('long-list', 'country')).toHaveAccessibleName(
        `Country ${shown} +9,980 more, rule 1`
      );
    });

    it.each<[string, SentenceSelection, string]>([
      ['rule', { kind: 'rule', rowId: 'r2' }, 'LI'],
      ['cell', { kind: 'cell', rowId: 'r2', columnId: 'age' }, 'SPAN'],
    ])('marks the selected %s alone as current, without axe violations', async (_, initial, tag) => {
      const { container } = renderSelectable({ initial });
      const current = [...container.querySelectorAll('[aria-current]')];
      expect(
        current.map((element) => [element.tagName, element.getAttribute('aria-current')])
      ).toEqual([[tag, 'true']]);
      expect(current[0]).toBe(
        initial.kind === 'rule' ? card('r2') : valueChip('r2', initial.columnId)
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no axe violations with a cell selected', async () => {
      const { container } = renderSelectable({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' },
      });
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('keyboard', () => {
    const startAt = (initial: SentenceSelection) => {
      const rendered = renderSelectable({ initial });
      act(() =>
        (initial.kind === 'cell'
          ? valueChip(initial.rowId, initial.columnId)
          : card(initial.rowId)
        ).focus()
      );
      return rendered;
    };

    it.each<['ltr' | 'rtl', string, string]>([
      ['ltr', 'ArrowRight', 'ArrowLeft'],
      ['rtl', 'ArrowLeft', 'ArrowRight'],
    ])('steps through the stops of a %s row in reading order, clamped', (direction, on, back) => {
      const { onSelect } = renderSelectable({
        initial: { kind: 'rule', rowId: 'r1' } satisfies SentenceSelection,
        containerProps: { style: { direction } },
      });
      act(() => card('r1').focus());
      expect(walk(on, on, on, on, back)).toEqual([
        'r1:risk',
        'r1:age',
        'r1:income',
        'r1:income',
        'r1:age',
      ]);
      expect(onSelect.mock.calls.map(([selection]) => selection.columnId)).toEqual([
        'risk',
        'age',
        'income',
        'age',
      ]);
    });

    it('keeps the column a click lands on, not the one ↓ kept before it', () => {
      startAt({ kind: 'cell', rowId: 'r1', columnId: 'income' });
      expect(walk('ArrowDown', 'ArrowDown')).toEqual(['r2:income', 'r3']);
      fireEvent.click(valueChip('r1', 'age'), { detail: 1 });
      expect(focusedStop()).toBe('r1:age');
      expect(walk('ArrowDown', 'ArrowDown', 'ArrowUp')).toEqual(['r2:age', 'r3:age', 'r2:age']);
    });

    it('starts a new run of ↑ and ↓ from a click on the rule ↓ landed on', () => {
      startAt({ kind: 'cell', rowId: 'r1', columnId: 'income' });
      expect(walk('ArrowDown', 'ArrowDown')).toEqual(['r2:income', 'r3']);
      fireEvent.click(card('r3'), { detail: 1 });
      expect(focusedStop()).toBe('r3');
      expect(walk('ArrowUp')).toEqual(['r2']);
    });

    it('starts a new run of ↑ and ↓ from a click on a cell and then back on the rule ↓ landed on', () => {
      startAt({ kind: 'cell', rowId: 'r1', columnId: 'income' });
      expect(walk('ArrowDown', 'ArrowDown')).toEqual(['r2:income', 'r3']);
      fireEvent.click(valueChip('r3', 'age'), { detail: 1 });
      fireEvent.click(card('r3'), { detail: 1 });
      expect(walk('ArrowUp')).toEqual(['r2']);
    });

    it('starts a new run of ↑ and ↓ from a host select that leaves and returns to the rule ↓ landed on', () => {
      let hostSelect: (selection: SentenceSelection | null) => void = () => {};
      const Host = () => {
        const [selected, setSelected] = useState<SentenceSelection | null>({
          kind: 'cell',
          rowId: 'r1',
          columnId: 'income',
        });
        hostSelect = setSelected;
        return view({
          rules: GRID_SENTENCE_RULES,
          ...GRID_SENTENCE_COLUMNS,
          hitPolicy: GRID_SENTENCE_POLICY,
          selected,
          onSelect: setSelected,
        });
      };
      render(<Host />);
      act(() => valueChip('r1', 'income').focus());
      expect(walk('ArrowDown', 'ArrowDown')).toEqual(['r2:income', 'r3']);
      act(() => hostSelect({ kind: 'rule', rowId: 'r1' }));
      act(() => hostSelect({ kind: 'rule', rowId: 'r3' }));
      act(() => card('r3').focus());
      expect(walk('ArrowUp')).toEqual(['r2']);
    });

    it('starts a new run of ↑ and ↓ after Escape, from the rule a key enters on', () => {
      const [r1, r2, r3] = GRID_SENTENCE_RULES;
      if (!r1 || !r2 || !r3) throw new Error('no grid rules');
      renderSelectable({
        rules: [r3, r1, r2],
        initial: { kind: 'cell', rowId: 'r1', columnId: 'income' },
      });
      act(() => valueChip('r1', 'income').focus());
      expect(walk('ArrowUp', 'Escape', 'ArrowDown', 'ArrowDown')).toEqual(['r3', 'nl', 'r3', 'r1']);
    });

    it('moves a row with ↓ and ↑, keeping the column across a row without it', () => {
      startAt({ kind: 'cell', rowId: 'r1', columnId: 'income' });
      expect(walk('ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowUp', 'ArrowUp')).toEqual([
        'r2:income',
        'r3',
        'r3',
        'r2:income',
        'r1:income',
      ]);
      const [r1, r2, r3] = GRID_SENTENCE_RULES;
      if (!r1 || !r2 || !r3) throw new Error('no grid rules');
      cleanup();
      const { onSelect } = renderSelectable({
        rules: [r1, r3, r2],
        initial: { kind: 'cell', rowId: 'r1', columnId: 'income' } satisfies SentenceSelection,
      });
      act(() => valueChip('r1', 'income').focus());
      expect(walk('ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowUp')).toEqual([
        'r3',
        'r2:income',
        'r2:age',
        'r3:age',
        'r1:age',
      ]);
      expect(onSelect).toHaveBeenCalledTimes(5);
    });

    it.each<[string, KeyboardEventInit, SentenceSelection, string]>([
      ['ArrowDown', { metaKey: true }, { kind: 'cell', rowId: 'r1', columnId: 'age' }, 'r3:age'],
      ['ArrowUp', { ctrlKey: true }, { kind: 'cell', rowId: 'r3', columnId: 'age' }, 'r1:age'],
      ['End', {}, { kind: 'cell', rowId: 'r2', columnId: 'age' }, 'r2:income'],
      ['Home', {}, { kind: 'cell', rowId: 'r2', columnId: 'age' }, 'r2'],
      ['ArrowRight', { ctrlKey: true }, { kind: 'rule', rowId: 'r2' }, 'r2:income'],
      ['ArrowLeft', { metaKey: true }, { kind: 'cell', rowId: 'r2', columnId: 'income' }, 'r2'],
      ['End', { ctrlKey: true }, { kind: 'cell', rowId: 'r2', columnId: 'age' }, 'r3:age'],
      ['Home', { metaKey: true }, { kind: 'cell', rowId: 'r2', columnId: 'age' }, 'r1'],
    ])('moves with %s %o from %o to %s', (key, init, from, stop) => {
      startAt(from);
      press(key, init);
      expect(focusedStop()).toBe(stop);
    });

    it('leaves Tab and Shift+Tab on a stop to the browser, selecting nothing', () => {
      const { onSelect } = startAt({ kind: 'cell', rowId: 'r3', columnId: 'risk' });
      expect([
        press('Tab'),
        press('Tab', { shiftKey: true }),
        press('Tab', { altKey: true }),
      ]).toEqual([true, true, true]);
      expect(focusedStop()).toBe('r3:risk');
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('clears with Escape and returns focus to the view, claiming it only when something was selected', () => {
      const { onSelect } = startAt({ kind: 'cell', rowId: 'r2', columnId: 'age' });
      expect(press('Escape')).toBe(false);
      expect(onSelect.mock.calls).toEqual([[null]]);
      expect(document.activeElement).toBe(screen.getByTestId('nl'));
      expect(press('Escape')).toBe(true);
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('selects the first visible rule on the first arrow, Home or End with nothing selected', () => {
      const rules = manySentenceRules(2000);
      const { onSelect } = renderSelectable({ rules });
      act(() => scrollTo(sentenceRuleOffsets(rules)[500] ?? 0));
      act(() => screen.getByTestId('nl').focus());
      expect(press('End')).toBe(false);
      expect(onSelect.mock.calls).toEqual([[{ kind: 'rule', rowId: 'row-500' }]]);
      expect(focusedStop()).toBe('row-500');
    });

    it.each<[string, SentenceSelection | null, string[]]>([
      ['nothing', null, ['Tab', 'Escape', 'a', 'PageDown', ' ']],
      [
        'a cell',
        { kind: 'cell', rowId: 'r2', columnId: 'age' },
        ['PageUp', 'PageDown', ' ', 'Enter', 'F2', 'a'],
      ],
    ])('leaves keys it has no move for alone with %s selected', (_, initial, keys) => {
      const { onSelect } = renderSelectable({ initial });
      act(() => screen.getByTestId('nl').focus());
      expect(keys.map((key) => press(key))).toEqual(keys.map(() => true));
      expect(press('a', { metaKey: true })).toBe(true);
      expect(onSelect).not.toHaveBeenCalled();
    });

    const aroundView = () => {
      const before = document.body.insertBefore(
        document.createElement('button'),
        document.body.firstChild
      );
      const after = document.body.appendChild(document.createElement('button'));
      onTestFinished(() => {
        before.remove();
        after.remove();
      });
      return { before, after };
    };
    const overflowingBandLists = () => {
      const scrollWidth = vi
        .spyOn(Element.prototype, 'scrollWidth', 'get')
        .mockImplementation(function (this: Element) {
          return this.matches('ul[aria-label]') ? 3000 : 0;
        });
      onTestFinished(() => scrollWidth.mockRestore());
    };
    const tabs = async (count: number, shift = false) => {
      const user = userEvent.setup();
      const focused: (Element | null)[] = [];
      for (const _ of Array.from({ length: count })) {
        await user.tab({ shift });
        focused.push(document.activeElement);
      }
      return focused;
    };

    it.each<[string, SentenceSelection, string]>([
      ['a rule', { kind: 'rule', rowId: 'r2' }, 'r2'],
      ['a cell', { kind: 'cell', rowId: 'r2', columnId: 'age' }, 'r2:age'],
    ])('lands Tab into the view on the selected stop with %s selected, and Tab or Shift+Tab from it leaves the view', async (_, initial, stop) => {
      const { onSelect } = renderSelectable({ initial, ...NO_COLUMNS });
      const { before, after } = aroundView();
      act(() => before.focus());
      await tabs(1);
      expect(focusedStop()).toBe(stop);
      expect(await tabs(1)).toEqual([after]);
      await tabs(1, true);
      expect(focusedStop()).toBe(stop);
      expect(await tabs(1, true)).toEqual([before]);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('passes the band lists going into the view and stops on them going back out of it from the selected stop', async () => {
      overflowingBandLists();
      const { onSelect } = renderSelectable({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' },
      });
      const { before, after } = aroundView();
      const inputs = screen.getByRole('list', { name: 'Inputs' });
      const outputs = screen.getByRole('list', { name: 'Outputs' });
      const stop = valueChip('r2', 'age');
      act(() => before.focus());
      expect(await tabs(2)).toEqual([stop, after]);
      expect(await tabs(4, true)).toEqual([stop, outputs, inputs, before]);
      expect(await tabs(1)).toEqual([stop]);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('leaves focus on the view a pointer gives it with a stop selected', () => {
      const { onSelect } = renderSelectable({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' },
      });
      const view = screen.getByTestId('nl');
      fireEvent.pointerDown(view);
      act(() => view.focus());
      fireEvent.pointerUp(view);
      expect(document.activeElement).toBe(view);
      act(() => valueChip('r2', 'age').focus());
      act(() => view.focus());
      expect(document.activeElement).toBe(view);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it.each([
      ['a mouse click', ['pointerdown', 'mousedown', 'focus', 'pointerup', 'mouseup', 'click']],
      ['a touch tap', ['pointerdown', 'pointerup', 'mousedown', 'focus', 'mouseup', 'click']],
    ] as const)('leaves focus on the view %s on its header gives it with a stop selected', (_, order) => {
      const { onSelect } = renderSelectable({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' },
      });
      const view = screen.getByTestId('nl');
      const header = screen.getByTestId('nl-header');
      const fire = {
        pointerdown: () => fireEvent.pointerDown(header),
        pointerup: () => fireEvent.pointerUp(header),
        mousedown: () => fireEvent.mouseDown(header),
        focus: () => act(() => view.focus()),
        mouseup: () => fireEvent.mouseUp(header),
        click: () => fireEvent.click(header),
      };
      for (const step of order) fire[step]();
      expect(document.activeElement).toBe(view);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it.each<[string, (view: HTMLElement, header: HTMLElement) => void]>([
      [
        'a click on its header that moves no focus',
        (_, header) => {
          fireEvent.pointerDown(header);
          fireEvent.pointerUp(header);
          fireEvent.click(header);
        },
      ],
      [
        'a press on its header released outside the view',
        (view, header) => {
          fireEvent.pointerDown(header);
          act(() => view.focus());
          fireEvent.pointerUp(document.body);
          fireEvent.click(document.body);
        },
      ],
      [
        'a touch on its header the browser cancels to scroll',
        (_, header) => {
          fireEvent.pointerDown(header);
          fireEvent.pointerCancel(header);
        },
      ],
      [
        'a touch held on its header that no click follows',
        (_, header) => {
          fireEvent.pointerDown(header, { pointerType: 'touch' });
          fireEvent.pointerUp(header, { pointerType: 'touch' });
        },
      ],
    ])('lands Tab into the view on the selected stop after %s', async (_, gesture) => {
      const { onSelect } = renderSelectable({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' },
      });
      const { before } = aroundView();
      gesture(screen.getByTestId('nl'), screen.getByTestId('nl-header'));
      act(() => before.focus());
      await tabs(1);
      expect(focusedStop()).toBe('r2:age');
      expect(onSelect).not.toHaveBeenCalled();
    });

    it.each<[string, (view: HTMLElement, header: HTMLElement, before: HTMLElement) => void]>([
      [
        'a touch on its header the browser cancels to scroll',
        (_, header) => {
          fireEvent.pointerDown(header, { pointerType: 'touch' });
          fireEvent.pointerCancel(header, { pointerType: 'touch' });
        },
      ],
      [
        'a press on its header whose focus a script then moved out of the view',
        (view, header, before) => {
          fireEvent.pointerDown(header);
          act(() => view.focus());
          act(() => before.focus());
        },
      ],
    ])('moves the focus a script gives the view to the selected stop after %s', (_, gesture) => {
      const { onSelect } = renderSelectable({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' },
      });
      const { before } = aroundView();
      const view = screen.getByTestId('nl');
      gesture(view, screen.getByTestId('nl-header'), before);
      act(() => view.focus());
      expect(focusedStop()).toBe('r2:age');
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('stops waiting for the end of a press once the view unmounts', () => {
      const add = vi.spyOn(document, 'addEventListener');
      const remove = vi.spyOn(document, 'removeEventListener');
      onTestFinished(() => {
        add.mockRestore();
        remove.mockRestore();
      });
      const { unmount } = renderSelectable({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' },
      });
      add.mockClear();
      fireEvent.pointerDown(screen.getByTestId('nl-header'));
      const waiting = add.mock.calls.filter(([type]) => type === 'keydown');
      expect(waiting).toHaveLength(1);
      unmount();
      expect(remove.mock.calls).toContainEqual(waiting[0]);
    });

    it.each([
      ['band lists that overflow', true],
      ['no bands', false],
    ])('moves Tab on from the view a press on its header leaves focused to the selected stop, past %s', async (_, overflowing) => {
      if (overflowing) overflowingBandLists();
      const { onSelect } = renderSelectable({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' } satisfies SentenceSelection,
        ...(!overflowing && NO_COLUMNS),
      });
      const view = screen.getByTestId('nl');
      const header = screen.getByTestId('nl-header');
      fireEvent.pointerDown(header);
      act(() => view.focus());
      fireEvent.pointerUp(header);
      fireEvent.click(header);
      expect(document.activeElement).toBe(view);
      expect(await tabs(1)).toEqual([valueChip('r2', 'age')]);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('lands Shift+Tab from the band lists on the view itself with nothing selected', async () => {
      overflowingBandLists();
      const { onSelect } = renderSelectable();
      const { before } = aroundView();
      const inputs = screen.getByRole('list', { name: 'Inputs' });
      act(() => before.focus());
      expect(await tabs(2)).toEqual([screen.getByTestId('nl'), inputs]);
      expect(await tabs(2, true)).toEqual([screen.getByTestId('nl'), before]);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('lands Tab into the view on the view itself with nothing selected', async () => {
      const { onSelect } = renderSelectable({ ...NO_COLUMNS });
      const { before, after } = aroundView();
      act(() => before.focus());
      expect(await tabs(2)).toEqual([screen.getByTestId('nl'), after]);
      expect(await tabs(2, true)).toEqual([screen.getByTestId('nl'), before]);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it.each([
      'the document',
      'a shadow root, focus moving beside the view in it',
    ])("keeps no focus pending from a move the host refused, so the host's own later select of it leaves focus alone, in %s", (scope) => {
      const host = document.body.appendChild(document.createElement('div'));
      onTestFinished(() => host.remove());
      const shadow = scope === 'the document' ? undefined : host.attachShadow({ mode: 'open' });
      const root = shadow ?? document;
      const outside = (shadow ?? document.body).appendChild(document.createElement('button'));
      onTestFinished(() => outside.remove());
      const container = (shadow ?? host).appendChild(document.createElement('div'));
      const onSelect = vi.fn();
      const props = { rules: GRID_SENTENCE_RULES, ...GRID_SENTENCE_COLUMNS, onSelect };
      const { rerender } = render(view({ ...props, selected: { kind: 'rule', rowId: 'r2' } }), {
        container,
      });
      const r2 = within(container).getByTestId('nl-row-r2');
      act(() => r2.focus());
      fireEvent.keyDown(r2, { key: 'ArrowRight' });
      expect(onSelect.mock.calls).toEqual([[{ kind: 'cell', rowId: 'r2', columnId: 'risk' }]]);
      act(() => outside.focus());
      rerender(view({ ...props, selected: { kind: 'cell', rowId: 'r2', columnId: 'risk' } }));
      expect(root.activeElement).toBe(outside);
    });

    it.each([
      ['ArrowRight', { kind: 'cell', rowId: 'r2', columnId: 'risk' }, 'r2:risk'],
      ['ArrowDown', { kind: 'rule', rowId: 'r3' }, 'r3'],
    ])('focuses where %s moves once the host applies the select a moment later, after rendering without it', async (key, expected, stop) => {
      const onSelect = vi.fn();
      const LateHost = () => {
        const [selected, setSelected] = useState<SentenceSelection | null>({
          kind: 'rule',
          rowId: 'r2',
        });
        const [saving, setSaving] = useState(false);
        return view({
          rules: GRID_SENTENCE_RULES,
          ...GRID_SENTENCE_COLUMNS,
          hitPolicy: GRID_SENTENCE_POLICY,
          containerProps: { 'data-saving': String(saving) },
          selected,
          onSelect: (next) => {
            onSelect(next);
            setSaving(true);
            later(() => setSelected(next));
          },
        });
      };
      render(<LateHost />);
      act(() => card('r2').focus());
      press(key);
      await settleLater();
      expect(onSelect.mock.calls).toEqual([[expected]]);
      expect(focusedStop()).toBe(stop);
    });

    it('keeps the column ↓ started from across moves the host applies a moment later, after rendering without them', async () => {
      const LateHost = () => {
        const [selected, setSelected] = useState<SentenceSelection | null>({
          kind: 'cell',
          rowId: 'r1',
          columnId: 'income',
        });
        const [saving, setSaving] = useState(false);
        return view({
          rules: GRID_SENTENCE_RULES,
          ...GRID_SENTENCE_COLUMNS,
          hitPolicy: GRID_SENTENCE_POLICY,
          containerProps: { 'data-saving': String(saving) },
          selected,
          onSelect: (next) => {
            setSaving((was) => !was);
            later(() => setSelected(next));
          },
        });
      };
      render(<LateHost />);
      act(() => valueChip('r1', 'income').focus());
      const stops = [];
      for (const key of ['ArrowDown', 'ArrowDown', 'ArrowUp']) {
        press(key);
        await settleLater();
        stops.push(focusedStop());
      }
      expect(stops).toEqual(['r2:income', 'r3', 'r2:income']);
    });

    it("keeps no focus pending from a move a host refused a moment later, so the host's own later select of it leaves focus alone", async () => {
      const outside = document.body.appendChild(document.createElement('button'));
      onTestFinished(() => outside.remove());
      const props = { rules: GRID_SENTENCE_RULES, ...GRID_SENTENCE_COLUMNS, onSelect: vi.fn() };
      const { rerender } = render(view({ ...props, selected: { kind: 'rule', rowId: 'r2' } }));
      act(() => card('r2').focus());
      press('ArrowRight');
      await settleLater();
      rerender(view({ ...props, selected: { kind: 'rule', rowId: 'r2' } }));
      act(() => outside.focus());
      rerender(view({ ...props, selected: { kind: 'cell', rowId: 'r2', columnId: 'risk' } }));
      expect(document.activeElement).toBe(outside);
    });

    it('focuses the selected stop on a move that stays put', () => {
      const { onSelect } = renderSelectable({
        initial: { kind: 'cell', rowId: 'r3', columnId: 'age' },
      });
      act(() => screen.getByTestId('nl').focus());
      expect(press('End')).toBe(false);
      expect(focusedStop()).toBe('r3:age');
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('tells the host to select the rule when its selected cell has no value in it', () => {
      const initial: SentenceSelection = { kind: 'cell', rowId: 'r3', columnId: 'income' };
      const { onSelect, unmount } = renderSelectable({ initial });
      fireEvent.click(card('r3'));
      expect(onSelect.mock.calls).toEqual([[{ kind: 'rule', rowId: 'r3' }]]);
      expect(focusedStop()).toBe('r3');
      unmount();
      const home = renderSelectable({ initial });
      act(() => screen.getByTestId('nl').focus());
      press('Home');
      expect(home.onSelect.mock.calls).toEqual([[{ kind: 'rule', rowId: 'r3' }]]);
    });

    it('ignores a key mid-composition', () => {
      const { onSelect } = startAt({ kind: 'cell', rowId: 'r2', columnId: 'age' });
      expect(press('ArrowRight', { isComposing: true })).toBe(true);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('ignores a key from a text field inside a row', () => {
      const { onSelect } = startAt({ kind: 'cell', rowId: 'r2', columnId: 'age' });
      const field = document.createElement('input');
      card('r2').append(field);
      act(() => field.focus());
      expect(press('ArrowRight')).toBe(true);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('ignores a key something inside a row already claimed', () => {
      const { onSelect } = startAt({ kind: 'cell', rowId: 'r2', columnId: 'age' });
      valueChip('r2', 'age').addEventListener('keydown', (event) => event.preventDefault());
      press('ArrowRight');
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('leaves a band list its own arrows', () => {
      const { onSelect } = renderSelectable({ initial: { kind: 'rule', rowId: 'r2' } });
      act(() => screen.getByRole('list', { name: 'Inputs' }).focus());
      expect([press('ArrowRight'), press('End')]).toEqual([true, true]);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("hands the host's own handlers what the view leaves alone", () => {
      const onKeyDown = vi.fn();
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      const onClick = vi.fn();
      const onPointerCancel = vi.fn();
      renderSelectable({
        initial: { kind: 'rule', rowId: 'r2' } satisfies SentenceSelection,
        containerProps: { onKeyDown, onFocus, onBlur, onClick, onPointerCancel },
      });
      act(() => card('r2').focus());
      press('ArrowRight');
      press('a');
      fireEvent.click(valueChip('r1', 'risk'));
      act(() => card('r1').blur());
      fireEvent.pointerCancel(card('r1'));
      expect(onKeyDown.mock.calls.map(([event]) => event.key)).toEqual(['a']);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onPointerCancel).toHaveBeenCalledTimes(1);
      expect(onFocus).toHaveBeenCalled();
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('focus through windowing', () => {
    it('keeps the selected row and its focus mounted while it scrolls out and back', () => {
      const rules = manySentenceRules(2000);
      renderSelectable({ rules });
      fireEvent.click(valueChip('row-0', 'decision'));
      const chip = valueChip('row-0', 'decision');
      act(() => scrollTo(sentenceRuleOffsets(rules)[500] ?? 0));
      expect(card('row-500')).toBeInTheDocument();
      expect(document.activeElement).toBe(chip);
      act(() => scrollTo(0));
      expect(document.activeElement).toBe(chip);
      expect(valueChip('row-0', 'decision')).toBe(chip);
    });

    it.each([
      'the document',
      'a shadow root',
    ])('returns focus to the view when the focused row is removed, in %s', (scope) => {
      const host = document.body.appendChild(document.createElement('div'));
      onTestFinished(() => host.remove());
      const shadow = scope === 'a shadow root' ? host.attachShadow({ mode: 'open' }) : undefined;
      const container = (shadow ?? host).appendChild(document.createElement('div'));
      const { rerender } = render(<Selectable />, { container });
      const inView = within(container);
      fireEvent.click(
        inView
          .getByTestId('nl-row-r2')
          .querySelector('[data-kind="value"][data-column-id="age"]') ?? container
      );
      rerender(<Selectable rules={GRID_SENTENCE_RULES.filter(({ rowId }) => rowId !== 'r2')} />);
      expect((shadow ?? document).activeElement).toBe(inView.getByTestId('nl'));
    });

    it.each([
      'the document',
      'a shadow root',
    ])('leaves focus where the host moves it out of the view as it removes the focused rule, in %s', (scope) => {
      const outside = document.body.appendChild(document.createElement('button'));
      onTestFinished(() => outside.remove());
      const host = document.body.appendChild(document.createElement('div'));
      onTestFinished(() => host.remove());
      const shadow = scope === 'a shadow root' ? host.attachShadow({ mode: 'open' }) : undefined;
      const container = (shadow ?? host).appendChild(document.createElement('div'));
      const RemovingHost = ({ removed }: { removed: boolean }) => {
        useLayoutEffect(() => {
          if (removed) outside.focus();
        }, [removed]);
        return (
          <Selectable
            rules={
              removed
                ? GRID_SENTENCE_RULES.filter(({ rowId }) => rowId !== 'r2')
                : GRID_SENTENCE_RULES
            }
          />
        );
      };
      const { rerender } = render(<RemovingHost removed={false} />, { container });
      fireEvent.click(
        within(container)
          .getByTestId('nl-row-r2')
          .querySelector('[data-kind="value"][data-column-id="age"]') ?? container
      );
      rerender(<RemovingHost removed />);
      expect(document.activeElement).toBe(outside);
    });

    it('scrolls a rule the host selects into view, without taking focus', () => {
      const rules = manySentenceRules(2000);
      const onSelect = vi.fn();
      const { rerender } = render(
        view({ rules, selected: { kind: 'rule', rowId: 'row-0' }, onSelect })
      );
      const frame = screen.getByTestId('nl');
      expect(frame.scrollTop).toBe(0);
      rerender(view({ rules, selected: { kind: 'rule', rowId: 'row-1500' }, onSelect }));
      const offsets = sentenceRuleOffsets(rules);
      expect(frame.scrollTop).toBe((offsets[1501] ?? 0) - FALLBACK_ROW_VIEWPORT_PX);
      expect(card('row-1500')).toHaveAttribute('tabindex', '0');
      expect(document.activeElement).toBe(document.body);
      rerender(
        view({
          rules,
          selected: { kind: 'cell', rowId: 'row-1500', columnId: 'decision' },
          onSelect,
        })
      );
      act(() => scrollTo(0));
      rerender(
        view({ rules, selected: { kind: 'cell', rowId: 'row-1500', columnId: 'reason' }, onSelect })
      );
      expect(frame.scrollTop).toBe(0);
    });

    it('scrolls on a key to a cell its row scrolled past, and to the top of a rule taller than the view', () => {
      renderSelectable({ initial: { kind: 'cell', rowId: 'r2', columnId: 'age' } });
      const frame = screen.getByTestId('nl');
      Object.defineProperty(frame, 'clientHeight', { value: 100 });
      const chip = valueChip('r3', 'age');
      vi.spyOn(chip, 'getBoundingClientRect').mockReturnValue({
        ...rect(0, 40),
        top: 300,
        bottom: 324,
      });
      act(() => valueChip('r2', 'age').focus());
      press('ArrowDown');
      expect(focusedStop()).toBe('r3:age');
      const rowEnd = sentenceRuleOffsets(GRID_SENTENCE_RULES)[3] ?? 0;
      expect(frame.scrollTop).toBe(rowEnd - 100 + 224);
      vi.spyOn(card('r1'), 'getBoundingClientRect').mockReturnValue({
        ...rect(0, 400),
        top: 20,
        bottom: 370,
      });
      press('Home', { metaKey: true });
      expect(focusedStop()).toBe('r1');
      expect(frame.scrollTop).toBe(20);
    });

    it('leaves a rule taller than the view where it is when a click selects it', () => {
      renderSelectable({ rules: [manyLinesRule(10)] });
      const frame = screen.getByTestId('nl');
      Object.defineProperty(frame, 'clientHeight', { value: 100 });
      act(() => scrollTo(150));
      vi.spyOn(card('many-lines'), 'getBoundingClientRect').mockImplementation(() => ({
        ...rect(0, 400),
        top: -frame.scrollTop,
        bottom: 400 - frame.scrollTop,
      }));
      fireEvent.click(within(card('many-lines')).getAllByText('is')[3] as HTMLElement);
      expect(focusedStop()).toBe('many-lines');
      expect(frame.scrollTop).toBe(150);
    });

    it.each([
      'selectable',
      'editable',
    ])('leaves a rule partly in view where it is when a click on its value selects it, %s', (mode) => {
      const rules = manySentenceRules(30);
      const props = {
        rules,
        initial: { kind: 'rule', rowId: 'row-0' } satisfies SentenceSelection,
      };
      if (mode === 'editable') renderEditing(props);
      else renderSelectable(props);
      const frame = screen.getByTestId('nl');
      Object.defineProperty(frame, 'clientHeight', { value: 300 });
      const at = (sentenceRuleOffsets(rules)[10] ?? 0) - 300 + 40;
      act(() => scrollTo(at));
      const chip = valueChip('row-10', 'decision');
      fireEvent.pointerDown(chip);
      fireEvent.pointerUp(chip);
      fireEvent.click(chip, { detail: 1 });
      expect(screen.queryByTestId('nl-editor') !== null).toBe(mode === 'editable');
      if (mode === 'selectable') expect(focusedStop()).toBe('row-10:decision');
      expect(frame.scrollTop).toBe(at);
    });

    it.each([
      ['refuses', false],
      ['applies', true],
    ])('leaves a rule taller than the view where it is when the host %s the clear a click on its remove action asks for', (_, applies) => {
      const ClearingHost = () => {
        const [rules, setRules] = useState<SentenceRule[]>(() => [manyLinesRule(10)]);
        const [selected, setSelected] = useState<SentenceSelection | null>({
          kind: 'rule',
          rowId: 'many-lines',
        });
        return view({
          rules,
          ...manyColumns(10),
          selected,
          onSelect: setSelected,
          edit: editWith({
            onClearCell: (cell) => {
              if (!applies) return;
              setRules((current) =>
                current.map((rule) => ({
                  ...rule,
                  lines: rule.lines.filter((line) => line.columnId !== cell.columnId),
                }))
              );
            },
          }),
        });
      };
      render(<ClearingHost />);
      const frame = screen.getByTestId('nl');
      Object.defineProperty(frame, 'clientHeight', { value: 100 });
      act(() => scrollTo(150));
      const bounds = HTMLElement.prototype.getBoundingClientRect;
      const cardBounds = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
      onTestFinished(() => cardBounds.mockRestore());
      cardBounds.mockImplementation(function (this: HTMLElement) {
        if (this.tagName !== 'LI' || this.dataset.rowId !== 'many-lines') return bounds.call(this);
        return { ...rect(0, 400), top: -frame.scrollTop, bottom: 400 - frame.scrollTop };
      });
      const remove = card('many-lines').querySelectorAll<HTMLElement>(
        '[data-rule-action="clear"]'
      )[3];
      if (!remove) throw new Error('no fourth remove action');
      const columnId = remove.closest<HTMLElement>('li[data-column-id]')?.dataset.columnId;
      fireEvent.pointerDown(remove);
      act(() => remove.focus());
      fireEvent.pointerUp(remove);
      fireEvent.click(remove, { detail: 1 });
      expect(card('many-lines').querySelector(`li[data-column-id="${columnId}"]`) === null).toBe(
        applies
      );
      expect(frame.scrollTop).toBe(150);
    });

    it('leaves a visible cell of a rule taller than the view where it is', () => {
      renderSelectable({ rules: [manyLinesRule(10)] });
      const frame = screen.getByTestId('nl');
      Object.defineProperty(frame, 'clientHeight', { value: 100 });
      act(() => scrollTo(150));
      const chip = valueChip('many-lines', 'input-5');
      vi.spyOn(chip, 'getBoundingClientRect').mockImplementation(() => ({
        ...rect(0, 40),
        top: 181 - frame.scrollTop,
        bottom: 205 - frame.scrollTop,
      }));
      fireEvent.click(chip);
      expect(frame.scrollTop).toBe(150);
    });

    it('scrolls the cell the host selects in a rule taller than the view out from under the header', () => {
      const rules = [...manySentenceRules(3), manyLinesRule(10)];
      const onSelect = vi.fn();
      const { rerender } = render(
        view({ rules, selected: { kind: 'rule', rowId: 'row-0' }, onSelect })
      );
      const frame = screen.getByTestId('nl');
      Object.defineProperty(frame, 'clientHeight', { value: 100 });
      Object.defineProperty(screen.getByTestId('nl-header'), 'offsetHeight', { value: 33 });
      const chip = valueChip('many-lines', 'decision');
      const chipTop = (sentenceRuleOffsets(rules)[3] ?? 0) + 11;
      vi.spyOn(chip, 'getBoundingClientRect').mockImplementation(() => ({
        ...rect(0, 40),
        top: chipTop - frame.scrollTop,
        bottom: chipTop + 24 - frame.scrollTop,
      }));
      rerender(
        view({
          rules,
          selected: { kind: 'cell', rowId: 'many-lines', columnId: 'decision' },
          onSelect,
        })
      );
      const { top, bottom } = chip.getBoundingClientRect();
      expect(top).toBeGreaterThanOrEqual(33);
      expect(bottom).toBeLessThanOrEqual(100);
      expect(document.activeElement).toBe(document.body);
    });

    it.each([
      'the document',
      'a shadow root',
    ])('keeps a focused add-rule action in view after the rule it adds, or a cell of it the host selects, in %s', (scope) => {
      const AddingHost = () => {
        const [rules, setRules] = useState(() => manySentenceRules(3));
        const [selected, setSelected] = useState<SentenceSelection | null>(null);
        const onAdd = () => {
          setRules(manySentenceRules(rules.length + 1));
          setSelected(
            rules.length > 3
              ? { kind: 'cell', rowId: `row-${rules.length}`, columnId: 'decision' }
              : { kind: 'rule', rowId: `row-${rules.length}` }
          );
        };
        return view({
          rules,
          selected,
          onSelect: setSelected,
          onAddRule: onAdd,
        });
      };
      const host = document.body.appendChild(document.createElement('div'));
      const shadow = scope === 'a shadow root' ? host.attachShadow({ mode: 'open' }) : undefined;
      const container = (shadow ?? host).appendChild(document.createElement('div'));
      render(<AddingHost />, { container });
      const inView = within(container);
      const frame = inView.getByTestId('nl');
      Object.defineProperty(frame, 'clientHeight', { value: 100 });
      const add = inView.getByRole('button', { name: 'Add rule' });
      const footer = add.parentElement;
      if (!footer) throw new Error('no add-rule footer');
      vi.spyOn(footer, 'getBoundingClientRect').mockImplementation(() => {
        const mounted = container.querySelectorAll('li[data-row-id]').length;
        const listEnd = sentenceRuleOffsets(manySentenceRules(mounted)).at(-1) ?? 0;
        return {
          ...rect(0, 400),
          top: listEnd - frame.scrollTop,
          bottom: listEnd + 48 - frame.scrollTop,
        };
      });
      for (const added of [3, 4]) {
        add.focus();
        fireEvent.click(add);
        const row = inView.getByTestId(`nl-row-row-${added}`);
        const stop =
          added > 3 ? row.querySelector('[data-kind="value"][data-column-id="decision"]') : row;
        expect(stop).toHaveAttribute('tabindex', '0');
        expect((shadow ?? document).activeElement).toBe(add);
        expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(100);
      }
      host.remove();
    });

    it('scrolls a rule the host selects out from under the sticky header', () => {
      const rules = manySentenceRules(2000);
      const { rerender } = render(view({ rules, selected: null, onSelect: vi.fn() }));
      Object.defineProperty(screen.getByTestId('nl-header'), 'offsetHeight', { value: 33 });
      const top = sentenceRuleOffsets(rules)[100] ?? 0;
      act(() => scrollTo(top - 10));
      rerender(view({ rules, selected: { kind: 'rule', rowId: 'row-100' }, onSelect: vi.fn() }));
      expect(screen.getByTestId('nl').scrollTop).toBe(top - 33);
    });
  });

  describe('editing', () => {
    it('takes edit only with a controlled selection, without which no card control is tabbable', () => {
      render(
        <DecisionText
          table={{
            rules: GRID_SENTENCE_RULES,
            ...GRID_SENTENCE_COLUMNS,
            hitPolicy: GRID_SENTENCE_POLICY,
          }}
          hitPolicies={HIT_POLICIES}
          columnTypes={COLUMN_TYPES}
          ariaLabel="Rules"
          dataTestId="nl"
          // @ts-expect-error
          mode={{ kind: 'edit', edit: editWith(), onAddRule: vi.fn() }}
        />
      );
      const controls = card('r1').querySelectorAll<HTMLElement>('button, [tabindex]');
      expect(controls.length).toBeGreaterThan(0);
      expect([...controls].filter((control) => control.tabIndex >= 0)).toEqual([]);
    });

    it('selects the cell of a clicked value, then starts editing that value', () => {
      const { onSelect, onStartEdit } = renderEditing();
      fireEvent.click(secondAge());
      expect(onSelect.mock.calls).toEqual([[{ kind: 'cell', rowId: 'r2', columnId: 'age' }]]);
      expect(onStartEdit.mock.calls).toEqual([[r2Age(1)]]);
      expect(onSelect.mock.invocationCallOrder[0]).toBeLessThan(
        onStartEdit.mock.invocationCallOrder[0] ?? 0
      );
    });

    it('stays read-only without edit: a click only selects and Enter, F2 and Delete reach the host', () => {
      const onKeyDown = vi.fn();
      const { onSelect } = renderSelectable({ containerProps: { onKeyDown } });
      fireEvent.click(secondAge());
      expect(onSelect.mock.calls).toEqual([[{ kind: 'cell', rowId: 'r2', columnId: 'age' }]]);
      expect(screen.queryByTestId('nl-editor')).toBeNull();
      expect([press('Enter'), press('F2'), press('Delete')]).toEqual([true, true, true]);
      expect(onKeyDown.mock.calls.map(([event]) => event.key)).toEqual(['Enter', 'F2', 'Delete']);
    });

    it('starts editing the first value of a selected cell on Enter, Space or F2, never on a rule or mid-composition', () => {
      const { onStartEdit } = renderEditing({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' },
      });
      act(() => valueChip('r2', 'age').focus());
      expect(press('Enter')).toBe(false);
      press('Escape');
      expect(press(' ')).toBe(false);
      press('Escape');
      expect(press('F2')).toBe(false);
      expect(onStartEdit.mock.calls).toEqual([[r2Age(0)], [r2Age(0)], [r2Age(0)]]);
      press('Escape');
      press('Enter', { isComposing: true });
      press(' ', { isComposing: true });
      press('Home');
      expect(focusedStop()).toBe('r2');
      press('Enter');
      press(' ');
      press('F2');
      expect(onStartEdit).toHaveBeenCalledTimes(3);
    });

    it('opens one editor outside the card, seeded with the value, named by its cell and without axe violations', async () => {
      const { container } = renderEditing({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' } satisfies SentenceSelection,
        initialEditing: r2Age(1),
      });
      expect(screen.getAllByTestId('nl-editor')).toHaveLength(1);
      expect(editor()).toHaveValue('60');
      expect(editor()).toHaveAccessibleName('age 60, rule 2');
      expect(screen.getByRole('dialog', { name: 'age 60, rule 2' })).toContainElement(editor());
      expect(card('r2').closest('ul')?.contains(editor())).toBe(false);
      expect(document.activeElement).toBe(editor());
      expect(await axe(container)).toHaveNoViolations();
    });

    it('opens the editor inside the section width on its first render', () => {
      const lefts: string[] = [];
      const record = (event: FocusEvent) => {
        if (event.target instanceof HTMLInputElement) {
          lefts.push(screen.getByTestId('nl-value-editor').style.left);
        }
      };
      document.addEventListener('focusin', record);
      const width = vi
        .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
        .mockImplementation(function (this: HTMLElement) {
          return this.tagName === 'DIALOG' ? 256 : 0;
        });
      const { onStartEdit } = renderEditing({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' },
      });
      Object.defineProperty(screen.getByTestId('nl'), 'clientWidth', { value: 400 });
      const chip = secondAge();
      vi.spyOn(chip, 'getBoundingClientRect').mockReturnValue(rect(350, 370));
      fireEvent.click(chip);
      document.removeEventListener('focusin', record);
      width.mockRestore();
      expect(onStartEdit).toHaveBeenCalledWith(r2Age(1));
      expect(lefts).toEqual(['144px']);
      expect(screen.getByTestId('nl-value-editor')).toHaveStyle({ left: '144px' });
    });

    it.each<[string, number, number, number, { top: string; left: string }]>([
      ['under its value when it fits below', 900, 1280, 600, { top: '624px', left: '600px' }],
      ['above its value when only that fits', 700, 1280, 600, { top: '400px', left: '600px' }],
      ['at the window bottom when neither fits', 300, 1280, 150, { top: '100px', left: '150px' }],
      ['inside the window right edge', 900, 700, 600, { top: '624px', left: '444px' }],
    ])('places the open editor %s', (_, innerHeight, innerWidth, at, expected) => {
      const size = vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(innerHeight);
      const across = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(innerWidth);
      const height = vi
        .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
        .mockImplementation(function (this: HTMLElement) {
          return this.tagName === 'DIALOG' ? 200 : 0;
        });
      const width = vi
        .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
        .mockImplementation(function (this: HTMLElement) {
          return this.tagName === 'DIALOG' ? 256 : 0;
        });
      renderEditing({ initial: { kind: 'cell', rowId: 'r2', columnId: 'age' } });
      Object.defineProperty(screen.getByTestId('nl'), 'clientWidth', { value: 2000 });
      const chip = secondAge();
      vi.spyOn(chip, 'getBoundingClientRect').mockReturnValue({
        ...rect(at, at + 40),
        top: at,
        bottom: at + 24,
        y: at,
      });
      fireEvent.click(chip);
      expect(screen.getByTestId('nl-value-editor')).toHaveStyle(expected);
      for (const spy of [size, across, height, width]) spy.mockRestore();
    });

    it('places an editor open on mount once when the page leaves its dialog the browser margins', () => {
      const computed = window.getComputedStyle;
      const spies = [
        vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(700),
        vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
          this: HTMLElement
        ) {
          return this.tagName === 'DIALOG' ? 200 : 0;
        }),
        vi
          .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
          .mockReturnValue({ ...rect(0, 40), top: 600, bottom: 624, y: 600 }),
        vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
          const style = computed(element, pseudo);
          if (!(element instanceof HTMLDialogElement)) return style;
          const between = (700 - (Number.parseFloat(element.style.top) || 0) - 200) / 2;
          const marginTop = element.style.bottom === 'auto' ? '0px' : `${between}px`;
          return new Proxy(style, {
            get: (target, key) => (key === 'marginTop' ? marginTop : Reflect.get(target, key)),
          });
        }),
      ];
      onTestFinished(() => {
        for (const spy of spies) spy.mockRestore();
      });
      renderEditing({ initialEditing: r2Age(1) });
      expect(screen.getByTestId('nl-value-editor')).toHaveStyle({ top: '400px' });
    });

    it('places the editor once at the right edge when the page leaves its dialog to fit its content', () => {
      const spies = [
        vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(640),
        vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
          this: HTMLElement
        ) {
          if (this.tagName !== 'DIALOG') return 0;
          if (!this.querySelector('input')) return 40;
          return Math.min(298, 640 - (Number.parseFloat(this.style.left) || 0));
        }),
      ];
      onTestFinished(() => {
        for (const spy of spies) spy.mockRestore();
      });
      renderEditing({ initial: { kind: 'cell', rowId: 'r2', columnId: 'age' } });
      Object.defineProperty(screen.getByTestId('nl'), 'clientWidth', { value: 639 });
      const chip = secondAge();
      vi.spyOn(chip, 'getBoundingClientRect').mockReturnValue(rect(500, 540));
      fireEvent.click(chip);
      expect(screen.getByTestId('nl-value-editor')).toHaveStyle({ left: '341px' });
    });

    it('moves the open editor with its value once a web font moves it', async () => {
      const fonts = new EventTarget();
      Object.defineProperty(document, 'fonts', { value: fonts, configurable: true });
      renderEditing({ initial: { kind: 'cell', rowId: 'r1', columnId: 'age' } });
      Object.defineProperty(screen.getByTestId('nl'), 'clientWidth', { value: 800 });
      const [chip] = valueChips('r2', 'age');
      if (!chip) throw new Error('age value');
      let start = 100;
      vi.spyOn(chip, 'getBoundingClientRect').mockImplementation(() => rect(start, start + 45));
      fireEvent.click(chip);
      expect(screen.getByTestId('nl-value-editor')).toHaveStyle({ left: '100px' });
      start = 420;
      await act(async () => {
        fonts.dispatchEvent(new Event('loadingdone'));
        await new Promise(requestAnimationFrame);
      });
      expect(screen.getByTestId('nl-value-editor')).toHaveStyle({ left: '420px' });
      Reflect.deleteProperty(document, 'fonts');
    });

    it.each<[string]>([
      ['the page'],
      ['a shadow-root panel the view is slotted into'],
    ])('moves the open editor with its value once %s scrolls', async (scroller) => {
      const slotted = scroller !== 'the page';
      const panel = document.body.appendChild(document.createElement('div'));
      onTestFinished(() => panel.remove());
      const inner = panel.attachShadow({ mode: 'open' }).appendChild(document.createElement('div'));
      const slot = inner.appendChild(document.createElement('slot'));
      const container = panel.appendChild(document.createElement('div'));
      if (slotted) Object.defineProperty(container, 'assignedSlot', { value: slot });
      renderEditing({ initial: { kind: 'cell', rowId: 'r1', columnId: 'age' } }, container);
      Object.defineProperty(screen.getByTestId('nl'), 'clientWidth', { value: 800 });
      const [chip] = valueChips('r2', 'age');
      if (!chip) throw new Error('age value');
      let start = 100;
      vi.spyOn(chip, 'getBoundingClientRect').mockImplementation(() => rect(start, start + 45));
      fireEvent.click(chip);
      expect(screen.getByTestId('nl-value-editor')).toHaveStyle({ left: '100px' });
      start = 300;
      await act(async () => {
        fireEvent.scroll(slotted ? inner : document);
        await new Promise(requestAnimationFrame);
      });
      expect(screen.getByTestId('nl-value-editor')).toHaveStyle({ left: '300px' });
    });

    it('moves the open editor with its value once a mark wraps it onto the next line', () => {
      const spies = renderEditing({ initial: { kind: 'cell', rowId: 'r1', columnId: 'age' } });
      Object.defineProperty(screen.getByTestId('nl'), 'clientWidth', { value: 800 });
      const [chip] = valueChips('r2', 'age');
      if (!chip) throw new Error('age value');
      let start = 330;
      vi.spyOn(chip, 'getBoundingClientRect').mockImplementation(() => rect(start, start + 45));
      fireEvent.click(chip);
      expect(screen.getByTestId('nl-value-editor')).toHaveStyle({ left: '330px' });
      start = 40;
      const marks = rowMarks({
        r2: { cells: { age: { tone: 'error', title: 'Not a number', glyph: true } } },
      });
      spies.rerender(<EditingHost spies={spies} marks={marks} />);
      expect(screen.getByTestId('nl-value-editor')).toHaveStyle({ left: '40px' });
    });

    it('moves the open editor with its value when the host inserts a rule above it', () => {
      const boxes = vi
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockImplementation(function (this: HTMLElement) {
          const row = this.closest<HTMLElement>('li[data-row-id]');
          const top = row ? (mountedRows().indexOf(row) + 1) * 100 : 0;
          return { ...rect(0, 20), top, bottom: top + 24, y: top };
        });
      const spies = renderEditing({ initial: { kind: 'cell', rowId: 'r2', columnId: 'age' } });
      fireEvent.click(secondAge());
      expect(screen.getByTestId('nl-value-editor')).toHaveStyle({ top: '224px' });
      const [first] = GRID_SENTENCE_RULES;
      const inserted = first ? [{ ...first, rowId: 'r0' }] : [];
      spies.rerender(<EditingHost spies={spies} rules={[...inserted, ...GRID_SENTENCE_RULES]} />);
      boxes.mockRestore();
      expect(screen.getByTestId('nl-value-editor')).toHaveStyle({ top: '324px' });
    });

    it('commits once on Enter, then selects and focuses the same cell of the next rule', () => {
      const { onCommit, onSelect } = renderEditing({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' } satisfies SentenceSelection,
        initialEditing: r2Age(1),
      });
      fireEvent.change(editor(), { target: { value: '61' } });
      fireEvent.keyDown(editor(), { key: 'Enter' });
      expect(onCommit.mock.calls).toEqual([[r2Age(1), '61', 'down']]);
      expect(screen.queryByTestId('nl-editor')).toBeNull();
      expect(onSelect.mock.calls).toEqual([[{ kind: 'cell', rowId: 'r3', columnId: 'age' }]]);
      expect(focusedStop()).toBe('r3:age');
    });

    it.each([
      'with a render',
      'silently',
      'a moment later',
    ])('drops a Tab the host refused %s, so closing the editor later opens no other value', async (refusal) => {
      const onStartEdit = vi.fn();
      const RefusingHost = () => {
        const [editing, setEditing] = useState<SentenceValueId | null>(r2Age(0));
        const [, setRefusals] = useState(0);
        return (
          <>
            <button type="button" onClick={() => setEditing(null)}>
              Close
            </button>
            {view({
              rules: GRID_SENTENCE_RULES,
              ...GRID_SENTENCE_COLUMNS,
              selected: { kind: 'cell', rowId: 'r2', columnId: 'age' } satisfies SentenceSelection,
              onSelect: vi.fn(),
              edit: editWith({
                editing,
                onStartEdit,
                onCommit: () => {
                  if (refusal === 'with a render') setRefusals((count) => count + 1);
                  if (refusal === 'a moment later') later(() => setRefusals((count) => count + 1));
                },
              }),
            })}
          </>
        );
      };
      render(<RefusingHost />);
      fireEvent.keyDown(editor(), { key: 'Tab' });
      await settleLater();
      expect(editor()).toHaveValue('25');
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByTestId('nl-editor')).toBeNull();
      expect(onStartEdit).not.toHaveBeenCalled();
    });

    const LateEditingHost = ({ refuse = false }: { refuse?: boolean }) => {
      const [editing, setEditing] = useState<SentenceValueId | null>(r2Age(0));
      const [selected, setSelected] = useState<SentenceSelection | null>({
        kind: 'cell',
        rowId: 'r2',
        columnId: 'age',
      });
      const close = () => later(() => setEditing(refuse ? (current) => current : null));
      return (
        <>
          <button type="button" onClick={() => setEditing(null)}>
            Close
          </button>
          {view({
            rules: GRID_SENTENCE_RULES,
            ...GRID_SENTENCE_COLUMNS,
            selected,
            onSelect: setSelected,
            edit: editWith({ editing, onStartEdit: setEditing, onCommit: close, onCancel: close }),
          })}
        </>
      );
    };

    it.each<[string, KeyboardEventInit, string, string]>([
      ['Enter', { key: 'Enter' }, '', 'r3:age'],
      ['Escape', { key: 'Escape' }, '', 'r2:age'],
    ])('moves on from %s once the host closes the editor a moment later', async (_, key, opened, stop) => {
      render(<LateEditingHost />);
      fireEvent.keyDown(editor(), key);
      await settleLater();
      expect(screen.queryByTestId('nl-editor') === null ? '' : editor().value).toBe(opened);
      expect(focusedStop()).toBe(stop);
    });

    it.each([
      ['while the editor stays open', false],
      ['once focus leaves before the host closes the editor a moment later', true],
    ])('commits nothing on a blur after Escape cancels the edit, %s', async (_, late) => {
      const outside = document.body.appendChild(document.createElement('button'));
      onTestFinished(() => outside.remove());
      const onCommit = vi.fn();
      const SlowCancelHost = () => {
        const [editing, setEditing] = useState<SentenceValueId | null>(r2Age(0));
        return view({
          rules: GRID_SENTENCE_RULES,
          ...GRID_SENTENCE_COLUMNS,
          selected: { kind: 'cell', rowId: 'r2', columnId: 'age' } satisfies SentenceSelection,
          onSelect: vi.fn(),
          edit: editWith({
            editing,
            onCommit,
            onCancel: () => {
              if (late) later(() => setEditing(null));
            },
          }),
        });
      };
      render(<SlowCancelHost />);
      fireEvent.change(editor(), { target: { value: 'cancelled' } });
      fireEvent.keyDown(editor(), { key: 'Escape' });
      act(() => outside.focus());
      await settleLater();
      expect(onCommit).not.toHaveBeenCalled();
    });

    it('leaves focus where the host moves it as it closes the editor a moment after Enter', async () => {
      const outside = document.body.appendChild(document.createElement('button'));
      onTestFinished(() => outside.remove());
      const onSelect = vi.fn();
      const MovingHost = () => {
        const [editing, setEditing] = useState<SentenceValueId | null>(r2Age(0));
        return view({
          rules: GRID_SENTENCE_RULES,
          ...GRID_SENTENCE_COLUMNS,
          selected: { kind: 'cell', rowId: 'r2', columnId: 'age' } satisfies SentenceSelection,
          onSelect,
          edit: editWith({
            editing,
            onCommit: () =>
              later(() => {
                outside.focus();
                setEditing(null);
              }),
          }),
        });
      };
      render(<MovingHost />);
      fireEvent.keyDown(editor(), { key: 'Enter' });
      await settleLater();
      expect(screen.queryByTestId('nl-editor')).toBeNull();
      expect(onSelect).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(outside);
    });

    it.each<[string, KeyboardEventInit]>([
      ['Tab', { key: 'Tab' }],
      ['Escape', { key: 'Escape' }],
    ])('neither moves nor reopens when the host closes the editor after a click, having refused %s a moment later', async (_, key) => {
      render(<LateEditingHost refuse />);
      fireEvent.keyDown(editor(), key);
      await settleLater();
      expect(screen.getByTestId('nl-editor')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByTestId('nl-editor')).toBeNull();
      expect(document.activeElement).toBe(screen.getByTestId('nl'));
    });

    it('cancels the edit of a rule its delete action removes, as a clear of the edited cell does', () => {
      const { onCancel } = renderEditing({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' } satisfies SentenceSelection,
        initialEditing: r2Age(0),
        refuse: true,
      });
      fireEvent.click(within(card('r2')).getByRole('button', { name: 'Delete rule 2' }));
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('nl-editor')).toBeNull();
    });

    it('cancels once the edit of a rule the host removes another way, as by undo or another client', () => {
      const onCancel = vi.fn();
      const props = {
        ...GRID_SENTENCE_COLUMNS,
        selected: { kind: 'cell', rowId: 'r2', columnId: 'age' } satisfies SentenceSelection,
        onSelect: vi.fn(),
        edit: editWith({ editing: r2Age(0), onCancel }),
      };
      const without = GRID_SENTENCE_RULES.filter(({ rowId }) => rowId !== 'r2');
      const { rerender } = render(view({ ...props, rules: GRID_SENTENCE_RULES }));
      expect(screen.getByTestId('nl-editor')).toBeInTheDocument();
      rerender(view({ ...props, rules: without }));
      rerender(view({ ...props, rules: [...without] }));
      expect(screen.queryByTestId('nl-editor')).toBeNull();
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('keeps the editor closed when a rule the host removed while it was edited comes back', () => {
      const CancellingHost = ({ rules }: { rules: readonly SentenceRule[] }) => {
        const [editing, setEditing] = useState<SentenceValueId | null>(r2Age(0));
        return view({
          rules,
          ...GRID_SENTENCE_COLUMNS,
          selected: { kind: 'cell', rowId: 'r2', columnId: 'age' } satisfies SentenceSelection,
          onSelect: vi.fn(),
          edit: editWith({ editing, onCancel: () => setEditing(null) }),
        });
      };
      const { rerender } = render(<CancellingHost rules={GRID_SENTENCE_RULES} />);
      rerender(
        <CancellingHost rules={GRID_SENTENCE_RULES.filter(({ rowId }) => rowId !== 'r2')} />
      );
      rerender(<CancellingHost rules={GRID_SENTENCE_RULES} />);
      expect(card('r2')).toBeInTheDocument();
      expect(screen.queryByTestId('nl-editor')).toBeNull();
    });

    it('cancels on Escape back to the chip, and commits in place on a press outside, focusing the chip again', () => {
      const { onCancel, onCommit } = renderEditing({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' } satisfies SentenceSelection,
        initialEditing: r2Age(1),
      });
      fireEvent.keyDown(editor(), { key: 'Escape' });
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(focusedStop()).toBe('r2:age');
      fireEvent.click(secondAge());
      const outside = document.createElement('button');
      document.body.append(outside);
      act(() => outside.focus());
      expect(onCommit).not.toHaveBeenCalled();
      act(() => editor().focus());
      pressOutside(screen.getByTestId('nl-value-editor'));
      expect(onCommit.mock.calls).toEqual([[r2Age(1), '60', 'none']]);
      expect(focusedStop()).toBe('r2:age');
      outside.remove();
    });

    it('keeps the editor and its draft open on a refused commit', () => {
      const { onCommit, onSelect } = renderEditing({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' } satisfies SentenceSelection,
        initialEditing: r2Age(1),
        refuse: true,
      });
      fireEvent.change(editor(), { target: { value: '61' } });
      fireEvent.keyDown(editor(), { key: 'Enter' });
      expect(editor()).toHaveValue('61');
      expect(document.activeElement).toBe(editor());
      expect(onSelect).not.toHaveBeenCalled();
      fireEvent.blur(editor());
      expect(onCommit).toHaveBeenCalledTimes(1);
      fireEvent.change(editor(), { target: { value: '62' } });
      pressOutside(screen.getByTestId('nl-value-editor'));
      expect(onCommit.mock.calls).toEqual([
        [r2Age(1), '61', 'down'],
        [r2Age(1), '62', 'none'],
      ]);
    });

    it("swaps in the host's editor from Edit expression, handing it the value it edits, applying only from the popover", () => {
      const contexts: ExpressionEditorProps[] = [];
      const renderEditor = (context: ExpressionEditorProps) => {
        contexts.push(context);
        return <textarea aria-label={context.ariaLabel} defaultValue={context.value} />;
      };
      const { onCommit } = renderEditing({ initialEditing: r2Age(1), renderEditor });
      expect(editor()).toHaveValue('60');
      expect(contexts).toEqual([]);
      fireEvent.click(screen.getByRole('button', { name: 'Edit expression' }));
      expect(screen.queryByTestId('nl-editor')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Edit expression' })).toBeNull();
      expect(screen.getByRole('textbox', { name: 'age 60, rule 2' })).toHaveValue('60');
      const context = contexts.at(-1);
      expect(context?.target).toEqual(r2Age(1));
      act(() => context?.onChange('x'));
      expect(onCommit).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
      expect(onCommit.mock.calls).toEqual([[r2Age(1), 'x', 'none']]);
    });

    it('keeps the edited rule and its editor mounted while it scrolls away, with nothing selected', () => {
      const rules = manySentenceRules(400);
      renderEditing({
        rules,
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        initialEditing: { rowId: 'row-300', columnId: 'decision', index: 0 },
      });
      const input = editor();
      act(() => scrollTo(sentenceRuleOffsets(rules)[300] ?? 0));
      act(() => scrollTo(0));
      expect(card('row-300')).toBeInTheDocument();
      expect(editor()).toBe(input);
    });

    it("keeps the editor's keys from the navigation and hands them to the host's handlers, as the grid's cell editor does", () => {
      const onKeyDown = vi.fn();
      const { onSelect, onClearCell, onCommit } = renderEditing({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' } satisfies SentenceSelection,
        initialEditing: r2Age(1),
        containerProps: { onKeyDown },
      });
      expect([
        press('ArrowDown'),
        press('ArrowRight'),
        press('Delete'),
        press('s', { ctrlKey: true }),
        press('z', { ctrlKey: true }),
      ]).toEqual([true, true, true, true, true]);
      expect(onSelect).not.toHaveBeenCalled();
      expect(onClearCell).not.toHaveBeenCalled();
      expect(onCommit).not.toHaveBeenCalled();
      expect(onKeyDown.mock.calls.map(([event]) => event.key)).toEqual([
        'ArrowDown',
        'ArrowRight',
        'Delete',
        's',
        'z',
      ]);
    });
  });

  describe('value popover', () => {
    let uninstallInertness: () => void = () => {};
    beforeAll(() => {
      uninstallInertness = installModalInertness();
    });
    afterAll(() => uninstallInertness());
    const AGE_OFFERS: readonly FixtureOffer[] = [
      { operator: '<', label: OPERATOR_WORDS['<'], shape: 'single' },
      { operator: '>', label: OPERATOR_WORDS['>'], shape: 'single' },
    ];
    const RISKS = ['"high"', '"standard"', '"review"'];
    const r1Age: SentenceValueId = { rowId: 'r1', columnId: 'age', index: 0 };
    const r1Risk: SentenceValueId = { rowId: 'r1', columnId: 'risk', index: 0 };
    const r3Channel: SentenceValueId = { rowId: 'r3', columnId: 'channel', index: 0 };
    const CHANNEL_COLUMNS = {
      ...GRID_SENTENCE_COLUMNS,
      inputs: [
        ...GRID_SENTENCE_COLUMNS.inputs,
        { id: 'channel', name: 'channel', type: 'text' as const },
      ],
    };
    const field = (cell: SentenceCellId): ValueFieldData<FixtureOperator> => {
      if (cell.columnId === 'risk') return { kind: 'outcome', allowedValues: RISKS };
      if (cell.columnId === 'channel') return conditionField(AGE_OFFERS, single('>'));
      return conditionField(AGE_OFFERS, single('<', '25'), { expression: '< 25' });
    };
    const popover = () => screen.getByTestId('nl-value-editor');
    const inPopover = () => within(popover());
    const operatorSelect = () => inPopover().getByRole('combobox', { name: 'Operator' });
    const action = (name: string) => inPopover().getByRole('button', { name });
    const pressApply = () => {
      const apply = action('Apply');
      const hit = (apply.matches(':disabled') && apply.parentElement) || apply;
      fireEvent.pointerDown(hit);
      if (fireEvent.mouseDown(hit) && !apply.matches(':disabled')) act(() => apply.focus());
      fireEvent.pointerUp(hit);
      fireEvent.mouseUp(hit);
      fireEvent.click(hit);
    };

    it('cancels from Cancel an expression typed into a host editor', () => {
      const { onCommit, onCancel } = renderEditing({
        initialEditing: r1Age,
        valueField: field,
        renderEditor: hostInput,
      });
      fireEvent.click(action('Edit expression'));
      fireEvent.change(screen.getByTestId('host-editor'), { target: { value: 'x' } });
      const cancel = action('Cancel');
      act(() => cancel.focus());
      fireEvent.click(cancel);
      expect(onCommit).not.toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('applies from Apply the text a host editor reports through onChange', () => {
      const { onCommit } = renderEditing({
        initialEditing: r1Age,
        valueField: field,
        renderEditor: hostInput,
      });
      fireEvent.click(action('Edit expression'));
      fireEvent.change(screen.getByTestId('host-editor'), { target: { value: 'x' } });
      fireEvent.click(action('Apply'));
      expect(onCommit.mock.calls).toEqual([[r1Age, 'x', 'none']]);
    });

    it('applies from Apply the text a refused Enter submitted from a host editor', async () => {
      const user = userEvent.setup();
      const { onCommit } = renderEditing({
        initialEditing: r1Age,
        valueField: field,
        refuse: true,
        renderEditor: hostInput,
      });
      await user.click(action('Edit expression'));
      await user.clear(screen.getByTestId('host-editor'));
      await user.type(screen.getByTestId('host-editor'), 'x{Enter}');
      await user.click(action('Apply'));
      expect(onCommit.mock.calls).toEqual([
        [r1Age, 'x', 'down'],
        [r1Age, 'x', 'none'],
      ]);
    });

    it('applies an expression a host editor held as focus moved to the footer, on a press outside', () => {
      const { onCommit } = renderEditing({
        initialEditing: r1Age,
        valueField: field,
        renderEditor: hostInput,
      });
      fireEvent.click(action('Edit expression'));
      const expression = screen.getByRole('textbox', { name: 'age 25, rule 1' });
      act(() => expression.focus());
      fireEvent.change(expression, { target: { value: 'x' } });
      act(() => action('Apply').focus());
      expect(onCommit).not.toHaveBeenCalled();
      act(() => screen.getByTestId('nl').focus());
      expect(onCommit).not.toHaveBeenCalled();
      pressOutside(popover());
      expect(onCommit.mock.calls).toEqual([[r1Age, 'x', 'none']]);
    });

    it('returns focus to the value from Apply when the view is in a shadow root', () => {
      const host = document.body.appendChild(document.createElement('div'));
      onTestFinished(() => host.remove());
      const shadow = host.attachShadow({ mode: 'open' });
      const container = shadow.appendChild(document.createElement('div'));
      renderEditing(
        {
          initial: { kind: 'cell', rowId: 'r1', columnId: 'age' },
          initialEditing: r1Age,
          valueField: field,
        },
        container
      );
      const inShadow = within(container);
      fireEvent.click(
        within(inShadow.getByTestId('nl-value-editor')).getByRole('button', { name: 'Apply' })
      );
      expect(inShadow.queryByTestId('nl-value-editor')).toBeNull();
      expect(shadow.activeElement).toBe(
        inShadow.getByTestId('nl-row-r1').querySelector('[data-kind="value"][data-column-id="age"]')
      );
    });

    it("titles the popover with its column's type glyph", () => {
      renderEditing({ initialEditing: r1Risk, valueField: field });
      expect(popover().querySelector('svg')?.getAttribute('class')).toBe('lucide lucide-type');
    });

    it("titles the popover with the column's type glyph and name, over the cell's operator and value", () => {
      renderEditing({
        initialEditing: r1Age,
        valueField: field,
        inputs: GRID_SENTENCE_COLUMNS.inputs.map((column) => ({ ...column, type: 'number' })),
      });
      expect(popover().querySelector('svg')?.getAttribute('class')).toBe('lucide lucide-hash');
      expect(inPopover().getByText('age')).toBeInTheDocument();
      expect(operatorSelect()).toHaveTextContent('is less than');
      expect(editor()).toHaveValue('25');
      expect(
        inPopover()
          .getAllByRole('button')
          .map((button) => button.textContent)
      ).toEqual(['Edit expression', 'Cancel', 'Apply']);
    });

    it('opens the operator list from the value input on Alt+ArrowDown or Alt+ArrowUp, and returns focus to it on a pick', () => {
      const { onCommit, onCancel } = renderEditing({ initialEditing: r1Age, valueField: field });
      expect(editor()).toHaveAttribute('aria-keyshortcuts', 'Alt+ArrowDown Alt+ArrowUp');
      fireEvent.keyDown(editor(), { key: 'ArrowDown' });
      expect(screen.queryByRole('listbox')).toBeNull();
      fireEvent.keyDown(editor(), { key: 'ArrowDown', altKey: true });
      fireEvent.click(screen.getByRole('option', { name: 'is greater than' }));
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(document.activeElement).toBe(editor());
      fireEvent.keyDown(editor(), { key: 'ArrowUp', altKey: true });
      fireEvent.click(screen.getByRole('option', { name: 'is less than' }));
      expect(document.activeElement).toBe(editor());
      expect(onCommit).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
      fireEvent.keyDown(editor(), { key: 'ArrowDown', altKey: true });
      fireEvent.click(screen.getByRole('option', { name: 'is greater than' }));
      fireEvent.keyDown(editor(), { key: 'Enter' });
      expect(onCommit.mock.calls).toEqual([[r1Age, '25', 'down', '>']]);
    });

    it('shows no operator select or shortcut for a cell the host offers none for', () => {
      renderEditing({ initialEditing: r2Age(1) });
      expect(inPopover().queryByRole('combobox')).toBeNull();
      expect(inPopover().getByText('age')).toBeInTheDocument();
      expect(editor()).toHaveValue('60');
      expect(editor()).not.toHaveAttribute('aria-keyshortcuts');
      fireEvent.keyDown(editor(), { key: 'ArrowDown', altKey: true });
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(editor()).toBeInTheDocument();
    });

    it('opens a condition whose operator the host does not offer as its expression', () => {
      renderEditing({
        initialEditing: r1Age,
        valueField: () => conditionField(AGE_OFFERS, single('!=', '25'), { expression: '!= 25' }),
      });
      expect(inPopover().queryByRole('combobox', { name: 'Operator' })).toBeNull();
      expect(inPopover().getByRole('textbox')).toHaveValue('!= 25');
    });

    it('commits the picked operator with the value on Enter, and moves down as before', () => {
      const { onCommit, onSelect } = renderEditing({
        initial: { kind: 'cell', rowId: 'r1', columnId: 'age' } satisfies SentenceSelection,
        initialEditing: r1Age,
        valueField: field,
      });
      fireEvent.click(operatorSelect());
      fireEvent.click(screen.getByRole('option', { name: 'is greater than' }));
      expect(operatorSelect()).toHaveTextContent('is greater than');
      expect(onCommit).not.toHaveBeenCalled();
      fireEvent.keyDown(editor(), { key: 'Enter' });
      expect(onCommit.mock.calls).toEqual([[r1Age, '25', 'down', '>']]);
      expect(onSelect.mock.calls).toEqual([[{ kind: 'cell', rowId: 'r2', columnId: 'age' }]]);
      expect(focusedStop()).toBe('r2:age');
    });

    it('commits an allowed value from a click on its radio, offering no text field beside them', () => {
      const { onCommit } = renderEditing({
        initialEditing: r1Risk,
        valueField: field,
        renderEditor: () => null,
      });
      const high = inPopover().getByRole('radio', { name: '"high"' });
      expect(high).toBeChecked();
      expect(document.activeElement).toBe(high);
      expect(inPopover().queryByRole('textbox')).toBeNull();
      expect(action('Edit expression')).toBeInTheDocument();
      fireEvent.click(inPopover().getByRole('radio', { name: '"review"' }));
      expect(onCommit.mock.calls).toEqual([[r1Risk, '"review"', 'none']]);
      expect(screen.queryByTestId('nl-value-editor')).toBeNull();
    });

    it('moves the choice with an arrow key without committing, and commits it on Enter', async () => {
      const { onCommit } = renderEditing({ initialEditing: r1Risk, valueField: field });
      const standard = inPopover().getByRole('radio', { name: '"standard"' });
      fireEvent.keyDown(inPopover().getByRole('radio', { name: '"high"' }), { key: 'ArrowDown' });
      await waitFor(() => expect(standard).toBeChecked());
      fireEvent.keyUp(standard, { key: 'ArrowDown' });
      expect(document.activeElement).toBe(standard);
      expect(onCommit).not.toHaveBeenCalled();
      fireEvent.keyDown(standard, { key: 'Enter' });
      expect(onCommit.mock.calls).toEqual([[r1Risk, '"standard"', 'down']]);
    });

    it('commits the value an arrow key moved to on Space', async () => {
      const { onCommit } = renderEditing({ initialEditing: r1Risk, valueField: field });
      const user = userEvent.setup();
      const standard = inPopover().getByRole('radio', { name: '"standard"' });
      await user.keyboard('{ArrowDown}');
      await waitFor(() => expect(standard).toBeChecked());
      expect(document.activeElement).toBe(standard);
      await user.keyboard(' ');
      expect(onCommit.mock.calls).toEqual([[r1Risk, '"standard"', 'none']]);
    });

    it('shows a value the column does not allow as the checked radio after the allowed ones, marked not allowed', () => {
      const { onCommit } = renderEditing({
        initialEditing: r1Risk,
        valueField: () => ({ kind: 'outcome', allowedValues: ['"standard"', '"review"'] }),
      });
      const high = inPopover().getByRole('radio', { name: '"high"' });
      expect(inPopover().getAllByRole('radio').indexOf(high)).toBe(2);
      expect(high).toBeChecked();
      expect(high).toHaveAccessibleDescription('Not one of the allowed values');
      expect(
        inPopover().getByRole('radio', { name: '"standard"' })
      ).not.toHaveAccessibleDescription();
      expect(popover().querySelectorAll('[data-glyph="error"]')).toHaveLength(1);
      fireEvent.click(inPopover().getByRole('radio', { name: '"review"' }));
      expect(onCommit.mock.calls).toEqual([[r1Risk, '"review"', 'none']]);
    });

    it("focuses an empty outcome's first allowed value without choosing it", () => {
      const m2Reason: SentenceValueId = { rowId: 'm2', columnId: 'reason', index: 0 };
      const { onCommit } = renderEditing({
        rules: MULTI_SENTENCE_RULES,
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        initialEditing: m2Reason,
        valueField: () => ({ kind: 'outcome', allowedValues: ['"prime"', '"low score"'] }),
      });
      const radios = inPopover().getAllByRole('radio');
      expect(radios).toHaveLength(2);
      expect(document.activeElement).toBe(radios[0]);
      expect(radios.filter((radio) => radio.getAttribute('aria-checked') === 'true')).toEqual([]);
      fireEvent.click(action('Apply'));
      expect(onCommit.mock.calls).toEqual([[m2Reason, '', 'none']]);
    });

    it("offers an empty outcome the host's allowed values without their empty or repeated ones, none checked", () => {
      const m2Reason: SentenceValueId = { rowId: 'm2', columnId: 'reason', index: 0 };
      renderEditing({
        rules: MULTI_SENTENCE_RULES,
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        initialEditing: m2Reason,
        valueField: () => ({
          kind: 'outcome',
          allowedValues: ['', '"prime"', ' ', '"prime"', '"low score"'],
        }),
      });
      const radios = inPopover().getAllByRole('radio');
      expect(radios.map((radio) => radio.getAttribute('value'))).toEqual([
        '"prime"',
        '"low score"',
      ]);
      expect(radios.filter((radio) => radio.getAttribute('aria-checked') === 'true')).toEqual([]);
    });

    it("offers the host's operators without their repeated ones", () => {
      renderEditing({
        initialEditing: r1Age,
        valueField: () =>
          conditionField(
            [...AGE_OFFERS, { operator: '<', label: OPERATOR_WORDS['<'], shape: 'single' }],
            single('<')
          ),
      });
      fireEvent.click(operatorSelect());
      expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
        'is less than',
        'is greater than',
      ]);
    });

    it('returns focus to the operator once a key picks one that takes no value', async () => {
      renderEditing({
        initialEditing: r1Age,
        valueField: () =>
          conditionField([...AGE_OFFERS, offerOf('isEmpty', 'valueless')], single('<', '25')),
      });
      const value = inPopover().getByRole('textbox');
      act(() => value.focus());
      fireEvent.keyDown(value, { key: 'ArrowDown', altKey: true });
      const option = screen.getByRole('option', { name: 'is empty' });
      act(() => option.focus());
      fireEvent.keyDown(option, { key: 'Enter' });
      expect(inPopover().queryByRole('textbox')).toBeNull();
      await waitFor(() => expect(document.activeElement).toBe(operatorSelect()));
    });

    it('opens the operator list from an allowed value on Alt+ArrowDown, and returns focus to it on a pick', () => {
      const m3Channel: SentenceValueId = { rowId: 'm3', columnId: 'channel', index: 0 };
      const { onCommit } = renderEditing({
        rules: MULTI_SENTENCE_RULES,
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        initialEditing: m3Channel,
        valueField: () =>
          conditionField(AGE_OFFERS, single('<', '"branch"'), {
            allowedValues: ['"web"', '"branch"'],
          }),
      });
      const branch = inPopover().getByRole('radio', { name: '"branch"' });
      expect(branch).toHaveAttribute('aria-keyshortcuts', 'Alt+ArrowDown Alt+ArrowUp');
      fireEvent.keyDown(branch, { key: 'ArrowDown', altKey: true });
      fireEvent.keyUp(branch, { key: 'ArrowDown', altKey: true });
      fireEvent.click(screen.getByRole('option', { name: 'is greater than' }));
      expect(document.activeElement).toBe(branch);
      expect(branch).toBeChecked();
      fireEvent.keyDown(branch, { key: 'Enter' });
      expect(onCommit.mock.calls).toEqual([[m3Channel, '"branch"', 'down', '>']]);
    });

    it('clears an outcome with a value from Clear, and offers no Clear on a condition', () => {
      const { onClearCell, onCancel, onCommit } = renderEditing({
        initialEditing: r1Risk,
        valueField: field,
      });
      fireEvent.click(action('Clear'));
      expect(onClearCell.mock.calls).toEqual([[{ rowId: 'r1', columnId: 'risk' }]]);
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onCommit).not.toHaveBeenCalled();
      expect(screen.queryByTestId('nl-value-editor')).toBeNull();
      fireEvent.click(valueChip('r1', 'age'));
      expect(inPopover().queryByRole('button', { name: 'Clear' })).toBeNull();
    });

    it('cancels from Cancel back to the chip, committing nothing', () => {
      const { onCancel, onCommit } = renderEditing({
        initial: { kind: 'cell', rowId: 'r2', columnId: 'age' } satisfies SentenceSelection,
        initialEditing: r2Age(1),
      });
      fireEvent.change(editor(), { target: { value: '61' } });
      fireEvent.click(action('Cancel'));
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onCommit).not.toHaveBeenCalled();
      expect(focusedStop()).toBe('r2:age');
    });

    describe('settling', () => {
      it('commits the allowed value a press picks though the press leaves focus nowhere, as Safari does', () => {
        const { onCommit } = renderEditing({ initialEditing: r1Risk, valueField: field });
        safariPress(inPopover().getByRole('radio', { name: '"review"' }));
        expect(onCommit.mock.calls).toEqual([[r1Risk, '"review"', 'none']]);
      });

      it.each([
        ['its operator select', () => operatorSelect()],
        ['its header', () => inPopover().getByText('age')],
      ])('keeps the popover open from a press on %s that leaves focus nowhere, as Safari does, and Escape still cancels it', (_, target) => {
        const { onCommit, onCancel } = renderEditing({ initialEditing: r1Age, valueField: field });
        safariPress(target());
        expect(onCommit).not.toHaveBeenCalled();
        expect(popover()).toBeInTheDocument();
        {
          const focused = document.activeElement;
          if (focused instanceof HTMLElement) act(() => focused.blur());
        }
        if (screen.queryByRole('listbox')) {
          fireEvent.keyDown(document.body, { key: 'Escape' });
          expect(screen.queryByRole('listbox')).toBeNull();
          expect(onCancel).not.toHaveBeenCalled();
        }
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
      });

      it('applies the draft a host editor reports through onDraftChange on a press outside, not as focus leaves', () => {
        const { onCommit } = renderEditing({
          initialEditing: r1Age,
          valueField: field,
          renderEditor: hostInput,
        });
        fireEvent.click(action('Edit expression'));
        const input = screen.getByTestId('host-editor');
        act(() => input.focus());
        fireEvent.change(input, { target: { value: '< 30' } });
        act(() => screen.getByTestId('nl').focus());
        expect(onCommit).not.toHaveBeenCalled();
        pressOutside(popover());
        expect(onCommit.mock.calls).toEqual([[r1Age, '< 30', 'none']]);
      });

      it('shows the popover again when the browser closes its dialog while the host keeps it open', () => {
        const { onCancel } = renderEditing({ initialEditing: r1Age, valueField: field });
        const dialog = screen.getByRole('dialog');
        if (!(dialog instanceof HTMLDialogElement)) throw new Error('dialog');
        act(() => dialog.close());
        expect(dialog.open).toBe(true);
        expect(onCancel).not.toHaveBeenCalled();
      });

      it('opens Edit expression on the whole condition the host gives, and applies one left as it opened as the popover draft', () => {
        const { onCommitValues } = renderEditing({
          initialEditing: r1Age,
          valueField: field,
          renderEditor: hostInput,
        });
        fireEvent.click(action('Edit expression'));
        expect(screen.getByTestId('host-editor')).toHaveValue('< 25');
        fireEvent.click(action('Apply'));
        expect(onCommitValues.mock.calls).toEqual([
          [r1Age, { kind: 'single', operator: '<', value: '25' }, 'none'],
        ]);
      });

      it('tells the host an expression commit from a condition commit by its kind', () => {
        const { onCommitValues } = renderEditing({
          initialEditing: r1Age,
          valueField: field,
          renderEditor: hostInput,
        });
        fireEvent.change(editor(), { target: { value: '30' } });
        fireEvent.keyDown(editor(), { key: 'Enter' });
        fireEvent.click(valueChip('r1', 'age'));
        fireEvent.click(action('Edit expression'));
        const input = screen.getByTestId('host-editor');
        fireEvent.change(input, { target: { value: '< 30' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onCommitValues.mock.calls.map(([, commit]) => commit)).toEqual([
          { kind: 'single', operator: '<', value: '30' },
          { kind: 'expression', text: '< 30' },
        ]);
      });

      it('commits nothing from a host editor once Escape cancelled the popover and focus left before the host closed it', async () => {
        const outside = document.body.appendChild(document.createElement('button'));
        onTestFinished(() => outside.remove());
        const onCommit = vi.fn();
        const SlowCancelHost = () => {
          const [editing, setEditing] = useState<SentenceValueId | null>(r1Age);
          return view({
            rules: GRID_SENTENCE_RULES,
            ...GRID_SENTENCE_COLUMNS,
            selected: { kind: 'cell', rowId: 'r1', columnId: 'age' } satisfies SentenceSelection,
            onSelect: vi.fn(),
            edit: editWith({
              editing,
              onStartEdit: setEditing,
              valueField: field,
              renderEditor: hostInput,
              onCommit: (...args) => {
                onCommit(...args);
                setEditing(null);
              },
              onCancel: () => later(() => setEditing(null)),
            }),
          });
        };
        render(<SlowCancelHost />);
        fireEvent.click(action('Edit expression'));
        const input = screen.getByTestId('host-editor');
        act(() => input.focus());
        fireEvent.change(input, { target: { value: 'cancelled' } });
        fireEvent.keyDown(input, { key: 'Escape' });
        act(() => outside.focus());
        await settleLater();
        expect(onCommit).not.toHaveBeenCalled();
      });

      it('commits nothing from a condition added from + while it has no value, and says why Apply is off', () => {
        const { onCommit } = renderEditing({
          initialEditing: r3Channel,
          valueField: field,
          ...CHANNEL_COLUMNS,
        });
        expect(action('Apply')).toBeDisabled();
        expect(editor()).toHaveAttribute('aria-invalid', 'true');
        expect(editor()).toHaveAccessibleDescription('Enter a value');
        fireEvent.keyDown(editor(), { key: 'Enter' });
        fireEvent.keyDown(editor(), { key: 'Tab' });
        act(() => screen.getByTestId('nl').focus());
        pressOutside(popover());
        expect(onCommit).not.toHaveBeenCalled();
        expect(popover()).toBeInTheDocument();
        fireEvent.change(editor(), { target: { value: '"web"' } });
        expect(editor()).not.toHaveAccessibleDescription();
        expect(action('Apply')).toBeEnabled();
      });

      it('applies from Apply an expression typed for a condition added from + into a host editor', async () => {
        const user = userEvent.setup();
        const { onCommitValues } = renderEditing({
          initialEditing: r3Channel,
          valueField: () => conditionField(AGE_OFFERS, single('<')),
          ...CHANNEL_COLUMNS,
          renderEditor: hostInput,
        });
        await user.click(action('Edit expression'));
        pressApply();
        expect(onCommitValues).not.toHaveBeenCalled();
        expect(popover()).toBeInTheDocument();
        await user.type(screen.getByTestId('host-editor'), '"web"');
        pressApply();
        expect(onCommitValues.mock.calls).toEqual([
          [r3Channel, { kind: 'expression', text: '"web"' }, 'none'],
        ]);
      });

      it('applies an expression typed for a condition added from +, though its own fields hold no value', () => {
        const { onCommitValues } = renderEditing({
          initialEditing: r3Channel,
          valueField: () => conditionField(AGE_OFFERS, single('<')),
          ...CHANNEL_COLUMNS,
          renderEditor: hostInput,
        });
        fireEvent.click(action('Edit expression'));
        expect(action('Apply')).toHaveAttribute('aria-disabled', 'true');
        fireEvent.change(screen.getByTestId('host-editor'), { target: { value: '"web"' } });
        expect(action('Apply')).not.toHaveAttribute('aria-disabled');
        fireEvent.click(action('Apply'));
        expect(onCommitValues.mock.calls).toEqual([
          [r3Channel, { kind: 'expression', text: '"web"' }, 'none'],
        ]);
      });

      it.each<[string, ValueFieldData<FixtureOperator>, string]>([
        ['the operator the field holds', conditionField(AGE_OFFERS, single('<')), 'is less than'],
        [
          'the operator it repeats first',
          conditionField([...AGE_OFFERS, ...AGE_OFFERS], single('>')),
          'is greater than',
        ],
      ])('words a pending line with %s', (_, pendingField, words) => {
        renderEditing({
          initialEditing: r3Channel,
          valueField: () => pendingField,
          ...CHANNEL_COLUMNS,
        });
        expect(operatorSelect()).toHaveTextContent(words);
        expect(card('r3').querySelector('li[data-pending]')).toHaveTextContent(
          new RegExp(`^channel ${words} Set a value$`)
        );
      });
    });

    it('applies the draft in place from Apply, with its operator', () => {
      const { onCommit } = renderEditing({
        initial: { kind: 'cell', rowId: 'r1', columnId: 'age' } satisfies SentenceSelection,
        initialEditing: r1Age,
        valueField: field,
      });
      fireEvent.change(editor(), { target: { value: '30' } });
      fireEvent.click(action('Apply'));
      expect(onCommit.mock.calls).toEqual([[r1Age, '30', 'none', '<']]);
      expect(screen.queryByTestId('nl-value-editor')).toBeNull();
      expect(focusedStop()).toBe('r1:age');
    });

    it('keeps the edit open while focus moves anywhere, and commits once on a press outside', () => {
      const renderEditor = () => <textarea aria-label="expression" />;
      const { onCommit } = renderEditing({
        initialEditing: r1Age,
        valueField: field,
        renderEditor,
      });
      fireEvent.change(editor(), { target: { value: '30' } });
      for (const inside of [
        operatorSelect(),
        action('Edit expression'),
        action('Cancel'),
        action('Apply'),
      ]) {
        fireEvent.blur(editor(), { relatedTarget: inside });
      }
      expect(onCommit).not.toHaveBeenCalled();
      expect(editor()).toHaveValue('30');
      fireEvent.blur(editor(), { relatedTarget: card('r2') });
      fireEvent.blur(editor());
      expect(onCommit).not.toHaveBeenCalled();
      pressOutside(popover());
      expect(onCommit.mock.calls).toEqual([[r1Age, '30', 'none', '<']]);
    });

    it.each<[string, Parameters<typeof pressOutside>[1]]>([
      ['a left click', {}],
      ['a middle click', { button: 1 }],
      ['a right click', { button: 2 }],
      ['a touch tap', { pointerType: 'touch' }],
    ])('applies the typed draft once from %s outside the popover, and runs nothing else', (_, init) => {
      const onOpenDecision = vi.fn();
      const onAdd = vi.fn();
      const { onCommit, onStartEdit, onClearCell, onCancel } = renderEditing({
        initial: { kind: 'cell', rowId: 'r1', columnId: 'age' } satisfies SentenceSelection,
        initialEditing: r1Age,
        onOpenDecision,
        onAddRule: onAdd,
      });
      fireEvent.change(editor(), { target: { value: '30' } });
      pressOutside(popover(), init);
      expect(onCommit.mock.calls).toEqual([[r1Age, '30', 'none']]);
      expect(screen.queryByTestId('nl-value-editor')).toBeNull();
      expect(screen.queryByRole('menu')).toBeNull();
      expect(
        [onStartEdit, onClearCell, onCancel, onOpenDecision, onAdd].map(
          (spy) => spy.mock.calls.length
        )
      ).toEqual([0, 0, 0, 0, 0]);
    });

    it('applies nothing from a press that starts inside the popover and is released outside it', () => {
      const { onCommit } = renderEditing({ initialEditing: r1Age });
      fireEvent.change(editor(), { target: { value: '30' } });
      fireEvent.pointerDown(editor(), { clientX: 5, clientY: 5 });
      fireEvent.mouseDown(editor(), { clientX: 5, clientY: 5 });
      fireEvent.click(popover(), { clientX: -10, clientY: -10, detail: 1 });
      expect(onCommit).not.toHaveBeenCalled();
      expect(editor()).toHaveValue('30');
    });

    it('keeps focus where it is on a press outside, which the backdrop takes', () => {
      renderEditing({ initialEditing: r1Age });
      expect(document.activeElement).toBe(editor());
      const at = { clientX: -10, clientY: -10 };
      expect(fireEvent.mouseDown(popover(), at)).toBe(false);
      expect(fireEvent.mouseDown(editor(), at)).toBe(true);
    });

    it('shows a pending line for a condition added from +, opens on it, and drops it on Cancel', () => {
      const { onCommit } = renderEditing({
        initialEditing: r3Channel,
        valueField: field,
        ...CHANNEL_COLUMNS,
      });
      const line = card('r3').querySelector<HTMLElement>('li[data-pending]');
      expect(line).toHaveTextContent('channel is greater than Set a value');
      expect(
        within(card('r3')).queryByRole('button', { name: 'Remove channel from rule 3' })
      ).toBeNull();
      expect(editor()).toHaveValue('');
      expect(editor()).toHaveAccessibleName('New channel condition, rule 3');
      fireEvent.click(action('Cancel'));
      expect(onCommit).not.toHaveBeenCalled();
      expect(card('r3').querySelector('li[data-pending]')).toBeNull();
      expect(card('r3').querySelector('[data-column-id="channel"]')).toBeNull();
    });

    it('words the pending line with the operator the select picks before Apply', () => {
      const { onCommit } = renderEditing({
        initialEditing: r3Channel,
        valueField: field,
        ...CHANNEL_COLUMNS,
        inputIds: ['channel'],
      });
      const pendingLine = () => card('r3').querySelector('li[data-pending]');
      fireEvent.click(operatorSelect());
      fireEvent.click(screen.getByRole('option', { name: 'is less than' }));
      expect(pendingLine()).toHaveTextContent(/^channel is less than Set a value$/);
      expect(onCommit).not.toHaveBeenCalled();
      fireEvent.click(action('Cancel'));
      fireEvent.click(within(card('r3')).getByRole('button', { name: 'Add condition to rule 3' }));
      fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'channel' }));
      expect(pendingLine()).toHaveTextContent(/^channel is greater than Set a value$/);
    });

    it('commits a pending condition only on Apply, with its operator, and words it without a placeholder', () => {
      const { onCommit } = renderEditing({
        initialEditing: r3Channel,
        valueField: field,
        ...CHANNEL_COLUMNS,
      });
      fireEvent.change(editor(), { target: { value: '"web"' } });
      expect(onCommit).not.toHaveBeenCalled();
      fireEvent.click(action('Apply'));
      expect(onCommit.mock.calls).toEqual([[r3Channel, '"web"', 'none', '>']]);
      expect(card('r3').querySelector('li[data-pending]')).toBeNull();
    });

    it('words a pending line without an operator for a field only its expression shows', () => {
      renderEditing({
        initialEditing: r3Channel,
        valueField: () => ({ kind: 'expression', allowedValues: [], expression: '' }),
        ...CHANNEL_COLUMNS,
      });
      expect(card('r3').querySelector('li[data-pending]')).toHaveTextContent(
        /^channel Set a value$/
      );
    });

    describe('ranges and lists', () => {
      const SHAPED_OFFERS: readonly FixtureOffer[] = [
        { operator: '<', label: OPERATOR_WORDS['<'], shape: 'single' },
        { operator: 'between', label: OPERATOR_WORDS['between'], shape: 'range' },
        { operator: 'oneOf', label: OPERATOR_WORDS['oneOf'], shape: 'list' },
        { operator: 'noneOf', label: OPERATOR_WORDS['noneOf'], shape: 'list' },
      ];
      const COUNTRIES = ['"US"', '"CA"', '"MX"', '"GB"', '"DE"'];
      const BOTH_INCLUDED = { lowInclusive: true, highInclusive: true };
      const at = (rowId: string, columnId: string, index = 0): SentenceValueId => ({
        rowId,
        columnId,
        index,
      });
      const shapedField = (cell: SentenceCellId): ConditionField => {
        if (cell.rowId === 'm1' && cell.columnId === 'score') {
          return conditionField(SHAPED_OFFERS, {
            shape: 'range',
            operator: 'between',
            low: '700',
            high: '850',
            ends: BOTH_INCLUDED,
          });
        }
        if (cell.rowId === 'm1' && cell.columnId === 'country') {
          return conditionField(SHAPED_OFFERS, {
            shape: 'list',
            operator: 'oneOf',
            values: COUNTRIES,
          });
        }
        if (cell.rowId === 'm2' && cell.columnId === 'country') {
          return conditionField(SHAPED_OFFERS, {
            shape: 'list',
            operator: 'noneOf',
            values: ['"RU"', '"KP"'],
          });
        }
        const rule = MULTI_SENTENCE_RULES.find(({ rowId }) => rowId === cell.rowId);
        const token = rule && valueTokenOf(rule, { ...cell, index: 0 });
        return conditionField(SHAPED_OFFERS, single('<', token?.text ?? ''));
      };
      const renderShaped = (props: Omit<EditingHostProps, 'spies'> = {}) =>
        renderEditing({
          rules: MULTI_SENTENCE_RULES,
          ...MULTI_SENTENCE_COLUMNS,
          hitPolicy: MULTI_SENTENCE_POLICY,
          valueField: shapedField,
          ...props,
        });
      const end = (name: 'From' | 'To') => within(inPopover().getByRole('group', { name }));
      const endField = (name: 'From' | 'To') => end(name).getByRole('textbox', { name });
      const included = (name: 'From' | 'To') =>
        end(name).getByRole('checkbox', { name: 'Included' });
      const box = (name: string) => inPopover().getByRole('checkbox', { name });
      const addField = () => inPopover().getByRole('textbox', { name: 'Add value' });

      it('edits both ends of a range and whether each is included in one popover, focused on the clicked end', async () => {
        const { onCommitValues } = renderShaped({ initialEditing: at('m1', 'score', 1) });
        expect(operatorSelect()).toHaveTextContent('is between');
        expect(endField('From')).toHaveValue('700');
        expect(endField('To')).toHaveValue('850');
        expect(document.activeElement).toBe(endField('To'));
        expect(included('From')).toBeChecked();
        expect(included('To')).toBeChecked();
        expect(await axe(popover())).toHaveNoViolations();
        fireEvent.change(endField('From'), { target: { value: '650' } });
        fireEvent.click(included('To'));
        expect(included('To')).not.toBeChecked();
        expect(onCommitValues).not.toHaveBeenCalled();
        fireEvent.keyDown(endField('From'), { key: 'Enter' });
        expect(onCommitValues.mock.calls).toEqual([
          [
            at('m1', 'score', 1),
            {
              kind: 'range',
              operator: 'between',
              low: '650',
              high: '850',
              ends: { lowInclusive: true, highInclusive: false },
            },
            'down',
          ],
        ]);
      });

      it('keeps Apply off while an end is empty, committing nothing on Enter or a blur', () => {
        const { onCommitValues } = renderShaped({ initialEditing: at('m1', 'score') });
        fireEvent.change(endField('To'), { target: { value: '' } });
        expect(action('Apply')).toBeDisabled();
        fireEvent.keyDown(endField('From'), { key: 'Enter' });
        fireEvent.keyDown(included('To'), { key: 'Enter' });
        fireEvent.blur(endField('To'), { relatedTarget: card('m2') });
        expect(onCommitValues).not.toHaveBeenCalled();
        expect(popover()).toBeInTheDocument();
        fireEvent.change(endField('To'), { target: { value: '700' } });
        expect(action('Apply')).toBeEnabled();
        fireEvent.click(action('Apply'));
        expect(onCommitValues.mock.calls).toEqual([
          [
            at('m1', 'score'),
            { kind: 'range', operator: 'between', low: '700', high: '700', ends: BOTH_INCLUDED },
            'none',
          ],
        ]);
      });

      it('turns a single value into a range from it, with an empty To and both ends included', () => {
        const { onCommitValues } = renderShaped({ initialEditing: at('m3', 'score') });
        fireEvent.click(operatorSelect());
        fireEvent.click(screen.getByRole('option', { name: 'is between' }));
        expect(endField('From')).toHaveValue('600');
        expect(endField('To')).toHaveValue('');
        expect(included('From')).toBeChecked();
        expect(included('To')).toBeChecked();
        expect(document.activeElement).toBe(endField('From'));
        expect(action('Apply')).toBeDisabled();
        fireEvent.change(endField('To'), { target: { value: '650' } });
        fireEvent.keyDown(endField('To'), { key: 'Enter' });
        expect(onCommitValues.mock.calls).toEqual([
          [
            at('m3', 'score'),
            { kind: 'range', operator: 'between', low: '600', high: '650', ends: BOTH_INCLUDED },
            'down',
          ],
        ]);
      });

      it("opens the operator list from a range's Included box on Alt+ArrowDown, and carries its ends into a list", () => {
        renderShaped({ initialEditing: at('m1', 'score') });
        expect(included('To')).toHaveAttribute('aria-keyshortcuts', 'Alt+ArrowDown Alt+ArrowUp');
        fireEvent.keyDown(included('To'), { key: 'ArrowDown', altKey: true });
        fireEvent.click(screen.getByRole('option', { name: 'is one of' }));
        expect(box('700')).toBeChecked();
        expect(box('850')).toBeChecked();
        expect(document.activeElement).toBe(box('700'));
      });

      it('edits a list as checkboxes of its values with a field that adds one, focused on the clicked value', async () => {
        const { onCommitValues } = renderShaped({ initialEditing: at('m1', 'country', 2) });
        expect(operatorSelect()).toHaveTextContent('is one of');
        expect(inPopover().getAllByRole('checkbox')).toHaveLength(5);
        for (const country of COUNTRIES) expect(box(country)).toBeChecked();
        expect(document.activeElement).toBe(box('"MX"'));
        expect(await axe(popover())).toHaveNoViolations();
        fireEvent.click(box('"MX"'));
        expect(box('"MX"')).not.toBeChecked();
        fireEvent.change(addField(), { target: { value: '"FR"' } });
        fireEvent.keyDown(addField(), { key: 'Enter' });
        expect(addField()).toHaveValue('');
        expect(box('"FR"')).toBeChecked();
        fireEvent.change(addField(), { target: { value: '"IT"' } });
        fireEvent.click(action('Add value'));
        expect(box('"IT"')).toBeChecked();
        expect(onCommitValues).not.toHaveBeenCalled();
        fireEvent.keyDown(addField(), { key: 'Enter' });
        expect(onCommitValues.mock.calls).toEqual([
          [
            at('m1', 'country', 2),
            {
              kind: 'list',
              operator: 'oneOf',
              values: ['"US"', '"CA"', '"GB"', '"DE"', '"FR"', '"IT"'],
            },
            'down',
          ],
        ]);
      });

      it.each<[string, () => void, string]>([
        ['a list', () => {}, '"RU"'],
        [
          'a range whose From was typed',
          () => {
            fireEvent.click(operatorSelect());
            fireEvent.click(screen.getByRole('option', { name: 'is between' }));
            fireEvent.change(endField('From'), { target: { value: '"XX"' } });
          },
          '"XX"',
        ],
      ])('checks and applies the value a single operator keeps from %s, outside the allowed values', (_, before, kept) => {
        const { onCommitValues } = renderShaped({
          initialEditing: at('m2', 'country', 1),
          valueField: (cell) => ({ ...shapedField(cell), allowedValues: ['"CN"'] }),
        });
        before();
        fireEvent.click(operatorSelect());
        fireEvent.click(screen.getByRole('option', { name: 'is less than' }));
        const radios = inPopover().getAllByRole('radio');
        expect(radios.filter((radio) => radio.getAttribute('aria-checked') === 'true')).toEqual([
          inPopover().getByRole('radio', { name: kept }),
        ]);
        expect(inPopover().getByRole('radio', { name: kept })).toHaveAccessibleDescription(
          'Not one of the allowed values'
        );
        expect(inPopover().getByRole('radio', { name: '"KP"' })).toBeInTheDocument();
        fireEvent.click(action('Apply'));
        expect(onCommitValues.mock.calls).toEqual([
          [at('m2', 'country', 1), { kind: 'single', operator: '<', value: kept }, 'none'],
        ]);
      });

      it("offers a list the column's allowed values with no field to add one, keeping a held value outside them marked", () => {
        const { onCommitValues } = renderShaped({
          initialEditing: at('m2', 'country'),
          valueField: (cell) => ({ ...shapedField(cell), allowedValues: ['"RU"', '"CN"'] }),
        });
        const boxes = inPopover().getAllByRole('checkbox');
        expect(boxes.map((checkbox) => checkbox.getAttribute('aria-checked'))).toEqual([
          'true',
          'false',
          'true',
        ]);
        expect(boxes[2]).toBe(box('"KP"'));
        expect(box('"KP"')).toHaveAccessibleDescription('Not one of the allowed values');
        expect(inPopover().queryByRole('textbox')).toBeNull();
        fireEvent.click(box('"CN"'));
        fireEvent.click(action('Apply'));
        expect(onCommitValues.mock.calls).toEqual([
          [
            at('m2', 'country'),
            { kind: 'list', operator: 'noneOf', values: ['"RU"', '"KP"', '"CN"'] },
            'none',
          ],
        ]);
      });

      it('keeps a list’s values in their sentence order, adding a checked one after them and putting a re-checked one back', () => {
        const { onCommitValues } = renderShaped({
          initialEditing: at('m2', 'country'),
          valueField: (cell) => ({
            ...shapedField(cell),
            held: { shape: 'list', operator: 'noneOf', values: ['"KP"', '"RU"'] },
            allowedValues: ['"RU"', '"CN"'],
          }),
        });
        fireEvent.click(action('Apply'));
        fireEvent.click(valueChip('m2', 'country'));
        fireEvent.click(box('"CN"'));
        fireEvent.click(box('"KP"'));
        fireEvent.click(box('"KP"'));
        fireEvent.click(action('Apply'));
        expect(onCommitValues.mock.calls.map(([, commit]) => valuesOf(commit))).toEqual([
          ['"KP"', '"RU"'],
          ['"KP"', '"RU"', '"CN"'],
        ]);
      });

      it.each<[string, string[]]>([
        ['checking an allowed value', ['"CN"']],
        ['unchecking and re-checking a held value', ['"KP"', '"KP"']],
      ])('commits a list in its sentence order after %s', (_, clicks) => {
        const { onCommitValues } = renderShaped({
          initialEditing: at('m2', 'country'),
          valueField: (cell) => ({
            ...shapedField(cell),
            held: { shape: 'list', operator: 'noneOf', values: ['"KP"', '"RU"'] },
            allowedValues: ['"RU"', '"CN"'],
          }),
        });
        for (const option of clicks) fireEvent.click(box(option));
        fireEvent.click(action('Apply'));
        expect(onCommitValues.mock.calls.map(([, commit]) => valuesOf(commit))).toEqual([
          clicks.includes('"CN"') ? ['"KP"', '"RU"', '"CN"'] : ['"KP"', '"RU"'],
        ]);
      });

      it("lists every value of a long list, past the sentence's +N more", () => {
        const countries = Array.from({ length: 25 }, (_, index) => `"Country ${index + 1}"`);
        renderShaped({
          rules: [longValueListRule(25)],
          initialEditing: at('long-list', 'country'),
          valueField: () =>
            conditionField(SHAPED_OFFERS, { shape: 'list', operator: 'oneOf', values: countries }),
        });
        expect(inPopover().getAllByRole('checkbox')).toHaveLength(25);
        expect(box('"Country 25"')).toBeChecked();
      });

      it('keeps Apply off with nothing checked, and commits one checked value as the list', () => {
        const { onCommitValues } = renderShaped({ initialEditing: at('m2', 'country') });
        fireEvent.click(box('"RU"'));
        fireEvent.click(box('"KP"'));
        expect(action('Apply')).toBeDisabled();
        fireEvent.keyDown(addField(), { key: 'Enter' });
        expect(onCommitValues).not.toHaveBeenCalled();
        fireEvent.click(box('"KP"'));
        fireEvent.click(action('Apply'));
        expect(onCommitValues.mock.calls).toEqual([
          [at('m2', 'country'), { kind: 'list', operator: 'noneOf', values: ['"KP"'] }, 'none'],
        ]);
      });

      it('toggles the box a press lands on, keeping the list open, though the press leaves focus nowhere, as Safari does, and Escape still cancels', () => {
        const { onCommitValues, onCancel } = renderShaped({
          initialEditing: at('m1', 'country', 2),
        });
        safariPress(box('"CA"'));
        expect(onCommitValues).not.toHaveBeenCalled();
        expect(box('"CA"')).not.toBeChecked();
        expect(document.activeElement).toBe(document.body);
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
      });

      it.each([
        ['box', () => included('To')],
        ['label', () => end('To').getByText('Included')],
      ])("toggles a range end's Included from a press on its %s, keeping the range open, though the press leaves focus nowhere, as Safari does, and Escape still cancels", (_, target) => {
        const { onCommitValues, onCancel } = renderShaped({ initialEditing: at('m1', 'score') });
        safariPress(target());
        expect(onCommitValues).not.toHaveBeenCalled();
        expect(included('To')).not.toBeChecked();
        expect(document.activeElement).toBe(document.body);
        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
      });

      it('says why Apply is off: an empty end or nothing checked', async () => {
        renderShaped({ initialEditing: at('m1', 'score') });
        fireEvent.change(endField('To'), { target: { value: '' } });
        expect(action('Apply')).toBeDisabled();
        expect(endField('To')).toHaveAttribute('aria-invalid', 'true');
        expect(endField('To')).toHaveAccessibleDescription('Enter both ends');
        expect(endField('From')).toHaveAttribute('aria-invalid', 'false');
        expect(await axe(popover())).toHaveNoViolations();
        fireEvent.change(endField('To'), { target: { value: '900' } });
        expect(endField('To')).not.toHaveAccessibleDescription();
        expect(action('Apply')).toBeEnabled();
        cleanup();
        renderShaped({ initialEditing: at('m2', 'country') });
        fireEvent.click(box('"RU"'));
        fireEvent.click(box('"KP"'));
        expect(action('Apply')).toBeDisabled();
        expect(box('"RU"').closest('fieldset')).toHaveAccessibleDescription('Check a value');
        expect(await axe(popover())).toHaveNoViolations();
      });

      it.each<[string, () => void]>([
        ['Apply', () => fireEvent.click(action('Apply'))],
        ['a press outside', () => pressOutside(popover())],
      ])('applies the text left in Add value with the list on %s', (_, settle) => {
        const { onCommitValues } = renderShaped({ initialEditing: at('m2', 'country') });
        act(() => addField().focus());
        fireEvent.change(addField(), { target: { value: ' "FR" ' } });
        settle();
        expect(onCommitValues.mock.calls.map(([, commit]) => valuesOf(commit))).toEqual([
          ['"RU"', '"KP"', '"FR"'],
        ]);
      });

      it('counts the text left in Add value as a value of a list with nothing checked', () => {
        const { onCommitValues } = renderShaped({ initialEditing: at('m2', 'country') });
        fireEvent.click(box('"RU"'));
        fireEvent.click(box('"KP"'));
        fireEvent.change(addField(), { target: { value: '"FR"' } });
        expect(action('Apply')).toBeEnabled();
        fireEvent.click(action('Apply'));
        expect(onCommitValues.mock.calls.map(([, commit]) => valuesOf(commit))).toEqual([['"FR"']]);
      });

      it('keeps focus in Add value from a press on its + button, adding the text', () => {
        const { onCommitValues } = renderShaped({ initialEditing: at('m2', 'country') });
        act(() => addField().focus());
        fireEvent.change(addField(), { target: { value: '"FR"' } });
        safariPress(inPopover().getByRole('button', { name: 'Add value' }));
        expect(document.activeElement).toBe(addField());
        expect(addField()).toHaveValue('');
        expect(box('"FR"')).toBeChecked();
        expect(onCommitValues).not.toHaveBeenCalled();
      });

      it('applies from Apply an expression typed for an incomplete range into a host editor', async () => {
        const user = userEvent.setup();
        const { onCommitValues } = renderShaped({
          initialEditing: at('m3', 'score'),
          valueField: (cell) => ({ ...shapedField(cell), expression: '< 600' }),
          renderEditor: hostInput,
        });
        await user.click(operatorSelect());
        await user.click(screen.getByRole('option', { name: 'is between' }));
        await user.click(action('Edit expression'));
        await user.clear(screen.getByTestId('host-editor'));
        await user.type(screen.getByTestId('host-editor'), '[[600..650]');
        pressApply();
        expect(onCommitValues.mock.calls).toEqual([
          [at('m3', 'score'), { kind: 'expression', text: '[600..650]' }, 'none'],
        ]);
      });

      it('opens Edit expression on a whole range the host gives, applying it as it opened unchanged', () => {
        const { onCommitValues } = renderShaped({
          initialEditing: at('m1', 'score', 1),
          valueField: (cell) => ({ ...shapedField(cell), expression: '[700..850]' }),
          renderEditor: ({ value, ariaLabel }) => (
            <input aria-label={ariaLabel} data-testid="host-editor" defaultValue={value} />
          ),
        });
        fireEvent.click(action('Edit expression'));
        expect(screen.getByTestId('host-editor')).toHaveValue('[700..850]');
        fireEvent.click(action('Apply'));
        expect(onCommitValues.mock.calls).toEqual([
          [
            at('m1', 'score', 1),
            { kind: 'range', operator: 'between', low: '700', high: '850', ends: BOTH_INCLUDED },
            'none',
          ],
        ]);
      });
    });
  });
  describe('column popover', () => {
    let uninstallInertness: () => void = () => {};
    beforeAll(() => {
      uninstallInertness = installModalInertness();
    });
    afterAll(() => uninstallInertness());
    const AGE_FIELD: ColumnFieldData<FixtureType> = {
      kind: 'input',
      label: 'age',
      expression: 'applicant.age',
      type: 'text',
      allowedValues: '',
    };
    const FIELDS: Record<string, ColumnFieldData<FixtureType>> = {
      age: AGE_FIELD,
      risk: {
        kind: 'output',
        label: 'risk',
        name: 'risk',
        nameRequired: false,
        type: 'text',
        allowedValues: '"high", "low"',
      },
    };
    const columnEdit = (
      overrides: Partial<ColumnEdit<FixtureType>> = {}
    ): ColumnEdit<FixtureType> => ({
      field: (columnId) => FIELDS[columnId] ?? AGE_FIELD,
      onCommit: vi.fn(),
      ...overrides,
    });
    const pill = (name: string) =>
      within(screen.getByTestId('nl-bands')).getByRole('button', { name });
    const popover = () => screen.getByTestId('nl-column-editor');
    const inPopover = () => within(popover());
    const field = (name: string) => inPopover().getByRole('textbox', { name }) as HTMLInputElement;
    const typeSelect = () => inPopover().getByRole('combobox', { name: 'Data type' });
    const action = (name: string) => inPopover().getByRole('button', { name });
    const renderColumns = (overrides: Partial<ColumnEdit<FixtureType>> = {}) => {
      const column = columnEdit(overrides);
      renderEditing({ column });
      return column;
    };

    it('keeps the pills plain without column editing', () => {
      renderEditing();
      expect(within(screen.getByTestId('nl-bands')).queryAllByRole('button')).toEqual([]);
    });

    it("opens an input's popover from its pill, titled by its kind and name, over its label, expression, type and allowed values", async () => {
      const { container } = renderEditing({ column: columnEdit() });
      expect(pill('age')).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(pill('age'));
      expect(pill('age')).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('dialog', { name: 'Input · age' })).toBe(popover());
      expect(inPopover().getByText('Input · age')).toBeInTheDocument();
      expect(field('Label')).toHaveValue('age');
      expect(document.activeElement).toBe(field('Label'));
      expect(field('Input expression')).toHaveValue('applicant.age');
      expect(field('Input expression')).toBeRequired();
      expect(typeSelect()).toHaveTextContent('Text');
      expect(field('Allowed values')).toHaveValue('');
      expect(field('Allowed values')).toHaveAttribute('placeholder', 'e.g. "web", "app"');
      expect(field('Allowed values')).toHaveAccessibleDescription(
        'Separate values with commas, and write each one as the example shows.'
      );
      expect(
        inPopover()
          .getAllByRole('button')
          .map((button) => button.textContent)
      ).toEqual(['Cancel', 'Apply']);
      expect(screen.queryByTestId('nl-value-editor')).toBeNull();
      expect(await axe(container)).toHaveNoViolations();
    });

    it("titles a column's popover with its type's glyph, and offers each of the host's types with its own", () => {
      renderEditing({
        column: columnEdit({ field: () => ({ ...AGE_FIELD, type: 'number' }) }),
        inputs: GRID_SENTENCE_COLUMNS.inputs.map((column) => ({ ...column, type: 'number' })),
      });
      fireEvent.click(pill('age'));
      const header = inPopover().getByText('Input · age').parentElement;
      expect(header?.querySelector('svg')?.getAttribute('class')).toBe('lucide lucide-hash');
      expect(typeSelect().querySelector('svg')?.getAttribute('class')).toBe('lucide lucide-hash');
      fireEvent.click(typeSelect());
      fireEvent.click(screen.getByRole('option', { name: 'Text' }));
      expect(typeSelect().querySelector('svg')?.getAttribute('class')).toBe('lucide lucide-type');
    });

    it("names an output's binding as its output name, required only when the host says so", () => {
      renderColumns();
      fireEvent.click(pill('risk'));
      expect(inPopover().getByText('Output · risk')).toBeInTheDocument();
      expect(field('Output name')).toHaveValue('risk');
      expect(field('Output name')).not.toBeRequired();
      expect(field('Allowed values')).toHaveValue('"high", "low"');
    });

    it('opens from Enter or Space on the pill, and closes from it again', async () => {
      const user = userEvent.setup();
      renderColumns();
      act(() => pill('age').focus());
      await user.keyboard('{Enter}');
      expect(popover()).toBeInTheDocument();
      await user.keyboard('{Escape}');
      expect(screen.queryByTestId('nl-column-editor')).toBeNull();
      expect(document.activeElement).toBe(pill('age'));
      await user.keyboard(' ');
      expect(popover()).toBeInTheDocument();
      fireEvent.click(pill('age'));
      expect(screen.queryByTestId('nl-column-editor')).toBeNull();
    });

    it('applies only the changed fields from Apply, with the picked type, and returns focus to the pill', () => {
      const { onCommit } = renderColumns();
      fireEvent.click(pill('age'));
      fireEvent.change(field('Label'), { target: { value: '  Age  ' } });
      fireEvent.click(typeSelect());
      fireEvent.click(screen.getByRole('option', { name: 'Number' }));
      expect(typeSelect()).toHaveTextContent('Number');
      expect(field('Allowed values')).toHaveAttribute('placeholder', 'e.g. 10, 20');
      fireEvent.click(action('Apply'));
      expect(vi.mocked(onCommit).mock.calls).toEqual([
        ['age', { kind: 'input', label: 'Age', type: 'number' }],
      ]);
      expect(screen.queryByTestId('nl-column-editor')).toBeNull();
      expect(document.activeElement).toBe(pill('age'));
    });

    it('applies on Enter in a field, never mid-composition', () => {
      const { onCommit } = renderColumns();
      fireEvent.click(pill('risk'));
      fireEvent.change(field('Output name'), { target: { value: 'riskLevel' } });
      fireEvent.change(field('Allowed values'), { target: { value: '"high"' } });
      fireEvent.keyDown(field('Allowed values'), { key: 'Enter', isComposing: true });
      expect(onCommit).not.toHaveBeenCalled();
      fireEvent.keyDown(field('Allowed values'), { key: 'Enter' });
      expect(vi.mocked(onCommit).mock.calls).toEqual([
        ['risk', { kind: 'output', name: 'riskLevel', allowedValues: '"high"' }],
      ]);
      expect(document.activeElement).toBe(pill('risk'));
    });

    it('closes without a commit when nothing changed', () => {
      const { onCommit } = renderColumns();
      fireEvent.click(pill('age'));
      fireEvent.keyDown(field('Label'), { key: 'Enter' });
      expect(onCommit).not.toHaveBeenCalled();
      expect(screen.queryByTestId('nl-column-editor')).toBeNull();
    });

    it('cancels from Cancel or Escape back to the pill, keeping Escape in an open type list to the list', () => {
      const { onCommit } = renderColumns();
      fireEvent.click(pill('age'));
      fireEvent.change(field('Label'), { target: { value: 'Age' } });
      fireEvent.click(action('Cancel'));
      expect(screen.queryByTestId('nl-column-editor')).toBeNull();
      expect(document.activeElement).toBe(pill('age'));
      fireEvent.click(pill('age'));
      expect(field('Label')).toHaveValue('age');
      fireEvent.click(typeSelect());
      fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
      expect(popover()).toBeInTheDocument();
      fireEvent.keyDown(field('Label'), { key: 'Escape' });
      expect(screen.queryByTestId('nl-column-editor')).toBeNull();
      expect(onCommit).not.toHaveBeenCalled();
    });

    it('opens as a modal dialog, leaving Tab and Shift+Tab to the browser', () => {
      const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
      onTestFinished(() => showModal.mockRestore());
      renderColumns({ onMoreProperties: vi.fn() });
      fireEvent.click(pill('age'));
      expect(popover().tagName).toBe('DIALOG');
      expect(showModal.mock.contexts).toEqual([popover()]);
      act(() => action('Apply').focus());
      expect(fireEvent.keyDown(action('Apply'), { key: 'Tab' })).toBe(true);
      expect(fireEvent.keyDown(field('Label'), { key: 'Tab', shiftKey: true })).toBe(true);
      expect(popover()).toBeInTheDocument();
    });

    it('closes without a commit on a press outside, and stays open on a press inside', () => {
      const { onCommit } = renderColumns();
      fireEvent.click(pill('age'));
      fireEvent.change(field('Label'), { target: { value: 'Age' } });
      fireEvent.pointerDown(field('Label'));
      fireEvent.click(field('Label'));
      expect(popover()).toBeInTheDocument();
      pressOutside(popover());
      expect(screen.queryByTestId('nl-column-editor')).toBeNull();
      expect(document.activeElement).not.toBe(pill('age'));
      expect(onCommit).not.toHaveBeenCalled();
    });

    it('refuses Apply while a required binding is empty, and says why', () => {
      const { onCommit } = renderColumns();
      fireEvent.click(pill('age'));
      fireEvent.change(field('Input expression'), { target: { value: '  ' } });
      expect(field('Input expression')).toHaveAttribute('aria-invalid', 'true');
      expect(field('Input expression')).toHaveAccessibleDescription(
        'This input column has no expression'
      );
      expect(action('Apply')).toBeDisabled();
      fireEvent.keyDown(field('Input expression'), { key: 'Enter' });
      expect(onCommit).not.toHaveBeenCalled();
      expect(popover()).toBeInTheDocument();
    });

    it('refuses Apply while the label is empty, and says why', () => {
      const column = renderColumns();
      fireEvent.click(pill('age'));
      fireEvent.change(field('Label'), { target: { value: '   ' } });
      expect(action('Apply')).toBeDisabled();
      expect(field('Label')).toHaveAttribute('aria-invalid', 'true');
      expect(field('Label')).toHaveAccessibleDescription('Enter a label');
      fireEvent.keyDown(field('Label'), { key: 'Enter' });
      expect(column.onCommit).not.toHaveBeenCalled();
    });

    it('keeps the popover open from a press off its fields or on a label that leaves focus nowhere, as Safari does, and Escape still cancels it', () => {
      const column = renderColumns();
      fireEvent.click(pill('age'));
      safariPress(inPopover().getByText('Input · age'));
      expect(document.activeElement).toBe(document.body);
      safariPress(inPopover().getByText('Input expression'));
      expect(popover()).toBeInTheDocument();
      {
        const focused = document.activeElement;
        if (focused instanceof HTMLElement) act(() => focused.blur());
      }
      press('Escape');
      expect(screen.queryByTestId('nl-column-editor')).toBeNull();
      expect(column.onCommit).not.toHaveBeenCalled();
    });

    it("offers More properties only with the host's action, which closes the popover", () => {
      const onMoreProperties = vi.fn();
      const { onCommit } = renderColumns({ onMoreProperties });
      fireEvent.click(pill('risk'));
      fireEvent.click(action('More properties'));
      expect(onMoreProperties.mock.calls).toEqual([['risk']]);
      expect(onCommit).not.toHaveBeenCalled();
      expect(screen.queryByTestId('nl-column-editor')).toBeNull();
      expect(document.activeElement).not.toBe(pill('risk'));
    });

    it("lets a column of a type the host's types lack pick one of them, with its allowed values", () => {
      const { onCommit } = renderColumns({ field: () => ({ ...AGE_FIELD, type: 'date' }) });
      fireEvent.click(pill('age'));
      expect(field('Allowed values')).toHaveValue('');
      fireEvent.click(typeSelect());
      expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
        'Text',
        'Number',
      ]);
      fireEvent.click(screen.getByRole('option', { name: 'Number' }));
      fireEvent.click(action('Apply'));
      expect(vi.mocked(onCommit).mock.calls).toEqual([['age', { kind: 'input', type: 'number' }]]);
    });

    it.each<[string, readonly ColumnTypeOption<FixtureType>[]]>([
      ['reordered', [...COLUMN_TYPES].reverse()],
      ['shrunk', COLUMN_TYPES.slice(0, 1)],
    ])("keeps the column's type while the host's types are %s under the open popover, committing nothing unchanged", (_, types) => {
      const column = columnEdit();
      const { rerender, onSelect, onStartEdit, onCommit, onCommitValues, onCancel, onClearCell } =
        renderEditing({ column });
      fireEvent.click(pill('age'));
      rerender(
        <EditingHost
          spies={{ onSelect, onStartEdit, onCommit, onCommitValues, onCancel, onClearCell }}
          column={column}
          columnTypes={types}
        />
      );
      expect(typeSelect()).toHaveTextContent('Text');
      fireEvent.click(action('Apply'));
      expect(column.onCommit).not.toHaveBeenCalled();
    });

    it('commits a type picked before the host shrinks its types, and nothing for a repeat of the held one', () => {
      const repeated: ColumnTypeOption<FixtureType>[] = [
        ...COLUMN_TYPES,
        { type: 'text', label: 'Text again', icon: null, example: 'x' },
      ];
      const column = columnEdit();
      const { rerender, onSelect, onStartEdit, onCommit, onCommitValues, onCancel, onClearCell } =
        renderEditing({ column, columnTypes: repeated });
      fireEvent.click(pill('age'));
      fireEvent.click(typeSelect());
      fireEvent.click(screen.getByRole('option', { name: 'Text again' }));
      fireEvent.click(action('Apply'));
      expect(column.onCommit).not.toHaveBeenCalled();
      fireEvent.click(pill('age'));
      fireEvent.click(typeSelect());
      fireEvent.click(screen.getByRole('option', { name: 'Number' }));
      rerender(
        <EditingHost
          spies={{ onSelect, onStartEdit, onCommit, onCommitValues, onCancel, onClearCell }}
          column={column}
          columnTypes={COLUMN_TYPES.slice(0, 1)}
        />
      );
      fireEvent.click(action('Apply'));
      expect(vi.mocked(column.onCommit).mock.calls).toEqual([
        ['age', { kind: 'input', type: 'number' }],
      ]);
    });

    it('closes once the host has no field for the open column', () => {
      const fields = { current: true };
      const column = columnEdit({ field: () => (fields.current ? AGE_FIELD : undefined) });
      const { rerender, onSelect, onStartEdit, onCommit, onCommitValues, onCancel, onClearCell } =
        renderEditing({ column });
      fireEvent.click(pill('age'));
      expect(popover()).toBeInTheDocument();
      fields.current = false;
      rerender(
        <EditingHost
          spies={{ onSelect, onStartEdit, onCommit, onCommitValues, onCancel, onClearCell }}
          column={column}
        />
      );
      expect(screen.queryByTestId('nl-column-editor')).toBeNull();
      expect(pill('age')).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes once the column is gone', () => {
      const column = columnEdit();
      const { rerender, onSelect, onStartEdit, onCommit, onCommitValues, onCancel, onClearCell } =
        renderEditing({ column });
      fireEvent.click(pill('age'));
      rerender(
        <EditingHost
          spies={{ onSelect, onStartEdit, onCommit, onCommitValues, onCancel, onClearCell }}
          column={column}
          {...GRID_SENTENCE_COLUMNS}
          inputs={GRID_SENTENCE_COLUMNS.inputs.filter((c) => c.id !== 'age')}
        />
      );
      expect(screen.queryByTestId('nl-column-editor')).toBeNull();
    });
  });

  describe('conditions', () => {
    const renderConditions = () => {
      const onClearCell = vi.fn();
      const rendered = render(
        view({ edit: editWith({ onClearCell }), selected: null, onSelect: vi.fn() })
      );
      return { onClearCell, ...rendered };
    };
    const button = (rowId: string, name: string) =>
      within(card(rowId)).getByRole('button', { name });

    it("clears a list line's condition from its remove action, and each of a lead's from its own", () => {
      const { onClearCell } = renderConditions();
      fireEvent.click(button('m1', 'Remove Debt Ratio from rule 1'));
      fireEvent.click(button('m3', 'Remove Channel from rule 3'));
      fireEvent.click(button('m3', 'Remove Credit Score from rule 3'));
      expect(onClearCell.mock.calls).toEqual([
        [{ rowId: 'm1', columnId: 'debt' }],
        [{ rowId: 'm3', columnId: 'channel' }],
        [{ rowId: 'm3', columnId: 'score' }],
      ]);
      expect(
        within(card('m3'))
          .getAllByRole('button', { name: /^Remove / })
          .map((remove) => remove.getAttribute('aria-label'))
      ).toEqual(['Remove Credit Score from rule 3', 'Remove Channel from rule 3']);
    });

    it('clears each outcome with a value from the heading, and offers no card action without edit', () => {
      const { onClearCell, unmount } = renderConditions();
      const clears = (rowId: string) =>
        [...(ruleLine(rowId, 0)?.querySelectorAll('[data-rule-action]') ?? [])].map((action) =>
          action.getAttribute('aria-label')
        );
      expect(clears('m1')).toEqual([
        'Clear Decision in rule 1',
        'Clear Credit Limit in rule 1',
        'Clear Reason in rule 1',
      ]);
      expect(clears('m2')).toEqual(['Clear Decision in rule 2', 'Clear Credit Limit in rule 2']);
      fireEvent.click(button('m2', 'Clear Credit Limit in rule 2'));
      expect(onClearCell.mock.calls).toEqual([[{ rowId: 'm2', columnId: 'limit' }]]);
      expect(within(card('m5')).queryAllByRole('button', { name: /^Remove / })).toEqual([]);
      unmount();
      renderView({ selected: null, onSelect: vi.fn() });
      expect(document.querySelectorAll('[data-rule-action]')).toHaveLength(0);
    });

    it('clears a selected cell on Delete or Backspace, an input or an output alike', () => {
      const onClearCell = vi.fn();
      renderSelectable({
        rules: MULTI_SENTENCE_RULES,
        initial: { kind: 'cell', rowId: 'm3', columnId: 'channel' } satisfies SentenceSelection,
        edit: editWith({ onClearCell }),
      });
      act(() => valueChip('m3', 'channel').focus());
      expect(press('Delete')).toBe(false);
      press('Home');
      press('ArrowRight');
      expect(focusedStop()).toBe('m3:decision');
      expect(press('Backspace')).toBe(false);
      press('Home');
      expect(press('Delete')).toBe(true);
      expect(onClearCell.mock.calls).toEqual([
        [{ rowId: 'm3', columnId: 'channel' }],
        [{ rowId: 'm3', columnId: 'decision' }],
      ]);
    });

    it('opens the inputs a rule has no condition on from +, and edits one on its pending line', () => {
      const { onSelect } = renderEditing({
        inputIds: ['age', 'income'],
        initial: { kind: 'cell', rowId: 'r1', columnId: 'age' } satisfies SentenceSelection,
      });
      const add = button('r3', 'Add condition to rule 3');
      expect(add).toHaveAttribute('aria-haspopup', 'menu');
      const frame = screen.getByTestId('nl');
      Object.defineProperty(frame, 'clientWidth', { value: 800 });
      Object.defineProperty(frame, 'clientHeight', { value: 400 });
      const boxes = vi
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockImplementation(function (this: HTMLElement) {
          return this.closest('[data-pending]') && this.dataset.kind === 'value'
            ? { ...rect(300, 380), top: 130, bottom: 154 }
            : rect(0, 0);
        });
      fireEvent.click(add);
      const menu = screen.getByRole('menu');
      expect(menu).toHaveAttribute('aria-label', 'Add condition to rule 3');
      expect(
        within(menu)
          .getAllByRole('menuitem')
          .map((item) => item.textContent)
      ).toEqual(['income']);
      fireEvent.click(within(menu).getByRole('menuitem', { name: 'income' }));
      expect(onSelect.mock.calls).toEqual([[{ kind: 'cell', rowId: 'r3', columnId: 'income' }]]);
      const input = editor();
      expect(input).toHaveValue('');
      expect(input).toHaveAccessibleName('New income condition, rule 3');
      expect(screen.getByTestId('nl-value-editor')).toHaveStyle({ top: '154px', left: '300px' });
      boxes.mockRestore();
      expect(document.activeElement).toBe(input);
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(document.activeElement).toBe(add);
      expect(add).toHaveAttribute('tabindex', '0');
    });

    it('returns focus to + when a new condition is cancelled with nothing selected', () => {
      renderEditing({
        initialEditing: { rowId: 'r3', columnId: 'income', index: 0 },
      });
      fireEvent.keyDown(editor(), { key: 'Escape' });
      expect(document.activeElement).toBe(button('r3', 'Add condition to rule 3'));
    });

    const [withRegion, regionId] = tableWithNewInput(EDITABLE_TABLE);
    const FOUR_LINES = tableWithValue(
      withRegion,
      { rowId: 'r2', columnId: regionId, index: 0 },
      '"EU"'
    );

    interface TableHostProps {
      initial: SentenceSelection | null;
      start?: EditableTable;
      late?: boolean;
    }

    const TableHost = ({ initial, start = EDITABLE_TABLE, late = false }: TableHostProps) => {
      const [table, setTable] = useState(start);
      const [selected, setSelected] = useState(initial);
      const [editing, setEditing] = useState<SentenceValueId | null>(null);
      return view({
        rules: wordedRules(table),
        ...tableColumns(table),
        hitPolicy: GRID_SENTENCE_POLICY,
        selected,
        onSelect: setSelected,
        edit: editWith({
          editing,
          onStartEdit: setEditing,
          onDeleteRule: (rowId) => setTable((current) => tableWithoutRule(current, rowId)),
          onCommit: (value, commit) => {
            const [text = ''] = valuesOf(commit);
            setTable((current) =>
              text === '' ? tableWithoutCell(current, value) : tableWithValue(current, value, text)
            );
            setEditing(null);
          },
          onClearCell: (cell) => {
            const clear = () => setTable((current) => tableWithoutCell(current, cell));
            if (late) later(clear);
            else clear();
          },
          inputIds: table.inputs.map((input) => input.id),
        }),
      });
    };

    it.each<[string, SentenceCellId, boolean]>([
      ['its last line', { rowId: 'r2', columnId: 'channel' }, false],
      ['its lead', { rowId: 'r1', columnId: 'age' }, false],
      ['its last line, a moment later', { rowId: 'r2', columnId: 'channel' }, true],
      ['its lead, a moment later', { rowId: 'r1', columnId: 'age' }, true],
    ])('keeps focus on the rule after Delete removes its condition from %s', async (_, cell, late) => {
      render(<TableHost initial={{ kind: 'cell', ...cell }} late={late} />);
      act(() => valueChip(cell.rowId, cell.columnId).focus());
      press('Delete');
      await settleLater();
      expect(card(cell.rowId).querySelector(`[data-column-id="${cell.columnId}"]`)).toBeNull();
      expect(document.activeElement).toBe(card(cell.rowId));
      expect(card(cell.rowId)).toHaveAttribute('tabindex', '0');
    });

    it('keeps focus on the rule after Delete removes its lead condition in a shadow root', () => {
      const host = document.body.appendChild(document.createElement('div'));
      const shadow = host.attachShadow({ mode: 'open' });
      const container = shadow.appendChild(document.createElement('div'));
      render(<TableHost initial={{ kind: 'cell', rowId: 'r1', columnId: 'age' }} />, { container });
      const row = within(container).getByTestId('nl-row-r1');
      const age = row.querySelector<HTMLElement>('[data-kind="value"][data-column-id="age"]');
      if (!age) throw new Error('no age value in r1');
      act(() => age.focus());
      fireEvent.keyDown(age, { key: 'Delete' });
      expect(row.querySelector('[data-column-id="age"]')).toBeNull();
      expect(shadow.activeElement).toBe(row);
      host.remove();
    });

    it.each<[string, SentenceCellId, KeyboardEventInit, string]>([
      ['Enter to the next rule', { rowId: 'r1', columnId: 'age' }, { key: 'Enter' }, 'r2:age'],
    ])('moves by %s when committing an empty value removes its condition', (_, cell, key, stop) => {
      render(<TableHost initial={{ kind: 'cell', ...cell }} />);
      act(() => valueChip(cell.rowId, cell.columnId).focus());
      press('Enter');
      fireEvent.change(editor(), { target: { value: '' } });
      fireEvent.keyDown(editor(), key);
      expect(card(cell.rowId).querySelector(`[data-column-id="${cell.columnId}"]`)).toBeNull();
      expect(focusedStop()).toBe(stop);
    });

    it.each<[string, KeyboardEventInit, string]>([
      ['Enter to the next rule', { key: 'Enter' }, 'r2:channel'],
    ])('moves by %s when committing a condition added from +', (_, key, stop) => {
      render(<TableHost initial={{ kind: 'rule', rowId: 'r1' }} />);
      fireEvent.click(button('r1', 'Add condition to rule 1'));
      fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'channel' }));
      fireEvent.change(editor(), { target: { value: '"web"' } });
      fireEvent.keyDown(editor(), key);
      expect(valueChip('r1', 'channel')).toHaveTextContent('"web"');
      expect(focusedStop()).toBe(stop);
    });

    it('keeps focus on the rule after its ✕ removes a line with lines after it', () => {
      render(<TableHost initial={{ kind: 'rule', rowId: 'r2' }} start={FOUR_LINES} />);
      const remove = button('r2', 'Remove age from rule 2');
      act(() => remove.focus());
      fireEvent.click(remove);
      expect(document.activeElement).toBe(card('r2'));
    });

    it.each([
      ['press outside', () => pressOutside(screen.getByTestId('nl-value-editor'))],
      ['Enter', () => fireEvent.keyDown(editor(), { key: 'Enter' })],
    ])('closes the editor of the condition its ✕ removes after a refused %s commit, staying on its rule', (_, settle) => {
      const { onCancel, onClearCell, onSelect } = renderEditing({
        initial: { kind: 'cell', rowId: 'r1', columnId: 'age' } satisfies SentenceSelection,
        initialEditing: { rowId: 'r1', columnId: 'age', index: 0 },
        refuse: true,
      });
      fireEvent.change(editor(), { target: { value: '' } });
      settle();
      fireEvent.click(button('r1', 'Remove age from rule 1'));
      expect(onClearCell).toHaveBeenCalledWith({ rowId: 'r1', columnId: 'age' });
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('nl-editor')).toBeNull();
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('returns focus to the rule after its ✕ removes a condition whose commit was refused while focus is on the view', () => {
      renderEditing({
        initial: { kind: 'cell', rowId: 'r1', columnId: 'age' } satisfies SentenceSelection,
        initialEditing: { rowId: 'r1', columnId: 'age', index: 0 },
        refuse: true,
      });
      fireEvent.change(editor(), { target: { value: '' } });
      fireEvent.blur(editor());
      act(() => screen.getByTestId('nl').focus());
      fireEvent.click(button('r1', 'Remove age from rule 1'));
      expect(card('r1').contains(document.activeElement)).toBe(true);
    });

    const noValueLead = [
      'when ',
      { kind: 'input', columnId: 'age', text: 'age' },
      ' is less than ',
      { kind: 'value', columnId: 'age', index: 0, text: '25' },
      ' and ',
      { kind: 'input', columnId: 'income', text: 'income' },
      ' is not empty',
    ] satisfies SentencePart[];
    const NO_VALUE_RULES = GRID_SENTENCE_RULES.map((rule) =>
      rule.rowId === 'r1' ? { ...rule, lead: noValueLead } : rule
    );

    const noValueInput = () => {
      const input = card('r1').querySelector<HTMLElement>(
        '[data-kind="input"][data-column-id="income"]'
      );
      if (!input) throw new Error('no income input in r1');
      return input;
    };

    it('selects a condition with no value by a click on its input', () => {
      const { onSelect } = renderSelectable({ rules: NO_VALUE_RULES });
      fireEvent.click(noValueInput());
      expect(onSelect).toHaveBeenLastCalledWith({ kind: 'cell', rowId: 'r1', columnId: 'income' });
    });

    it('edits a condition with no value by a click on its input', () => {
      const { onStartEdit } = renderEditing({ rules: NO_VALUE_RULES });
      fireEvent.click(noValueInput());
      expect(onStartEdit).toHaveBeenCalledWith({ rowId: 'r1', columnId: 'income', index: 0 });
    });

    it('removes a condition with no value by Delete on its input', () => {
      const { onClearCell } = renderEditing({
        rules: NO_VALUE_RULES,
        initial: { kind: 'rule', rowId: 'r1' },
      });
      act(() => card('r1').focus());
      walk('ArrowRight', 'ArrowRight', 'ArrowRight');
      expect(document.activeElement).toHaveAttribute('data-column-id', 'income');
      press('Delete');
      expect(onClearCell).toHaveBeenCalledWith({ rowId: 'r1', columnId: 'income' });
    });

    it.each<[string, KeyboardEventInit, string]>([
      ['Escape back to its input', { key: 'Escape' }, 'r1:income'],
      ['Enter down to the next rule', { key: 'Enter' }, 'r2:income'],
    ])('moves by %s from the editor of a condition with no value', (_, key, stop) => {
      renderEditing({
        rules: NO_VALUE_RULES,
        initial: { kind: 'cell', rowId: 'r1', columnId: 'income' },
      });
      act(() => card('r1').querySelector<HTMLElement>('[data-column-id="income"]')?.focus());
      press('Enter');
      fireEvent.keyDown(editor(), key);
      expect(focusedStop()).toBe(stop);
    });

    it('names the editor of a condition with no value as its cell, not as a new condition', () => {
      renderEditing({
        rules: NO_VALUE_RULES,
        initial: { kind: 'cell', rowId: 'r1', columnId: 'income' },
      });
      act(() => card('r1').querySelector<HTMLElement>('[data-column-id="income"]')?.focus());
      press('Enter');
      expect(editor()).toHaveAccessibleName('income, rule 1');
    });

    it('keeps focus on the rule after its ✕ re-words it, selecting that rule first', () => {
      render(<TableHost initial={{ kind: 'cell', rowId: 'r1', columnId: 'age' }} />);
      const remove = button('r2', 'Remove channel from rule 2');
      act(() => remove.focus());
      fireEvent.click(remove);
      expect(card('r2').querySelectorAll('li[data-column-id]')).toHaveLength(0);
      expect(document.activeElement).toBe(card('r2'));
      const removeAge = button('r2', 'Remove age from rule 2');
      act(() => removeAge.focus());
      fireEvent.click(removeAge);
      expect(document.activeElement).toBe(card('r2'));
    });

    it("keeps each rule's line count, so the windowing arithmetic still holds", () => {
      const { unmount } = renderView();
      const lineTexts = () =>
        MULTI_SENTENCE_RULES.map((rule) =>
          [...card(rule.rowId).querySelectorAll('li[data-column-id]')].map(
            (line) => line.textContent
          )
        );
      const readOnly = lineTexts();
      unmount();
      renderConditions();
      expect(lineTexts()).toEqual(readOnly);
    });
  });

  describe('rule menu', () => {
    const actions = (rowId: string) =>
      within(card(rowId)).getByRole('button', { name: `Rule ${rowId.slice(1)} actions` });
    const renderMenus = (overrides: Partial<FixtureEdit> = {}) =>
      render(
        view({
          rules: GRID_SENTENCE_RULES,
          ...GRID_SENTENCE_COLUMNS,
          selected: null,
          onSelect: vi.fn(),
          edit: editWith(overrides),
        })
      );
    const menuItems = () =>
      within(screen.getByRole('menu'))
        .getAllByRole('menuitem')
        .map((item) => item.textContent);
    type RuleChange = (rules: readonly SentenceRule[], rowId: string) => readonly SentenceRule[];
    interface RuleChangeHostProps {
      change: RuleChange;
      next?: string;
      initial?: string;
      onDeleteRule?: FixtureEdit['onDeleteRule'];
      late?: boolean;
    }
    const RuleChangeHost = ({
      change,
      next,
      initial = 'r2',
      onDeleteRule,
      late,
    }: RuleChangeHostProps) => {
      const [rules, setRules] = useState<readonly SentenceRule[]>(GRID_SENTENCE_RULES);
      const [selected, setSelected] = useState<SentenceSelection | null>({
        kind: 'rule',
        rowId: initial,
      });
      const apply = (rowId: string) => {
        setRules((current) => change(current, rowId));
        if (next) setSelected({ kind: 'rule', rowId: next });
      };
      return view({
        rules,
        selected,
        onSelect: setSelected,
        edit: editWith({
          onInsertRule: (index) => apply(rules[index - 1]?.rowId ?? ''),
          onDeleteRule: (rowId) => {
            onDeleteRule?.(rowId);
            if (late) later(() => apply(rowId));
            else apply(rowId);
          },
        }),
      });
    };
    const removeRule: RuleChange = (rules, rowId) => rules.filter((rule) => rule.rowId !== rowId);
    const insertBelow: RuleChange = (rules, rowId) =>
      rules.flatMap((rule) => (rule.rowId === rowId ? [rule, { ...rule, rowId: 'r2b' }] : [rule]));

    it("opens its own rule's menu from ⋯, runs the picked action for that rule, and focuses ⋯ again on close", () => {
      const onDeleteRule = vi.fn();
      renderMenus({ onDeleteRule });
      expect(actions('r2')).toHaveAttribute('aria-haspopup', 'menu');
      fireEvent.click(actions('r2'));
      const menu = screen.getByRole('menu');
      expect(menu).toHaveAttribute('aria-label', 'Rule 2 actions');
      expect(menuItems()).toEqual(['Delete rule 2']);
      fireEvent.click(within(menu).getByRole('menuitem', { name: 'Delete rule 2' }));
      expect(onDeleteRule.mock.calls).toEqual([['r2']]);
      expect(screen.queryByRole('menu')).toBeNull();
      expect(document.activeElement).toBe(actions('r2'));
      fireEvent.click(actions('r2'));
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
      expect(screen.queryByRole('menu')).toBeNull();
      expect(document.activeElement).toBe(actions('r2'));
    });

    const RULE_ACTIONS = [
      'onInsertRule',
      'onDuplicateRule',
      'onClearRule',
      'onMoveRule',
      'onDeleteRule',
    ] as const;
    const ruleActionSpies = () => ({
      onInsertRule: vi.fn(),
      onDuplicateRule: vi.fn(),
      onClearRule: vi.fn(),
      onMoveRule: vi.fn(),
      onDeleteRule: vi.fn(),
    });

    it("words a rule's menu in groups, insert to clear, move, delete, each pick calling its action for that rule", () => {
      const spies = ruleActionSpies();
      renderMenus(spies);
      const pick = (rowId: string, name: string) => {
        fireEvent.click(actions(rowId));
        fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name }));
      };
      fireEvent.click(actions('r2'));
      expect(menuItems()).toEqual([
        'Insert rule above',
        'Insert rule below',
        'Duplicate rule',
        'Clear rule',
        'Move up',
        'Move down',
        'Delete rule 2',
      ]);
      expect(screen.getByRole('menu').querySelectorAll('[role="separator"]')).toHaveLength(2);
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
      pick('r2', 'Insert rule above');
      pick('r2', 'Insert rule below');
      pick('r2', 'Duplicate rule');
      pick('r2', 'Clear rule');
      pick('r2', 'Move up');
      pick('r2', 'Move down');
      pick('r2', 'Delete rule 2');
      expect(RULE_ACTIONS.map((name) => spies[name].mock.calls)).toEqual([
        [[1], [2]],
        [['r2']],
        [['r2']],
        [
          [1, 0],
          [1, 2],
        ],
        [['r2']],
      ]);
    });

    it.each<[string, string, string]>([
      ['first', 'r1', 'Move up'],
      ['last', 'r3', 'Move down'],
    ])('offers no move past the %s rule', (_, rowId, name) => {
      const spies = ruleActionSpies();
      renderMenus(spies);
      fireEvent.click(actions(rowId));
      const item = within(screen.getByRole('menu')).getByRole('menuitem', { name });
      expect(item).toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(item);
      expect(spies.onMoveRule).not.toHaveBeenCalled();
    });

    it.each<['onInsertRule' | 'onMoveRule', readonly string[], number]>([
      [
        'onInsertRule',
        ['Duplicate rule', 'Clear rule', 'Move up', 'Move down', 'Delete rule 2'],
        2,
      ],
      [
        'onMoveRule',
        ['Insert rule above', 'Insert rule below', 'Duplicate rule', 'Clear rule', 'Delete rule 2'],
        1,
      ],
    ])('leaves out the entries of an action the host omits, %s, and a divider left without a group', (omitted, items, dividers) => {
      renderMenus({ ...ruleActionSpies(), [omitted]: undefined });
      fireEvent.click(actions('r2'));
      expect(menuItems()).toEqual(items);
      expect(screen.getByRole('menu').querySelectorAll('[role="separator"]')).toHaveLength(
        dividers
      );
    });

    it("words a rule's add-condition menu from the inputs it has no condition on, then Add input", () => {
      const onAddInput = vi.fn();
      renderMenus({ inputIds: ['income', 'age', 'gone', 'income'], onAddInput });
      fireEvent.click(within(card('r3')).getByRole('button', { name: 'Add condition to rule 3' }));
      expect(menuItems()).toEqual(['income', 'Add input column']);
      expect(screen.getByRole('menu').querySelectorAll('[role="separator"]')).toHaveLength(1);
      fireEvent.click(
        within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Add input column' })
      );
      expect(onAddInput.mock.calls).toEqual([['r3']]);
      expect(screen.queryByTestId('nl-value-editor')).toBeNull();
    });

    it('opens no menu from + while there is no input to add and no Add input', () => {
      renderMenus({ inputIds: ['age'] });
      const add = within(card('r3')).getByRole('button', { name: 'Add condition to rule 3' });
      fireEvent.click(add);
      expect(screen.queryByRole('menu')).toBeNull();
      expect(add).not.toHaveAttribute('aria-expanded', 'true');
    });

    it('marks only the button whose menu is open as expanded', () => {
      renderMenus({ onAddInput: vi.fn() });
      const add = (rowId: string) =>
        within(card(rowId)).getByRole('button', {
          name: `Add condition to rule ${rowId.slice(1)}`,
        });
      const expanded = () =>
        screen
          .getAllByRole('button', { expanded: true })
          .map((button) => button.getAttribute('aria-label'));
      fireEvent.click(add('r2'));
      expect(expanded()).toEqual(['Add condition to rule 2']);
      expect(add('r2')).toHaveAttribute('aria-haspopup', 'menu');
      expect(actions('r2')).toHaveAttribute('aria-expanded', 'false');
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
      expect(add('r2')).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(actions('r2'));
      expect(expanded()).toEqual(['Rule 2 actions']);
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
      expect(screen.queryAllByRole('button', { expanded: true })).toEqual([]);
    });

    it.each<[string, string, RuleChange, string, string]>([
      ["removes the menu's own rule", 'Delete rule 2', removeRule, 'r3', 'r3'],
      ['inserts it, and walks on from there', 'Insert rule below', insertBelow, 'r2b', 'r3'],
    ])('focuses the rule the host selects once a menu pick %s', (_, label, change, next, below) => {
      render(<RuleChangeHost change={change} next={next} />);
      fireEvent.click(actions('r2'));
      fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: label }));
      expect(screen.queryAllByTestId('nl-row-r2')).toHaveLength(change === removeRule ? 0 : 1);
      expect(document.activeElement).toBe(card(next));
      expect(walk('ArrowDown')).toEqual([below]);
    });

    it.each<[string, () => void]>([
      ['the rules scroll', () => scrollTo(150)],
      ['the window resizes', () => window.dispatchEvent(new Event('resize'))],
      ['an outer container scrolls', () => fireEvent.scroll(document.body)],
      ['the page scrolls', () => fireEvent.scroll(document)],
    ])('closes the rule menu when %s, not when the menu scrolls, and focuses ⋯ again', (_, close) => {
      renderMenus();
      fireEvent.click(actions('r2'));
      fireEvent.scroll(screen.getByRole('menu'));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      act(close);
      expect(screen.queryByRole('menu')).toBeNull();
      expect(document.activeElement).toBe(actions('r2'));
    });

    it.each([
      'the rules scroll',
      'a container outside the shadow root scrolls',
    ])('closes the rule menu of a view in a shadow root when %s, not when the menu scrolls', (scroller) => {
      const outer = document.body.appendChild(document.createElement('div'));
      onTestFinished(() => outer.remove());
      const shadow = outer
        .appendChild(document.createElement('div'))
        .attachShadow({ mode: 'open' });
      const container = shadow.appendChild(document.createElement('div'));
      render(
        view({
          rules: GRID_SENTENCE_RULES,
          selected: null,
          onSelect: vi.fn(),
          edit: editWith(),
        }),
        { container }
      );
      const inView = within(container);
      fireEvent.click(
        within(inView.getByTestId('nl-row-r2')).getByRole('button', { name: 'Rule 2 actions' })
      );
      const menu = () => inView.queryByRole('menu') ?? screen.queryByRole('menu');
      const open = menu();
      if (!open) throw new Error('no rule menu');
      fireEvent.scroll(open);
      expect(menu()).not.toBeNull();
      act(() => {
        fireEvent.scroll(scroller === 'the rules scroll' ? inView.getByTestId('nl') : outer);
      });
      expect(menu()).toBeNull();
    });

    it('closes the rule menu of a view slotted into a scrolling shadow-root panel when the panel scrolls', () => {
      const panel = document.body.appendChild(document.createElement('div'));
      onTestFinished(() => panel.remove());
      const scroller = panel
        .attachShadow({ mode: 'open' })
        .appendChild(document.createElement('div'));
      const slot = scroller.appendChild(document.createElement('slot'));
      const container = panel.appendChild(document.createElement('div'));
      Object.defineProperty(container, 'assignedSlot', { configurable: true, value: slot });
      render(
        view({
          rules: GRID_SENTENCE_RULES,
          selected: null,
          onSelect: vi.fn(),
          edit: editWith(),
        }),
        { container }
      );
      fireEvent.click(actions('r2'));
      fireEvent.scroll(screen.getByRole('menu'));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      act(() => {
        fireEvent.scroll(scroller);
      });
      expect(screen.queryByRole('menu')).toBeNull();
      expect(document.activeElement).toBe(actions('r2'));
    });

    it.each<[string, readonly SentenceRule[], boolean]>([
      ['its rule is gone', GRID_SENTENCE_RULES.filter((rule) => rule.rowId !== 'r2'), true],
      ['editing is gone', GRID_SENTENCE_RULES, false],
    ])('closes the rule menu once %s, running nothing, and focuses the view', (_, rules, editable) => {
      const onDeleteRule = vi.fn();
      const edit = editWith({ onDeleteRule });
      const onSelect = vi.fn();
      const { rerender } = render(
        view({ rules: GRID_SENTENCE_RULES, selected: null, onSelect, edit })
      );
      fireEvent.click(actions('r2'));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      rerender(view({ rules, selected: null, onSelect, edit: editable ? edit : undefined }));
      expect(screen.queryByRole('menu')).toBeNull();
      expect(onDeleteRule).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(screen.getByTestId('nl'));
    });

    it('keeps the rule menu at its button when a rule inserted above moves it', () => {
      const original = HTMLElement.prototype.getBoundingClientRect;
      const boxes = vi
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockImplementation(function (this: HTMLElement) {
          if (this.dataset.ruleAction !== 'rule') return original.call(this);
          const top = mountedRows().findIndex((row) => row.contains(this)) * 40;
          return { ...rect(10, 30), top, y: top, bottom: top + 24 };
        });
      const edit = editWith();
      const onSelect = vi.fn();
      const { rerender } = render(
        view({ rules: GRID_SENTENCE_RULES, selected: null, onSelect, edit })
      );
      fireEvent.click(actions('r2'));
      const before = screen.getByTestId('nl-context-menu-anchor').style.top;
      const [first] = GRID_SENTENCE_RULES;
      if (!first) throw new Error('no first rule');
      rerender(
        view({
          rules: [{ ...first, rowId: 'r0' }, ...GRID_SENTENCE_RULES],
          selected: null,
          onSelect,
          edit,
        })
      );
      const after = screen.getByTestId('nl-context-menu-anchor').style.top;
      boxes.mockRestore();
      expect([before, after]).toEqual(['64px', '104px']);
    });

    it('closes the rule menu when rules inserted above move its rule out of the mounted rules', () => {
      const rules = manySentenceRules(2000);
      const props = {
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        selected: null,
        onSelect: vi.fn(),
        edit: editWith(),
      };
      const { rerender } = render(view({ ...props, rules }));
      const trigger = card('row-2').querySelector<HTMLElement>('[data-rule-action="rule"]');
      if (!trigger) throw new Error('no ⋯ in row-2');
      fireEvent.click(trigger);
      expect(screen.getByRole('menu')).toBeInTheDocument();
      const inserted = manySentenceRules(50).map((rule) => ({
        ...rule,
        rowId: `new-${rule.rowId}`,
      }));
      rerender(view({ ...props, rules: [...inserted, ...rules] }));
      expect(screen.queryByTestId('nl-row-row-2')).toBeNull();
      expect(screen.queryByRole('menu')).toBeNull();
      expect(document.activeElement).toBe(screen.getByTestId('nl'));
    });

    it('leaves the rules where they scrolled when the scroll that closes a menu unmounts its rule', () => {
      renderSelectable({
        rules: manySentenceRules(2000),
        ...MULTI_SENTENCE_COLUMNS,
        hitPolicy: MULTI_SENTENCE_POLICY,
        initial: { kind: 'rule', rowId: 'row-0' } satisfies SentenceSelection,
        edit: editWith(),
      });
      const trigger = card('row-2').querySelector<HTMLElement>('[data-rule-action="rule"]');
      if (!trigger) throw new Error('no ⋯ in row-2');
      fireEvent.click(trigger);
      expect(screen.getByRole('menu')).toBeInTheDocument();
      act(() => scrollTo(30_000));
      expect(screen.queryByRole('menu')).toBeNull();
      expect(screen.queryByTestId('nl-row-row-2')).toBeNull();
      expect(screen.getByTestId('nl').scrollTop).toBe(30_000);
      expect(document.activeElement).toBe(card('row-0'));
    });

    it("tabs from the selected stop to its rule's + to ⋯ to delete to Add rule and then out of the view, leaving their keys to the browser", () => {
      const { onSelect } = renderSelectable({
        initial: { kind: 'cell', rowId: 'r3', columnId: 'risk' } satisfies SentenceSelection,
        edit: editWith(),
      });
      const add = within(card('r3')).getByRole('button', { name: 'Add condition to rule 3' });
      const chip = valueChip('r3', 'risk');
      act(() => chip.focus());
      expect(press('Tab')).toBe(true);
      const tabbable = [
        ...screen.getByTestId('nl').querySelectorAll<HTMLElement>('button, [tabindex]'),
      ].filter(
        (element) =>
          element.tabIndex >= 0 &&
          (element === chip ||
            (chip.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0)
      );
      const remove = within(card('r3')).getByRole('button', { name: 'Delete rule 3' });
      const addRule = screen.getByRole('button', { name: 'Add rule' });
      expect(tabbable).toEqual([chip, add, actions('r3'), remove, addRule]);
      expect(
        within(card('r2')).getByRole('button', { name: 'Add condition to rule 2' })
      ).toHaveAttribute('tabindex', '-1');
      for (const action of [add, actions('r3'), remove, addRule]) {
        act(() => action.focus());
        expect(press('Tab')).toBe(true);
      }
      act(() => add.focus());
      expect(press('Tab', { shiftKey: true })).toBe(true);
      expect(press('ArrowLeft')).toBe(true);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('deletes its rule from the delete action, leaves Delete on the rule to the host, and focuses the rule the host selects', () => {
      const onDeleteRule = vi.fn();
      render(<RuleChangeHost change={removeRule} next="r3" onDeleteRule={onDeleteRule} />);
      act(() => card('r2').focus());
      expect(press('Delete')).toBe(true);
      expect(onDeleteRule).not.toHaveBeenCalled();
      const remove = within(card('r2')).getByRole('button', { name: 'Delete rule 2' });
      expect(remove).toHaveAttribute('data-rule-action', 'delete');
      act(() => remove.focus());
      fireEvent.click(remove);
      expect(onDeleteRule.mock.calls).toEqual([['r2']]);
      expect(screen.queryByTestId('nl-row-r2')).toBeNull();
      expect(screen.queryByRole('menu')).toBeNull();
      expect(document.activeElement).toBe(card('r3'));
    });

    it('leaves no refocus pending from a delete the host refused, so its later select of another rule takes no focus', () => {
      const props = {
        rules: GRID_SENTENCE_RULES,
        onSelect: vi.fn(),
        edit: editWith({ onDeleteRule: vi.fn() }),
      };
      const { rerender } = render(view({ ...props, selected: { kind: 'rule', rowId: 'r2' } }));
      const remove = within(card('r2')).getByRole('button', { name: 'Delete rule 2' });
      act(() => remove.focus());
      fireEvent.click(remove);
      expect(props.edit.onDeleteRule).toHaveBeenCalledWith('r2');
      expect(document.activeElement).toBe(card('r2'));
      rerender(view({ ...props, selected: { kind: 'rule', rowId: 'r1' } }));
      expect(document.activeElement).toBe(card('r2'));
    });

    it('leaves no refocus pending from a clear the host refused, so its later select of another rule takes no focus', () => {
      const props = {
        rules: GRID_SENTENCE_RULES,
        ...GRID_SENTENCE_COLUMNS,
        onSelect: vi.fn(),
        edit: editWith({ onClearCell: vi.fn() }),
      };
      const { rerender } = render(
        view({ ...props, selected: { kind: 'cell', rowId: 'r2', columnId: 'age' } })
      );
      const chip = valueChip('r2', 'age');
      act(() => chip.focus());
      press('Delete');
      expect(props.edit.onClearCell).toHaveBeenCalledWith({ rowId: 'r2', columnId: 'age' });
      expect(document.activeElement).toBe(chip);
      rerender(view({ ...props, selected: { kind: 'rule', rowId: 'r1' } }));
      expect(document.activeElement).toBe(chip);
    });

    it.each<[string, string, Pick<RuleChangeHostProps, 'next' | 'late'>, string]>([
      ['r2', 'selects the next rule', { next: 'r3' }, 'r3'],
      ['r2', 'selects the next rule a moment later', { next: 'r3', late: true }, 'r3'],
      ['r2', 'keeps its selection', {}, 'nl'],
      ['r1', 'selects the next rule', { next: 'r3' }, 'r3'],
      ['r1', 'selects the next rule a moment later', { next: 'r3', late: true }, 'r3'],
      ['r1', 'keeps its selection', {}, 'r1'],
    ])('with %s selected, focuses what the host %s once it removes the rule of the delete action pressed', async (initial, _, answer, focused) => {
      render(<RuleChangeHost change={removeRule} initial={initial} {...answer} />);
      const remove = within(card('r2')).getByRole('button', { name: 'Delete rule 2' });
      act(() => remove.focus());
      fireEvent.click(remove);
      await settleLater();
      expect(screen.queryByTestId('nl-row-r2')).toBeNull();
      expect(focusedStop()).toBe(focused);
    });

    it.each<[string, string, () => void]>([
      ['r2', 'a key', () => press('Shift')],
      ['r2', 'a press', () => fireEvent.pointerDown(screen.getByTestId('nl'))],
      ['r1', 'a key', () => press('Shift')],
      ['r1', 'a press', () => fireEvent.pointerDown(screen.getByTestId('nl'))],
    ])('with %s selected, leaves focus where the press of a refused delete action put it, and drops its refocus at %s', (initial, _, gesture) => {
      const props = { rules: GRID_SENTENCE_RULES, onSelect: vi.fn(), edit: editWith() };
      const { rerender } = render(view({ ...props, selected: { kind: 'rule', rowId: initial } }));
      const remove = within(card('r2')).getByRole('button', { name: 'Delete rule 2' });
      act(() => remove.focus());
      fireEvent.click(remove);
      expect(document.activeElement).toBe(initial === 'r2' ? card('r2') : remove);
      gesture();
      rerender(
        view({
          ...props,
          rules: removeRule(GRID_SENTENCE_RULES, 'r2'),
          selected: { kind: 'rule', rowId: 'r3' },
        })
      );
      expect(document.activeElement).toBe(screen.getByTestId('nl'));
    });

    it.each([
      'the document',
      'a shadow root',
    ])('leaves focus on the confirmation the host moves it to from the delete action, in %s', (scope) => {
      const confirm = document.body.appendChild(document.createElement('button'));
      onTestFinished(() => confirm.remove());
      const host = document.body.appendChild(document.createElement('div'));
      onTestFinished(() => host.remove());
      const shadow = scope === 'a shadow root' ? host.attachShadow({ mode: 'open' }) : undefined;
      const container = (shadow ?? host).appendChild(document.createElement('div'));
      render(
        view({
          rules: GRID_SENTENCE_RULES,
          selected: { kind: 'rule', rowId: 'r2' } satisfies SentenceSelection,
          onSelect: vi.fn(),
          edit: editWith({ onDeleteRule: () => confirm.focus() }),
        }),
        { container }
      );
      const remove = within(container).getByRole('button', { name: 'Delete rule 2' });
      act(() => remove.focus());
      fireEvent.click(remove);
      expect(document.activeElement).toBe(confirm);
    });

    it('focuses the rule the host selects after the delete action removes its rule in a shadow root', () => {
      const host = document.body.appendChild(document.createElement('div'));
      onTestFinished(() => host.remove());
      const shadow = host.attachShadow({ mode: 'open' });
      const container = shadow.appendChild(document.createElement('div'));
      render(<RuleChangeHost change={removeRule} next="r3" />, { container });
      const inView = within(container);
      const remove = within(inView.getByTestId('nl-row-r2')).getByRole('button', {
        name: 'Delete rule 2',
      });
      act(() => remove.focus());
      fireEvent.click(remove);
      expect(inView.queryByTestId('nl-row-r2')).toBeNull();
      expect(shadow.activeElement).toBe(inView.getByTestId('nl-row-r3'));
    });
  });

  describe('policy', () => {
    const FIRST: FixturePick = { kind: 'policy', policy: 'first' };
    const trigger = () => screen.getByRole('button', { name: /^Hit policy/ });

    it('offers no menu from a picker the host gives no hit policies', async () => {
      renderView({ hitPolicy: FIRST, hitPolicies: [], onPolicyChange: vi.fn() });
      const user = userEvent.setup();
      await user.click(trigger());
      expect(screen.queryByRole('menu')).toBeNull();
      expect(trigger()).toBeDisabled();
      expect(trigger()).not.toHaveAttribute('aria-haspopup');
    });

    it.each<[string, FixturePick, boolean, string, string]>([
      ['the picked policy', FIRST, true, 'F·First', 'Stops at the first matching rule.'],
      [
        'a picked total',
        { kind: 'total', policy: 'collect', total: 'min' },
        true,
        'C<·Minimum',
        'Returns the smallest match.',
      ],
      [
        'nothing for a pick the host lacks',
        { kind: 'total', policy: 'first', total: 'sum' },
        true,
        '',
        '',
      ],
      [
        'the plain label outside editing',
        GRID_SENTENCE_POLICY,
        false,
        'Unique',
        'Exactly one rule may match. Overlaps are errors.',
      ],
    ])('shows %s in place of the label, then its hint', (_, hitPolicy, editing, label, hint) => {
      renderView({ hitPolicy, ...(editing ? { onPolicyChange: vi.fn() } : {}) });
      expect(screen.queryByTestId('nl-policy')?.textContent).toBe(editing ? label : undefined);
      expect(screen.getByTestId('nl-header').textContent).toBe(`${label}${hint}`);
    });

    it('reports the picked policy and focuses the trigger again', async () => {
      const user = userEvent.setup();
      const onPolicyChange = vi.fn();
      renderView({ hitPolicy: FIRST, onPolicyChange });
      await user.click(trigger());
      const unique = screen.getByRole('menuitemradio', { name: /^Unique/ });
      expect(unique).toHaveAccessibleDescription(
        'Exactly one rule may match. Overlaps are errors.'
      );
      expect(screen.getByRole('menuitemradio', { name: /^First/ })).toHaveAttribute(
        'aria-checked',
        'true'
      );
      await user.click(unique);
      expect(onPolicyChange).toHaveBeenCalledWith(GRID_SENTENCE_POLICY);
      expect(screen.queryByRole('menu')).toBeNull();
      expect(document.activeElement).toBe(trigger());
    });

    it('picks a total by keyboard, and refuses a refused one with its reason', async () => {
      const user = userEvent.setup();
      const onPolicyChange = vi.fn();
      renderView({ hitPolicy: FIRST, onPolicyChange });
      const openTotals = async () => {
        act(() => trigger().focus());
        await user.keyboard('{Enter}');
        act(() => screen.getByRole('menuitem', { name: /^Collect and total/ }).focus());
        await user.keyboard('{ArrowRight}');
        return screen.findByRole('menuitemradio', { name: /^Sum/ });
      };
      const sum = await openTotals();
      expect(sum).toHaveAttribute('aria-disabled', 'true');
      expect(sum).toHaveAccessibleDescription('Needs a number output.');
      expect(
        screen.getByRole('menuitem', { name: /^Collect and total/ })
      ).toHaveAccessibleDescription('Totals the matches.');
      expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: /^Minimum/ }));
      await user.keyboard('{Enter}');
      expect(onPolicyChange).toHaveBeenCalledWith({
        kind: 'total',
        policy: 'collect',
        total: 'min',
      });
      await user.click(await openTotals());
      expect(onPolicyChange).toHaveBeenCalledTimes(1);
    });

    it('ends the picker with the header mark, announced on the trigger', () => {
      renderView({
        onPolicyChange: vi.fn(),
        headerMark: { tone: 'error', title: 'Priority needs ranked output values', glyph: true },
      });
      const badge = screen.getByTestId('nl-header').querySelector('[data-glyph]')?.parentElement;
      expect(badge?.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'error');
      expect(badge).toHaveAttribute('data-mark-title', 'Priority needs ranked output values');
      expect(trigger()).toHaveAccessibleDescription('Error: Priority needs ranked output values');
    });

    it('ends the plain label with the header mark when there is no picker', () => {
      renderView({
        hitPolicy: GRID_SENTENCE_POLICY,
        headerMark: { tone: 'warning', title: 'No rules', glyph: true },
      });
      const header = screen.getByTestId('nl-header');
      expect(header.querySelector('[data-glyph="warning"]')).not.toBeNull();
      expect(screen.getByText('Unique')).toHaveAccessibleDescription('Warning: No rules');
    });
  });

  describe('decision links', () => {
    const linkedRules: SentenceRule[] = GRID_SENTENCE_RULES.map((rule) => ({
      ...rule,
      lead: rule.lead.map((part) =>
        typeof part !== 'string' && part.kind === 'input' && part.columnId === 'income'
          ? { ...part, producedBy: 'income-decision' }
          : part
      ),
    }));
    const link = (rowId: string) =>
      within(card(rowId)).getByRole('button', { name: "Open income's decision" });
    const noValueLinkedRules: SentenceRule[] = GRID_SENTENCE_RULES.map((rule) => ({
      ...rule,
      lead: [
        'when ',
        { kind: 'input', columnId: 'income', text: 'income', producedBy: 'income-decision' },
        ' is not empty',
      ],
    }));

    it('opens the decision by a click on the input or Alt+Enter on its cell, without selecting or editing', () => {
      const onOpenDecision = vi.fn();
      const edit = editWith();
      const { onSelect } = renderSelectable({
        rules: linkedRules,
        onOpenDecision,
        edit,
        initial: { kind: 'cell', rowId: 'r1', columnId: 'income' } satisfies SentenceSelection,
      });
      expect(link('r1')).toHaveAttribute('tabindex', '-1');
      fireEvent.click(link('r2'));
      expect(onOpenDecision).toHaveBeenCalledWith('income-decision');
      expect(onSelect).not.toHaveBeenCalled();
      act(() => valueChip('r1', 'income').focus());
      press('Enter', { altKey: true });
      expect(onOpenDecision).toHaveBeenCalledTimes(2);
      expect(edit.onStartEdit).not.toHaveBeenCalled();
    });

    it('marks a selected linked input with no value as current on its link alone, without axe violations', async () => {
      const { container } = renderSelectable({
        rules: noValueLinkedRules,
        onOpenDecision: vi.fn(),
        initial: { kind: 'cell', rowId: 'r2', columnId: 'income' } satisfies SentenceSelection,
      });
      const current = [...container.querySelectorAll('[aria-current]')];
      expect(current).toEqual([link('r2')]);
      expect(link('r2')).toHaveAttribute('aria-current', 'true');
      expect(link('r1')).not.toHaveAttribute('aria-current');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('takes onSelect only with selected, without which no stop or link is tabbable', () => {
      render(
        <DecisionText
          table={{ rules: linkedRules, ...GRID_SENTENCE_COLUMNS, hitPolicy: GRID_SENTENCE_POLICY }}
          hitPolicies={HIT_POLICIES}
          columnTypes={COLUMN_TYPES}
          ariaLabel="Rules"
          dataTestId="nl"
          onOpenDecision={vi.fn()}
          // @ts-expect-error
          mode={{ kind: 'select', onSelect: vi.fn() }}
        />
      );
      const controls = document.querySelectorAll<HTMLElement>(
        'li[data-row-id], li[data-row-id] [tabindex], li[data-row-id] button'
      );
      expect(screen.getAllByRole('button', { name: "Open income's decision" })).toHaveLength(2);
      expect([...controls].filter((control) => control.tabIndex >= 0)).toEqual([]);
    });

    it('keeps a selectable link in the tab order when its input has no value to open it from', async () => {
      const onOpenDecision = vi.fn();
      renderSelectable({
        rules: noValueLinkedRules,
        onOpenDecision,
        ...NO_COLUMNS,
        initial: { kind: 'cell', rowId: 'r1', columnId: 'income' } satisfies SentenceSelection,
      });
      const user = userEvent.setup();
      await user.tab();
      expect(document.activeElement).toBe(link('r1'));
      await user.keyboard('{Enter}');
      expect(onOpenDecision.mock.calls).toEqual([['income-decision']]);
    });

    it.each([
      'read-only',
      'selectable',
      'editable',
    ])('opens the decision of a linked input with no value on a click in the %s view, which arrow keys select', async (mode) => {
      const onOpenDecision = vi.fn();
      const onStartEdit = vi.fn();
      const edit = mode === 'editable' ? editWith({ onStartEdit }) : undefined;
      const props = { rules: noValueLinkedRules, onOpenDecision };
      const { onSelect } =
        mode === 'read-only'
          ? { onSelect: vi.fn(), ...renderView(props) }
          : renderSelectable({ ...props, edit, initial: { kind: 'rule', rowId: 'r2' } });
      const user = userEvent.setup();
      await user.click(link('r2'));
      expect(onOpenDecision.mock.calls).toEqual([['income-decision']]);
      expect(onSelect).not.toHaveBeenCalled();
      expect(onStartEdit).not.toHaveBeenCalled();
      if (mode === 'read-only') return;
      act(() => card('r2').focus());
      expect(walk('ArrowRight', 'ArrowRight')).toEqual(['r2:risk', 'r2:income']);
      expect(document.activeElement).toBe(link('r2'));
      expect(onSelect.mock.calls).toEqual([
        [{ kind: 'cell', rowId: 'r2', columnId: 'risk' }],
        [{ kind: 'cell', rowId: 'r2', columnId: 'income' }],
      ]);
      expect(onStartEdit).not.toHaveBeenCalled();
    });

    it.each<[string, boolean]>([
      ['selectable', false],
      ['editable', true],
    ])('opens the decision of a selected linked input with no value on Space in the %s view, and on Enter unless Enter edits it', async (_, editable) => {
      const onOpenDecision = vi.fn();
      const onStartEdit = vi.fn();
      renderSelectable({
        rules: noValueLinkedRules,
        onOpenDecision,
        edit: editable ? editWith({ onStartEdit }) : undefined,
        initial: { kind: 'cell', rowId: 'r2', columnId: 'income' } satisfies SentenceSelection,
      });
      const user = userEvent.setup();
      act(() => link('r2').focus());
      await user.keyboard(' ');
      expect(onOpenDecision.mock.calls).toEqual([['income-decision']]);
      expect(onStartEdit).not.toHaveBeenCalled();
      await user.keyboard('{Enter}');
      expect(onOpenDecision).toHaveBeenCalledTimes(editable ? 1 : 2);
      expect(onStartEdit.mock.calls).toEqual(
        editable ? [[{ rowId: 'r2', columnId: 'income', index: 0 }]] : []
      );
    });

    it('stops on each input with no value in reading order, and opens its decision by Alt+Enter', () => {
      const onOpenDecision = vi.fn();
      const lead = [
        'when ',
        { kind: 'input', columnId: 'income', text: 'income', producedBy: 'income-decision' },
        ' is set and ',
        { kind: 'input', columnId: 'age', text: 'age' },
        ' is ',
        { kind: 'value', columnId: 'age', index: 0, text: '25' },
        ' and ',
        { kind: 'input', columnId: 'channel', text: 'channel', producedBy: 'channel-decision' },
        ' is set',
      ] satisfies SentencePart[];
      const rules = GRID_SENTENCE_RULES.map((rule) => ({ ...rule, lead }));
      renderSelectable({ rules, onOpenDecision, initial: { kind: 'rule', rowId: 'r1' } });
      act(() => card('r1').focus());
      expect(walk('ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight')).toEqual([
        'r1:risk',
        'r1:income',
        'r1:age',
        'r1:channel',
      ]);
      walk('ArrowLeft', 'ArrowLeft');
      press('Enter', { altKey: true });
      expect(onOpenDecision.mock.calls).toEqual([['income-decision']]);
    });

    it('keeps a read-only link in the tab order, and the input plain without onOpenDecision', () => {
      const props = { rules: linkedRules, onOpenDecision: vi.fn() };
      const { rerender } = renderView(props);
      expect(link('r1')).not.toHaveAttribute('tabindex');
      rerender(view({ ...props, onOpenDecision: undefined }));
      expect(screen.queryByRole('button', { name: "Open income's decision" })).toBeNull();
    });
  });
});
