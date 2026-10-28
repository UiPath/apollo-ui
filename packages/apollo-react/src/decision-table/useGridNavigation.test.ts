import {
  cellSelectionFeature,
  coreFeatures,
  createCoreRowModel,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { type EditGesture, type GridPosition, useGridNavigation } from './useGridNavigation';

/** Any table will do: the instance is only the store the selection rectangle lives in — the
 * ids the hook translates against are handed in below, so these tests stay pure translation. */
const FEATURES = tableFeatures({
  ...coreFeatures,
  cellSelectionFeature,
  coreRowModel: createCoreRowModel(),
});

const useBareTable = () =>
  useTable({
    features: FEATURES,
    data: [],
    columns: [],
    enableCellSelection: true,
    enableCellRangeSelection: true,
    autoResetCellSelection: false,
  });

const ids = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, index) => `${prefix}${index}`);

const useNavigation = (rows: number, cols: number) => {
  const table = useBareTable();
  return useGridNavigation({ table, rowIds: ids('rule', rows), colIds: ids('col', cols) });
};

describe('useGridNavigation', () => {
  it('selects and edits a position inside the grid', () => {
    const { result } = renderHook(() => useNavigation(3, 4));

    act(() => result.current.select({ row: 1, col: 2 }));
    expect(result.current.focus).toEqual({ row: 1, col: 2 });
    expect(result.current.editing).toBe(false);

    act(() => result.current.startEditAt({ row: 2, col: 3 }));
    expect(result.current.focus).toEqual({ row: 2, col: 3 });
    expect(result.current.editing).toBe(true);
  });

  it('puts the focus ring on the focus cell, but on no cell of a header or gutter gesture', () => {
    const { result } = renderHook(() => useNavigation(3, 4));

    act(() => result.current.select({ row: 1, col: 2 }));
    expect(result.current.focusRing).toEqual({ row: 1, col: 2 });

    act(() => result.current.selectRow(1));
    expect(result.current.focusRing).toBeNull();
  });

  describe('axisSelection', () => {
    it('names the axis a header or gutter gesture picked, and nothing for an ordinary cell', () => {
      const { result } = renderHook(() => useNavigation(3, 4));

      act(() => result.current.selectColumn(2));
      expect(result.current.axisSelection).toBe('column');
      // The whole axis is the unit, so there is no single cell to show or edit.
      expect(result.current.singleSelection).toBeNull();

      act(() => result.current.selectRow(1));
      expect(result.current.axisSelection).toBe('row');

      act(() => result.current.select({ row: 1, col: 2 }));
      expect(result.current.axisSelection).toBeNull();
      expect(result.current.singleSelection).toEqual({ row: 1, col: 2 });
    });

    it('focuses the near corner, so the keyboard moves from the cell beside the header', () => {
      const { result } = renderHook(() => useNavigation(400, 4));

      act(() => result.current.selectColumn(2));
      expect(result.current.focus).toEqual({ row: 0, col: 2 });
      expect(result.current.range).toEqual({
        anchor: { row: 399, col: 2 },
        focus: { row: 0, col: 2 },
      });

      act(() => result.current.selectRow(5));
      expect(result.current.focus).toEqual({ row: 5, col: 0 });
    });

    it('drops once an extend moves the rectangle, and on every other kind of selection', () => {
      const { result } = renderHook(() => useNavigation(3, 4));

      act(() => result.current.selectColumn(2));
      act(() => result.current.extendTo({ row: 2, col: 3 }));
      // Extending grows the gesture rather than replacing it — but the rectangle is no longer the
      // one the header made, so it stops reading as an axis.
      expect(result.current.axisSelection).toBeNull();

      for (const start of [
        () => result.current.selectAll(),
        () => result.current.startEditAt({ row: 0, col: 0 }),
        () => result.current.clear(),
      ]) {
        act(() => result.current.selectColumn(2));
        expect(result.current.axisSelection).toBe('column');
        act(start);
        expect(result.current.axisSelection).toBeNull();
      }
    });

    it('does not let a drag that rebuilds the same rectangle pass for the header gesture', () => {
      const { result } = renderHook(() => useNavigation(3, 4));

      act(() => result.current.selectColumn(2));
      expect(result.current.axisSelection).toBe('column');

      // The same rectangle, built by dragging top to bottom: the coordinates match, the gesture
      // does not. Anchoring the drag drops the axis, so extending back onto it cannot restore it.
      act(() => result.current.select({ row: 0, col: 2 }));
      act(() => result.current.extendTo({ row: 2, col: 2 }));
      expect(result.current.range).toEqual({
        anchor: { row: 0, col: 2 },
        focus: { row: 2, col: 2 },
      });
      expect(result.current.axisSelection).toBeNull();
    });
  });

  describe('Escape', () => {
    const escapeKey = () =>
      ({ key: 'Escape', preventDefault: vi.fn() }) as unknown as React.KeyboardEvent;

    it('drops the selection and reports the Escape', () => {
      const onEscape = vi.fn();
      const { result } = renderHook(() => {
        const table = useBareTable();
        return useGridNavigation(
          { table, rowIds: ids('rule', 3), colIds: ids('col', 4) },
          { onEscape }
        );
      });

      const event = escapeKey();
      act(() => result.current.selectColumn(2));
      act(() => result.current.onKeyDown(event));

      expect(result.current.range).toBeNull();
      expect(result.current.axisSelection).toBeNull();
      expect(onEscape).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('reports the Escape when this grid holds no selection', () => {
      const onEscape = vi.fn();
      const { result } = renderHook(() => {
        const table = useBareTable();
        return useGridNavigation(
          { table, rowIds: ids('rule', 3), colIds: ids('col', 4) },
          { onEscape }
        );
      });

      const event = escapeKey();
      act(() => result.current.onKeyDown(event));

      expect(onEscape).toHaveBeenCalledTimes(1);
      // Nothing here to clear, so the key is left to the host's own Escape.
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('leaves an open editor to cancel itself', () => {
      const { result } = renderHook(() => useNavigation(3, 4));

      act(() => result.current.startEditAt({ row: 1, col: 1 }));
      act(() => result.current.onKeyDown(escapeKey()));

      expect(result.current.editing).toBe(true);
      expect(result.current.focus).toEqual({ row: 1, col: 1 });
    });
  });

  it('reports no selection once the grid has no rows', () => {
    // A table can legitimately reach zero rules — the last row is deletable, and the parser
    // accepts an externally-authored table with none. Reporting row 0 there tells the formula
    // bar a cell is selected, so it stays enabled and silently discards what the user types.
    const { result, rerender } = renderHook(
      ({ rows }: { rows: number }) => useNavigation(rows, 4),
      { initialProps: { rows: 2 } }
    );

    act(() => result.current.select({ row: 1, col: 1 }));
    expect(result.current.focus).toEqual({ row: 1, col: 1 });

    rerender({ rows: 0 });
    expect(result.current.focus).toBeNull();
  });

  it('reports no selection once the grid has no columns', () => {
    const { result, rerender } = renderHook(
      ({ cols }: { cols: number }) => useNavigation(3, cols),
      { initialProps: { cols: 2 } }
    );

    act(() => result.current.select({ row: 1, col: 1 }));
    rerender({ cols: 0 });

    expect(result.current.focus).toBeNull();
  });

  it('drops a selection whose rule was deleted rather than re-pointing it at a neighbour', () => {
    // Ranges are stored as rule ids, and a rule id is unique and never reused. Where the
    // index-based predecessor clamped row 3 down onto row 0 — and had to re-clamp on store so a
    // regrown table did not resurrect it — a deleted rule now simply has no cell to select. The
    // user is not silently moved onto a rule they never picked, and nothing can come back.
    const { result, rerender } = renderHook(
      ({ rows }: { rows: number }) => useNavigation(rows, 4),
      { initialProps: { rows: 4 } }
    );

    act(() => result.current.select({ row: 3, col: 0 }));
    expect(result.current.focus).toEqual({ row: 3, col: 0 });

    rerender({ rows: 1 });
    expect(result.current.focus).toBeNull();

    rerender({ rows: 4 });
    expect(result.current.focus).toBeNull();
  });

  it('clamps a position handed in beyond the grid bounds', () => {
    const { result } = renderHook(() => useNavigation(2, 3));

    act(() => result.current.select({ row: 99, col: 99 }));
    expect(result.current.focus).toEqual({ row: 1, col: 2 });

    act(() => result.current.select({ row: -5, col: -5 }));
    expect(result.current.focus).toEqual({ row: 0, col: 0 });
  });

  it('moves the selection down on commit and closes the editor', () => {
    const { result } = renderHook(() => useNavigation(3, 3));

    act(() => result.current.startEditAt({ row: 0, col: 0 }));
    act(() => result.current.commitEdit('down'));

    expect(result.current.focus).toEqual({ row: 1, col: 0 });
    expect(result.current.editing).toBe(false);
  });

  it('moves right on commit and stops at the last column', () => {
    const { result } = renderHook(() => useNavigation(2, 2));

    act(() => result.current.select({ row: 0, col: 1 }));
    act(() => result.current.startEditAt({ row: 0, col: 1 }));
    act(() => result.current.commitEdit('right'));

    expect(result.current.focus).toEqual({ row: 0, col: 1 });
  });

  it('moves left on commit and stops at the first column', () => {
    const { result } = renderHook(() => useNavigation(2, 3));

    act(() => result.current.startEditAt({ row: 1, col: 1 }));
    act(() => result.current.commitEdit('left'));
    expect(result.current.focus).toEqual({ row: 1, col: 0 });
    expect(result.current.editing).toBe(false);

    act(() => result.current.startEditAt({ row: 1, col: 0 }));
    act(() => result.current.commitEdit('left'));
    expect(result.current.focus).toEqual({ row: 1, col: 0 });
  });

  it('keeps the selection and closes the editor when an edit is cancelled', () => {
    const { result } = renderHook(() => useNavigation(2, 2));

    act(() => result.current.startEditAt({ row: 1, col: 1 }));
    act(() => result.current.cancelEdit());

    expect(result.current.focus).toEqual({ row: 1, col: 1 });
    expect(result.current.editing).toBe(false);
  });

  it('extends a range from the anchor and reports both corners', () => {
    const { result } = renderHook(() => useNavigation(4, 4));

    act(() => result.current.select({ row: 1, col: 1 }));
    act(() => result.current.extendTo({ row: 3, col: 2 }));

    expect(result.current.range).toEqual({ anchor: { row: 1, col: 1 }, focus: { row: 3, col: 2 } });
    expect(result.current.focus).toEqual({ row: 3, col: 2 });
  });

  describe('typing', () => {
    const key = (init: Partial<React.KeyboardEvent> & { key: string }, isComposing = false) =>
      ({
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        nativeEvent: { isComposing },
        preventDefault: vi.fn(),
        ...init,
      }) as unknown as React.KeyboardEvent;

    const useTyping = (canEditAt?: (position: GridPosition, gesture: EditGesture) => boolean) => {
      const table = useBareTable();
      return useGridNavigation(
        { table, rowIds: ids('rule', 3), colIds: ids('col', 4) },
        { canEditAt }
      );
    };

    it("opens the selected cell's editor, leaving the keystroke for the browser to deliver into it", () => {
      const { result } = renderHook(() => useTyping());
      const event = key({ key: 'x' });

      act(() => result.current.select({ row: 1, col: 2 }));
      act(() => result.current.onKeyDown(event));

      expect(result.current.editing).toBe(true);
      expect(result.current.openedByTyping).toBe(true);
      expect(result.current.focus).toEqual({ row: 1, col: 2 });
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it("types into a range's focus cell alone", () => {
      const { result } = renderHook(() => useTyping());

      act(() => result.current.select({ row: 0, col: 0 }));
      act(() => result.current.extendTo({ row: 2, col: 1 }));
      act(() => result.current.onKeyDown(key({ key: '5' })));

      expect(result.current.range).toEqual({
        anchor: { row: 2, col: 1 },
        focus: { row: 2, col: 1 },
      });
      expect(result.current.editing).toBe(true);
    });

    it('starts on a character or a dead key, but not a Ctrl/Cmd chord, a named key or IME composition', () => {
      const { result } = renderHook(() => useTyping());
      act(() => result.current.select({ row: 0, col: 0 }));

      for (const ignored of [
        key({ key: 'c', metaKey: true }),
        key({ key: 'c', ctrlKey: true }),
        key({ key: 'k' }, true),
        key({ key: 'Shift' }),
      ]) {
        act(() => result.current.onKeyDown(ignored));
      }
      expect(result.current.editing).toBe(false);

      act(() => result.current.onKeyDown(key({ key: '@', ctrlKey: true, altKey: true })));
      expect(result.current.editing).toBe(true);

      act(() => result.current.cancelEdit());
      act(() => result.current.onKeyDown(key({ key: 'Dead' })));
      expect(result.current.editing).toBe(true);
    });

    it('takes an Alt character only on macOS, where Option types one and Ctrl+Option is a shortcut', () => {
      const platform = vi.spyOn(navigator, 'platform', 'get');
      try {
        const { result } = renderHook(() => useTyping());
        act(() => result.current.select({ row: 0, col: 0 }));

        platform.mockReturnValue('Win32');
        act(() => result.current.onKeyDown(key({ key: 'n', altKey: true })));
        expect(result.current.editing).toBe(false);

        platform.mockReturnValue('MacIntel');
        // macOS has no AltGr, so Ctrl+Option is a shortcut chord there.
        act(() => result.current.onKeyDown(key({ key: 'n', ctrlKey: true, altKey: true })));
        expect(result.current.editing).toBe(false);

        act(() => result.current.onKeyDown(key({ key: 'ø', altKey: true })));
        expect(result.current.editing).toBe(true);
      } finally {
        platform.mockRestore();
      }
    });

    it('asks whether the cell can be typed into, as distinct from opened by a command', () => {
      const canEditAt = vi.fn(
        (_position: GridPosition, gesture: EditGesture) => gesture === 'command'
      );
      const { result } = renderHook(() => useTyping(canEditAt));
      act(() => result.current.select({ row: 0, col: 1 }));

      act(() => result.current.onKeyDown(key({ key: 'x' })));
      expect(canEditAt).toHaveBeenLastCalledWith({ row: 0, col: 1 }, 'type');
      expect(result.current.editing).toBe(false);

      act(() => result.current.onKeyDown(key({ key: 'Enter' })));
      expect(canEditAt).toHaveBeenLastCalledWith({ row: 0, col: 1 }, 'command');
      expect(result.current.editing).toBe(true);
      expect(result.current.openedByTyping).toBe(false);
    });

    it('is not opened by typing once the editor is opened any other way', () => {
      const { result } = renderHook(() => useTyping());

      act(() => result.current.select({ row: 0, col: 0 }));
      act(() => result.current.onKeyDown(key({ key: 'x' })));
      act(() => result.current.cancelEdit());
      act(() => result.current.onKeyDown(key({ key: 'F2' })));
      expect(result.current.openedByTyping).toBe(false);

      act(() => result.current.cancelEdit());
      act(() => result.current.onKeyDown(key({ key: 'x' })));
      act(() => result.current.cancelEdit());
      act(() => result.current.startEditAt({ row: 1, col: 1 }));
      expect(result.current.openedByTyping).toBe(false);
    });

    it('leaves keys alone while an editor is open', () => {
      const { result } = renderHook(() => useTyping());
      act(() => result.current.startEditAt({ row: 0, col: 0 }));
      const typed = key({ key: 'x' });

      act(() => result.current.onKeyDown(typed));

      expect(result.current.openedByTyping).toBe(false);
      expect(typed.preventDefault).not.toHaveBeenCalled();
    });

    it('walks the row with Tab and Shift+Tab, and lets Tab leave the grid past either end', () => {
      const { result } = renderHook(() => useTyping());

      act(() => result.current.select({ row: 1, col: 2 }));
      act(() => result.current.onKeyDown(key({ key: 'Tab' })));
      expect(result.current.focus).toEqual({ row: 1, col: 3 });
      expect(result.current.editing).toBe(false);

      const pastEnd = key({ key: 'Tab' });
      act(() => result.current.onKeyDown(pastEnd));
      expect(result.current.focus).toEqual({ row: 1, col: 3 });
      expect(pastEnd.preventDefault).not.toHaveBeenCalled();

      act(() => result.current.select({ row: 1, col: 1 }));
      act(() => result.current.onKeyDown(key({ key: 'Tab', shiftKey: true })));
      expect(result.current.focus).toEqual({ row: 1, col: 0 });

      const pastStart = key({ key: 'Tab', shiftKey: true });
      act(() => result.current.onKeyDown(pastStart));
      expect(pastStart.preventDefault).not.toHaveBeenCalled();
    });
  });
});
