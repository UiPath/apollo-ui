/**
 * Toolbar Action Store
 *
 * Module-level store for toolbar action handler, mode, and breakpoints.
 *
 * We use a module-level store instead of React context because:
 * 1. UIX's ExecutionStatusContext doesn't pass through custom properties
 * 2. The `getToolbar` function in node-factory is not a React component
 *    and cannot use hooks
 *
 * The store is set by FlowEditor via useEffect and accessed by toolbar-resolver.
 */

import { useEffect } from 'react';
import { ToolbarActionHandler } from '../schema/toolbar';

interface ToolbarActionStore {
  mode: string;
  onToolbarAction?: ToolbarActionHandler;
  breakpoints?: Set<string>;
  collapsed?: Set<string>;
}

// Module-level singleton store
let toolbarActionStore: ToolbarActionStore = {
  mode: 'design',
  onToolbarAction: undefined,
  breakpoints: undefined,
  collapsed: undefined,
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
  breakpoints?: Set<string>,
  collapsed?: Set<string>
): void {
  useEffect(() => {
    setToolbarActionStore({ mode, onToolbarAction, breakpoints, collapsed });

    // Cleanup: reset handler when component unmounts or switches
    // This prevents stale handlers from being invoked on the wrong canvas
    return () => {
      setToolbarActionStore({
        mode: 'design',
        onToolbarAction: undefined,
        breakpoints: undefined,
        collapsed: undefined,
      });
    };
  }, [mode, onToolbarAction, breakpoints, collapsed]);
}
