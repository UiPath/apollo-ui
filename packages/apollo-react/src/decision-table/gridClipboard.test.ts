import { copyRangeMatrix, planRangeClear, planRangePaste } from './gridClipboard';
import type { GridRange } from './gridTypes';

/** A 3×4 grid reading "r{row}c{col}". Column 2 accepts no write; column 3 blanks to "-". */
const fakeModel = (overrides: Partial<Parameters<typeof planRangePaste>[0]> = {}) => ({
  rowCount: 3,
  columnCount: 4,
  textAt: (row: number, col: number) => `r${row}c${col}`,
  canWriteAt: (_row: number, col: number) => col !== 2,
  blankTextAt: (col: number) => (col === 3 ? '-' : ''),
  ...overrides,
});

const range = (top: number, left: number, bottom: number, right: number): GridRange => ({
  anchor: { row: top, col: left },
  focus: { row: bottom, col: right },
});

describe('copyRangeMatrix', () => {
  it('reads the block row-major, whatever direction it was dragged in', () => {
    const expected = [
      ['r0c1', 'r0c2'],
      ['r1c1', 'r1c2'],
    ];
    expect(copyRangeMatrix(fakeModel(), range(0, 1, 1, 2))).toEqual(expected);
    // Dragged bottom-right to top-left: the same rectangle, so the same matrix.
    expect(copyRangeMatrix(fakeModel(), range(1, 2, 0, 1))).toEqual(expected);
  });

  it('reads a column that accepts no write, so a copy carries what the user sees', () => {
    expect(copyRangeMatrix(fakeModel(), range(0, 2, 0, 2))).toEqual([['r0c2']]);
  });
});

describe('planRangePaste', () => {
  it("anchors the block at the range's top-left", () => {
    const plan = planRangePaste(fakeModel(), range(1, 0, 1, 0), [['a', 'b']]);
    expect(plan.writes).toEqual([
      { row: 1, col: 0, text: 'a' },
      { row: 1, col: 1, text: 'b' },
    ]);
    expect(plan).toMatchObject({
      appendRows: 0,
      clampedRows: 0,
      clampedColumns: 0,
      skippedCells: 0,
    });
  });

  it('fills the whole selection when a single cell was copied', () => {
    const plan = planRangePaste(fakeModel(), range(0, 0, 1, 1), [['X']]);
    expect(plan.writes).toEqual([
      { row: 0, col: 0, text: 'X' },
      { row: 0, col: 1, text: 'X' },
      { row: 1, col: 0, text: 'X' },
      { row: 1, col: 1, text: 'X' },
    ]);
  });

  it('leaves a single cell pasted over a single cell alone', () => {
    expect(planRangePaste(fakeModel(), range(0, 0, 0, 0), [['X']]).writes).toEqual([
      { row: 0, col: 0, text: 'X' },
    ]);
  });

  // The block lands around an unwritable position rather than failing or shifting columns across.
  it('skips a cell landing where nothing can be written, and lands the rest around it', () => {
    const plan = planRangePaste(fakeModel(), range(0, 1, 0, 1), [['a', 'b', 'c']]);
    expect(plan.writes).toEqual([
      { row: 0, col: 1, text: 'a' },
      { row: 0, col: 3, text: 'c' },
    ]);
    expect(plan.skippedCells).toBe(1);
  });

  it('counts a skipped column once per row it covers', () => {
    const plan = planRangePaste(fakeModel(), range(0, 2, 0, 2), [['a'], ['b'], ['c']]);
    expect(plan.writes).toEqual([]);
    expect(plan.skippedCells).toBe(3);
  });

  it('clamps rows and columns that do not fit, reporting both', () => {
    const plan = planRangePaste(fakeModel(), range(2, 3, 2, 3), [
      ['a', 'b'],
      ['c', 'd'],
    ]);
    expect(plan.writes).toEqual([{ row: 2, col: 3, text: 'a' }]);
    expect(plan).toMatchObject({ clampedRows: 1, clampedColumns: 1 });
  });

  it("appends rows in grow mode, capped by the model's limit, reporting the rest as clamped", () => {
    const block = [['a'], ['b'], ['c'], ['d'], ['e']];
    // Anchored on the last row: one row fits, and the model allows two appends.
    const plan = planRangePaste(fakeModel({ maxAppendRows: 2 }), range(2, 0, 2, 0), block, {
      grow: true,
    });
    expect(plan.appendRows).toBe(2);
    expect(plan.writes.map((write) => write.row)).toEqual([2, 3, 4]);
    expect(plan.clampedRows).toBe(2);
  });

  it('never grows a model that declares no limit, however the caller asks', () => {
    const plan = planRangePaste(fakeModel(), range(2, 0, 2, 0), [['a'], ['b']], { grow: true });
    expect(plan.appendRows).toBe(0);
    expect(plan.clampedRows).toBe(1);
  });

  it('survives a block wider than the argument limit of a spread', () => {
    // `Math.max(...row)` over a spreadsheet-width row throws; the planner reduces instead.
    const wide = [Array.from({ length: 200_000 }, (_unused, index) => String(index))];
    expect(() => planRangePaste(fakeModel(), range(0, 0, 0, 0), wide)).not.toThrow();
    expect(planRangePaste(fakeModel(), range(0, 0, 0, 0), wide).clampedColumns).toBe(200_000 - 4);
  });

  it('treats a leading empty row as data, not as an empty block', () => {
    const plan = planRangePaste(fakeModel(), range(0, 0, 0, 0), [[], ['a']]);
    expect(plan.writes).toEqual([{ row: 1, col: 0, text: 'a' }]);
  });

  it('skips a hole in a ragged block instead of writing undefined', () => {
    const plan = planRangePaste(fakeModel(), range(0, 0, 0, 0), [['a'], ['b', 'c']]);
    expect(plan.writes).toEqual([
      { row: 0, col: 0, text: 'a' },
      { row: 1, col: 0, text: 'b' },
      { row: 1, col: 1, text: 'c' },
    ]);
  });

  it('returns nothing for a genuinely empty block', () => {
    expect(planRangePaste(fakeModel(), range(0, 0, 0, 0), [])).toMatchObject({
      writes: [],
      clampedRows: 0,
      clampedColumns: 0,
    });
    expect(planRangePaste(fakeModel(), range(0, 0, 0, 0), [[], []]).writes).toEqual([]);
  });
});

describe('planRangeClear', () => {
  // A clear is a paste of blanks through the same `writeAt`, so it skips exactly what a paste skips.
  it("writes each column's own blank value and skips what accepts no write", () => {
    expect(planRangeClear(fakeModel(), range(0, 1, 0, 3))).toEqual([
      { row: 0, col: 1, text: '' },
      { row: 0, col: 3, text: '-' },
    ]);
  });

  it('never addresses a row or column past the end of the grid', () => {
    expect(planRangeClear(fakeModel(), range(2, 3, 9, 9))).toEqual([{ row: 2, col: 3, text: '-' }]);
  });
});
