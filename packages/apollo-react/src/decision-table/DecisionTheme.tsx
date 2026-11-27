import { PortalContainerProvider, type Theme } from '@uipath/apollo-wind';
import { useResolvedPortalContainer } from '@uipath/apollo-wind/components/ui/portal-container';
import type React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/** Routes the view's overlays into a node carrying `theme`, so popovers, menus and tooltips paint in it; the host's own theme when it is omitted. */
export const DecisionTheme = ({
  theme,
  children,
}: {
  theme: Theme | undefined;
  children: React.ReactNode;
}): React.ReactNode => {
  const portalContainer = useResolvedPortalContainer();
  const [overlayNode, setOverlayNode] = useState<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <>
      <PortalContainerProvider container={overlayNode}>{children}</PortalContainerProvider>
      {mounted &&
        createPortal(
          <div ref={setOverlayNode} data-slot="decision-theme-overlays" className={theme} />,
          portalContainer ?? document.body
        )}
    </>
  );
};
