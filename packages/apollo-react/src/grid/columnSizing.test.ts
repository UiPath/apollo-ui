import { resizeColumnWidths, resolveColumnWidths, type SizedColumn } from './columnSizing';

// Reserved gutters as the decision table uses them: 88 (48 row-number + 40 add-column) when
// editable, 48 when read-only — passed here as plain reserved widths.
const cols = (...defaults: number[]): SizedColumn[] =>
  defaults.map((defaultWidth, index) => ({ id: `c${index}`, defaultWidth }));

describe('resolveColumnWidths', () => {
  it('returns one width per flexible column, excluding the gutters', () => {
    const widths = resolveColumnWidths({
      containerWidth: 0,
      columns: cols(200, 220, 220),
      overrides: {},
      reservedPx: 88,
    });
    expect(widths).toHaveLength(3);
  });

  it('splits surplus evenly across flexible columns, remainder to the last', () => {
    // gutters 88 + base 300 = 388; container 398 leaves 10 to split across 3 → 3,3,4.
    const widths = resolveColumnWidths({
      containerWidth: 398,
      columns: cols(100, 100, 100),
      overrides: {},
      reservedPx: 88,
    });
    expect(widths).toEqual([103, 103, 104]);
  });

  it('keeps an overridden column at its width and re-fits the rest to fill the container', () => {
    // c0 overridden to 200; the surplus (508 − 88 − 200 − 200 defaults = 20) fills the two others.
    const widths = resolveColumnWidths({
      containerWidth: 508,
      columns: cols(100, 100, 100),
      overrides: { c0: 200 },
      reservedPx: 88,
    });
    expect(widths).toEqual([200, 110, 110]);
  });

  it('leaves the table narrower than the container when every column is overridden', () => {
    const overrides = { c0: 100, c1: 100 };
    const widths = resolveColumnWidths({
      containerWidth: 1000,
      columns: cols(220, 220),
      overrides,
      reservedPx: 88,
    });
    expect(widths).toEqual([100, 100]);
  });

  it('uses base widths with no shrinking when the columns overflow the container', () => {
    const widths = resolveColumnWidths({
      containerWidth: 400,
      columns: cols(220, 220, 220),
      overrides: {},
      reservedPx: 88,
    });
    expect(widths).toEqual([220, 220, 220]);
  });

  it('reserves only what the caller passes, growing columns more with a smaller gutter', () => {
    const editable = resolveColumnWidths({
      containerWidth: 200,
      columns: cols(100),
      overrides: {},
      reservedPx: 88,
    });
    const readOnly = resolveColumnWidths({
      containerWidth: 200,
      columns: cols(100),
      overrides: {},
      reservedPx: 48,
    });
    // Editable reserves 88 of gutters (48 + 40) → 112; read-only reserves only 48 → 152.
    expect(editable).toEqual([112]);
    expect(readOnly).toEqual([152]);
  });

  it('never applies a stored width to a column that is not present', () => {
    // A deleted column's width lingers in storage; a recreated column gets a fresh UUID id, so it can
    // never match — it starts at its default rather than inheriting the old width.
    const widths = resolveColumnWidths({
      containerWidth: 0,
      columns: cols(220),
      overrides: { 'deleted-column-id': 300 },
      reservedPx: 88,
    });
    expect(widths).toEqual([220]);
  });
});

describe('resizeColumnWidths', () => {
  // Three columns filling a 508px container at 140 each (88 gutters + 3×140).
  const three = cols(100, 100, 100);
  const filled = { c0: 140, c1: 140, c2: 140 };

  it('shrinks only the columns to the right to keep the table filled', () => {
    const next = resizeColumnWidths(filled, three, 'c0', 200, {}, 508, 88);
    // c0 widened; c1 and c2 (to its right) give back their surplus to stay filled; total stays 508.
    expect(next).toEqual({ c0: 200, c1: 110, c2: 110 });
  });

  it('extends the table once the right columns are back at their default', () => {
    const next = resizeColumnWidths(filled, three, 'c0', 400, {}, 508, 88);
    // Nothing left to give past the defaults, so the right columns sit at 100 and the table overflows.
    expect(next).toEqual({ c0: 400, c1: 100, c2: 100 });
  });

  it('grows the right columns when a column is narrowed, to keep filling the container', () => {
    const next = resizeColumnWidths(filled, three, 'c0', 100, {}, 508, 88);
    expect(next).toEqual({ c0: 100, c1: 160, c2: 160 });
  });

  it("holds the columns to the left so a middle column's dragged edge stays put", () => {
    const next = resizeColumnWidths(filled, three, 'c1', 200, {}, 508, 88);
    // c0 (left) is untouched; only c2 (right) absorbs — here it falls to its default and the table extends.
    expect(next.c0).toBe(140);
    expect(next.c1).toBe(200);
  });

  it('clamps the dragged column to the minimum width', () => {
    const next = resizeColumnWidths(filled, three, 'c0', 10, {}, 508, 88);
    expect(next.c0).toBe(80);
  });

  it('does not shrink an overridden column to the right; only the flexible ones absorb', () => {
    const next = resizeColumnWidths(
      { c0: 140, c1: 140, c2: 300 },
      three,
      'c0',
      200,
      { c2: 300 },
      508,
      88
    );
    expect(next.c2).toBe(300); // pinned, untouched
    expect(next.c0).toBe(200);
  });

  it('just extends the table when the last column is dragged, since nothing is to its right', () => {
    const next = resizeColumnWidths(filled, three, 'c2', 260, {}, 508, 88);
    expect(next).toEqual({ c0: 140, c1: 140, c2: 260 });
  });

  it('floors a sub-minimum default at MIN_COLUMN_WIDTH, so the first touch of a handle moves nothing', () => {
    const widths = resolveColumnWidths({
      containerWidth: 0, // no surplus: base widths come through unfitted
      columns: [{ id: 'narrow', defaultWidth: 40 }],
      overrides: {},
      reservedPx: 0,
    });
    // Laid out exactly where the resize path's clamp would put it — no first-drag jump from 40 to 80.
    expect(widths).toEqual([80]);
  });
});
