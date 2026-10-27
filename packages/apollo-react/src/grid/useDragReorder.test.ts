import { columnBoundaryForX, dropIndex, rowBoundaryForY } from './useDragReorder';

/**
 * Where the drag must land, derived from what an insertion slot *means* rather than from slot
 * arithmetic: slot `boundary` is the gap before item `boundary` in the pre-move array. Walk the
 * original, emit the dragged item on reaching its gap, and skip it at its old home. Deliberately
 * shares no `- 1` with the code under test — a reference that reimplemented the formula would
 * agree with a broken one.
 */
const moveToSlot = <T>(items: T[], from: number, boundary: number): T[] => {
  const out: T[] = [];
  items.forEach((item, index) => {
    if (index === boundary) {
      out.push(items[from]);
    }
    if (index !== from) {
      out.push(item);
    }
  });
  if (boundary === items.length) {
    out.push(items[from]);
  }
  return out;
};

/** `moveItem` in decisionTableReducer, the sole consumer of `dropIndex`'s result. */
const moveItem = <T>(items: T[], from: number, to: number): T[] => {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

describe('dropIndex', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f'];

  // The whole from × boundary space, not a sample: the two candidate formulas agree on every
  // downward drag, so partial coverage is what let a wrong one pass the entire suite once.
  it('lands the drag where the insertion slot means, for every from/boundary pair', () => {
    const mismatches: string[] = [];
    items.forEach((_, from) => {
      for (let boundary = 0; boundary <= items.length; boundary++) {
        const actual = moveItem(items, from, dropIndex(from, boundary)).join('');
        const expected = moveToSlot(items, from, boundary).join('');
        if (actual !== expected) {
          mismatches.push(`from=${from} slot=${boundary}: expected ${expected}, got ${actual}`);
        }
      }
    });
    expect(mismatches).toEqual([]);
  });

  // Guards the `to !== from` contract at the call site: a drag that went nowhere must be
  // indistinguishable from no drag, or it reorders nothing while still dirtying the document.
  it('maps both no-op slots back to the source, so a drag that went nowhere dispatches nothing', () => {
    items.forEach((_, from) => {
      expect(dropIndex(from, from)).toBe(from);
      expect(dropIndex(from, from + 1)).toBe(from);
    });
  });

  it('subtracts one only for slots past the source, which is what removing it first shifts', () => {
    expect(dropIndex(0, 3)).toBe(2);
    expect(dropIndex(5, 2)).toBe(2);
    expect(dropIndex(0, items.length)).toBe(items.length - 1);
    expect(dropIndex(5, 0)).toBe(0);
  });
});

describe('rowBoundaryForY', () => {
  it('rounds to the nearest row slot and clamps to [0, rowCount]', () => {
    expect(rowBoundaryForY(0, 29, 10, 5)).toBe(0);
    expect(rowBoundaryForY(14, 29, 10, 5)).toBe(0); // below the midline of row 0
    expect(rowBoundaryForY(15, 29, 10, 5)).toBe(1); // past it
    expect(rowBoundaryForY(29 * 10 + 100, 29, 10, 5)).toBe(10); // past the last row clamps to the end slot
    expect(rowBoundaryForY(-50, 29, 10, 5)).toBe(0);
  });

  it('holds the previous boundary for a coordinate-less event (NaN)', () => {
    expect(rowBoundaryForY(Number.NaN, 29, 10, 5)).toBe(5);
  });
});

describe('columnBoundaryForX', () => {
  // Three columns of 100px: slots at 0, 100, 200, 300; midlines at 50, 150, 250.
  const offsets = [0, 100, 200, 300];

  it("picks the nearest slot by each column's midline", () => {
    expect(columnBoundaryForX(0, offsets, 3, 0, 3, 0)).toBe(0);
    expect(columnBoundaryForX(49, offsets, 3, 0, 3, 0)).toBe(0);
    expect(columnBoundaryForX(51, offsets, 3, 0, 3, 0)).toBe(1);
    expect(columnBoundaryForX(260, offsets, 3, 0, 3, 0)).toBe(3);
  });

  it('clamps into the dragged band and returns a band-space slot', () => {
    // Band [1, 3): a pointer over column 0 clamps to the band's start, in band space.
    expect(columnBoundaryForX(0, offsets, 3, 1, 3, 0)).toBe(0);
    expect(columnBoundaryForX(151, offsets, 3, 1, 3, 0)).toBe(1);
    // And past the band's end clamps to its last slot.
    expect(columnBoundaryForX(1000, offsets, 3, 0, 2, 0)).toBe(2);
  });

  it('holds the previous boundary for a coordinate-less event (NaN)', () => {
    expect(columnBoundaryForX(Number.NaN, offsets, 3, 0, 3, 2)).toBe(2);
  });
});
