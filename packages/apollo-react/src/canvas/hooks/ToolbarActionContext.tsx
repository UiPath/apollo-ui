/**
 * Toolbar action store: the canvas mode, action handler and breakpoints that
 * `resolveToolbar` reads. `ToolbarActionStoreProvider` holds one per BaseCanvas and nodes
 * read it first; the module-level store is the fallback for code outside any canvas
 * (e.g. `getToolbar` in node-factory, which cannot use hooks).
 */

import { createContext, type ReactNode, useContext, useEffect, useMemo } from 'react';
import type { ToolbarActionHandler } from '../schema/toolbar';

export interface ToolbarActionStore {
  mode: string;
  onToolbarAction?: ToolbarActionHandler;
  breakpoints?: Set<string>;
}

// Module-level singleton store
let toolbarActionStore: ToolbarActionStore = {
  mode: 'design',
  onToolbarAction: undefined,
  breakpoints: undefined,
};

/**
 * Set the toolbar action store values
 * Called by FlowEditor when mode or handler changes
 */
export function setToolbarActionStore(store: ToolbarActionStore): void {
  toolbarActionStore = store;
}

/**
 * Get current toolbar action store values
 * Called by toolbar-resolver to access mode and handler
 */
export function getToolbarActionStore(): ToolbarActionStore {
  return toolbarActionStore;
}

/**
 * React hook to sync toolbar action store with component props
 * Use this in FlowEditor to keep the store updated
 */
export function useToolbarActionStore(
  mode: string,
  onToolbarAction?: ToolbarActionHandler,
  breakpoints?: Set<string>
): void {
  useEffect(() => {
    setToolbarActionStore({ mode, onToolbarAction, breakpoints });

    // Cleanup: reset handler when component unmounts or switches
    // This prevents stale handlers from being invoked on the wrong canvas
    return () => {
      setToolbarActionStore({
        mode: 'design',
        onToolbarAction: undefined,
        breakpoints: undefined,
      });
    };
  }, [mode, onToolbarAction, breakpoints]);
}

// One per BaseCanvas, so side-by-side canvases never share mode, handler or breakpoints.
const ToolbarActionStoreContext = createContext<ToolbarActionStore | undefined>(undefined);

export function ToolbarActionStoreProvider({
  mode,
  onToolbarAction,
  breakpoints,
  children,
}: ToolbarActionStore & { children: ReactNode }) {
  const value = useMemo(
    () => ({ mode, onToolbarAction, breakpoints }),
    [mode, onToolbarAction, breakpoints]
  );
  return (
    <ToolbarActionStoreContext.Provider value={value}>
      {children}
    </ToolbarActionStoreContext.Provider>
  );
}

/** The nearest BaseCanvas's toolbar store, or `undefined` outside any canvas. */
export function useToolbarActionStoreContext(): ToolbarActionStore | undefined {
  return useContext(ToolbarActionStoreContext);
}
