import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import {
  bandGeometry,
  buildRowPreview,
  dragShiftPx,
  dropIndex,
  gapStartPx,
  slotForCopy,
  usePressDrag,
} from './useDragReorder';

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
      out.push(items[from]!);
    }
    if (index !== from) {
      out.push(item);
    }
  });
  if (boundary === items.length) {
    out.push(items[from]!);
  }
  return out;
};

/** The array move a consumer performs with `dropIndex`'s result. */
const moveItem = <T>(items: T[], from: number, to: number): T[] => {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
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

describe('slotForCopy', () => {
  const rows = { offsetOf: (index: number) => index * 30, sizeAt: () => 30 };

  it("swaps once the copy's centre enters a neighbour, whichever way it moves", () => {
    // Row 2 lifted to row 1's top: its centre is inside row 1, so it drops there (slot 1).
    expect(slotForCopy(2, 30, 5, rows.offsetOf, rows.sizeAt)).toBe(1);
    // Row 0 moved down a full row: it lands after row 1 (slot 2).
    expect(slotForCopy(0, 30, 5, rows.offsetOf, rows.sizeAt)).toBe(2);
    // Half a row is where it turns: just short stays home, just past swaps.
    expect(slotForCopy(0, 14, 5, rows.offsetOf, rows.sizeAt)).toBe(0);
    expect(slotForCopy(0, 15, 5, rows.offsetOf, rows.sizeAt)).toBe(2);
  });

  it('stays home at rest, and clamps to the ends', () => {
    expect(slotForCopy(2, 60, 5, rows.offsetOf, rows.sizeAt)).toBe(2);
    expect(slotForCopy(2, -500, 5, rows.offsetOf, rows.sizeAt)).toBe(0);
    expect(slotForCopy(2, 5000, 5, rows.offsetOf, rows.sizeAt)).toBe(5);
  });

  it("measures columns of unequal width by their own spans, not the pointer's", () => {
    // [0..300) [300..400) [400..500): the wide first column needs only reach the second.
    const widths = [300, 100, 100];
    const offsetOf = (index: number) => widths.slice(0, index).reduce((a, b) => a + b, 0);
    const sizeAt = (index: number) => widths[index]!;
    // Its centre (copy left + 150) passing 300 swaps it with the second column.
    expect(slotForCopy(0, 149, 3, offsetOf, sizeAt)).toBe(0);
    expect(slotForCopy(0, 150, 3, offsetOf, sizeAt)).toBe(2);
  });

  it("splits a band's first column at its own span, without the separator before it", () => {
    // `bandGeometry` drops the separator, so the band's offsets start at its first column.
    const offsets = [0, 100, 200, 330, 430];
    const band = bandGeometry(offsets, () => 100, 2);
    // b1 lifted to 40: its centre (90) is inside b0, so it drops before it; at 60 it is past b0.
    expect(slotForCopy(1, 40, 2, band.offsetOf, band.sizeAt)).toBe(0);
    expect(slotForCopy(1, 60, 2, band.offsetOf, band.sizeAt)).toBe(1);
  });
});

// Checked against where the reorder itself puts each unit, so a shift is exactly the move the drop makes.
describe('dragShiftPx and gapStartPx', () => {
  const sizes = [40, 10, 25, 60, 15];
  const offsetIn = (order: number[], index: number) =>
    order.slice(0, index).reduce((sum, unit) => sum + sizes[unit]!, 0);
  const units = sizes.map((_, index) => index);
  const sizeAt = (index: number) => sizes[index]!;
  const offsetAt = (index: number) => offsetIn(units, index);

  it('moves every unit by where the drop puts it, for every from/to pair', () => {
    for (const from of units) {
      for (const to of units) {
        const after = moveItem(units, from, to);
        for (const unit of units) {
          const shift = dragShiftPx(unit, from, to, sizeAt);
          expect(shift).toBe(offsetIn(after, after.indexOf(unit)) - offsetIn(units, unit));
        }
      }
    }
  });

  it('opens the gap where the dragged unit lands', () => {
    for (const from of units) {
      for (const to of units) {
        const after = moveItem(units, from, to);
        expect(gapStartPx(from, to, offsetAt, sizeAt)).toBe(offsetIn(after, to));
      }
    }
  });
});

describe('bandGeometry', () => {
  // Two inputs (100, 80), then a 30px separator charged to the first output's span, then outputs (60, 40).
  const widths = [100, 80, 60, 40];
  const offsets = [0, 100, 180, 270, 310];
  const columnWidth = (dataIndex: number) => widths[dataIndex]!;

  it('starts a band past the separator before it, and measures its columns without it', () => {
    const outputs = bandGeometry(offsets, columnWidth, 2);

    expect(outputs.left).toBe(210);
    expect([0, 1, 2].map(outputs.offsetOf)).toEqual([0, 60, 100]);
    expect([0, 1].map(outputs.sizeAt)).toEqual([60, 40]);
  });

  it('reads a band with no separator before it as its offsets', () => {
    const inputs = bandGeometry(offsets, columnWidth, 0);

    expect(inputs.left).toBe(0);
    expect([0, 1, 2].map(inputs.offsetOf)).toEqual([0, 100, 180]);
  });
});

// A MouseEvent carries the coordinates and buttons the listener reads.
const moveTo = (clientX: number, clientY: number) =>
  document.dispatchEvent(
    new MouseEvent('pointermove', { bubbles: true, clientX, clientY, buttons: 1 })
  );

describe('usePressDrag', () => {
  it('starts the drag on the first move past the threshold, and not on one inside it', () => {
    const start = vi.fn();
    const { result } = renderHook(() => usePressDrag([0]));

    result.current.press({ clientX: 10, clientY: 10 }, start);
    moveTo(12, 11);
    expect(start).not.toHaveBeenCalled();

    moveTo(20, 10);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['the window loses focus', () => window.dispatchEvent(new Event('blur'))],
    [
      'the page is hidden',
      () => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        document.dispatchEvent(new Event('visibilitychange'));
        Reflect.deleteProperty(document, 'visibilityState');
      },
    ],
  ])('disarms a pending press when %s, whose release it may never see', (_, leave) => {
    const start = vi.fn();
    const { result } = renderHook(() => usePressDrag([0]));

    result.current.press({ clientX: 10, clientY: 10 }, start);
    leave();
    moveTo(30, 10);

    expect(start).not.toHaveBeenCalled();
  });

  it('hands the drag the move that started it and where its press began', () => {
    const start = vi.fn(() => true);
    const { result } = renderHook(() => usePressDrag([0]));

    result.current.press({ clientX: 10, clientY: 10 }, start);
    moveTo(30, 12);

    expect(start).toHaveBeenCalledWith(
      expect.objectContaining({ clientX: 30, clientY: 12, press: { clientX: 10, clientY: 10 } })
    );
  });

  it('tells the click after a drag apart from a plain one, and clears on the next press', () => {
    const { result } = renderHook(() => usePressDrag([0]));

    result.current.press({ clientX: 10, clientY: 10 }, () => true);
    moveTo(30, 10);
    expect(result.current.clickWasDrag()).toBe(true);
    expect(result.current.clickWasDrag()).toBe(false);

    // A drag whose click went to another element, then a press that cannot drag: still a plain click.
    result.current.press({ clientX: 10, clientY: 10 }, () => true);
    moveTo(30, 10);
    result.current.press({ clientX: 10, clientY: 10 }, null);
    expect(result.current.clickWasDrag()).toBe(false);
  });

  it('leaves a press whose drag was refused a click', () => {
    const { result } = renderHook(() => usePressDrag([0]));

    result.current.press({ clientX: 10, clientY: 10 }, () => false);
    moveTo(30, 10);
    expect(result.current.clickWasDrag()).toBe(false);
  });

  it('disarms a press still armed when the component unmounts', () => {
    const start = vi.fn();
    const { result, unmount } = renderHook(() => usePressDrag([0]));

    result.current.press({ clientX: 10, clientY: 10 }, start);
    unmount();
    moveTo(40, 10);

    expect(start).not.toHaveBeenCalled();
  });

  it('disarms a press still armed when what was pressed moves to another position', () => {
    const start = vi.fn();
    const { result, rerender } = renderHook(({ index }) => usePressDrag([index]), {
      initialProps: { index: 3 },
    });

    result.current.press({ clientX: 10, clientY: 10 }, start);
    rerender({ index: 2 });
    moveTo(40, 10);

    expect(start).not.toHaveBeenCalled();
  });
});

describe('buildRowPreview', () => {
  const containerWith = (html: string) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container;
  };

  it('builds no row preview for a row that is not mounted', () => {
    const container = containerWith('<table><tbody><tr aria-rowindex="3"></tr></tbody></table>');

    expect(buildRowPreview(container, 9)).toBeNull();
    expect(buildRowPreview(container, 3)?.sources).toHaveLength(1);
  });

  it('strips the copy of ids, test ids and focus, and leaves the source untouched', () => {
    const container = containerWith(
      '<table aria-label="Rules" data-testid="grid"><tbody>' +
        '<tr aria-rowindex="3" id="r3"><td data-testid="cell"><button>x</button></td></tr>' +
        '</tbody></table>'
    );

    const preview = buildRowPreview(container, 3);

    expect(preview?.table.hasAttribute('inert')).toBe(true);
    expect(preview?.table.hasAttribute('aria-label')).toBe(false);
    expect(preview?.table.querySelectorAll('[id], [data-testid]')).toHaveLength(0);
    expect(container.querySelector('#r3 [data-testid="cell"]')).not.toBeNull();
  });
});
