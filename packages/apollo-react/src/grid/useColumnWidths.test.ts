import { vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { SizedColumn } from './columnSizing';
import { useColumnWidths } from './useColumnWidths';

describe('useColumnWidths', () => {
  it('keeps directional drag sizes when the columns array is rebuilt with the same ids and widths', async () => {
    const containerRef = { current: { clientWidth: 800 } as unknown as HTMLElement };
    const cols = (): SizedColumn[] => [
      { id: 'c0', defaultWidth: 100 },
      { id: 'c1', defaultWidth: 100 },
      { id: 'c2', defaultWidth: 100 },
    ];
    const { result, rerender } = renderHook(
      ({ columns }) =>
        useColumnWidths({ columns, reservedPx: 88, containerRef, initialWidths: {} }),
      {
        initialProps: { columns: cols() },
      }
    );
    // Widen the last column: nothing to its right flexes, so the others hold — a directional
    // layout resolveColumnWidths would not reproduce.
    act(() =>
      result.current.onResizeKeyDown('c2', {
        key: 'ArrowRight',
        preventDefault: () => {},
      } as unknown as React.KeyboardEvent)
    );
    const directional = result.current.widths;

    // A cosmetic defs rebuild (e.g. a header rename) must not snap the layout back to auto-fit.
    rerender({ columns: cols() });
    await waitFor(() => expect(result.current.widths).toEqual(directional));
  });

  it('reports the full override map on a resize, so the host can persist it by replacement', () => {
    const containerRef = { current: { clientWidth: 800 } as unknown as HTMLElement };
    const onWidthsChange = vi.fn();
    const columns: SizedColumn[] = [{ id: 'c0', defaultWidth: 100 }];
    const { result } = renderHook(() =>
      useColumnWidths({ columns, reservedPx: 88, containerRef, initialWidths: {}, onWidthsChange })
    );

    act(() =>
      result.current.onResizeKeyDown('c0', {
        key: 'ArrowRight',
        preventDefault: () => {},
      } as unknown as React.KeyboardEvent)
    );
    expect(onWidthsChange).toHaveBeenCalledWith({ c0: expect.any(Number) });
  });

  it("resets overrides when the host hands it a new document's widths, so files do not bleed", async () => {
    const containerRef = { current: null };
    const columns: SizedColumn[] = [{ id: 'input:colX', defaultWidth: 220 }];
    const { result, rerender } = renderHook(
      ({ initialWidths }) =>
        useColumnWidths({ columns, reservedPx: 88, containerRef, initialWidths }),
      {
        initialProps: { initialWidths: { 'input:colX': 300 } as Record<string, number> },
      }
    );

    // file-a has a stored override; it applies.
    await waitFor(() => expect(result.current.widths).toEqual([300]));

    // Switching to a file with nothing stored must fall back to the default, not keep file-a's width.
    rerender({ initialWidths: {} });
    await waitFor(() => expect(result.current.widths).toEqual([220]));
  });

  it("prunes a deleted column's override and reports the pruned map to the host", async () => {
    const containerRef = { current: null };
    const onWidthsChange = vi.fn();
    const twoCols: SizedColumn[] = [
      { id: 'input:a', defaultWidth: 220 },
      { id: 'output:b', defaultWidth: 220 },
    ];
    const oneCol: SizedColumn[] = [{ id: 'input:a', defaultWidth: 220 }];
    const initialWidths = { 'input:a': 120, 'output:b': 240 };
    const { result, rerender } = renderHook(
      ({ columns }) =>
        useColumnWidths({ columns, reservedPx: 88, containerRef, initialWidths, onWidthsChange }),
      {
        initialProps: { columns: twoCols },
      }
    );
    await waitFor(() => expect(result.current.widths).toEqual([120, 240]));

    // Deleting output:b must drop its width from state and report the map without it.
    rerender({ columns: oneCol });
    await waitFor(() => expect(result.current.widths).toEqual([120]));
    expect(onWidthsChange).toHaveBeenLastCalledWith({ 'input:a': 120 });
  });

  it('reveals the table with defaults and stops persisting when the seed promise rejects', async () => {
    const containerRef = { current: { clientWidth: 800 } as unknown as HTMLElement };
    const onWidthsChange = vi.fn();
    const columns: SizedColumn[] = [{ id: 'c0', defaultWidth: 100 }];
    const seed = Promise.reject(new Error('read failed'));
    // Held ahead of the render so the rejection is never unhandled.
    seed.catch(() => {});
    const { result } = renderHook(() =>
      useColumnWidths({
        columns,
        reservedPx: 88,
        containerRef,
        initialWidths: seed,
        onWidthsChange,
      })
    );

    // Reveals with the defaults — hidden-forever would be strictly worse than un-remembered widths.
    await waitFor(() => expect(result.current.widths).toEqual([712]));

    // A resize still works this session, but is NOT reported: the persisted map is unknowable, and
    // a "full" map built from this blind session would overwrite every width the failed read hid.
    act(() =>
      result.current.onResizeKeyDown('c0', {
        key: 'ArrowRight',
        preventDefault: () => {},
      } as unknown as React.KeyboardEvent)
    );
    expect(onWidthsChange).not.toHaveBeenCalled();
  });

  it('prunes a column deleted while the seed promise was in flight', async () => {
    const containerRef = { current: null };
    const onWidthsChange = vi.fn();
    let resolveSeed: (widths: Record<string, number>) => void = () => {};
    const seed = new Promise<Record<string, number>>((resolve) => {
      resolveSeed = resolve;
    });
    const twoCols: SizedColumn[] = [
      { id: 'input:a', defaultWidth: 220 },
      { id: 'output:b', defaultWidth: 220 },
    ];
    const oneCol: SizedColumn[] = [{ id: 'input:a', defaultWidth: 220 }];
    const { result, rerender } = renderHook(
      ({ columns }) =>
        useColumnWidths({
          columns,
          reservedPx: 88,
          containerRef,
          initialWidths: seed,
          onWidthsChange,
        }),
      {
        initialProps: { columns: twoCols },
      }
    );

    // The column disappears before the read settles; the resolved map still carries its ghost key.
    rerender({ columns: oneCol });
    await act(async () => resolveSeed({ 'input:a': 120, 'output:b': 240 }));

    await waitFor(() => expect(result.current.widths).toEqual([120]));
    // The ghost never entered the overrides, so the next report has nothing to resurrect.
    act(() =>
      result.current.onResizeKeyDown('input:a', {
        key: 'ArrowRight',
        preventDefault: () => {},
      } as unknown as React.KeyboardEvent)
    );
    expect(onWidthsChange).toHaveBeenLastCalledWith({ 'input:a': 136 });
  });
});
