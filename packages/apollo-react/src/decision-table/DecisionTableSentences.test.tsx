import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { expectTypeOf, vi } from 'vitest';
import {
  CHANNEL,
  COUNTRY,
  channel,
  country,
  longValueListRow,
  MULTI_SENTENCE_BANDS,
  MULTI_SENTENCE_HEADER,
  MULTI_SENTENCE_ROWS,
  manyColumnBands,
  manySentenceRows,
  SENTENCE_LABELS,
} from './__fixtures__/sentences.fixtures';
import { EMPTY_VALUE_DASH } from './constants';
import { DecisionTableSentences, type DecisionTableSentencesProps } from './DecisionTableSentences';
import type { RowMark, TableMarks } from './marks';
import { sentenceRowOffsets } from './sentenceRowHeights';

const view = (props: Partial<DecisionTableSentencesProps> = {}) => (
  <DecisionTableSentences
    rows={MULTI_SENTENCE_ROWS}
    bands={MULTI_SENTENCE_BANDS}
    header={MULTI_SENTENCE_HEADER}
    labels={SENTENCE_LABELS}
    ariaLabel="Rules"
    dataTestId="nl"
    {...props}
  />
);
const renderView = (props: Partial<DecisionTableSentencesProps> = {}) => render(view(props));

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

