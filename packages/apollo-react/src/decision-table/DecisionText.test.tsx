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
import { useState } from 'react';
import { type Mock, onTestFinished, vi } from 'vitest';
import {
  EDITABLE_TABLE,
  type EditableTable,
  tableBands,
  tableWithNewInput,
  tableWithoutCell,
  tableWithValue,
  unusedInputs,
  wordedRules,
} from './__fixtures__/editableSentences.fixtures';
import {
  CHANNEL,
  COUNTRY,
  channel,
  country,
  DECISION_TEXT_EDIT_LABELS,
  DECISION_TEXT_LABELS,
  GRID_SENTENCE_BANDS,
  GRID_SENTENCE_HEADER,
  GRID_SENTENCE_RULES,
  HIT_POLICY_GROUPS,
  longValueListRule,
  MULTI_SENTENCE_BANDS,
  MULTI_SENTENCE_HEADER,
  MULTI_SENTENCE_RULES,
  manyColumnBands,
  manyLinesRule,
  manySentenceRules,
  valueList,
} from './__fixtures__/sentences.fixtures';
import { CellTextEditor } from './CellTextEditor';
import type { ColumnEdit, ColumnField, ColumnTypeOption } from './ColumnPopover';
import { EMPTY_VALUE_DASH, FALLBACK_ROW_VIEWPORT_PX } from './constants';
import { DecisionText, type DecisionTextEdit, type DecisionTextProps } from './DecisionText';
import type { GridMenuEntry } from './GridMenu';
import type { CellCommitMove } from './gridTypes';
import type { RowMark, TableMarks } from './marks';
import { sentenceRuleOffsets } from './sentenceRuleHeights';
import type {
  SentenceBand,
  SentenceCellId,
  SentencePart,
  SentenceRule,
  SentenceSelection,
  SentenceValueId,
  SentenceValueToken,
} from './sentenceTypes';
import type { SentenceEditorContext, ValueField, ValueOperatorOption } from './ValuePopover';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

type ViewProps<Props extends DecisionTextProps = DecisionTextProps> = Props extends unknown
  ? Partial<Props> & Pick<Props, 'selected' | 'onSelect' | 'edit'>
  : never;

