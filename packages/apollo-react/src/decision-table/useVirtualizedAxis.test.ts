import { act, renderHook } from '@testing-library/react';
import { useVirtualizedAxis, windowSegments } from './useVirtualizedAxis';

type Segments = ReturnType<typeof windowSegments>;

const offsetsFor = (widths: number[]): number[] =>
  widths.reduce<number[]>(
    (offsets, width) => {
      offsets.push(offsets[offsets.length - 1]! + width);
      return offsets;
    },
    [0]
  );

const mountsItem = (segments: Segments, index: number): boolean =>
  segments.some(
    (segment) => segment.type === 'items' && segment.from <= index && index < segment.to
  );

describe('useVirtualizedAxis (virtual-core binding)', () => {
  it('re-measures when the offsets change, so the window follows resized geometry', () => {
    // The core caches item measurements and estimateSize is NOT one of its invalidation deps —
    // without the explicit measure() on offsets change, the scroll→index math keeps the old
    // widths and the window lands on the wrong columns after a resize.
    const element = document.createElement('div');
    document.body.appendChild(element);
    try {
      const wide = offsetsFor(new Array<number>(100).fill(200));
      const narrow = offsetsFor(new Array<number>(100).fill(100));
      const { result, rerender } = renderHook(
        ({ offsets }: { offsets: number[] }) =>
          useVirtualizedAxis(100, 200, null, {
            axis: 'horizontal',
            overscanItems: 4,
            fallbackViewportPx: 400,
            leadingFixedPx: 0,
            itemOffsetsPx: offsets,
          }),
        { initialProps: { offsets: wide } }
      );
      result.current.measureRef(element);
      rerender({ offsets: wide });

      // At 200px items, offset 10000 is item 50.
      act(() => {
        element.scrollLeft = 10_000;
        element.dispatchEvent(new Event('scroll'));
      });
      expect(mountsItem(result.current.segments, 50)).toBe(true);

      // Halve every width: the same content position now lives at half the offset. Under stale
      // measurements the core would translate 5000px with the old 200px items (item 25).
      rerender({ offsets: narrow });
      act(() => {
        element.scrollLeft = 5_000;
        element.dispatchEvent(new Event('scroll'));
      });
      expect(mountsItem(result.current.segments, 50)).toBe(true);
      expect(mountsItem(result.current.segments, 25)).toBe(false);
    } finally {
      element.remove();
    }
  });
});

/**
 * The segment maths is the entire correctness of the row window: every row is either mounted or
 * accounted for by a spacer of exactly its height, in order, with no overlap. A one-row error
 * here shows up as the table visually jumping on every scroll.
 */
