import { act, renderHook } from '@testing-library/react';
import type { Viewport } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { useCanvasViewViewport } from './useCanvasViewViewport';

const sequentialViewport: Viewport = { x: 10, y: 20, zoom: 0.8 };
const flowViewport: Viewport = { x: 200, y: 100, zoom: 1.2 };

describe('useCanvasViewViewport', () => {
  it('fits an initial view once when requested', () => {
    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    const cancelAnimationFrame = vi.fn();
    vi.stubGlobal('requestAnimationFrame', requestAnimationFrame);
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);

    const reactFlow = {
      getViewport: vi.fn(() => sequentialViewport),
      setViewport: vi.fn(),
      fitView: vi.fn(),
    };
    const { rerender, unmount } = renderHook(
      ({ view }: { view: 'flow' | 'sequential' }) =>
        useCanvasViewViewport({ view, reactFlow, fitOnMount: true }),
      { initialProps: { view: 'sequential' as const } }
    );

    expect(reactFlow.fitView).toHaveBeenCalledOnce();
    expect(reactFlow.fitView).toHaveBeenCalledWith({ duration: 0 });

    rerender({ view: 'sequential' });
    expect(reactFlow.fitView).toHaveBeenCalledOnce();

    unmount();
    vi.unstubAllGlobals();
  });

  it('restores each local viewport instead of fitting again on a return visit', () => {
    let currentViewport = sequentialViewport;
    const reactFlow = {
      getViewport: vi.fn(() => currentViewport),
      setViewport: vi.fn(),
      fitView: vi.fn(),
    };
    const { result, rerender } = renderHook(
      ({ view }: { view: 'flow' | 'sequential' }) => useCanvasViewViewport({ view, reactFlow }),
      { initialProps: { view: 'sequential' as const } }
    );

    act(() => result.current.onMove?.(null, sequentialViewport));
    rerender({ view: 'flow' });
    expect(reactFlow.fitView).toHaveBeenCalledTimes(1);
    expect(reactFlow.fitView).toHaveBeenCalledWith(
      expect.objectContaining({
        minZoom: sequentialViewport.zoom,
        maxZoom: sequentialViewport.zoom,
      })
    );

    currentViewport = flowViewport;
    act(() => result.current.onMove?.(null, flowViewport));
    rerender({ view: 'sequential' });

    expect(reactFlow.setViewport).toHaveBeenLastCalledWith(
      { ...sequentialViewport, zoom: flowViewport.zoom },
      { duration: 300 }
    );
    expect(reactFlow.fitView).toHaveBeenCalledTimes(1);
  });

  it('synchronizes the local fallback with an external viewport store', () => {
    const stored = new Map<'flow' | 'sequential', Viewport>();
    const externalStore = {
      saveViewport: vi.fn((view: 'flow' | 'sequential', viewport: Viewport) => {
        stored.set(view, viewport);
      }),
      getViewport: vi.fn((view: 'flow' | 'sequential') => stored.get(view)),
    };
    const reactFlow = {
      getViewport: vi.fn(() => sequentialViewport),
      setViewport: vi.fn(),
      fitView: vi.fn(),
    };
    const { result } = renderHook(() =>
      useCanvasViewViewport({ view: 'sequential', reactFlow, externalStore })
    );

    act(() => result.current.onMove?.(null, sequentialViewport));

    expect(externalStore.saveViewport).toHaveBeenCalledWith('sequential', sequentialViewport);
  });
});
