import React, { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { act, renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
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

  // Filling the container stretches the columns past the window; a live drag that takes width back
  // from them has to shrink the spacer standing in for the unmounted ones, or the colgroup shears.
  it('keeps the spacer for unmounted columns in step with a live drag that redistributes them', () => {
    const containerRef = { current: { clientWidth: 800 } as unknown as HTMLElement };
    const columns: SizedColumn[] = ['c0', 'c1', 'c2', 'c3'].map((id) => ({
      id,
      defaultWidth: 100,
    }));
    const { result } = renderHook(() =>
      useColumnWidths({ columns, reservedPx: 0, containerRef, initialWidths: {} })
    );
    expect(result.current.widths).toEqual([200, 200, 200, 200]);

    const table = document.createElement('table');
    const handle = document.createElement('span');
    table.append(handle);
    handle.setPointerCapture = vi.fn();
    const spacer = document.createElement('col');
    act(() => {
      result.current.setTableElement(table);
      result.current.setSpacerElement('hidden', ['c2', 'c3'], spacer);
      result.current.onResizeStart('c0', {
        clientX: 100,
        pointerId: 1,
        currentTarget: handle,
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as React.PointerEvent);
    });
    act(() => {
      handle.dispatchEvent(new MouseEvent('pointermove', { clientX: 200, buttons: 1 }));
    });

    // c0 took 100px; the three columns to its right share the 500px left evenly, so the spacer
    // standing in for c2 and c3 holds two thirds of it.
    expect(Number.parseFloat(spacer.style.width)).toBeCloseTo(1000 / 3);
    expect(Number.parseFloat(table.style.width)).toBe(800);
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

  it('is never shown at its default widths: it fits to the container before it reveals', async () => {
    const columns: SizedColumn[] = ['c0', 'c1'].map((id) => ({ id, defaultWidth: 100 }));
    const Probe = () => {
      const containerRef = useRef<HTMLDivElement>(null);
      const { widths, setTableElement } = useColumnWidths({
        columns,
        reservedPx: 0,
        containerRef,
        initialWidths: {},
      });
      return React.createElement(
        'div',
        { ref: containerRef },
        React.createElement(
          'table',
          { ref: setTableElement },
          React.createElement(
            'colgroup',
            null,
            ...widths.map((width, index) =>
              React.createElement('col', { key: index, style: { width } })
            )
          )
        )
      );
    };
    const clientWidth = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800);
    // Outside act, so the browser's order holds: layout effects before the paint, passive ones after.
    const environment = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const actEnvironment = environment.IS_REACT_ACT_ENVIRONMENT;
    environment.IS_REACT_ACT_ENVIRONMENT = false;
    const host = document.createElement('div');
    document.body.append(host);
    const shown: string[][] = [];
    const observer = new MutationObserver(() => {
      const table = host.querySelector('table');
      if (table?.style.visibility === 'visible') {
        shown.push([...table.querySelectorAll('col')].map((col) => col.style.width));
      }
    });
    observer.observe(host, { subtree: true, attributes: true, childList: true });
    const root = createRoot(host);
    try {
      root.render(React.createElement(Probe));
      await waitFor(() => expect(shown.length).toBeGreaterThan(0));
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(shown.every((cols) => cols.join() === '400px,400px')).toBe(true);
    } finally {
      observer.disconnect();
      root.unmount();
      host.remove();
      environment.IS_REACT_ACT_ENVIRONMENT = actEnvironment;
      clientWidth.mockRestore();
    }
  });
});
