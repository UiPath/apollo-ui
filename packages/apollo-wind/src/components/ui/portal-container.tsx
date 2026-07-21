'use client';

import * as React from 'react';

/** Node that Radix overlays portal into. `null` falls back to `document.body`. */
const PortalContainerContext = React.createContext<HTMLElement | null>(null);

export const usePortalContainer = (): HTMLElement | null =>
  React.useContext(PortalContainerContext);

export interface PortalContainerProviderProps {
  children: React.ReactNode;
  /** Node to portal into. Omit to auto-use an in-tree boundary. */
  container?: HTMLElement | null;
}

/**
 * Portals overlays into its own subtree instead of `document.body`, keeping
 * them in the same DOM root and focus boundary as their trigger.
 *
 * Fixes overlays breaking under shadow-DOM or focus-trapped hosts, where
 * body-level content lands outside the trigger's root. Mount one per React root.
 */
export function PortalContainerProvider({
  children,
  container,
}: PortalContainerProviderProps) {
  const [boundary, setBoundary] = React.useState<HTMLElement | null>(null);
  const value = container ?? boundary;
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