describe('windowSegments', () => {
  const HEIGHT = 29;

  it('covers a small table with a single run and no spacers', () => {
    expect(
      windowSegments({ itemCount: 5, itemSizePx: HEIGHT, start: 0, end: 5, retained: null })
    ).toEqual([{ type: 'items', from: 0, to: 5 }]);
  });

  it('stands in for the rows beyond the window with one spacer', () => {
    expect(
      windowSegments({ itemCount: 100, itemSizePx: HEIGHT, start: 0, end: 40, retained: null })
    ).toEqual([
      { type: 'items', from: 0, to: 40 },
      { type: 'spacer', sizePx: 60 * HEIGHT },
    ]);
  });

  it('brackets a mid-table window with spacers on both sides', () => {
    expect(
      windowSegments({ itemCount: 100, itemSizePx: HEIGHT, start: 40, end: 70, retained: null })
    ).toEqual([
      { type: 'spacer', sizePx: 40 * HEIGHT },
      { type: 'items', from: 40, to: 70 },
      { type: 'spacer', sizePx: 30 * HEIGHT },
    ]);
  });

  it('pins a row above the window at its true offset', () => {
    expect(
      windowSegments({ itemCount: 100, itemSizePx: HEIGHT, start: 40, end: 70, retained: 3 })
    ).toEqual([
      { type: 'spacer', sizePx: 3 * HEIGHT },
      { type: 'items', from: 3, to: 4 },
      { type: 'spacer', sizePx: 36 * HEIGHT },
      { type: 'items', from: 40, to: 70 },
      { type: 'spacer', sizePx: 30 * HEIGHT },
    ]);
  });

  it('pins a row below the window at its true offset', () => {
    expect(
      windowSegments({ itemCount: 100, itemSizePx: HEIGHT, start: 0, end: 30, retained: 90 })
    ).toEqual([
      { type: 'items', from: 0, to: 30 },
      { type: 'spacer', sizePx: 60 * HEIGHT },
      { type: 'items', from: 90, to: 91 },
      { type: 'spacer', sizePx: 9 * HEIGHT },
    ]);
  });

  it('does not duplicate a retained row that the window already holds', () => {
    expect(
      windowSegments({ itemCount: 100, itemSizePx: HEIGHT, start: 40, end: 70, retained: 50 })
    ).toEqual([
      { type: 'spacer', sizePx: 40 * HEIGHT },
      { type: 'items', from: 40, to: 70 },
      { type: 'spacer', sizePx: 30 * HEIGHT },
    ]);
  });

  it('pins the row adjacent to the window without a zero-height spacer between them', () => {
    expect(
      windowSegments({ itemCount: 100, itemSizePx: HEIGHT, start: 40, end: 70, retained: 70 })
    ).toEqual([
      { type: 'spacer', sizePx: 40 * HEIGHT },
      { type: 'items', from: 40, to: 70 },
      { type: 'items', from: 70, to: 71 },
      { type: 'spacer', sizePx: 29 * HEIGHT },
    ]);
  });

  it('returns nothing for an empty table', () => {
    expect(
      windowSegments({ itemCount: 0, itemSizePx: HEIGHT, start: 0, end: 0, retained: null })
    ).toEqual([]);
  });

  it('clamps out-of-contract ranges instead of letting rows vanish downstream', () => {
    // A negative start would reach the consumer's slice() as a wrap-around; an end past the table
    // and a pin outside it would fabricate items. All are callers' bugs, absorbed loudly here.
    expect(
      windowSegments({ itemCount: 10, itemSizePx: HEIGHT, start: -5, end: 20, retained: 40 })
    ).toEqual([{ type: 'items', from: 0, to: 10 }]);
  });

  it('sizes spacers from prefix sums when items vary in width', () => {
    // Items 0..4 sized 100, 200, 300, 400, 500.
    const offsetsPx = [0, 100, 300, 600, 1000, 1500];
    expect(
      windowSegments({
        itemCount: 5,
        itemSizePx: HEIGHT,
        start: 2,
        end: 4,
        retained: null,
        offsetsPx,
      })
    ).toEqual([
      { type: 'spacer', sizePx: 300 },
      { type: 'items', from: 2, to: 4 },
      { type: 'spacer', sizePx: 500 },
    ]);
  });

  it.each([
    [100, 0, 40, null],
    [100, 40, 70, 3],
    [100, 0, 30, 90],
    [1000, 500, 540, 0],
  ])('accounts for every row exactly once (rows=%i window=%i..%i pin=%p)', (rows, start, end, pin) => {
    const segments = windowSegments({
      itemCount: rows,
      itemSizePx: HEIGHT,
      start,
      end,
      retained: pin as number | null,
    });
    let cursor = 0;
    let accounted = 0;
    for (const segment of segments) {
      if (segment.type === 'spacer') {
        expect(segment.sizePx % HEIGHT).toBe(0);
        accounted += segment.sizePx / HEIGHT;
        cursor += segment.sizePx / HEIGHT;
      } else {
        // Runs appear in order and never overlap what came before.
        expect(segment.from).toBe(cursor);
        accounted += segment.to - segment.from;
        cursor = segment.to;
      }
    }
    expect(accounted).toBe(rows);
  });
});
