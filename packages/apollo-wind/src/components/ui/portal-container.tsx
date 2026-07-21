'use client';

import * as React from 'react';

/** Node that Radix overlays portal into. `null` falls back to `document.body`. */
const PortalContainerContext = React.createContext<HTMLElement | null>(null);

export const usePortalContainer = (): HTMLElement | null =>
  React.useContext(PortalContainerContext);

export interface PortalContainerProviderProps {
  children: React.ReactNode;
  /**
   * Node to portal into. Omit (`undefined`) to auto-use an in-tree boundary;
   * pass `null` to force Radix's default (`document.body`) for the subtree.
   */
  container?: HTMLElement | null;
}

/**
 * Portals overlays into its own subtree instead of `document.body`, keeping
 * them in the same DOM root and focus boundary as their trigger.
 *
 * Fixes overlays breaking under shadow-DOM or focus-trapped hosts, where
 * body-level content lands outside the trigger's root. Mount one per React root.
 */
export function PortalContainerProvider({ children, container }: PortalContainerProviderProps) {
  const [boundary, setBoundary] = React.useState<HTMLElement | null>(null);
  // `undefined` → auto boundary; explicit `null` → force `document.body`.
  const value = container !== undefined ? container : boundary;
  return (
    <PortalContainerContext.Provider value={value}>
      {children}
      {container === undefined && (
        // display:contents so the boundary never affects layout.
        <div ref={setBoundary} style={{ display: 'contents' }} />
      )}
    </PortalContainerContext.Provider>
  );
}
