import type { Viewport } from '@uipath/apollo-react/canvas/xyflow/react';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef } from 'react';
import type { CanvasView } from '../../utils/sequential/sequential.types';
import { useCanvasViewMode } from './useCanvasViewMode';

/**
 * Coordination hub for a flow/sequential toggle composition. It owns the current
 * view (persisted via {@link useCanvasViewMode}) and a per-view viewport store so
 * switching views restores the viewport you left behind (the HierarchicalCanvas
 * save/restore pattern applied to the view axis, D11).
 *
 * It is OPTIONAL: SequentialCanvas works standalone without it. A consumer that
 * wants a real toggle wraps the canvas in {@link SequentialViewProvider} and
 * feeds `view` / `onChange` to the canvas and ViewSwitcher.
 */
export interface SequentialViewContextValue {
  view: CanvasView;
  setView: (view: CanvasView) => void;
  /** Remember a view's viewport before switching away. */
  saveViewport: (view: CanvasView, viewport: Viewport) => void;
  /** The viewport to restore when a view mounts (undefined = fit fresh). */
  getViewport: (view: CanvasView) => Viewport | undefined;
}

const SequentialViewContext = createContext<SequentialViewContextValue | undefined>(undefined);

export interface SequentialViewProviderProps {
  children: ReactNode;
  /** localStorage key backing the persisted view choice. */
  storageKey: string;
  initialView?: CanvasView;
}

export function SequentialViewProvider({
  children,
  storageKey,
  initialView = 'flow',
}: SequentialViewProviderProps) {
  const [view, setView] = useCanvasViewMode(storageKey, initialView);
  const viewportByView = useRef<Map<CanvasView, Viewport>>(new Map());

  const saveViewport = useCallback((forView: CanvasView, viewport: Viewport) => {
    viewportByView.current.set(forView, viewport);
  }, []);

  const getViewport = useCallback(
    (forView: CanvasView): Viewport | undefined => viewportByView.current.get(forView),
    []
  );

  const value = useMemo<SequentialViewContextValue>(
    () => ({ view, setView, saveViewport, getViewport }),
    [view, setView, saveViewport, getViewport]
  );

  return <SequentialViewContext.Provider value={value}>{children}</SequentialViewContext.Provider>;
}

/** Returns the context or throws when used outside a {@link SequentialViewProvider}. */
export function useSequentialView(): SequentialViewContextValue {
  const context = useContext(SequentialViewContext);
  if (!context) {
    throw new Error('useSequentialView must be used within a SequentialViewProvider');
  }
  return context;
}

/** Returns the context or undefined, so SequentialCanvas can run standalone. */
export function useOptionalSequentialView(): SequentialViewContextValue | undefined {
  return useContext(SequentialViewContext);
}