describe('DecisionTableSentences', () => {
  describe('layout', () => {
    it('shows the header label and hint above the rows', () => {
      renderView();
      expect(screen.getByTestId('nl-header')).toHaveTextContent(
        'CollectReturns the matches as a list.'
      );
    });

    it('lists each band caption followed by its column names', () => {
      renderView();
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

    it('draws the lines of any row that has them', () => {
      const [, , inline] = MULTI_SENTENCE_ROWS;
      if (!inline) throw new Error('fixture');
      renderView({ rows: [{ ...inline, lines: [{ columnId: 'score', parts: ['extra'] }] }] });
      expect(card('m3').querySelector('ul')).toHaveTextContent('extra');
    });

    it('reads an always row as its heading and "in every case"', () => {
      renderView();
      expect(card('m5').textContent).toBe(
        'Decision is "decline" · Credit Limit is 0 · Reason is "no match"in every case'
      );
    });

    it('shows an empty value as the grid shows an empty cell', () => {
      renderView();
      expect(valueChip('m2', 'reason')).toHaveTextContent(EMPTY_VALUE_DASH);
    });

    it('numbers rows only when asked', () => {
      const { unmount } = renderView();
      expect(card('m1').textContent?.startsWith('Decision')).toBe(true);
      unmount();
      renderView({ numbered: true });
      expect(['m1', 'm2', 'm3', 'm4', 'm5'].map((rowId) => card(rowId).textContent?.[0])).toEqual([
        '1',
        '2',
        '3',
        '4',
        '5',
      ]);
    });

    it('tags each chip with its kind and column', () => {
      renderView();
      const kinds = [...card('m3').querySelectorAll<HTMLElement>('[data-kind]')].map(
        (chip) => `${chip.dataset.kind}:${chip.dataset.columnId}:${chip.textContent}`
      );
      expect(kinds).toEqual([
        'output:decision:Decision',
        'value:decision:"decline"',
        'output:limit:Credit Limit',
        'value:limit:0',
        'output:reason:Reason',
        'value:reason:"low score"',
        'input:score:Credit Score',
        'value:score:600',
        'input:channel:Channel',
        'value:channel:"branch"',
      ]);
    });
  });

  describe('accessibility', () => {
    it('names each row by its heading and lead, and counts it among all rows', () => {
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

    it('names each band list once, by its caption', () => {
      renderView();
      const inputs = screen.getByRole('list', { name: 'Inputs' });
      expect(inputs.previousElementSibling).toHaveAttribute('aria-hidden', 'true');
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

    it('announces each mark of a line once, in its own tone', () => {
      renderView({ marks: twoMarks });
      expect(card('m3')).toHaveAccessibleDescription('Warning: Overlaps row 1 Error: Not a number');
      const announcement = screen.getByText('Warning: Overlaps row 1');
      expect(announcement.closest('[hidden]')).not.toBeNull();
    });

    it('shows one glyph per line with the worst tone and every message', () => {
      renderView({ marks: twoMarks });
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
    it('reports the value chip under the pointer by its cell, and null when it leaves', () => {
      const onTokenHover = vi.fn();
      renderView({ onTokenHover });
      const chip = valueChip('m3', 'score');
      fireEvent.pointerOver(chip);
      fireEvent.pointerOut(chip, { relatedTarget: document.body });
      expect(onTokenHover.mock.calls).toEqual([[{ rowId: 'm3', columnId: 'score' }], [null]]);
    });

    it('reports nothing for a name chip or a band column', () => {
      const onTokenHover = vi.fn();
      renderView({ onTokenHover });
      const name = card('m3').querySelector('[data-kind="input"][data-column-id="score"]');
      const column = screen.getByTestId('nl-bands').querySelector('[data-column-id="score"]');
      if (!name || !column) throw new Error('chips');
      fireEvent.pointerOver(name);
      fireEvent.pointerOver(column);
      expect(onTokenHover).not.toHaveBeenCalled();
    });

    it('reports null when the hovered row is removed', () => {
      const onTokenHover = vi.fn();
      const { rerender } = renderView({ onTokenHover });
      fireEvent.pointerOver(valueChip('m1', 'score'));
      rerender(view({ onTokenHover, rows: [] }));
      expect(onTokenHover.mock.calls).toEqual([[{ rowId: 'm1', columnId: 'score' }], [null]]);
    });

    it('reports the cell a hovered chip stands for once a re-render rewords it', () => {
      const onTokenHover = vi.fn();
      const { rerender } = renderView({ onTokenHover });
      fireEvent.pointerOver(valueChip('m3', 'score'));
      const reworded = MULTI_SENTENCE_ROWS.map((row) =>
        row.rowId === 'm3'
          ? { ...row, lead: ['when ', CHANNEL, ' is not ', channel('"branch"')] }
          : row
      );
      rerender(view({ onTokenHover, rows: reworded }));
      expect(onTokenHover.mock.calls).toEqual([
        [{ rowId: 'm3', columnId: 'score' }],
        [{ rowId: 'm3', columnId: 'channel' }],
      ]);
    });

    it('reports null when scrolling unmounts the hovered row', () => {
      const onTokenHover = vi.fn();
      const rows = manySentenceRows(2000);
      renderView({ rows, onTokenHover });
      fireEvent.pointerOver(valueChip('row-0', 'decision'));
      act(() => scrollTo(sentenceRowOffsets(rows)[500] ?? 0));
      expect(screen.queryByTestId('nl-row-row-0')).toBeNull();
      expect(onTokenHover).toHaveBeenLastCalledWith(null);
    });

    it('reports null when it unmounts under the pointer', () => {
      const onTokenHover = vi.fn();
      const { unmount } = renderView({ onTokenHover });
      fireEvent.pointerOver(valueChip('m1', 'score'));
      unmount();
      expect(onTokenHover).toHaveBeenLastCalledWith(null);
    });

    it("keeps the host's own pointer handlers", () => {
      const onTokenHover = vi.fn();
      const onPointerOver = vi.fn();
      const onPointerOut = vi.fn();
      renderView({ onTokenHover, containerProps: { onPointerOver, onPointerOut } });
      fireEvent.pointerOver(valueChip('m3', 'score'));
      fireEvent.pointerOut(valueChip('m3', 'score'), { relatedTarget: document.body });
      expect(onTokenHover.mock.calls).toEqual([[{ rowId: 'm3', columnId: 'score' }], [null]]);
      expect(onPointerOver).toHaveBeenCalledTimes(1);
      expect(onPointerOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('empty state', () => {
    it('keeps the header and bands and offers the add action', () => {
      const onAddRow = vi.fn();
      renderView({ rows: [], addRow: { label: 'Add rule', onAdd: onAddRow } });
      const empty = screen.getByTestId('nl-empty');
      expect(empty).toHaveTextContent('No rules yet');
      fireEvent.click(within(empty).getByRole('button', { name: 'Add rule' }));
      expect(onAddRow).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('nl-header')).toBeInTheDocument();
      expect(screen.getByTestId('nl-bands')).toBeInTheDocument();
    });

    it('offers no add action without addRow', () => {
      renderView({ rows: [] });
      expect(within(screen.getByTestId('nl-empty')).queryByRole('button')).toBeNull();
    });

    it('takes an add action only with its label', () => {
      expectTypeOf<{ onAdd: () => void }>().not.toExtend<
        NonNullable<DecisionTableSentencesProps['addRow']>
      >();
    });

    it('lets a wrapper forward every prop but its testid', () => {
      expectTypeOf<
        Omit<DecisionTableSentencesProps, 'dataTestId'> & { dataTestId: string }
      >().toExtend<DecisionTableSentencesProps>();
    });
  });

  describe('windowing', () => {
    it('mounts only the viewport and overscan of 20,000 rows, with a spacer for the rest', () => {
      const rows = manySentenceRows(20_000);
      renderView({ rows });
      const mounted = mountedRows();
      expect(mounted.map((row) => row.dataset.rowId)).toEqual(
        Array.from({ length: mounted.length }, (_, index) => `row-${index}`)
      );
      expect(mounted).toHaveLength(17);
      expect(mounted[0]).toHaveAttribute('aria-setsize', '20000');
      const spacer = mounted.at(-1)?.nextElementSibling;
      expect(spacer).toBe(screen.getByTestId('nl-row-spacer'));
      expect(spacer).toHaveAttribute('aria-hidden', 'true');
      const offsets = sentenceRowOffsets(rows);
      expect(spacer).toHaveStyle({
        height: `${(offsets[20_000] ?? 0) - (offsets[mounted.length] ?? 0)}px`,
      });
    });

    it('keeps the mounted rows when the leading spacer appears', () => {
      const rows = manySentenceRows(2000);
      renderView({ rows });
      const before = card('row-15');
      act(() => scrollTo(sentenceRowOffsets(rows)[12] ?? 0));
      expect(screen.getAllByTestId('nl-row-spacer')).toHaveLength(2);
      expect(card('row-15')).toBe(before);
    });
  });

  describe('at scale', () => {
    const countryLine = () => {
      const line = card('long-list').querySelector<HTMLElement>('li[data-column-id="country"]');
      if (!line) throw new Error('line');
      return line;
    };

    it('renders the first 20 values of a 10,000-value line and counts the rest outside the clamp', () => {
      renderView({ rows: [longValueListRow(10_000)] });
      const line = countryLine();
      expect(line.querySelectorAll('[data-kind="value"]')).toHaveLength(20);
      const more = line.querySelector<HTMLElement>('[data-more-values]');
      expect(more).toHaveTextContent('+9,980 more');
      expect(more?.parentElement).toBe(line);
      expect(more?.previousElementSibling?.textContent).toMatch(/"Country 20"$/);
    });

    it('titles the count with the next 20 hidden values only', () => {
      renderView({ rows: [longValueListRow(10_000)] });
      const more = countryLine().querySelector<HTMLElement>('[data-more-values]');
      expect(more?.title).toBe(
        `${Array.from({ length: 20 }, (_, index) => `"Country ${index + 21}"`).join(', ')}…`
      );
    });

    it('keeps the words after the last value of a clamped line, and titles the count with them', () => {
      const texts = Array.from({ length: 10_000 }, (_, index) => `"C${index + 1}"`);
      const values = texts.flatMap((text, index) =>
        index === 0 ? [country(text)] : [', ', country(text)]
      );
      const [first] = MULTI_SENTENCE_ROWS;
      if (!first) throw new Error('fixture');
      renderView({
        rows: [{ ...first, lines: [{ columnId: 'country', parts: [...values, ' ← ', COUNTRY] }] }],
      });
      const line = card('m1').querySelector<HTMLElement>('li[data-column-id="country"]');
      expect(line?.querySelector('[data-kind="input"]')).toHaveTextContent('Country');
      expect(line?.querySelector('[data-more-values]')?.getAttribute('title')).toBe(
        `${texts.slice(20, 40).join(', ')}… ← Country`
      );
    });

    it('keeps hover and marks on the values it shows', () => {
      const onTokenHover = vi.fn();
      renderView({
        rows: [longValueListRow(10_000)],
        onTokenHover,
        marks: rowMarks({
          'long-list': { cells: { country: { tone: 'error', title: 'Too many', glyph: true } } },
        }),
      });
      const [first] = countryLine().querySelectorAll<HTMLElement>('[data-kind="value"]');
      if (!first) throw new Error('value');
      expect(first).toHaveAttribute('data-mark-title', 'Too many');
      fireEvent.pointerOver(first);
      expect(onTokenHover).toHaveBeenCalledWith({ rowId: 'long-list', columnId: 'country' });
      expect(countryLine().lastElementChild?.querySelector('[data-glyph="error"]')).not.toBeNull();
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

    it('keeps 50 band columns on one keyboard-scrollable list', () => {
      renderView({ bands: manyColumnBands(50) });
      const inputs = screen.getByRole('list', { name: 'Inputs' });
      expect(within(inputs).getAllByRole('listitem')).toHaveLength(50);
      expect(inputs).toHaveAttribute('tabindex', '0');
    });
  });
});
