'use client';

import * as React from 'react';

/**
 * Node overlays portal into. `null` means fall back to `document.body` — either
 * no provider is mounted, or one is but its boundary hasn't attached yet; it is
 * not a reliable "is a provider mounted?" signal.
 */
const PortalContainerContext = React.createContext<HTMLElement | null>(null);

const usePortalContainer = (): HTMLElement | null => React.useContext(PortalContainerContext);

/**
 * Per-overlay portal target: `undefined`/`null` inherit the nearest
 * {@link PortalContainerProvider} (or `document.body` if none), `'body'` forces
 * `document.body`, an element portals into it. `null` inherits rather than
 * forcing body so `container={ref.current}` is safe before the ref attaches.
 */
export type PortalContainerOverride = HTMLElement | 'body' | null;

/**
 * Resolves an overlay's portal target from its `container` and the ambient
 * provider, shared so the behavior stays identical across overlays. `undefined`
 * is Radix's default (`document.body`) and keeps SSR clear of `document`.
 */
export function useResolvedPortalContainer(
  container?: PortalContainerOverride
): HTMLElement | undefined {
  const portalContainer = usePortalContainer();
  if (container === 'body') return undefined;
  return container ?? portalContainer ?? undefined;
}

export interface PortalContainerProviderProps {
  children: React.ReactNode;
  /** Node to portal into; omit (or pass a not-yet-attached ref, i.e. `null`) for an auto in-tree boundary. */
  container?: HTMLElement | null;
}

/**
 * Portals Popover/Select/DropdownMenu content (and Combobox/MultiSelect built on
 * them) into its own subtree instead of `document.body`, keeping overlays in the
 * trigger's DOM root and focus boundary. Without it they break under shadow-DOM
 * or focus-trapped hosts, where body-level content escapes the root. Mount one
 * per React root.
 *
 * Known limitation: an overlay open *on mount* portals to `document.body` for
 * the first commit (the boundary ref hasn't attached yet) then remounts; pass a
 * stable `container` you own for that case.
 */
export function PortalContainerProvider({ children, container }: PortalContainerProviderProps) {
  const [boundary, setBoundary] = React.useState<HTMLElement | null>(null);
  const value = container ?? boundary;
  return (
    <PortalContainerContext.Provider value={value}>
      {children}
      {container == null && (
        // `contents` (display:contents) so the boundary never affects layout.
        <div ref={setBoundary} className="contents" />
      )}
    </PortalContainerContext.Provider>
  );
}
