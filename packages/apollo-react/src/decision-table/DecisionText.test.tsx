import {
  act,
  cleanup,
  fireEvent,
  type RenderResult,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type React from 'react';
import { useLayoutEffect, useState } from 'react';
import { onTestFinished, vi } from 'vitest';
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
import { SENTENCE_RULE_OVERSCAN } from './useRuleWindow';

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
/** Runs a host's answer a moment after the call that asked for it, as a host that saves first does. */
const later = (answer: () => void) => {
  void Promise.resolve().then(answer);
};
const settleLater = () => act(async () => {});
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
        bands: MULTI_SENTENCE_BANDS,
        header: MULTI_SENTENCE_HEADER,
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

    it('leaves focus on the rule the user is on after a click on an add-rule action that adds none', () => {
      const onAdd = vi.fn();
      const props = {
        rules: GRID_SENTENCE_RULES,
        bands: GRID_SENTENCE_BANDS,
        selected: { rowId: 'r1' },
        onSelect: vi.fn(),
        addRule: { label: 'Add rule', onAdd },
      };
      const { rerender } = render(view(props));
      act(() => card('r1').focus());
      fireEvent.click(screen.getByRole('button', { name: 'Add rule' }), { detail: 1 });
      rerender(view({ ...props, selected: { rowId: 'r1' } }));
      expect(onAdd).toHaveBeenCalledTimes(1);
      expect(focusedStop()).toBe('r1');
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

    it('keeps focus where it is when rules arrive after an add-rule action a host answered a moment later with none', async () => {
      const outside = document.body.appendChild(document.createElement('button'));
      onTestFinished(() => outside.remove());
      const props = {
        addRule: { label: 'Add rule', onAdd: vi.fn() },
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
          addRule: { label: 'Add rule', onAdd: () => (late ? later(add) : add()) },
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

    it('keeps 50 band columns on one list, named once by its caption', () => {
      renderView({ bands: manyColumnBands(50) });
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
      renderView({ bands: manyColumnBands(50) });
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
      const [inputBand, ...rest] = MULTI_SENTENCE_BANDS;
      if (!inputBand) throw new Error('no band');
      const grown = [
        { ...inputBand, columns: [...inputBand.columns, { id: 'age', name: 'Age' }] },
        ...rest,
      ];
      await act(async () => rerender(view({ bands: grown })));
      expect(inputs()).not.toHaveAttribute('tabindex');
      setWidths(inputs(), 700, 400);
      const added = within(inputs()).getAllByRole('listitem').at(-1);
      if (!added) throw new Error('no added column');
      resize(added);
      expect(inputs()).toHaveAttribute('tabindex', '0');
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

    it('names each cell stop by its column, values and row, as a group that Enter and Space leave to the host', () => {
      const onKeyDown = vi.fn();
      renderSelectable({
        initial: { rowId: 'r2', columnId: 'age' },
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

    it('takes no cell labels from a read-only view, and names a stop by its column and values without them', () => {
      const { cell: _cell, emptyValue: _emptyValue, ...readOnly } = DECISION_TEXT_LABELS;
      const namesWith = (labels: DecisionTextProps['labels']) => {
        const { unmount } = renderView({ labels });
        const names = mountedRows().map((row) => row.getAttribute('aria-label'));
        unmount();
        return names;
      };
      expect(namesWith(readOnly)).toEqual(namesWith(DECISION_TEXT_LABELS));
      renderSelectable({ labels: readOnly, initial: { rowId: 'r2', columnId: 'age' } });
      expect(valueChip('r2', 'age')).toHaveAccessibleName('age 25 and 60');
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

    it.each<[string, SentenceSelection, string]>([
      ['rule', { rowId: 'r2' }, 'LI'],
      ['cell', { rowId: 'r2', columnId: 'age' }, 'SPAN'],
    ])('marks the selected %s alone as current, without axe violations', async (_, initial, tag) => {
      const { container } = renderSelectable({ initial });
      const current = [...container.querySelectorAll('[aria-current]')];
      expect(
        current.map((element) => [element.tagName, element.getAttribute('aria-current')])
      ).toEqual([[tag, 'true']]);
      expect(current[0]).toBe(
        initial.columnId === undefined ? card('r2') : valueChip('r2', initial.columnId)
      );
      expect(await axe(container)).toHaveNoViolations();
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

    it('keeps the column a click lands on, not the one ↓ kept before it', () => {
      startAt({ rowId: 'r1', columnId: 'income' });
      expect(walk('ArrowDown', 'ArrowDown')).toEqual(['r2:income', 'r3']);
      fireEvent.click(valueChip('r1', 'age'), { detail: 1 });
      expect(focusedStop()).toBe('r1:age');
      expect(walk('ArrowDown', 'ArrowDown', 'ArrowUp')).toEqual(['r2:age', 'r3:age', 'r2:age']);
    });

    it('starts a new run of ↑ and ↓ from a click on the rule ↓ landed on', () => {
      startAt({ rowId: 'r1', columnId: 'income' });
      expect(walk('ArrowDown', 'ArrowDown')).toEqual(['r2:income', 'r3']);
      fireEvent.click(card('r3'), { detail: 1 });
      expect(focusedStop()).toBe('r3');
      expect(walk('ArrowUp')).toEqual(['r2']);
    });

    it('starts a new run of ↑ and ↓ from a click on a cell and then back on the rule ↓ landed on', () => {
      startAt({ rowId: 'r1', columnId: 'income' });
      expect(walk('ArrowDown', 'ArrowDown')).toEqual(['r2:income', 'r3']);
      fireEvent.click(valueChip('r3', 'age'), { detail: 1 });
      fireEvent.click(card('r3'), { detail: 1 });
      expect(walk('ArrowUp')).toEqual(['r2']);
    });

    it('starts a new run of ↑ and ↓ from a host select that leaves and returns to the rule ↓ landed on', () => {
      let hostSelect: (selection: SentenceSelection | null) => void = () => {};
      const Host = () => {
        const [selected, setSelected] = useState<SentenceSelection | null>({
          rowId: 'r1',
          columnId: 'income',
        });
        hostSelect = setSelected;
        return view({
          rules: GRID_SENTENCE_RULES,
          bands: GRID_SENTENCE_BANDS,
          header: GRID_SENTENCE_HEADER,
          selected,
          onSelect: setSelected,
        });
      };
      render(<Host />);
      act(() => valueChip('r1', 'income').focus());
      expect(walk('ArrowDown', 'ArrowDown')).toEqual(['r2:income', 'r3']);
      act(() => hostSelect({ rowId: 'r1' }));
      act(() => hostSelect({ rowId: 'r3' }));
      act(() => card('r3').focus());
      expect(walk('ArrowUp')).toEqual(['r2']);
    });

    it('starts a new run of ↑ and ↓ after Escape, from the rule a key enters on', () => {
      const [r1, r2, r3] = GRID_SENTENCE_RULES;
      if (!r1 || !r2 || !r3) throw new Error('no grid rules');
      renderSelectable({ rules: [r3, r1, r2], initial: { rowId: 'r1', columnId: 'income' } });
      act(() => valueChip('r1', 'income').focus());
      expect(walk('ArrowUp', 'Escape', 'ArrowDown', 'ArrowDown')).toEqual(['r3', 'nl', 'r3', 'r1']);
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

    it('leaves Tab and Shift+Tab on a stop to the browser, selecting nothing', () => {
      const { onSelect } = startAt({ rowId: 'r3', columnId: 'risk' });
      expect([
        press('Tab'),
        press('Tab', { shiftKey: true }),
        press('Tab', { altKey: true }),
      ]).toEqual([true, true, true]);
      expect(focusedStop()).toBe('r3:risk');
      expect(onSelect).not.toHaveBeenCalled();
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
      ['a rule', { rowId: 'r2' }, 'r2'],
      ['a cell', { rowId: 'r2', columnId: 'age' }, 'r2:age'],
    ])('lands Tab into the view on the selected stop with %s selected, and Tab or Shift+Tab from it leaves the view', async (_, initial, stop) => {
      const { onSelect } = renderSelectable({ initial, bands: [] });
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
      const { onSelect } = renderSelectable({ initial: { rowId: 'r2', columnId: 'age' } });
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
      const { onSelect } = renderSelectable({ initial: { rowId: 'r2', columnId: 'age' } });
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
      const { onSelect } = renderSelectable({ initial: { rowId: 'r2', columnId: 'age' } });
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
    ])('lands Tab into the view on the selected stop after %s', async (_, gesture) => {
      const { onSelect } = renderSelectable({ initial: { rowId: 'r2', columnId: 'age' } });
      const { before } = aroundView();
      gesture(screen.getByTestId('nl'), screen.getByTestId('nl-header'));
      act(() => before.focus());
      await tabs(1);
      expect(focusedStop()).toBe('r2:age');
      expect(onSelect).not.toHaveBeenCalled();
    });

    it.each([
      ['band lists that overflow', true],
      ['no bands', false],
    ])('moves Tab on from the view a press on its header leaves focused to the selected stop, past %s', async (_, overflowing) => {
      if (overflowing) overflowingBandLists();
      const { onSelect } = renderSelectable({
        initial: { rowId: 'r2', columnId: 'age' },
        ...(!overflowing && { bands: [] }),
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
      const { onSelect } = renderSelectable({ bands: [] });
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
      const props = { rules: GRID_SENTENCE_RULES, bands: GRID_SENTENCE_BANDS, onSelect };
      const { rerender } = render(view({ ...props, selected: { rowId: 'r2' } }), { container });
      const r2 = within(container).getByTestId('nl-row-r2');
      act(() => r2.focus());
      fireEvent.keyDown(r2, { key: 'ArrowRight' });
      expect(onSelect.mock.calls).toEqual([[{ rowId: 'r2', columnId: 'risk' }]]);
      act(() => outside.focus());
      rerender(view({ ...props, selected: { rowId: 'r2', columnId: 'risk' } }));
      expect(root.activeElement).toBe(outside);
    });

    it.each([
      ['ArrowRight', { rowId: 'r2', columnId: 'risk' }, 'r2:risk'],
      ['ArrowDown', { rowId: 'r3' }, 'r3'],
    ])('focuses where %s moves once the host applies the select a moment later, after rendering without it', async (key, expected, stop) => {
      const onSelect = vi.fn();
      const LateHost = () => {
        const [selected, setSelected] = useState<SentenceSelection | null>({ rowId: 'r2' });
        const [saving, setSaving] = useState(false);
        return view({
          rules: GRID_SENTENCE_RULES,
          bands: GRID_SENTENCE_BANDS,
          header: GRID_SENTENCE_HEADER,
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
          rowId: 'r1',
          columnId: 'income',
        });
        const [saving, setSaving] = useState(false);
        return view({
          rules: GRID_SENTENCE_RULES,
          bands: GRID_SENTENCE_BANDS,
          header: GRID_SENTENCE_HEADER,
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
      const props = { rules: GRID_SENTENCE_RULES, bands: GRID_SENTENCE_BANDS, onSelect: vi.fn() };
      const { rerender } = render(view({ ...props, selected: { rowId: 'r2' } }));
      act(() => card('r2').focus());
      press('ArrowRight');
      await settleLater();
      rerender(view({ ...props, selected: { rowId: 'r2' } }));
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
      const onPointerCancel = vi.fn();
      renderSelectable({
        initial: { rowId: 'r2' },
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

    it('leaves a rule partly in view where it is when a click on its value selects it', () => {
      const rules = manySentenceRules(30);
      renderSelectable({ rules, initial: { rowId: 'row-0' } });
      const frame = screen.getByTestId('nl');
      Object.defineProperty(frame, 'clientHeight', { value: 300 });
      const at = (sentenceRuleOffsets(rules)[10] ?? 0) - 300 + 40;
      act(() => scrollTo(at));
      const chip = valueChip('row-10', 'decision');
      fireEvent.pointerDown(chip);
      fireEvent.pointerUp(chip);
      fireEvent.click(chip, { detail: 1 });
      expect(focusedStop()).toBe('row-10:decision');
      expect(frame.scrollTop).toBe(at);
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
});