const view = (props: ViewProps = {}) => (
  <DecisionText
    rules={MULTI_SENTENCE_RULES}
    bands={MULTI_SENTENCE_BANDS}
    header={MULTI_SENTENCE_HEADER}
    labels={DECISION_TEXT_LABELS}
    ariaLabel="Rules"
    dataTestId="nl"
    {...props}
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

type SelectableProps = Partial<DecisionTextProps> & { initial?: SentenceSelection | null };

const Selectable = ({ initial = null, onSelect, ...props }: SelectableProps) => {
  const [selected, setSelected] = useState(initial);
  return view({
    rules: GRID_SENTENCE_RULES,
    bands: GRID_SENTENCE_BANDS,
    header: GRID_SENTENCE_HEADER,
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
  onSelect: Mock<NonNullable<DecisionTextProps['onSelect']>>;
  onStartEdit: Mock<DecisionTextEdit['onStartEdit']>;
  onCommit: Mock<
    (value: SentenceValueId, text: string, move: CellCommitMove, operator?: string) => void
  >;
  onCommitValues: Mock<DecisionTextEdit['onCommit']>;
  onCancel: Mock<DecisionTextEdit['onCancel']>;
  onClearCell: Mock<DecisionTextEdit['onClearCell']>;
}

interface EditingHostProps
  extends Partial<Omit<DecisionTextProps, 'selected' | 'onSelect' | 'edit'>> {
  spies: EditSpies;
  initial?: SentenceSelection | null;
  initialEditing?: SentenceValueId | null;
  refuse?: boolean;
  renderEditor?: DecisionTextEdit['renderEditor'];
  valueField?: DecisionTextEdit['valueField'];
  column?: DecisionTextEdit['column'];
  conditionEntries?: (
    rowId: string,
    startEdit: (value: SentenceValueId) => void
  ) => GridMenuEntry[];
}

const EditingHost = ({
  spies,
  initialEditing = null,
  refuse = false,
  renderEditor,
  valueField,
  column,
  conditionEntries,
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
        conditionEntries: (rowId) => conditionEntries?.(rowId, setEditing) ?? [],
        onStartEdit: (value) => {
          spies.onStartEdit(value);
          setEditing(value);
        },
        onCommit: (value, commit, move) => {
          spies.onCommitValues(value, commit, move);
          const [text = ''] = commit.values;
          if (commit.operator === undefined) spies.onCommit(value, text, move);
          else spies.onCommit(value, text, move, commit.operator);
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
const secondAge = () => {
  const [, second] = valueChips('r2', 'age');
  if (!second) throw new Error('second age value');
  return second;
};
const editor = () => screen.getByTestId('nl-editor') as HTMLInputElement;
const r2Age = (index: number): SentenceValueId => ({ rowId: 'r2', columnId: 'age', index });
const editWith = (overrides: Partial<DecisionTextEdit> = {}): DecisionTextEdit => ({
  editing: null,
  onStartEdit: vi.fn(),
  onCommit: vi.fn(),
  onCancel: vi.fn(),
  onClearCell: vi.fn(),
  conditionEntries: () => [],
  ruleEntries: () => [],
  onDeleteRule: vi.fn(),
  labels: DECISION_TEXT_EDIT_LABELS,
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
        bands: [
          {
            id: 'inputs',
            label: 'Inputs',
            columns: [{ id: 'score', name: 'Credit Score', icon: <svg data-testid="type-icon" /> }],
          },
        ],
      });
      const column = within(screen.getByTestId('nl-bands')).getByRole('listitem');
      expect(column.firstElementChild).toHaveAttribute('aria-hidden', 'true');
      expect(column.firstElementChild).toContainElement(screen.getByTestId('type-icon'));
      expect(column).toHaveTextContent(/^Credit Score$/);
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

    it('labels the scroll region and has no axe violations', async () => {
      const { container } = renderView();
      expect(screen.getByRole('region', { name: 'Rules' })).toBe(screen.getByTestId('nl'));
      expect(await axe(container)).toHaveNoViolations();
    });

    it.each<[string, SentenceSelection | undefined]>([
      ['nothing', undefined],
      ['a rule', { rowId: 'r1' }],
      ['a cell', { rowId: 'r2', columnId: 'age' }],
    ])('stays read-only without onSelect with %s selected', (_, selected) => {
      renderView({
        rules: GRID_SENTENCE_RULES,
        bands: GRID_SENTENCE_BANDS,
        header: GRID_SENTENCE_HEADER,
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
      expect([...document.querySelectorAll('[tabindex]')]).toEqual([
        screen.getByTestId('nl'),
        ...screen.getAllByRole('list', { name: /Inputs|Outputs/ }),
      ]);
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

    it('shows the mark a focused element carries or is described by, without adding to its description', () => {
      renderSelectable({
        rules: MULTI_SENTENCE_RULES,
        bands: MULTI_SENTENCE_BANDS,
        header: MULTI_SENTENCE_HEADER,
        marks: scoreMarks,
        initial: { rowId: 'm5' },
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
        bands: MULTI_SENTENCE_BANDS,
        header: MULTI_SENTENCE_HEADER,
        marks: rowMarks({
          m1: {
            cells: {
              debt: { tone: 'error', title: 'Not a number', glyph: true },
              country: { tone: 'warning', title: 'Overlaps row 2', glyph: true },
            },
          },
        }),
        initial: { rowId: 'm1' },
      });
      act(() => card('m1').focus());
      expect(tooltip()).toHaveTextContent('Not a number');
      expect(tooltip()).toHaveTextContent('Overlaps row 2');
    });

    it('shows every message of a focused rule whose first mark the pointer is on, until Escape', () => {
      renderSelectable({
        rules: MULTI_SENTENCE_RULES,
        bands: MULTI_SENTENCE_BANDS,
        header: MULTI_SENTENCE_HEADER,
        marks: rowMarks({
          m1: {
            cells: {
              debt: { tone: 'error', title: 'Not a number', glyph: true },
              country: { tone: 'warning', title: 'Overlaps row 2', glyph: true },
            },
          },
        }),
        initial: { rowId: 'm1' },
      });
      const [firstId = ''] = card('m1').getAttribute('aria-describedby')?.split(' ') ?? [];
      const first = document.getElementById(firstId)?.closest('[data-mark-title]');
      if (!first) throw new Error('m1 first badge');
      fireEvent.pointerOver(first);
      expect(tooltip()).not.toHaveTextContent('Overlaps row 2');
      act(() => card('m1').focus());
      expect(tooltip()).toHaveTextContent('Not a number');
      expect(tooltip()).toHaveTextContent('Overlaps row 2');
      fireEvent.keyDown(card('m1'), { key: 'Escape' });
      fireEvent.pointerOver(first);
      expect(tooltip()).toBeNull();
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
          bands={MULTI_SENTENCE_BANDS}
          header={MULTI_SENTENCE_HEADER}
          marks={scoreMarks}
          initial={{ rowId: 'm5' }}
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
        bands: MULTI_SENTENCE_BANDS,
        header: MULTI_SENTENCE_HEADER,
        marks: scoreMarks,
        initial: { rowId: 'm5' },
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
      renderView({ rules: [], addRule: { label: 'Add rule', onAdd: onAddRow } });
      const empty = screen.getByTestId('nl-empty');
      expect(empty).toHaveTextContent('No rules yet');
      expect(screen.getAllByRole('button', { name: 'Add rule' })).toHaveLength(1);
      fireEvent.click(within(empty).getByRole('button', { name: 'Add rule' }));
      expect(onAddRow).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('nl-header')).toBeInTheDocument();
      expect(screen.getByTestId('nl-bands')).toBeInTheDocument();
    });

    it('follows the rules with the add-rule action', () => {
      const onAdd = vi.fn();
      renderView({ addRule: { label: 'Add rule', onAdd } });
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
          setSelected({ rowId: 'row-0' });
        };
        return view({
          rules,
          selected,
          onSelect: setSelected,
          addRule: { label: 'Add rule', onAdd },
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
      const props = { addRule: { label: 'Add rule', onAdd }, selected: null, onSelect: vi.fn() };
      const { rerender } = render(view({ ...props, rules: [] }));
      fireEvent.click(screen.getByRole('button', { name: 'Add rule' }));
      expect(onAdd).toHaveBeenCalledTimes(1);
      act(() => outside.focus());
      rerender(view({ ...props, rules: manySentenceRules(1) }));
      expect(document.activeElement).toBe(outside);
    });

    it.each([
      ['the empty state, adding a rule taller than the view', 0, () => [manyLinesRule(10)]],
      ['the footer', 3, (count: number) => manySentenceRules(count + 1)],
    ])('keeps the focused add-rule action in view after a rule it adds from %s that the host leaves unselected', (_, initialCount, added) => {
      const AddingHost = () => {
        const [rules, setRules] = useState<SentenceRule[]>(() => manySentenceRules(initialCount));
        currentRules = rules;
        return view({
          rules,
          selected: null,
          onSelect: vi.fn(),
          addRule: { label: 'Add rule', onAdd: () => setRules(added(rules.length)) },
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
      expect(mounted).toHaveLength(17);
      expect(mounted[0]).toHaveAttribute('aria-setsize', '20000');
      const spacer = mounted.at(-1)?.nextElementSibling;
      expect(spacer).toBe(screen.getByTestId('nl-row-spacer'));
      expect(spacer).toHaveAttribute('aria-hidden', 'true');
      const offsets = sentenceRuleOffsets(rules);
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
      rerender(view({ rules, selected: { rowId: 'row-1' }, onSelect }));
      rerender(view({ rules, selected: { rowId: 'row-1', columnId: 'decision' }, onSelect }));
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

    it('keeps 50 band columns on one keyboard-scrollable list, named once by its caption', () => {
      renderView({ bands: manyColumnBands(50) });
      const inputs = screen.getByRole('list', { name: 'Inputs' });
      expect(within(inputs).getAllByRole('listitem')).toHaveLength(50);
      expect(inputs).toHaveAttribute('tabindex', '0');
      expect(inputs.previousElementSibling).toHaveAttribute('aria-hidden', 'true');
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
      expect(onSelect.mock.calls).toEqual([[{ rowId: 'r2', columnId: 'age' }]]);
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
        [{ rowId: 'r2' }],
        [{ rowId: 'r1' }],
        [{ rowId: 'r3' }],
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
      expect(onSelect.mock.calls).toEqual([[{ rowId: 'long-list', columnId: 'country' }]]);
      expect(focusedStop()).toBe('long-list:country');
      expect(more).toHaveAttribute('data-selected', 'true');
      expect(more).not.toHaveAttribute('tabindex');
    });

    it("paints and tab-stops the host's selection without taking focus", () => {
      renderSelectable({ initial: { rowId: 'r2', columnId: 'age' } });
      const stops = document.querySelectorAll('li[data-row-id][tabindex="0"], li [tabindex="0"]');
      expect([...stops]).toEqual([valueChip('r2', 'age')]);
      expect(document.activeElement).toBe(document.body);
    });

    it.each<[string, SentenceSelection, string | null]>([
      ['a rule', { rowId: 'r2' }, 'r2'],
      ['a cell its row has no token for, as its rule', { rowId: 'r3', columnId: 'income' }, 'r3'],
      ['a row that is gone, as nothing', { rowId: 'gone' }, null],
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
        view({ rules: GRID_SENTENCE_RULES, selected: { rowId: 'r1' }, onSelect })
      );
      rerender(
        view({ rules: GRID_SENTENCE_RULES, selected: { rowId: 'r3', columnId: 'risk' }, onSelect })
      );
      expect(card('r1')).toHaveAttribute('tabindex', '-1');
      expect(valueChip('r3', 'risk')).toHaveAttribute('tabindex', '0');
    });

    it('names each cell stop as a button by its column, values and row', () => {
      renderSelectable();
      expect(valueChip('r2', 'age')).toHaveAttribute('role', 'button');
      expect(valueChip('r2', 'age')).toHaveAccessibleName('age 25 and 60, rule 2');
      expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
        '"high"',
        '25',
        '40000',
        '"standard"',
        '25',
        '40000',
        '"review"',
        '60',
      ]);
      expect(card('r2')).toHaveAccessibleName(
        'risk is "standard" when age is between 25 and 60 and income is greater than 40000'
      );
    });

    it('names an empty value by its word, never by the dash it shows', () => {
      const edit = editWith({ editing: { rowId: 'm2', columnId: 'reason', index: 0 } });
      render(view({ selected: { rowId: 'm2', columnId: 'reason' }, onSelect: vi.fn(), edit }));
      expect(valueChip('m2', 'reason')).toHaveTextContent(EMPTY_VALUE_DASH);
      expect(valueChip('m2', 'reason')).toHaveAccessibleName('Reason empty, rule 2');
      expect(editor()).toHaveAccessibleName('Reason empty, rule 2');
    });

    it('re-renders only the rules a selection leaves and enters', () => {
      const cell = vi.fn(DECISION_TEXT_LABELS.cell);
      renderSelectable({
        rules: manySentenceRules(2000),
        labels: { ...DECISION_TEXT_LABELS, cell },
        initial: { rowId: 'row-0' },
      });
      act(() => card('row-0').focus());
      cell.mockClear();
      press('ArrowDown');
      const positions = cell.mock.calls.map(([, , position]) => position);
      expect(positions).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2]);
    });

    it('names a clamped cell by the values it shows and its count', () => {
      renderSelectable({ rules: [longValueListRule(10_000)] });
      const shown = Array.from({ length: 20 }, (_, index) => `"Country ${index + 1}"`).join(', ');
      expect(valueChip('long-list', 'country')).toHaveAccessibleName(
        `Country ${shown} +9,980 more, rule 1`
      );
    });

    it('has no axe violations with a cell selected', async () => {
      const { container } = renderSelectable({ initial: { rowId: 'r2', columnId: 'age' } });
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('keyboard', () => {
    const startAt = (initial: SentenceSelection) => {
      const rendered = renderSelectable({ initial });
      const { columnId } = initial;
      act(() => (columnId ? valueChip(initial.rowId, columnId) : card(initial.rowId)).focus());
      return rendered;
    };

    it.each<['ltr' | 'rtl', string, string]>([
      ['ltr', 'ArrowRight', 'ArrowLeft'],
      ['rtl', 'ArrowLeft', 'ArrowRight'],
    ])('steps through the stops of a %s row in reading order, clamped', (direction, on, back) => {
      const { onSelect } = renderSelectable({
        initial: { rowId: 'r1' },
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

    it('moves a row with ↓ and ↑, keeping the column across a row without it', () => {
      startAt({ rowId: 'r1', columnId: 'income' });
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
        initial: { rowId: 'r1', columnId: 'income' },
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
      ['ArrowDown', { metaKey: true }, { rowId: 'r1', columnId: 'age' }, 'r3:age'],
      ['ArrowUp', { ctrlKey: true }, { rowId: 'r3', columnId: 'age' }, 'r1:age'],
      ['End', {}, { rowId: 'r2', columnId: 'age' }, 'r2:income'],
      ['Home', {}, { rowId: 'r2', columnId: 'age' }, 'r2'],
      ['ArrowRight', { ctrlKey: true }, { rowId: 'r2' }, 'r2:income'],
      ['ArrowLeft', { metaKey: true }, { rowId: 'r2', columnId: 'income' }, 'r2'],
      ['End', { ctrlKey: true }, { rowId: 'r2', columnId: 'age' }, 'r3:age'],
      ['Home', { metaKey: true }, { rowId: 'r2', columnId: 'age' }, 'r1'],
    ])('moves with %s %o from %o to %s', (key, init, from, stop) => {
      startAt(from);
      press(key, init);
      expect(focusedStop()).toBe(stop);
    });

    it("tabs through a row's stops and lets Tab leave at either end", () => {
      const { onSelect } = startAt({ rowId: 'r3' });
      expect(walk('Tab', 'Tab')).toEqual(['r3:risk', 'r3:age']);
      expect(press('Tab')).toBe(true);
      press('Tab', { shiftKey: true });
      press('Tab', { shiftKey: true });
      expect(focusedStop()).toBe('r3');
      expect(press('Tab', { shiftKey: true })).toBe(true);
      expect(press('Tab', { altKey: true })).toBe(true);
      expect(onSelect).toHaveBeenCalledTimes(4);
    });

    it('clears with Escape and returns focus to the view, claiming it only when something was selected', () => {
      const { onSelect } = startAt({ rowId: 'r2', columnId: 'age' });
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
      expect(onSelect.mock.calls).toEqual([[{ rowId: 'row-500' }]]);
      expect(focusedStop()).toBe('row-500');
    });

    it.each<[string, SentenceSelection | null, string[]]>([
      ['nothing', null, ['Tab', 'Escape', 'a', 'PageDown', ' ']],
      ['a cell', { rowId: 'r2', columnId: 'age' }, ['PageUp', 'PageDown', ' ', 'Enter', 'F2', 'a']],
    ])('leaves keys it has no move for alone with %s selected', (_, initial, keys) => {
      const { onSelect } = renderSelectable({ initial });
      act(() => screen.getByTestId('nl').focus());
      expect(keys.map((key) => press(key))).toEqual(keys.map(() => true));
      expect(press('a', { metaKey: true })).toBe(true);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it.each<[string, SentenceSelection]>([
      ['a rule', { rowId: 'r2' }],
      ['a cell', { rowId: 'r2', columnId: 'age' }],
    ])('leaves Tab on the view itself to the browser with %s selected, moving on to the selected stop', async (_, initial) => {
      const { onSelect } = renderSelectable({ initial });
      const user = userEvent.setup();
      act(() => screen.getByTestId('nl').focus());
      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('list', { name: 'Inputs' }));
      await user.tab();
      await user.tab();
      expect(focusedStop()).toBe(initial.columnId ? `r2:${initial.columnId}` : 'r2');
      act(() => screen.getByTestId('nl').focus());
      await user.tab({ shift: true });
      expect(document.activeElement).toBe(document.body);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("keeps no focus pending from a move the host refused, so the host's own later select of it leaves focus alone", () => {
      const outside = document.body.appendChild(document.createElement('button'));
      onTestFinished(() => outside.remove());
      const onSelect = vi.fn();
      const props = { rules: GRID_SENTENCE_RULES, bands: GRID_SENTENCE_BANDS, onSelect };
      const { rerender } = render(view({ ...props, selected: { rowId: 'r2' } }));
      act(() => card('r2').focus());
      press('ArrowRight');
      expect(onSelect.mock.calls).toEqual([[{ rowId: 'r2', columnId: 'risk' }]]);
      act(() => outside.focus());
      rerender(view({ ...props, selected: { rowId: 'r2', columnId: 'risk' } }));
      expect(document.activeElement).toBe(outside);
    });

    it('focuses the selected stop on a move that stays put', () => {
      const { onSelect } = renderSelectable({ initial: { rowId: 'r3', columnId: 'age' } });
      act(() => screen.getByTestId('nl').focus());
      expect(press('End')).toBe(false);
      expect(focusedStop()).toBe('r3:age');
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('tells the host to select the rule when its selected cell has no value in it', () => {
      const initial = { rowId: 'r3', columnId: 'income' };
      const { onSelect, unmount } = renderSelectable({ initial });
      fireEvent.click(card('r3'));
      expect(onSelect.mock.calls).toEqual([[{ rowId: 'r3' }]]);
      expect(focusedStop()).toBe('r3');
      unmount();
      const home = renderSelectable({ initial });
      act(() => screen.getByTestId('nl').focus());
      press('Home');
      expect(home.onSelect.mock.calls).toEqual([[{ rowId: 'r3' }]]);
    });

    it('ignores a key mid-composition', () => {
      const { onSelect } = startAt({ rowId: 'r2', columnId: 'age' });
      expect(press('ArrowRight', { isComposing: true })).toBe(true);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('ignores a key from a text field inside a row', () => {
      const { onSelect } = startAt({ rowId: 'r2', columnId: 'age' });
      const field = document.createElement('input');
      card('r2').append(field);
      act(() => field.focus());
      expect(press('ArrowRight')).toBe(true);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('ignores a key something inside a row already claimed', () => {
      const { onSelect } = startAt({ rowId: 'r2', columnId: 'age' });
      valueChip('r2', 'age').addEventListener('keydown', (event) => event.preventDefault());
      press('ArrowRight');
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('leaves a band list its own arrows', () => {
      const { onSelect } = renderSelectable({ initial: { rowId: 'r2' } });
      act(() => screen.getByRole('list', { name: 'Inputs' }).focus());
      expect([press('ArrowRight'), press('End')]).toEqual([true, true]);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("hands the host's own handlers what the view leaves alone", () => {
      const onKeyDown = vi.fn();
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      const onClick = vi.fn();
      renderSelectable({
        initial: { rowId: 'r2' },
        containerProps: { onKeyDown, onFocus, onBlur, onClick },
      });
      act(() => card('r2').focus());
      press('ArrowRight');
      press('a');
      fireEvent.click(valueChip('r1', 'risk'));
      act(() => card('r1').blur());
      expect(onKeyDown.mock.calls.map(([event]) => event.key)).toEqual(['a']);
      expect(onClick).toHaveBeenCalledTimes(1);
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

    it('scrolls a rule the host selects into view, without taking focus', () => {
      const rules = manySentenceRules(2000);
      const onSelect = vi.fn();
      const { rerender } = render(view({ rules, selected: { rowId: 'row-0' }, onSelect }));
      const frame = screen.getByTestId('nl');
      expect(frame.scrollTop).toBe(0);
      rerender(view({ rules, selected: { rowId: 'row-1500' }, onSelect }));
      const offsets = sentenceRuleOffsets(rules);
      expect(frame.scrollTop).toBe((offsets[1501] ?? 0) - FALLBACK_ROW_VIEWPORT_PX);
      expect(card('row-1500')).toHaveAttribute('tabindex', '0');
      expect(document.activeElement).toBe(document.body);
      rerender(view({ rules, selected: { rowId: 'row-1500', columnId: 'decision' }, onSelect }));
      act(() => scrollTo(0));
      rerender(view({ rules, selected: { rowId: 'row-1500', columnId: 'reason' }, onSelect }));
      expect(frame.scrollTop).toBe(0);
    });

    it('scrolls on a key to a cell its row scrolled past, and to the top of a rule taller than the view', () => {
      renderSelectable({ initial: { rowId: 'r2', columnId: 'age' } });
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
      const { rerender } = render(view({ rules, selected: { rowId: 'row-0' }, onSelect }));
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
      rerender(view({ rules, selected: { rowId: 'many-lines', columnId: 'decision' }, onSelect }));
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
          setSelected({
            rowId: `row-${rules.length}`,
            ...(rules.length > 3 && { columnId: 'decision' }),
          });
        };
        return view({
          rules,
          selected,
          onSelect: setSelected,
          addRule: { label: 'Add rule', onAdd },
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
      rerender(view({ rules, selected: { rowId: 'row-100' }, onSelect: vi.fn() }));
      expect(screen.getByTestId('nl').scrollTop).toBe(top - 33);
    });
  });

  describe('editing', () => {
    it('takes edit only with a controlled selection, without which no card control is tabbable', () => {
      render(
        // @ts-expect-error
        <DecisionText
          rules={GRID_SENTENCE_RULES}
          bands={GRID_SENTENCE_BANDS}
          header={GRID_SENTENCE_HEADER}
          labels={DECISION_TEXT_LABELS}
          ariaLabel="Rules"
          dataTestId="nl"
          edit={editWith()}
        />
      );
      const controls = card('r1').querySelectorAll<HTMLElement>('button, [tabindex]');
      expect(controls.length).toBeGreaterThan(0);
      expect([...controls].filter((control) => control.tabIndex >= 0)).toEqual([]);
    });

    it('selects the cell of a clicked value, then starts editing that value', () => {
      const { onSelect, onStartEdit } = renderEditing();
      fireEvent.click(secondAge());
      expect(onSelect.mock.calls).toEqual([[{ rowId: 'r2', columnId: 'age' }]]);
      expect(onStartEdit.mock.calls).toEqual([[r2Age(1)]]);
      expect(onSelect.mock.invocationCallOrder[0]).toBeLessThan(
        onStartEdit.mock.invocationCallOrder[0] ?? 0
      );
    });

    it('stays read-only without edit: a click only selects and Enter, F2 and Delete reach the host', () => {
      const onKeyDown = vi.fn();
      const { onSelect } = renderSelectable({ containerProps: { onKeyDown } });
      fireEvent.click(secondAge());
      expect(onSelect.mock.calls).toEqual([[{ rowId: 'r2', columnId: 'age' }]]);
      expect(screen.queryByTestId('nl-editor')).toBeNull();
      expect([press('Enter'), press('F2'), press('Delete')]).toEqual([true, true, true]);
      expect(onKeyDown.mock.calls.map(([event]) => event.key)).toEqual(['Enter', 'F2', 'Delete']);
    });

    it('starts editing the first value of a selected cell on Enter, Space or F2, never on a rule or mid-composition', () => {
      const { onStartEdit } = renderEditing({ initial: { rowId: 'r2', columnId: 'age' } });
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
        initial: { rowId: 'r2', columnId: 'age' },
        initialEditing: r2Age(1),
      });
      expect(screen.getAllByTestId('nl-editor')).toHaveLength(1);
      expect(editor()).toHaveValue('60');
      expect(editor()).toHaveAccessibleName('age 60, rule 2');
      expect(screen.getByRole('group', { name: 'age 60, rule 2' })).toContainElement(editor());
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
          return this.tagName === 'FIELDSET' ? 256 : 0;
        });
      const { onStartEdit } = renderEditing({ initial: { rowId: 'r2', columnId: 'age' } });
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

    it('moves the open editor with its value once a web font moves it', async () => {
      const fonts = new EventTarget();
      Object.defineProperty(document, 'fonts', { value: fonts, configurable: true });
      renderEditing({ initial: { rowId: 'r1', columnId: 'age' } });
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

    it('moves the open editor with its value once a mark wraps it onto the next line', () => {
      const spies = renderEditing({ initial: { rowId: 'r1', columnId: 'age' } });
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
      const spies = renderEditing({ initial: { rowId: 'r2', columnId: 'age' } });
      fireEvent.click(secondAge());
      expect(screen.getByTestId('nl-value-editor')).toHaveStyle({ top: '200px' });
      const [first] = GRID_SENTENCE_RULES;
      const inserted = first ? [{ ...first, rowId: 'r0' }] : [];
      spies.rerender(<EditingHost spies={spies} rules={[...inserted, ...GRID_SENTENCE_RULES]} />);
      boxes.mockRestore();
      expect(screen.getByTestId('nl-value-editor')).toHaveStyle({ top: '300px' });
    });

    it('commits once on Enter, then selects and focuses the same cell of the next rule', () => {
      const { onCommit, onSelect } = renderEditing({
        initial: { rowId: 'r2', columnId: 'age' },
        initialEditing: r2Age(1),
      });
      fireEvent.change(editor(), { target: { value: '61' } });
      fireEvent.keyDown(editor(), { key: 'Enter' });
      expect(onCommit.mock.calls).toEqual([[r2Age(1), '61', 'down']]);
      expect(screen.queryByTestId('nl-editor')).toBeNull();
      expect(onSelect.mock.calls).toEqual([[{ rowId: 'r3', columnId: 'age' }]]);
      expect(focusedStop()).toBe('r3:age');
    });

    it("tabs to the cell's next value, and from its last value to the next cell", () => {
      const { onCommit, onStartEdit, onSelect } = renderEditing({
        initial: { rowId: 'r2', columnId: 'age' },
        initialEditing: r2Age(0),
      });
      fireEvent.keyDown(editor(), { key: 'Tab' });
      expect(onCommit.mock.calls).toEqual([[r2Age(0), '25', 'right']]);
      expect(onStartEdit.mock.calls).toEqual([[r2Age(1)]]);
      expect(editor()).toHaveValue('60');
      fireEvent.keyDown(editor(), { key: 'Tab' });
      expect(onSelect.mock.calls).toEqual([[{ rowId: 'r2', columnId: 'income' }]]);
      expect(focusedStop()).toBe('r2:income');
    });

    it("tabs back from a cell's later value to its previous one", () => {
      const { onCommit, onStartEdit } = renderEditing({
        initial: { rowId: 'r2', columnId: 'age' },
        initialEditing: r2Age(1),
      });
      fireEvent.keyDown(editor(), { key: 'Tab', shiftKey: true });
      expect(onCommit.mock.calls).toEqual([[r2Age(1), '60', 'left']]);
      expect(onStartEdit.mock.calls).toEqual([[r2Age(0)]]);
      expect(editor()).toHaveValue('25');
    });

    it.each([
      'with a render',
      'silently',
    ])('drops a Tab the host refused %s, so closing the editor later opens no other value', (refusal) => {
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
              bands: GRID_SENTENCE_BANDS,
              selected: { rowId: 'r2', columnId: 'age' },
              onSelect: vi.fn(),
              edit: editWith({
                editing,
                onStartEdit,
                onCommit: () => {
                  if (refusal === 'with a render') setRefusals((count) => count + 1);
                },
              }),
            })}
          </>
        );
      };
      render(<RefusingHost />);
      fireEvent.keyDown(editor(), { key: 'Tab' });
      expect(editor()).toHaveValue('25');
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByTestId('nl-editor')).toBeNull();
      expect(onStartEdit).not.toHaveBeenCalled();
    });

    it('cancels the edit of a rule its delete action removes, as a clear of the edited cell does', () => {
      const { onCancel } = renderEditing({
        initial: { rowId: 'r2', columnId: 'age' },
        initialEditing: r2Age(0),
        refuse: true,
      });
      fireEvent.click(within(card('r2')).getByRole('button', { name: 'Delete rule 2' }));
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('nl-editor')).toBeNull();
    });

    it('cancels on Escape back to the chip, and commits in place on a click outside', () => {
      const { onCancel, onCommit } = renderEditing({
        initial: { rowId: 'r2', columnId: 'age' },
        initialEditing: r2Age(1),
      });
      fireEvent.keyDown(editor(), { key: 'Escape' });
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(focusedStop()).toBe('r2:age');
      fireEvent.click(secondAge());
      const outside = document.createElement('button');
      document.body.append(outside);
      act(() => outside.focus());
      expect(onCommit.mock.calls).toEqual([[r2Age(1), '60', 'none']]);
      expect(document.activeElement).toBe(outside);
      outside.remove();
    });

    it('keeps the editor and its draft open on a refused commit', () => {
      const { onCommit, onSelect } = renderEditing({
        initial: { rowId: 'r2', columnId: 'age' },
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
      fireEvent.blur(editor());
      expect(onCommit.mock.calls).toEqual([
        [r2Age(1), '61', 'down'],
        [r2Age(1), '62', 'none'],
      ]);
    });

    it("swaps in the host's editor from Edit expression, handing it the value it edits and the edit's commit", () => {
      const contexts: SentenceEditorContext[] = [];
      const renderEditor = (context: SentenceEditorContext) => {
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
      act(() => context?.onCommit('x', 'none'));
      expect(onCommit.mock.calls).toEqual([[r2Age(1), 'x', 'none']]);
    });

    it('keeps the edited rule and its editor mounted while it scrolls away, with nothing selected', () => {
      const rules = manySentenceRules(400);
      renderEditing({
        rules,
        bands: MULTI_SENTENCE_BANDS,
        header: MULTI_SENTENCE_HEADER,
        initialEditing: { rowId: 'row-300', columnId: 'decision', index: 0 },
      });
      const input = editor();
      act(() => scrollTo(sentenceRuleOffsets(rules)[300] ?? 0));
      act(() => scrollTo(0));
      expect(card('row-300')).toBeInTheDocument();
      expect(editor()).toBe(input);
    });

    it("keeps the editor's keys from the navigation and the host's handlers", () => {
      const onKeyDown = vi.fn();
      const { onSelect } = renderEditing({
        initial: { rowId: 'r2', columnId: 'age' },
        initialEditing: r2Age(1),
        containerProps: { onKeyDown },
      });
      expect([press('ArrowDown'), press('ArrowRight'), press('Delete')]).toEqual([
        true,
        true,
        true,
      ]);
      expect(onSelect).not.toHaveBeenCalled();
      expect(onKeyDown).not.toHaveBeenCalled();
    });
  });

  describe('value popover', () => {
    const AGE_OPERATORS = [
      { id: '<', label: 'is less than' },
      { id: '>', label: 'is greater than' },
    ];
    const RISKS = ['"high"', '"standard"', '"review"'];
    const r1Age: SentenceValueId = { rowId: 'r1', columnId: 'age', index: 0 };
    const r1Risk: SentenceValueId = { rowId: 'r1', columnId: 'risk', index: 0 };
    const r3Channel: SentenceValueId = { rowId: 'r3', columnId: 'channel', index: 0 };
    const CHANNEL_BANDS: SentenceBand[] = [
      ...GRID_SENTENCE_BANDS,
      { id: 'more', label: 'More', columns: [{ id: 'channel', name: 'channel' }] },
    ];
    const field = (cell: SentenceCellId): ValueField => {
      if (cell.columnId === 'risk') return { allowedValues: RISKS };
      if (cell.columnId === 'channel') return { operators: AGE_OPERATORS, operator: '>' };
      return {
        icon: <svg data-testid="type-icon" />,
        operators: AGE_OPERATORS,
        operator: '<',
      };
    };
    const popover = () => screen.getByTestId('nl-value-editor');
    const inPopover = () => within(popover());
    const operatorSelect = () => inPopover().getByRole('combobox', { name: 'Operator' });
    const action = (name: string) => inPopover().getByRole('button', { name });

    const blurCommittingEditor =
      (reportsDraft: boolean) =>
      ({ value, ariaLabel, onCommit, onCancel, onDraftChange }: SentenceEditorContext) => (
        <CellTextEditor
          value={value}
          ariaLabel={ariaLabel}
          dataTestId="host-editor"
          onCommit={onCommit}
          onCancel={onCancel}
          onDraftChange={reportsDraft ? onDraftChange : undefined}
        />
      );

    it('cancels from Cancel an expression typed into a host editor that commits on blur', () => {
      const { onCommit, onCancel } = renderEditing({
        initialEditing: r1Age,
        valueField: field,
        renderEditor: blurCommittingEditor(true),
      });
      fireEvent.click(action('Edit expression'));
      fireEvent.change(screen.getByTestId('host-editor'), { target: { value: 'x' } });
      const cancel = action('Cancel');
      act(() => cancel.focus());
      fireEvent.click(cancel);
      expect(onCommit).not.toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('hands a host editor the grid editor contract, applying the draft it reports through onDraftChange', () => {
      const draftOnlyEditor = ({ value, ariaLabel, onDraftChange }: SentenceEditorContext) => (
        <input
          aria-label={ariaLabel}
          data-testid="host-editor"
          defaultValue={value}
          onChange={(event) => onDraftChange?.(event.currentTarget.value)}
        />
      );
      const { onCommit } = renderEditing({
        initialEditing: r1Age,
        valueField: field,
        renderEditor: draftOnlyEditor,
      });
      fireEvent.click(action('Edit expression'));
      fireEvent.change(screen.getByTestId('host-editor'), { target: { value: 'x' } });
      fireEvent.click(action('Apply'));
      expect(onCommit.mock.calls).toEqual([[r1Age, 'x', 'none']]);
    });

    it('applies once the text a host editor last held, though it reports no draft', () => {
      const { onCommit } = renderEditing({
        initialEditing: r1Age,
        valueField: field,
        refuse: true,
        renderEditor: blurCommittingEditor(false),
      });
      fireEvent.click(action('Edit expression'));
      fireEvent.change(screen.getByTestId('host-editor'), { target: { value: 'x' } });
      const apply = action('Apply');
      act(() => apply.focus());
      fireEvent.click(apply);
      expect(onCommit.mock.calls).toEqual([[r1Age, 'x', 'none']]);
    });

    it('applies from a mouse click on Apply the text a host editor holds, though it reports no draft', async () => {
      const user = userEvent.setup();
      const { onCommit } = renderEditing({
        initialEditing: r1Age,
        valueField: field,
        renderEditor: blurCommittingEditor(false),
      });
      await user.click(action('Edit expression'));
      await user.clear(screen.getByTestId('host-editor'));
      await user.type(screen.getByTestId('host-editor'), 'x');
      await user.click(action('Apply'));
      expect(onCommit.mock.calls).toEqual([[r1Age, 'x', 'none']]);
    });

    it('applies from Apply the text a refused Enter submitted from a host editor that reports no draft', async () => {
      const user = userEvent.setup();
      const { onCommit } = renderEditing({
        initialEditing: r1Age,
        valueField: field,
        refuse: true,
        renderEditor: blurCommittingEditor(false),
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

    it("leaves the cell on Shift+Tab from an expression a host editor submits for a cell's later value", () => {
      const { onStartEdit, onCommit } = renderEditing({
        initial: { rowId: 'r2', columnId: 'age' },
        initialEditing: r2Age(1),
        renderEditor: blurCommittingEditor(true),
      });
      fireEvent.click(action('Edit expression'));
      const input = screen.getByTestId('host-editor');
      fireEvent.change(input, { target: { value: '> limit' } });
      fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });
      expect(onCommit.mock.calls).toEqual([[r2Age(1), '> limit', 'left']]);
      expect(onStartEdit).not.toHaveBeenCalled();
      expect(screen.queryByTestId('nl-value-editor')).toBeNull();
      expect(focusedStop()).not.toBe('r2:age');
    });

    it('applies an expression a host editor held as focus moved to the footer, once focus leaves from there', () => {
      const renderEditor = ({ value, ariaLabel, onCommit }: SentenceEditorContext) => (
        <textarea
          aria-label={ariaLabel}
          defaultValue={value}
          onBlur={(event) => onCommit(event.currentTarget.value, 'none')}
        />
      );
      const { onCommit } = renderEditing({
        initialEditing: r1Age,
        valueField: field,
        renderEditor,
      });
      fireEvent.click(action('Edit expression'));
      const expression = screen.getByRole('textbox', { name: 'age 25, rule 1' });
      act(() => expression.focus());
      fireEvent.change(expression, { target: { value: 'x' } });
      act(() => action('Apply').focus());
      expect(onCommit).not.toHaveBeenCalled();
      act(() => screen.getByTestId('nl').focus());
      expect(onCommit.mock.calls).toEqual([[r1Age, 'x', 'none']]);
    });

    it('returns focus to the value from Apply when the view is in a shadow root', () => {
      const host = document.body.appendChild(document.createElement('div'));
      onTestFinished(() => host.remove());
      const shadow = host.attachShadow({ mode: 'open' });
      const container = shadow.appendChild(document.createElement('div'));
      renderEditing(
        { initial: { rowId: 'r1', columnId: 'age' }, initialEditing: r1Age, valueField: field },
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

    it("titles the popover with the column's type glyph and name, over the cell's operator and value", () => {
      renderEditing({ initialEditing: r1Age, valueField: field });
      expect(inPopover().getByTestId('type-icon')).toBeInTheDocument();
      expect(inPopover().getByText('age')).toBeInTheDocument();
      expect(operatorSelect()).toHaveTextContent('is less than');
      expect(editor()).toHaveValue('25');
      expect(
        inPopover()
          .getAllByRole('button')
          .map((button) => button.textContent)
      ).toEqual(['Cancel', 'Apply']);
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

    it("shows an operator the host's operators lack as it is, and keeps it offered once another is picked", async () => {
      const user = userEvent.setup();
      const { onCommit } = renderEditing({
        initialEditing: r1Age,
        valueField: () => ({ operators: AGE_OPERATORS, operator: '!=' }),
      });
      expect(operatorSelect()).toHaveTextContent('!=');
      await user.click(operatorSelect());
      await user.click(screen.getByRole('option', { name: 'is greater than' }));
      await user.click(operatorSelect());
      await user.click(screen.getByRole('option', { name: '!=' }));
      fireEvent.keyDown(editor(), { key: 'Enter' });
      expect(onCommit.mock.calls).toEqual([[r1Age, '25', 'down', '!=']]);
    });

    it('commits the picked operator with the value on Enter, and moves down as before', () => {
      const { onCommit, onSelect } = renderEditing({
        initial: { rowId: 'r1', columnId: 'age' },
        initialEditing: r1Age,
        valueField: field,
      });
      fireEvent.click(operatorSelect());
      fireEvent.click(screen.getByRole('option', { name: 'is greater than' }));
      expect(operatorSelect()).toHaveTextContent('is greater than');
      expect(onCommit).not.toHaveBeenCalled();
      fireEvent.keyDown(editor(), { key: 'Enter' });
      expect(onCommit.mock.calls).toEqual([[r1Age, '25', 'down', '>']]);
      expect(onSelect.mock.calls).toEqual([[{ rowId: 'r2', columnId: 'age' }]]);
      expect(focusedStop()).toBe('r2:age');
    });

    it('commits the operator on Tab and Shift+Tab, moving to the next and previous cell as before', () => {
      const { onCommit, onSelect } = renderEditing({
        initial: { rowId: 'r1', columnId: 'age' },
        initialEditing: r1Age,
        valueField: field,
      });
      fireEvent.keyDown(editor(), { key: 'Tab' });
      expect(onCommit.mock.calls).toEqual([[r1Age, '25', 'right', '<']]);
      expect(focusedStop()).toBe('r1:income');
      press('Enter');
      fireEvent.keyDown(editor(), { key: 'Tab', shiftKey: true });
      expect(onCommit.mock.calls.at(-1)).toEqual([
        { rowId: 'r1', columnId: 'income', index: 0 },
        '40000',
        'left',
        '<',
      ]);
      expect(onSelect.mock.calls.at(-1)).toEqual([{ rowId: 'r1', columnId: 'age' }]);
      expect(focusedStop()).toBe('r1:age');
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
        valueField: () => ({ allowedValues: ['"standard"', '"review"'] }),
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
        bands: MULTI_SENTENCE_BANDS,
        header: MULTI_SENTENCE_HEADER,
        initialEditing: m2Reason,
        valueField: () => ({ allowedValues: ['"prime"', '"low score"'] }),
      });
      const radios = inPopover().getAllByRole('radio');
      expect(radios).toHaveLength(2);
      expect(document.activeElement).toBe(radios[0]);
      expect(radios.filter((radio) => radio.getAttribute('aria-checked') === 'true')).toEqual([]);
      fireEvent.click(action('Apply'));
      expect(onCommit.mock.calls).toEqual([[m2Reason, '', 'none']]);
    });

    it('opens the operator list from an allowed value on Alt+ArrowDown, and returns focus to it on a pick', () => {
      const m3Channel: SentenceValueId = { rowId: 'm3', columnId: 'channel', index: 0 };
      const { onCommit } = renderEditing({
        rules: MULTI_SENTENCE_RULES,
        bands: MULTI_SENTENCE_BANDS,
        header: MULTI_SENTENCE_HEADER,
        initialEditing: m3Channel,
        valueField: () => ({
          operators: AGE_OPERATORS,
          operator: '<',
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
        initial: { rowId: 'r2', columnId: 'age' },
        initialEditing: r2Age(1),
      });
      fireEvent.change(editor(), { target: { value: '61' } });
      fireEvent.click(action('Cancel'));
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onCommit).not.toHaveBeenCalled();
      expect(focusedStop()).toBe('r2:age');
    });

    it('applies the draft in place from Apply, with its operator', () => {
      const { onCommit } = renderEditing({
        initial: { rowId: 'r1', columnId: 'age' },
        initialEditing: r1Age,
        valueField: field,
      });
      fireEvent.change(editor(), { target: { value: '30' } });
      fireEvent.click(action('Apply'));
      expect(onCommit.mock.calls).toEqual([[r1Age, '30', 'none', '<']]);
      expect(screen.queryByTestId('nl-value-editor')).toBeNull();
      expect(focusedStop()).toBe('r1:age');
    });

    it('keeps the edit open while focus moves inside the popover, and commits once it leaves', () => {
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
      expect(onCommit.mock.calls).toEqual([[r1Age, '30', 'none', '<']]);
    });

    it('shows a pending line for a condition added from +, opens on it, and drops it on Cancel', () => {
      const { onCommit } = renderEditing({
        initialEditing: r3Channel,
        valueField: field,
        bands: CHANNEL_BANDS,
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
        bands: CHANNEL_BANDS,
        conditionEntries: (_, startEdit) => [
          { label: 'channel', focusesOwnSurface: true, onClick: () => startEdit(r3Channel) },
        ],
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
        bands: CHANNEL_BANDS,
      });
      fireEvent.change(editor(), { target: { value: '"web"' } });
      expect(onCommit).not.toHaveBeenCalled();
      fireEvent.click(action('Apply'));
      expect(onCommit.mock.calls).toEqual([[r3Channel, '"web"', 'none', '>']]);
      expect(card('r3').querySelector('li[data-pending]')).toBeNull();
    });

    it('words a pending line without an operator when the host offers none', () => {
      renderEditing({ initialEditing: r3Channel, bands: CHANNEL_BANDS });
      expect(card('r3').querySelector('li[data-pending]')).toHaveTextContent(
        /^channel Set a value$/
      );
    });

    describe('ranges and lists', () => {
      const SHAPED_OPERATORS: ValueOperatorOption[] = [
        { id: '<', label: 'is less than' },
        { id: 'between', label: 'is between', shape: 'range' },
        { id: 'oneOf', label: 'is one of', shape: 'list' },
        { id: 'noneOf', label: 'is none of', shape: 'list' },
      ];
      const COUNTRIES = ['"US"', '"CA"', '"MX"', '"GB"', '"DE"'];
      const BOTH_INCLUDED = { lowInclusive: true, highInclusive: true };
      const inOrder = (low: string, high: string) => Number(low) <= Number(high);
      const at = (rowId: string, columnId: string, index = 0): SentenceValueId => ({
        rowId,
        columnId,
        index,
      });
      const shapedField = (cell: SentenceCellId): ValueField => {
        const base = { operators: SHAPED_OPERATORS, inOrder };
        if (cell.rowId === 'm1' && cell.columnId === 'score') {
          return { ...base, operator: 'between', values: ['700', '850'], ends: BOTH_INCLUDED };
        }
        if (cell.rowId === 'm1' && cell.columnId === 'country') {
          return { ...base, operator: 'oneOf', values: COUNTRIES };
        }
        if (cell.rowId === 'm2' && cell.columnId === 'country') {
          return { ...base, operator: 'noneOf', values: ['"RU"', '"KP"'] };
        }
        return { ...base, operator: '<' };
      };
      const renderShaped = (props: Omit<EditingHostProps, 'spies'> = {}) =>
        renderEditing({
          rules: MULTI_SENTENCE_RULES,
          bands: MULTI_SENTENCE_BANDS,
          header: MULTI_SENTENCE_HEADER,
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
              values: ['650', '850'],
              operator: 'between',
              ends: { lowInclusive: true, highInclusive: false },
            },
            'down',
          ],
        ]);
      });

      it('keeps Apply off while an end is empty or the ends are out of order, committing nothing on Enter or a blur', () => {
        const { onCommitValues } = renderShaped({ initialEditing: at('m1', 'score') });
        fireEvent.change(endField('To'), { target: { value: '' } });
        expect(action('Apply')).toBeDisabled();
        fireEvent.keyDown(endField('From'), { key: 'Enter' });
        fireEvent.change(endField('To'), { target: { value: '600' } });
        expect(action('Apply')).toBeDisabled();
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
            { values: ['700', '700'], operator: 'between', ends: BOTH_INCLUDED },
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
            { values: ['600', '650'], operator: 'between', ends: BOTH_INCLUDED },
            'down',
          ],
        ]);
      });

      it("tabs through a range's own fields, and applies and leaves the condition only from its last or first", () => {
        const { onCommitValues, onStartEdit } = renderShaped({
          initial: { rowId: 'm1', columnId: 'score' },
          initialEditing: at('m1', 'score'),
        });
        for (const field of [endField('From'), included('From'), endField('To')]) {
          fireEvent.keyDown(field, { key: 'Tab' });
        }
        for (const field of [included('From'), endField('To'), included('To')]) {
          fireEvent.keyDown(field, { key: 'Tab', shiftKey: true });
        }
        expect(onCommitValues).not.toHaveBeenCalled();
        fireEvent.keyDown(included('To'), { key: 'Tab' });
        expect(onCommitValues.mock.calls).toEqual([
          [
            at('m1', 'score'),
            { values: ['700', '850'], operator: 'between', ends: BOTH_INCLUDED },
            'right',
          ],
        ]);
        expect(onStartEdit).not.toHaveBeenCalled();
        expect(focusedStop()).toBe('m1:debt');
        fireEvent.click(valueChips('m1', 'score')[1] ?? card('m1'));
        fireEvent.keyDown(endField('From'), { key: 'Tab', shiftKey: true });
        expect(onCommitValues.mock.calls.at(-1)).toEqual([
          at('m1', 'score', 1),
          { values: ['700', '850'], operator: 'between', ends: BOTH_INCLUDED },
          'left',
        ]);
        expect(onStartEdit).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('nl-value-editor')).toBeNull();
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
            { values: ['"US"', '"CA"', '"GB"', '"DE"', '"FR"', '"IT"'], operator: 'oneOf' },
            'down',
          ],
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
          [at('m2', 'country'), { values: ['"RU"', '"KP"', '"CN"'], operator: 'noneOf' }, 'none'],
        ]);
      });

      it('keeps a list’s values in their sentence order, adding a checked one after them', () => {
        const { onCommitValues } = renderShaped({
          initialEditing: at('m2', 'country'),
          valueField: (cell) => ({
            ...shapedField(cell),
            values: ['"KP"', '"RU"'],
            allowedValues: ['"RU"', '"CN"'],
          }),
        });
        fireEvent.click(action('Apply'));
        fireEvent.click(valueChip('m2', 'country'));
        fireEvent.click(box('"CN"'));
        fireEvent.click(box('"KP"'));
        fireEvent.click(box('"KP"'));
        fireEvent.click(action('Apply'));
        expect(onCommitValues.mock.calls.map(([, commit]) => commit.values)).toEqual([
          ['"KP"', '"RU"'],
          ['"RU"', '"CN"', '"KP"'],
        ]);
      });

      it("lists every value of a long list, past the sentence's +N more", () => {
        const countries = Array.from({ length: 25 }, (_, index) => `"Country ${index + 1}"`);
        renderShaped({
          rules: [longValueListRule(25)],
          initialEditing: at('long-list', 'country'),
          valueField: () => ({ operators: SHAPED_OPERATORS, operator: 'oneOf', values: countries }),
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
          [at('m2', 'country'), { values: ['"KP"'], operator: 'noneOf' }, 'none'],
        ]);
      });

      it("tabs through a list's own fields, and applies and leaves it from its add field or its first value", () => {
        const { onCommitValues, onStartEdit } = renderShaped({
          initial: { rowId: 'm2', columnId: 'country' },
          initialEditing: at('m2', 'country'),
        });
        fireEvent.keyDown(box('"RU"'), { key: 'Tab' });
        fireEvent.keyDown(box('"KP"'), { key: 'Tab', shiftKey: true });
        fireEvent.keyDown(addField(), { key: 'Tab', shiftKey: true });
        expect(onCommitValues).not.toHaveBeenCalled();
        fireEvent.keyDown(addField(), { key: 'Tab' });
        expect(onCommitValues.mock.calls).toEqual([
          [at('m2', 'country'), { values: ['"RU"', '"KP"'], operator: 'noneOf' }, 'right'],
        ]);
        expect(onStartEdit).not.toHaveBeenCalled();
        fireEvent.click(valueChip('m2', 'country'));
        fireEvent.keyDown(box('"RU"'), { key: 'Tab', shiftKey: true });
        expect(onCommitValues.mock.calls.at(-1)?.[2]).toBe('left');
        expect(onStartEdit).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('column popover', () => {
    const TYPES: ColumnTypeOption[] = [
      {
        id: 'number',
        label: 'Number',
        icon: <svg data-testid="number-icon" />,
        allowedValuesPlaceholder: 'e.g. 10, 20',
      },
      { id: 'string', label: 'Text', allowedValuesPlaceholder: 'e.g. "a", "b"' },
    ];
    const AGE_FIELD: ColumnField = {
      kind: 'input',
      label: 'age',
      binding: 'applicant.age',
      required: true,
      typeRef: 'string',
      allowedValues: '',
    };
    const FIELDS: Record<string, ColumnField> = {
      age: AGE_FIELD,
      risk: {
        kind: 'output',
        label: 'risk',
        binding: 'risk',
        required: false,
        typeRef: 'string',
        allowedValues: '"high", "low"',
      },
    };
    const columnEdit = (overrides: Partial<ColumnEdit> = {}): ColumnEdit => ({
      field: (columnId) => FIELDS[columnId] ?? AGE_FIELD,
      types: TYPES,
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
    const renderColumns = (overrides: Partial<ColumnEdit> = {}) => {
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
      expect(screen.getByRole('group', { name: 'Input · age' })).toBe(popover());
      expect(inPopover().getByText('Input · age')).toBeInTheDocument();
      expect(field('Label')).toHaveValue('age');
      expect(document.activeElement).toBe(field('Label'));
      expect(field('Input expression')).toHaveValue('applicant.age');
      expect(field('Input expression')).toBeRequired();
      expect(typeSelect()).toHaveTextContent('Text');
      expect(field('Allowed values')).toHaveValue('');
      expect(field('Allowed values')).toHaveAttribute('placeholder', 'e.g. "a", "b"');
      expect(field('Allowed values')).toHaveAccessibleDescription('Separate values with commas.');
      expect(
        inPopover()
          .getAllByRole('button')
          .map((button) => button.textContent)
      ).toEqual(['Cancel', 'Apply']);
      expect(screen.queryByTestId('nl-value-editor')).toBeNull();
      expect(await axe(container)).toHaveNoViolations();
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
      expect(inPopover().getByTestId('number-icon')).toBeInTheDocument();
      expect(field('Allowed values')).toHaveAttribute('placeholder', 'e.g. 10, 20');
      fireEvent.click(action('Apply'));
      expect(vi.mocked(onCommit).mock.calls).toEqual([
        ['age', { label: 'Age', typeRef: 'number' }],
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
        ['risk', { binding: 'riskLevel', allowedValues: '"high"' }],
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

    it('keeps Tab and Shift+Tab inside the popover', async () => {
      const user = userEvent.setup();
      renderColumns({ onMoreProperties: vi.fn() });
      fireEvent.click(pill('age'));
      await user.tab();
      expect(document.activeElement).toBe(field('Input expression'));
      act(() => action('Apply').focus());
      await user.tab();
      expect(document.activeElement).toBe(field('Label'));
      await user.tab({ shift: true });
      expect(document.activeElement).toBe(action('Apply'));
      expect(popover()).toBeInTheDocument();
    });

    it('closes without a commit on a press outside, leaving focus where it lands', () => {
      const { onCommit } = renderColumns();
      fireEvent.click(pill('age'));
      fireEvent.change(field('Label'), { target: { value: 'Age' } });
      fireEvent.pointerDown(field('Label'));
      expect(popover()).toBeInTheDocument();
      fireEvent.pointerDown(card('r1'));
      expect(screen.queryByTestId('nl-column-editor')).toBeNull();
      expect(onCommit).not.toHaveBeenCalled();
    });

    it('refuses Apply while a required binding is empty, and says why', () => {
      const { onCommit } = renderColumns();
      fireEvent.click(pill('age'));
      fireEvent.change(field('Input expression'), { target: { value: '  ' } });
      expect(field('Input expression')).toHaveAttribute('aria-invalid', 'true');
      expect(field('Input expression')).toHaveAccessibleDescription('This input has no expression');
      expect(action('Apply')).toBeDisabled();
      fireEvent.keyDown(field('Input expression'), { key: 'Enter' });
      expect(onCommit).not.toHaveBeenCalled();
      expect(popover()).toBeInTheDocument();
    });

    it("offers More properties only with the host's action, which closes the popover", () => {
      const onMoreProperties = vi.fn();
      const { onCommit } = renderColumns({ onMoreProperties });
      fireEvent.click(pill('risk'));
      fireEvent.click(action('More properties'));
      expect(onMoreProperties.mock.calls).toEqual([['risk']]);
      expect(onCommit).not.toHaveBeenCalled();
      expect(screen.queryByTestId('nl-column-editor')).toBeNull();
    });

    it("offers the column's own type when the host's types lack it, and no allowed values the host leaves out", () => {
      renderColumns({
        field: () => ({
          kind: 'input',
          label: 'age',
          binding: 'age',
          required: true,
          typeRef: 'tPeriod',
        }),
      });
      fireEvent.click(pill('age'));
      expect(typeSelect()).toHaveTextContent('tPeriod');
      expect(inPopover().queryByRole('textbox', { name: 'Allowed values' })).toBeNull();
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
          bands={GRID_SENTENCE_BANDS.map((band) => ({
            ...band,
            columns: band.columns.filter((c) => c.id !== 'age'),
          }))}
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
        initial: { rowId: 'm3', columnId: 'channel' },
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

    it("opens the host's add-condition entries from +, and edits a condition the rule lacks on its pending line", () => {
      const conditionEntries = vi.fn(
        (rowId: string, startEdit: (value: SentenceValueId) => void): GridMenuEntry[] => [
          {
            label: 'income',
            focusesOwnSurface: true,
            onClick: () => startEdit({ rowId, columnId: 'income', index: 0 }),
          },
        ]
      );
      const { onSelect } = renderEditing({
        conditionEntries,
        initial: { rowId: 'r1', columnId: 'age' },
      });
      expect(conditionEntries).not.toHaveBeenCalled();
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
      expect(new Set(conditionEntries.mock.calls.map(([rowId]) => rowId))).toEqual(new Set(['r3']));
      fireEvent.click(within(menu).getByRole('menuitem', { name: 'income' }));
      expect(onSelect.mock.calls).toEqual([[{ rowId: 'r3', columnId: 'income' }]]);
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
      renderEditing({ initialEditing: { rowId: 'r3', columnId: 'channel', index: 0 } });
      fireEvent.keyDown(editor(), { key: 'Escape' });
      expect(document.activeElement).toBe(button('r3', 'Add condition to rule 3'));
    });

    const [withRegion, regionId] = tableWithNewInput(EDITABLE_TABLE);
    const FOUR_LINES = tableWithValue(
      withRegion,
      { rowId: 'r2', columnId: regionId, index: 0 },
      '"EU"'
    );

    const TableHost = ({
      initial,
      start = EDITABLE_TABLE,
    }: {
      initial: SentenceSelection | null;
      start?: EditableTable;
    }) => {
      const [table, setTable] = useState(start);
      const [selected, setSelected] = useState(initial);
      const [editing, setEditing] = useState<SentenceValueId | null>(null);
      return view({
        rules: wordedRules(table),
        bands: tableBands(table),
        header: GRID_SENTENCE_HEADER,
        selected,
        onSelect: setSelected,
        edit: editWith({
          editing,
          onStartEdit: setEditing,
          onCommit: (value, { values: [text = ''] }) => {
            setTable((current) =>
              text === '' ? tableWithoutCell(current, value) : tableWithValue(current, value, text)
            );
            setEditing(null);
          },
          onClearCell: (cell) => setTable((current) => tableWithoutCell(current, cell)),
          ruleEntries: () => [{ label: 'Delete rule', onClick: vi.fn() }],
          conditionEntries: (rowId) =>
            unusedInputs(table, rowId).map((input) => ({
              label: input.name,
              focusesOwnSurface: true,
              onClick: () => setEditing({ rowId, columnId: input.id, index: 0 }),
            })),
        }),
      });
    };

    it.each<[string, SentenceCellId]>([
      ['its last line', { rowId: 'r2', columnId: 'channel' }],
      ['its lead', { rowId: 'r1', columnId: 'age' }],
    ])('keeps focus on the rule after Delete removes its condition from %s', (_, cell) => {
      render(<TableHost initial={cell} />);
      act(() => valueChip(cell.rowId, cell.columnId).focus());
      press('Delete');
      expect(card(cell.rowId).querySelector(`[data-column-id="${cell.columnId}"]`)).toBeNull();
      expect(document.activeElement).toBe(card(cell.rowId));
      expect(card(cell.rowId)).toHaveAttribute('tabindex', '0');
    });

    it('keeps focus on the rule after Delete removes its lead condition in a shadow root', () => {
      const host = document.body.appendChild(document.createElement('div'));
      const shadow = host.attachShadow({ mode: 'open' });
      const container = shadow.appendChild(document.createElement('div'));
      render(<TableHost initial={{ rowId: 'r1', columnId: 'age' }} />, { container });
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
      ['Tab to the next cell', { rowId: 'r1', columnId: 'age' }, { key: 'Tab' }, 'r1:income'],
      [
        'Shift+Tab to the previous cell',
        { rowId: 'r1', columnId: 'income' },
        { key: 'Tab', shiftKey: true },
        'r1:age',
      ],
      [
        'Tab from the last cell to the rule',
        { rowId: 'r1', columnId: 'income' },
        { key: 'Tab' },
        'r1',
      ],
    ])('moves by %s when committing an empty value removes its condition', (_, cell, key, stop) => {
      render(<TableHost initial={cell} />);
      act(() => valueChip(cell.rowId, cell.columnId).focus());
      press('Enter');
      fireEvent.change(editor(), { target: { value: '' } });
      fireEvent.keyDown(editor(), key);
      expect(card(cell.rowId).querySelector(`[data-column-id="${cell.columnId}"]`)).toBeNull();
      expect(focusedStop()).toBe(stop);
    });

    it.each<[string, KeyboardEventInit, string]>([
      ['Enter to the next rule', { key: 'Enter' }, 'r2:channel'],
      ['Tab from the last cell in place', { key: 'Tab' }, 'r1:channel'],
      ['Shift+Tab to the previous cell', { key: 'Tab', shiftKey: true }, 'r1:income'],
    ])('moves by %s when committing a condition added from +', (_, key, stop) => {
      render(<TableHost initial={{ rowId: 'r1' }} />);
      fireEvent.click(button('r1', 'Add condition to rule 1'));
      fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'channel' }));
      fireEvent.change(editor(), { target: { value: '"web"' } });
      fireEvent.keyDown(editor(), key);
      expect(valueChip('r1', 'channel')).toHaveTextContent('"web"');
      expect(focusedStop()).toBe(stop);
    });

    it('keeps focus on the rule after its ✕ removes a line with lines after it', () => {
      render(<TableHost initial={{ rowId: 'r2' }} start={FOUR_LINES} />);
      const remove = button('r2', 'Remove age from rule 2');
      act(() => remove.focus());
      fireEvent.click(remove);
      expect(document.activeElement).toBe(card('r2'));
    });

    it.each([
      ['blur', () => fireEvent.blur(editor())],
      ['Enter', () => fireEvent.keyDown(editor(), { key: 'Enter' })],
    ])('closes the editor of the condition its ✕ removes after a refused %s commit, staying on its rule', (_, settle) => {
      const { onCancel, onClearCell, onSelect } = renderEditing({
        initial: { rowId: 'r1', columnId: 'age' },
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

    it('removes the condition whose ✕ was pressed when the blur commit adds a line before it', () => {
      const start = tableWithoutCell(FOUR_LINES, { rowId: 'r2', columnId: 'income' });
      render(<TableHost initial={{ rowId: 'r2' }} start={start} />);
      fireEvent.click(button('r2', 'Add condition to rule 2'));
      fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'income' }));
      fireEvent.change(editor(), { target: { value: '50000' } });
      const remove = button('r2', 'Remove channel from rule 2');
      fireEvent.pointerDown(remove);
      fireEvent.mouseDown(remove);
      act(() => remove.focus());
      fireEvent.mouseUp(remove);
      fireEvent.click(remove);
      const lines = [...card('r2').querySelectorAll<HTMLElement>('li[data-column-id]')];
      expect(lines.map((line) => line.dataset.columnId)).toEqual(['age', 'income', regionId]);
    });

    it('removes the condition whose ✕ the refused blur commit moved from under the press', () => {
      const { onClearCell } = renderEditing({
        initial: { rowId: 'r1', columnId: 'age' },
        initialEditing: { rowId: 'r1', columnId: 'age', index: 0 },
        refuse: true,
      });
      fireEvent.change(editor(), { target: { value: '' } });
      const remove = button('r1', 'Remove age from rule 1');
      const position = vi.spyOn(remove, 'getBoundingClientRect').mockReturnValue(rect(791, 811));
      fireEvent.pointerDown(remove);
      fireEvent.mouseDown(remove);
      fireEvent.blur(editor());
      position.mockReturnValue(rect(776, 796));
      fireEvent.pointerUp(card('r1'));
      fireEvent.mouseUp(card('r1'));
      fireEvent.click(card('r1'));
      expect(onClearCell).toHaveBeenCalledWith({ rowId: 'r1', columnId: 'age' });
      expect(screen.queryByTestId('nl-editor')).toBeNull();
    });

    it.each([
      'Add condition to rule 3',
      'Rule 3 actions',
    ])('opens the %s menu whose button the blur commit moved from under the press', (name) => {
      render(<TableHost initial={{ rowId: 'r1' }} />);
      fireEvent.click(button('r1', 'Add condition to rule 1'));
      fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'channel' }));
      fireEvent.change(editor(), { target: { value: '"web"' } });
      const trigger = button('r3', name);
      const position = vi
        .spyOn(trigger, 'getBoundingClientRect')
        .mockReturnValue({ ...rect(300, 324), top: 130, y: 130, bottom: 154 });
      fireEvent.pointerDown(trigger);
      fireEvent.mouseDown(trigger);
      act(() => trigger.focus());
      position.mockReturnValue({ ...rect(300, 324), top: 154, y: 154, bottom: 178 });
      fireEvent.pointerUp(card('r3'));
      fireEvent.mouseUp(card('r3'));
      fireEvent.click(card('r3'));
      expect(valueChip('r1', 'channel')).toHaveTextContent('"web"');
      expect(screen.getByRole('menu')).toHaveAttribute('aria-label', name);
      expect(screen.getByTestId('nl-context-menu-anchor')).toHaveStyle({
        top: '178px',
        left: '300px',
      });
    });

    it('returns focus to the rule after its ✕ removes a condition whose refused blur commit left focus on the view', () => {
      renderEditing({
        initial: { rowId: 'r1', columnId: 'age' },
        initialEditing: { rowId: 'r1', columnId: 'age', index: 0 },
        refuse: true,
      });
      fireEvent.change(editor(), { target: { value: '' } });
      fireEvent.blur(editor());
      act(() => screen.getByTestId('nl').focus());
      fireEvent.click(button('r1', 'Remove age from rule 1'));
      expect(card('r1').contains(document.activeElement)).toBe(true);
    });

    it('removes the lead condition whose ✕ was pressed when the blur commit moves the lead into lines', () => {
      render(<TableHost initial={{ rowId: 'r1' }} />);
      fireEvent.click(button('r1', 'Add condition to rule 1'));
      fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'channel' }));
      fireEvent.change(editor(), { target: { value: '"web"' } });
      const remove = button('r1', 'Remove age from rule 1');
      fireEvent.pointerDown(remove);
      fireEvent.mouseDown(remove);
      act(() => remove.focus());
      expect(remove.isConnected).toBe(false);
      fireEvent.pointerUp(card('r1'));
      fireEvent.mouseUp(card('r1'));
      fireEvent.click(card('r1'));
      expect(card('r1').querySelector('[data-column-id="age"]')).toBeNull();
      expect(valueChip('r1', 'channel')).toHaveTextContent('"web"');
    });

    it('edits the lead value that was pressed when the blur commit moves the lead into lines', () => {
      render(<TableHost initial={{ rowId: 'r1' }} />);
      fireEvent.click(button('r1', 'Add condition to rule 1'));
      fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'channel' }));
      fireEvent.change(editor(), { target: { value: '"web"' } });
      const age = valueChip('r1', 'age');
      fireEvent.pointerDown(age);
      fireEvent.mouseDown(age);
      act(() => age.focus());
      expect(age.isConnected).toBe(false);
      fireEvent.pointerUp(card('r1'));
      fireEvent.mouseUp(card('r1'));
      fireEvent.click(card('r1'));
      expect(valueChip('r1', 'channel')).toHaveTextContent('"web"');
      expect(editor()).toHaveAccessibleName(/^age .*, rule 1$/);
      expect(valueChip('r1', 'age')).toHaveAttribute('tabindex', '0');
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
      expect(onSelect).toHaveBeenLastCalledWith({ rowId: 'r1', columnId: 'income' });
    });

    it('edits a condition with no value by a click on its input', () => {
      const { onStartEdit } = renderEditing({ rules: NO_VALUE_RULES });
      fireEvent.click(noValueInput());
      expect(onStartEdit).toHaveBeenCalledWith({ rowId: 'r1', columnId: 'income', index: 0 });
    });

    it('removes a condition with no value by Delete on its input', () => {
      const { onClearCell } = renderEditing({ rules: NO_VALUE_RULES, initial: { rowId: 'r1' } });
      act(() => card('r1').focus());
      walk('ArrowRight', 'ArrowRight', 'ArrowRight');
      expect(document.activeElement).toHaveAttribute('data-column-id', 'income');
      press('Delete');
      expect(onClearCell).toHaveBeenCalledWith({ rowId: 'r1', columnId: 'income' });
    });

    it.each<[string, KeyboardEventInit, string]>([
      ['Escape back to its input', { key: 'Escape' }, 'r1:income'],
      ['Enter down to the next rule', { key: 'Enter' }, 'r2:income'],
      ['Tab from the last cell in place', { key: 'Tab' }, 'r1:income'],
      ['Shift+Tab to the previous cell', { key: 'Tab', shiftKey: true }, 'r1:age'],
    ])('moves by %s from the editor of a condition with no value', (_, key, stop) => {
      renderEditing({ rules: NO_VALUE_RULES, initial: { rowId: 'r1', columnId: 'income' } });
      act(() => card('r1').querySelector<HTMLElement>('[data-column-id="income"]')?.focus());
      press('Enter');
      fireEvent.keyDown(editor(), key);
      expect(focusedStop()).toBe(stop);
    });

    it('names the editor of a condition with no value as its cell, not as a new condition', () => {
      renderEditing({ rules: NO_VALUE_RULES, initial: { rowId: 'r1', columnId: 'income' } });
      act(() => card('r1').querySelector<HTMLElement>('[data-column-id="income"]')?.focus());
      press('Enter');
      expect(editor()).toHaveAccessibleName(DECISION_TEXT_LABELS.cell('income', '', 1));
    });

    it('keeps focus on the rule after its ✕ re-words it, selecting that rule first', () => {
      render(<TableHost initial={{ rowId: 'r1', columnId: 'age' }} />);
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
    const deleteEntry = (): GridMenuEntry[] => [{ label: 'Delete rule', onClick: vi.fn() }];
    const renderMenus = (overrides: Partial<DecisionTextEdit> = {}) =>
      render(
        view({
          rules: GRID_SENTENCE_RULES,
          selected: null,
          onSelect: vi.fn(),
          edit: editWith({ ruleEntries: deleteEntry, ...overrides }),
        })
      );
    type RuleChange = (rules: readonly SentenceRule[], rowId: string) => readonly SentenceRule[];
    interface RuleChangeHostProps {
      label: string;
      change: RuleChange;
      next: string;
      onDeleteRule?: DecisionTextEdit['onDeleteRule'];
    }
    const RuleChangeHost = ({ label, change, next, onDeleteRule }: RuleChangeHostProps) => {
      const [rules, setRules] = useState<readonly SentenceRule[]>(GRID_SENTENCE_RULES);
      const [selected, setSelected] = useState<SentenceSelection | null>({ rowId: 'r2' });
      const apply = (rowId: string) => {
        setRules((current) => change(current, rowId));
        setSelected({ rowId: next });
      };
      return view({
        rules,
        selected,
        onSelect: setSelected,
        edit: editWith({
          ruleEntries: (rowId) => [{ label, onClick: () => apply(rowId) }],
          onDeleteRule: (rowId) => {
            onDeleteRule?.(rowId);
            apply(rowId);
          },
        }),
      });
    };
    const removeRule: RuleChange = (rules, rowId) => rules.filter((rule) => rule.rowId !== rowId);
    const insertBelow: RuleChange = (rules, rowId) =>
      rules.flatMap((rule) => (rule.rowId === rowId ? [rule, { ...rule, rowId: 'r2b' }] : [rule]));

    it("opens the host's entries for its own rule from ⋯, and focuses ⋯ again on close", () => {
      const onDelete = vi.fn();
      const ruleEntries = vi.fn((_rowId: string): GridMenuEntry[] => [
        {
          label: 'Move up',
          disabled: true,
          disabledReason: 'Already the first rule',
          onClick: vi.fn(),
        },
        { divider: true },
        { label: 'Delete rule', destructive: true, onClick: onDelete },
      ]);
      renderMenus({ ruleEntries });
      expect(ruleEntries).not.toHaveBeenCalled();
      expect(actions('r2')).toHaveAttribute('aria-haspopup', 'menu');
      fireEvent.click(actions('r2'));
      const menu = screen.getByRole('menu');
      expect(menu).toHaveAttribute('aria-label', 'Rule 2 actions');
      expect(new Set(ruleEntries.mock.calls.map(([rowId]) => rowId))).toEqual(new Set(['r2']));
      expect(within(menu).getByRole('menuitem', { name: /^Move up/ })).toHaveAttribute(
        'aria-disabled',
        'true'
      );
      expect(screen.getByTestId('nl-menu-disabled-reason')).toHaveTextContent(
        'Already the first rule'
      );
      fireEvent.click(within(menu).getByRole('menuitem', { name: 'Delete rule' }));
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('menu')).toBeNull();
      expect(document.activeElement).toBe(actions('r2'));
      fireEvent.click(actions('r2'));
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
      expect(screen.queryByRole('menu')).toBeNull();
      expect(document.activeElement).toBe(actions('r2'));
    });

    it('opens no menu from + or ⋯ while the host has no entries for it', () => {
      const conditionEntries = vi.fn((): GridMenuEntry[] => []);
      renderMenus({ conditionEntries, ruleEntries: () => [] });
      const add = within(card('r3')).getByRole('button', { name: 'Add condition to rule 3' });
      fireEvent.click(add);
      expect(conditionEntries).toHaveBeenCalledWith('r3');
      expect(screen.queryByRole('menu')).toBeNull();
      expect(add).not.toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(actions('r3'));
      expect(screen.queryByRole('menu')).toBeNull();
      expect(actions('r3')).not.toHaveAttribute('aria-expanded', 'true');
    });

    it('marks only the button whose menu is open as expanded', () => {
      renderMenus({ conditionEntries: deleteEntry });
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
      ["removes the menu's own rule", 'Delete rule', removeRule, 'r3', 'r3'],
      ['inserts it, and walks on from there', 'Insert rule below', insertBelow, 'r2b', 'r3'],
    ])('focuses the rule the host selects once a menu pick %s', (_, label, change, next, below) => {
      render(<RuleChangeHost label={label} change={change} next={next} />);
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
          edit: editWith({ ruleEntries: deleteEntry }),
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

    it.each<[string, readonly SentenceRule[], boolean]>([
      ['its rule is gone', GRID_SENTENCE_RULES.filter((rule) => rule.rowId !== 'r2'), true],
      ['editing is gone', GRID_SENTENCE_RULES, false],
    ])('closes the rule menu once %s, asking no entries for it, and focuses the view', (_, rules, editable) => {
      const ruleEntries = vi.fn(deleteEntry);
      const edit = editWith({ ruleEntries });
      const onSelect = vi.fn();
      const { rerender } = render(
        view({ rules: GRID_SENTENCE_RULES, selected: null, onSelect, edit })
      );
      fireEvent.click(actions('r2'));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      ruleEntries.mockClear();
      rerender(view({ rules, selected: null, onSelect, edit: editable ? edit : undefined }));
      expect(screen.queryByRole('menu')).toBeNull();
      expect(ruleEntries).not.toHaveBeenCalled();
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
      const edit = editWith({ ruleEntries: deleteEntry });
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
        bands: MULTI_SENTENCE_BANDS,
        header: MULTI_SENTENCE_HEADER,
        selected: null,
        onSelect: vi.fn(),
        edit: editWith({ ruleEntries: deleteEntry }),
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
        bands: MULTI_SENTENCE_BANDS,
        header: MULTI_SENTENCE_HEADER,
        initial: { rowId: 'row-0' },
        edit: editWith({ ruleEntries: deleteEntry }),
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

    it("tabs from the selected rule's last stop to + to ⋯ to delete and then out of the view, leaving their keys to the browser", () => {
      const { onSelect } = renderSelectable({
        initial: { rowId: 'r3', columnId: 'age' },
        edit: editWith(),
      });
      const add = within(card('r3')).getByRole('button', { name: 'Add condition to rule 3' });
      const chip = valueChip('r3', 'age');
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
      expect(tabbable).toEqual([chip, add, actions('r3'), remove]);
      expect(
        within(card('r2')).getByRole('button', { name: 'Add condition to rule 2' })
      ).toHaveAttribute('tabindex', '-1');
      for (const action of [add, actions('r3'), remove]) {
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
      render(
        <RuleChangeHost
          label="Delete rule"
          change={removeRule}
          next="r3"
          onDeleteRule={onDeleteRule}
        />
      );
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
      const { rerender } = render(view({ ...props, selected: { rowId: 'r2' } }));
      const remove = within(card('r2')).getByRole('button', { name: 'Delete rule 2' });
      act(() => remove.focus());
      fireEvent.click(remove);
      expect(props.edit.onDeleteRule).toHaveBeenCalledWith('r2');
      expect(document.activeElement).toBe(card('r2'));
      rerender(view({ ...props, selected: { rowId: 'r1' } }));
      expect(document.activeElement).toBe(card('r2'));
    });

    it('focuses the rule the host selects after the delete action removes its rule in a shadow root', () => {
      const host = document.body.appendChild(document.createElement('div'));
      onTestFinished(() => host.remove());
      const shadow = host.attachShadow({ mode: 'open' });
      const container = shadow.appendChild(document.createElement('div'));
      render(<RuleChangeHost label="Delete rule" change={removeRule} next="r3" />, { container });
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
    type Policy = NonNullable<DecisionTextProps['policy']>;
    const policyWith = (overrides: Partial<Policy> = {}): Policy => ({
      value: 'FIRST',
      groups: HIT_POLICY_GROUPS,
      onChange: vi.fn(),
      label: 'Hit policy: First',
      ...overrides,
    });
    const trigger = () => screen.getByRole('button', { name: /^Hit policy/ });

    it.each<[string, Policy | undefined, string]>([
      ['the picked option', policyWith(), 'F·First'],
      ['a picked submenu option', policyWith({ value: 'COLLECT:MIN' }), 'C<·Minimum'],
      ['a value no option holds as it is', policyWith({ value: 'RULE ORDER' }), 'RULE ORDER'],
      ['the plain label without a policy', undefined, 'Unique'],
    ])('shows %s in place of the label, then the hint', (_, policy, label) => {
      renderView({ header: GRID_SENTENCE_HEADER, policy });
      expect(screen.queryByTestId('nl-policy')?.textContent).toBe(policy && label);
      expect(screen.getByTestId('nl-header')).toHaveTextContent(
        `${label}${GRID_SENTENCE_HEADER.hint}`
      );
    });

    it('reports the picked option and focuses the trigger again', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderView({ policy: policyWith({ onChange }) });
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
      expect(onChange).toHaveBeenCalledWith('UNIQUE');
      expect(screen.queryByRole('menu')).toBeNull();
      expect(document.activeElement).toBe(trigger());
    });

    it('picks a submenu option by keyboard, and refuses a disabled one with its reason', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderView({ policy: policyWith({ onChange }) });
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
      expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: /^Minimum/ }));
      await user.keyboard('{ArrowDown}{Enter}');
      expect(onChange).toHaveBeenCalledWith('COLLECT:MAX');
      await user.click(await openTotals());
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('ends the picker with the header mark, announced on the trigger', () => {
      renderView({
        policy: policyWith(),
        headerMark: { tone: 'error', title: 'Priority needs ranked output values', glyph: true },
      });
      const badge = screen.getByTestId('nl-header').querySelector('[data-glyph]')?.parentElement;
      expect(badge?.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'error');
      expect(badge).toHaveAttribute('data-mark-title', 'Priority needs ranked output values');
      expect(trigger()).toHaveAccessibleDescription('Error: Priority needs ranked output values');
    });

    it('ends the plain label with the header mark when there is no picker', () => {
      renderView({
        header: GRID_SENTENCE_HEADER,
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
          ? { ...part, decisionId: 'income-decision' }
          : part
      ),
    }));
    const link = (rowId: string) =>
      within(card(rowId)).getByRole('button', { name: 'Open the income decision' });

    it('opens the decision by a click on the input or Alt+Enter on its cell, without selecting or editing', () => {
      const onOpenDecision = vi.fn();
      const edit = editWith();
      const { onSelect } = renderSelectable({
        rules: linkedRules,
        onOpenDecision,
        edit,
        initial: { rowId: 'r1', columnId: 'income' },
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

    it('takes onSelect only with selected, without which no stop or link is tabbable', () => {
      render(
        // @ts-expect-error
        <DecisionText
          rules={linkedRules}
          bands={GRID_SENTENCE_BANDS}
          header={GRID_SENTENCE_HEADER}
          labels={DECISION_TEXT_LABELS}
          ariaLabel="Rules"
          dataTestId="nl"
          onOpenDecision={vi.fn()}
          onSelect={vi.fn()}
        />
      );
      const controls = document.querySelectorAll<HTMLElement>(
        'li[data-row-id], li[data-row-id] [tabindex], li[data-row-id] button'
      );
      expect(screen.getAllByRole('button', { name: 'Open the income decision' })).toHaveLength(2);
      expect([...controls].filter((control) => control.tabIndex >= 0)).toEqual([]);
    });

    it('keeps a selectable link in the tab order when its input has no value to open it from', async () => {
      const onOpenDecision = vi.fn();
      const rules = GRID_SENTENCE_RULES.map((rule) => ({
        ...rule,
        lead: [
          'when ',
          { kind: 'input', columnId: 'income', text: 'income', decisionId: 'income-decision' },
          ' is not empty',
        ] satisfies SentencePart[],
      }));
      renderSelectable({ rules, onOpenDecision, initial: { rowId: 'r1' } });
      const user = userEvent.setup();
      act(() => card('r1').focus());
      await user.tab();
      expect(focusedStop()).toBe('r1:risk');
      await user.tab();
      expect(document.activeElement).toBe(link('r1'));
      await user.keyboard('{Enter}');
      expect(onOpenDecision.mock.calls).toEqual([['income-decision']]);
    });

    it.each([
      'selectable',
      'editable',
    ])('selects, and edits when editable, a linked input with no value from a pointer click in a %s view', async (mode) => {
      const onOpenDecision = vi.fn();
      const rules = GRID_SENTENCE_RULES.map((rule) => ({
        ...rule,
        lead: [
          'when ',
          { kind: 'input', columnId: 'income', text: 'income', decisionId: 'income-decision' },
          ' is not empty',
        ] satisfies SentencePart[],
      }));
      const onStartEdit = vi.fn();
      const edit = mode === 'editable' ? editWith({ onStartEdit }) : undefined;
      const { onSelect } = renderSelectable({
        rules,
        onOpenDecision,
        edit,
        initial: { rowId: 'r1' },
      });
      const user = userEvent.setup();
      await user.click(link('r2'));
      expect(onSelect.mock.calls).toEqual([[{ rowId: 'r2', columnId: 'income' }]]);
      expect(onStartEdit.mock.calls).toEqual(
        edit ? [[{ rowId: 'r2', columnId: 'income', index: 0 }]] : []
      );
      expect(onOpenDecision).not.toHaveBeenCalled();
      press('Enter', { altKey: true });
      expect(onOpenDecision.mock.calls).toEqual([['income-decision']]);
    });

    it('stops on each input with no value in reading order, and opens its decision by Alt+Enter', async () => {
      const onOpenDecision = vi.fn();
      const lead = [
        'when ',
        { kind: 'input', columnId: 'income', text: 'income', decisionId: 'income-decision' },
        ' is set and ',
        { kind: 'input', columnId: 'age', text: 'age' },
        ' is ',
        { kind: 'value', columnId: 'age', index: 0, text: '25' },
        ' and ',
        { kind: 'input', columnId: 'channel', text: 'channel', decisionId: 'channel-decision' },
        ' is set',
      ] satisfies SentencePart[];
      const rules = GRID_SENTENCE_RULES.map((rule) => ({ ...rule, lead }));
      renderSelectable({ rules, onOpenDecision, initial: { rowId: 'r1' } });
      const user = userEvent.setup();
      act(() => card('r1').focus());
      const columns: (string | undefined)[] = [];
      for (const _ of [1, 2, 3, 4]) {
        await user.tab();
        columns.push(
          document.activeElement instanceof HTMLElement
            ? document.activeElement.dataset.columnId
            : undefined
        );
      }
      expect(columns).toEqual(['risk', 'income', 'age', 'channel']);
      await user.keyboard('{Shift>}{Tab}{Tab}{/Shift}');
      press('Enter', { altKey: true });
      expect(onOpenDecision.mock.calls).toEqual([['income-decision']]);
    });

    it('takes no links’ label from a view without onOpenDecision, and names a link by its input without one', () => {
      const { openDecision: _, ...unlinked } = DECISION_TEXT_LABELS;
      const { rerender } = renderView({ rules: linkedRules, labels: unlinked });
      expect(within(card('r1')).queryAllByRole('button')).toEqual([]);
      const onOpenDecision = vi.fn();
      rerender(view({ rules: linkedRules, labels: unlinked, onOpenDecision }));
      fireEvent.click(within(card('r1')).getByRole('button', { name: 'income' }));
      expect(onOpenDecision).toHaveBeenCalledWith('income-decision');
    });

    it('keeps a read-only link in the tab order, and the input plain without onOpenDecision', () => {
      const props = { rules: linkedRules, onOpenDecision: vi.fn() };
      const { rerender } = renderView(props);
      expect(link('r1')).not.toHaveAttribute('tabindex');
      rerender(view({ ...props, onOpenDecision: undefined }));
      expect(screen.queryByRole('button', { name: 'Open the income decision' })).toBeNull();
    });
  });
});
