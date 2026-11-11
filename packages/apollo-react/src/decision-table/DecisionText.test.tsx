import { act, fireEvent, type RenderResult, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { type Mock, vi } from 'vitest';
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
import { EMPTY_VALUE_DASH, FALLBACK_ROW_VIEWPORT_PX } from './constants';
import { DecisionText, type DecisionTextEdit, type DecisionTextProps } from './DecisionText';
import type { GridMenuEntry } from './GridMenu';
import type { RowMark, TableMarks } from './marks';
import { sentenceRuleOffsets } from './sentenceRuleHeights';
import type {
  SentenceCellId,
  SentencePart,
  SentenceRule,
  SentenceSelection,
  SentenceValueId,
  SentenceValueToken,
} from './sentenceTypes';
import type { SentenceEditorContext } from './ValueEditorOverlay';

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
  onSelect: Mock<(selection: SentenceSelection | null) => void>;
  onStartEdit: Mock<DecisionTextEdit['onStartEdit']>;
  onCommit: Mock<DecisionTextEdit['onCommit']>;
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
        conditionEntries: (rowId) => conditionEntries?.(rowId, setEditing) ?? [],
        onStartEdit: (value) => {
          spies.onStartEdit(value);
          setEditing(value);
        },
        onCommit: (value, text, move) => {
          spies.onCommit(value, text, move);
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

const renderEditing = (props: Omit<EditingHostProps, 'spies'> = {}) => {
  const spies: EditSpies = {
    onSelect: vi.fn(),
    onStartEdit: vi.fn(),
    onCommit: vi.fn(),
    onCancel: vi.fn(),
    onClearCell: vi.fn(),
  };
  const rendered = render(<EditingHost spies={spies} {...props} />);
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
      const line = (columnId: string) =>
        card('m1').querySelector<HTMLElement>(`li[data-column-id="${columnId}"]`);
      expect(line('score')).toHaveTextContent(/^Matched/);
      expect(line('debt')).toHaveTextContent(/^Not matched/);
      expect(line('country')).not.toHaveTextContent(/matched/i);
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

    it('moves a row with ↓ and ↑, keeping the column where the row has it', () => {
      startAt({ rowId: 'r1', columnId: 'income' });
      expect(walk('ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowUp', 'ArrowUp')).toEqual([
        'r2:income',
        'r3',
        'r3',
        'r2',
        'r1',
      ]);
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

    it('returns focus to the view when the focused row is removed', () => {
      const { rerender } = renderSelectable();
      fireEvent.click(valueChip('r2', 'age'));
      rerender(<Selectable rules={GRID_SENTENCE_RULES.filter(({ rowId }) => rowId !== 'r2')} />);
      expect(document.activeElement).toBe(screen.getByTestId('nl'));
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

    it('scrolls on to a cell its row scrolled past, and to the top of a rule taller than the view', () => {
      renderSelectable();
      const frame = screen.getByTestId('nl');
      Object.defineProperty(frame, 'clientHeight', { value: 100 });
      const chip = valueChip('r3', 'age');
      vi.spyOn(chip, 'getBoundingClientRect').mockReturnValue({
        ...rect(0, 40),
        top: 300,
        bottom: 324,
      });
      fireEvent.click(chip);
      const rowEnd = sentenceRuleOffsets(GRID_SENTENCE_RULES)[3] ?? 0;
      expect(frame.scrollTop).toBe(rowEnd - 100 + 224);
      vi.spyOn(card('r1'), 'getBoundingClientRect').mockReturnValue({
        ...rect(0, 400),
        top: 20,
        bottom: 370,
      });
      fireEvent.click(within(card('r1')).getByText('when'));
      expect(frame.scrollTop).toBe(20);
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

    it('starts editing the first value of a selected cell on Enter or F2, never on a rule or mid-composition', () => {
      const { onStartEdit } = renderEditing({ initial: { rowId: 'r2', columnId: 'age' } });
      act(() => valueChip('r2', 'age').focus());
      expect(press('Enter')).toBe(false);
      press('Escape');
      expect(press('F2')).toBe(false);
      expect(onStartEdit.mock.calls).toEqual([[r2Age(0)], [r2Age(0)]]);
      press('Escape');
      press('Enter', { isComposing: true });
      press('Home');
      expect(focusedStop()).toBe('r2');
      press('Enter');
      press('F2');
      expect(onStartEdit).toHaveBeenCalledTimes(2);
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

    it("hands the host's editor the value it edits and the edit's commit", () => {
      const contexts: SentenceEditorContext[] = [];
      const renderEditor = (context: SentenceEditorContext) => {
        contexts.push(context);
        return <textarea aria-label={context.ariaLabel} defaultValue={context.value} />;
      };
      const { onCommit } = renderEditing({ initialEditing: r2Age(1), renderEditor });
      expect(screen.queryByTestId('nl-editor')).toBeNull();
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

    it("opens the host's add-condition entries from +, and edits a condition the rule lacks under it", () => {
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
      vi.spyOn(add, 'getBoundingClientRect').mockReturnValue({
        ...rect(300, 324),
        top: 130,
        bottom: 154,
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
          onCommit: (value, text) => {
            setTable((current) =>
              text === '' ? tableWithoutCell(current, value) : tableWithValue(current, value, text)
            );
            setEditing(null);
          },
          onClearCell: (cell) => setTable((current) => tableWithoutCell(current, cell)),
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
      onDeleteRule?: (rowId: string) => void;
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

    it('keeps a read-only link in the tab order, and the input plain without onOpenDecision', () => {
      const props = { rules: linkedRules, onOpenDecision: vi.fn() };
      const { rerender } = renderView(props);
      expect(link('r1')).not.toHaveAttribute('tabindex');
      rerender(view({ ...props, onOpenDecision: undefined }));
      expect(screen.queryByRole('button', { name: 'Open the income decision' })).toBeNull();
    });
  });
});
