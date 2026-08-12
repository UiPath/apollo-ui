import { act, renderHook } from '@testing-library/react';
import type { Viewport } from '@uipath/apollo-react/canvas/xyflow/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  SequentialViewProvider,
  useOptionalSequentialView,
  useSequentialView,
} from './SequentialViewContext';

const storageKey = 'test-view-context.view';

const wrapper = ({ children }: { children: ReactNode }) => (
  <SequentialViewProvider storageKey={storageKey}>{children}</SequentialViewProvider>
);

describe('SequentialViewProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // The provider delegates the view itself to useCanvasViewMode, so the defaulting,
  // `initialView` and persistence contracts are covered by useCanvasViewMode.test.ts.
  // This only pins that the delegation is actually wired in both directions.
  it('exposes the stored view and writes back through setView', () => {
    const { result } = renderHook(() => useSequentialView(), { wrapper });

    expect(result.current.view).toBe('flow');
    act(() => result.current.setView('sequential'));
    expect(result.current.view).toBe('sequential');
  });

  describe('per-view viewport store (D11)', () => {
    const flowViewport: Viewport = { x: 10, y: 20, zoom: 1.5 };
    const sequentialViewport: Viewport = { x: -40, y: 300, zoom: 0.75 };

    it('returns undefined for a view that has not been saved, so it fits fresh', () => {
      const { result } = renderHook(() => useSequentialView(), { wrapper });

      expect(result.current.getViewport('flow')).toBeUndefined();
      expect(result.current.getViewport('sequential')).toBeUndefined();
    });

    it('keeps each view its own viewport rather than one shared value', () => {
      const { result } = renderHook(() => useSequentialView(), { wrapper });

      act(() => {
        result.current.saveViewport('flow', flowViewport);
        result.current.saveViewport('sequential', sequentialViewport);
      });

      expect(result.current.getViewport('flow')).toEqual(flowViewport);
      expect(result.current.getViewport('sequential')).toEqual(sequentialViewport);
    });

    it("overwrites a view's saved viewport on the next save", () => {
      const { result } = renderHook(() => useSequentialView(), { wrapper });

      act(() => result.current.saveViewport('flow', flowViewport));
      act(() => result.current.saveViewport('flow', { x: 0, y: 0, zoom: 2 }));

      expect(result.current.getViewport('flow')).toEqual({ x: 0, y: 0, zoom: 2 });
    });

    it('survives a view switch, which is the whole point of saving it', () => {
      const { result } = renderHook(() => useSequentialView(), { wrapper });

      act(() => {
        result.current.saveViewport('flow', flowViewport);
        result.current.setView('sequential');
      });

      expect(result.current.view).toBe('sequential');
      expect(result.current.getViewport('flow')).toEqual(flowViewport);
    });
  });

  it('throws a named error when useSequentialView is used outside a provider', () => {
    expect(() => renderHook(() => useSequentialView())).toThrow(
      'useSequentialView must be used within a SequentialViewProvider'
    );
  });

  it('returns undefined from the optional hook outside a provider, so the canvas runs standalone', () => {
    const { result } = renderHook(() => useOptionalSequentialView());

    expect(result.current).toBeUndefined();
  });
});
