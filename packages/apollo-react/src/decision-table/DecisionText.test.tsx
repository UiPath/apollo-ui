import { act, fireEvent, type RenderResult, render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { vi } from 'vitest';
import {
  CHANNEL,
  COUNTRY,
  channel,
  country,
  DECISION_TEXT_LABELS,
  MULTI_SENTENCE_BANDS,
  MULTI_SENTENCE_HEADER,
  MULTI_SENTENCE_RULES,
  manyColumnBands,
  manySentenceRules,
  valueList,
} from './__fixtures__/sentences.fixtures';
import { EMPTY_VALUE_DASH } from './constants';
import { DecisionText, type DecisionTextProps } from './DecisionText';
import type { RowMark, TableMarks } from './marks';
import { sentenceRuleOffsets } from './sentenceRuleHeights';
import type { SentenceRule, SentenceToken } from './sentenceTypes';

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
      expect(row.querySelector('[id$="-heading"]')?.textContent).toBe(
        'Decision is "approve" · Credit Limit is 25000 · Reason is "prime"'
      );
      expect(row.querySelector('[id$="-lead"]')?.textContent).toBe('when all of these are true:');
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
      const heading = card('m3').querySelector('[id$="-heading"]')?.parentElement;
      const lead = card('m3').querySelector('[id$="-lead"]')?.parentElement;
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
      const lead = card('m1').querySelector<HTMLElement>('[id$="-lead"]');
      const leadLine = lead?.parentElement;
      expect(leadLine?.querySelectorAll('[data-kind="value"]')).toHaveLength(41);
      expect(lead?.textContent).toMatch(
        /"C20"\+9,980 more and Channel is one of "K1", .*"K20"\+1 more and Age is greater than 18$/
      );
      const counts = [...(leadLine?.querySelectorAll<HTMLElement>('[data-more-values]') ?? [])];
      expect(
        counts.map((count) => [
          count.textContent,
          count.parentElement?.parentElement === leadLine,
          count.previousElementSibling?.classList.contains('truncate'),
          count.previousElementSibling?.textContent?.slice(-5),
        ])
      ).toEqual([
        ['+9,980 more', true, true, '"C20"'],
        ['+1 more', true, true, '"K20"'],
      ]);
      expect(counts[0]?.title).toMatch(
        /^"C21", "C22", .*"C40"… and Channel is one of "K1", .*"K20" and Age is greater than 18$/
      );
      expect(counts[1]?.title).toBe('"K21" and Age is greater than 18');
      expect(counts[1]?.nextElementSibling?.textContent).toBe(' and Age is greater than 18');
    });

    it('shows a clamped line in full as its title on hover, as a grid cell does', () => {
      renderView();
      const text = card('m3').querySelector<HTMLElement>('[id$="-lead"]');
      if (!text) throw new Error('lead');
      Object.defineProperty(text, 'scrollWidth', { value: 500 });
      Object.defineProperty(text, 'clientWidth', { value: 200 });
      fireEvent.mouseEnter(text);
      expect(text.title).toBe('when Credit Score is less than 600 and Channel is not "branch"');
    });

    it('keeps 50 band columns on one keyboard-scrollable list, named once by its caption', () => {
      renderView({ bands: manyColumnBands(50) });
      const inputs = screen.getByRole('list', { name: 'Inputs' });
      expect(within(inputs).getAllByRole('listitem')).toHaveLength(50);
      expect(inputs).toHaveAttribute('tabindex', '0');
      expect(inputs.previousElementSibling).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
