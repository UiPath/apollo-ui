/**
 * Toolbar action store: the canvas mode, action handler and breakpoints that
 * `resolveToolbar` reads. `ToolbarActionStoreProvider` holds one per BaseCanvas and nodes
 * read it first; the module-level store is the fallback for code outside any canvas
 * (e.g. `getToolbar` in node-factory, which cannot use hooks), and mirrors the most
 * recently mounted canvas that is still mounted.
 */

import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef } from 'react';
import type { ToolbarActionHandler } from '../schema/toolbar';
import { addMountedCanvas, newestMountedCanvas, removeMountedCanvas } from './mountedCanvases';

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

function syncToNewestCanvas(): void {
  setToolbarActionStore(
    newestMountedCanvas()?.store ?? {
      mode: 'design',
      onToolbarAction: undefined,
      breakpoints: undefined,
    }
  );
}

/**
 * Keeps the module-level store on the most recently mounted canvas that is still mounted.
 * When that canvas unmounts, the next newest takes over, or the default once none is left.
 */
export function useToolbarActionStore(
  mode: string,
  onToolbarAction?: ToolbarActionHandler,
  breakpoints?: Set<string>
): void {
  const entryRef = useRef({ store: { mode, onToolbarAction, breakpoints } });

  useEffect(() => {
    const entry = entryRef.current;
    addMountedCanvas(entry);
    syncToNewestCanvas();
    return () => {
      removeMountedCanvas(entry);
      syncToNewestCanvas();
    };
  }, []);

  useEffect(() => {
    entryRef.current.store = { mode, onToolbarAction, breakpoints };
    syncToNewestCanvas();
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
