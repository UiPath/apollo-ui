import { act, fireEvent, type RenderResult, render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { vi } from 'vitest';
import {
  CHANNEL,
  COUNTRY,
  channel,
  country,
  DECISION_TEXT_LABELS,
  GRID_SENTENCE_BANDS,
  GRID_SENTENCE_HEADER,
  GRID_SENTENCE_RULES,
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
import { DecisionText, type DecisionTextProps } from './DecisionText';
import type { RowMark, TableMarks } from './marks';
import { sentenceRuleOffsets } from './sentenceRuleHeights';
import type { SentenceRule, SentenceSelection, SentenceToken } from './sentenceTypes';

const view = (props: Partial<DecisionTextProps> = {}) => (
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
const renderView = (props: Partial<DecisionTextProps> = {}) => render(view(props));

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

interface SelectableProps extends Partial<DecisionTextProps> {
  initial?: SentenceSelection | null;
}

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
  if (element.dataset.kind === 'value') return `${rowId}:${element.dataset.columnId}`;
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
      const run = (value: (text: string) => SentenceToken, prefix: string, count: number) =>
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
              { columnId: 'age', kind: 'value', text: '18' },
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
      render(view({ selected: { rowId: 'm2', columnId: 'reason' }, onSelect: vi.fn() }));
      expect(valueChip('m2', 'reason')).toHaveTextContent(EMPTY_VALUE_DASH);
      expect(valueChip('m2', 'reason')).toHaveAccessibleName('Reason empty, rule 2');
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

    it('keeps a focused add-rule action in view after the rule it adds', () => {
      const AddingHost = () => {
        const [rules, setRules] = useState(() => manySentenceRules(3));
        const [selected, setSelected] = useState<SentenceSelection | null>(null);
        const onAdd = () => {
          setRules(manySentenceRules(rules.length + 1));
          setSelected({ rowId: `row-${rules.length}` });
        };
        return view({
          rules,
          selected,
          onSelect: setSelected,
          addRule: { label: 'Add rule', onAdd },
        });
      };
      render(<AddingHost />);
      const frame = screen.getByTestId('nl');
      Object.defineProperty(frame, 'clientHeight', { value: 100 });
      const add = screen.getByRole('button', { name: 'Add rule' });
      const footer = add.parentElement;
      if (!footer) throw new Error('no add-rule footer');
      vi.spyOn(footer, 'getBoundingClientRect').mockImplementation(() => {
        const listEnd = sentenceRuleOffsets(manySentenceRules(mountedRows().length)).at(-1) ?? 0;
        return {
          ...rect(0, 400),
          top: listEnd - frame.scrollTop,
          bottom: listEnd + 48 - frame.scrollTop,
        };
      });
      for (const added of [3, 4]) {
        add.focus();
        fireEvent.click(add);
        expect(card(`row-${added}`)).toHaveAttribute('tabindex', '0');
        expect(document.activeElement).toBe(add);
        expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(100);
      }
    });

    it('scrolls a rule the host selects out from under the sticky header', () => {
      const rules = manySentenceRules(2000);
      const { rerender } = render(view({ rules, onSelect: vi.fn() }));
      Object.defineProperty(screen.getByTestId('nl-header'), 'offsetHeight', { value: 33 });
      const top = sentenceRuleOffsets(rules)[100] ?? 0;
      act(() => scrollTo(top - 10));
      rerender(view({ rules, selected: { rowId: 'row-100' }, onSelect: vi.fn() }));
      expect(screen.getByTestId('nl').scrollTop).toBe(top - 33);
    });
  });
});
