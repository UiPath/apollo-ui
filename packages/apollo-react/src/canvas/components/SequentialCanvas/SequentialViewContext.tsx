import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import type { CanvasView } from '../../utils/sequential/sequential.types';
import { useCanvasViewMode } from './useCanvasViewMode';
import { createViewportStore, type ViewportStore } from './viewportStore';

/**
 * Optional coordination for a flow/sequential toggle: the persisted current view plus a
 * per-view viewport store. SequentialCanvas works standalone without it.
 */
export interface SequentialViewContextValue extends ViewportStore {
  view: CanvasView;
  setView: (view: CanvasView) => void;
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
  const [store] = useState(createViewportStore);

  const value = useMemo<SequentialViewContextValue>(
    () => ({ view, setView, ...store }),
    [view, setView, store]
  );

  return <SequentialViewContext.Provider value={value}>{children}</SequentialViewContext.Provider>;
}

/** Throws outside a {@link SequentialViewProvider}. */
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
