import { Row } from '@uipath/apollo-react/canvas/layouts';
import { Button } from '@uipath/apollo-wind';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { CanvasIcon } from '../../utils/icon-registry';

// The header paints the same surface as the panel and is not clipped by it, so
// its top corners have to mirror the panel's own radius in both theme families
// (see PANEL_SHELL_CLASS in CanvasPanelSurface) or they bleed past the shell.
const PANEL_HEADER_CLASS =
  'shrink-0 rounded-t-lg border-b border-b-(--canvas-border-de-emp) bg-(--canvas-background-raised) px-4 py-2 future:rounded-t-2xl';

// The scroll container's own radius clips the scrollbar it paints, so it tracks
// the panel's bottom corners for the same reason the header tracks the top.
const PANEL_CONTENT_CLASS =
  'min-h-0 flex-1 overflow-x-hidden rounded-b-lg future:rounded-b-2xl ' +
  '[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 ' +
  '[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-(--canvas-background-secondary) ' +
  '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-(--canvas-border) ' +
  '[&::-webkit-scrollbar-thumb:hover]:bg-(--canvas-border-de-emp)';

export interface PanelChromeProps {
  title?: ReactNode;
  header?: ReactNode;
  headerActions?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;
  scrollKey?: string;
  scrollableContent?: boolean;
}

export function PanelChrome({
  title,
  header,
  headerActions,
  children,
  onClose,
  scrollKey,
  scrollableContent = true,
}: PanelChromeProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && scrollKey) {
      contentRef.current.scrollTop = 0;
    }
  }, [scrollKey]);

  return (
    <>
      {(header || title || onClose) && (
        <div className={PANEL_HEADER_CLASS}>
          {header ?? (
            <Row gap={8} justify="between" align="center">
              <span className="text-base font-bold">{title}</span>
              <Row gap={8} align="center">
                {headerActions}
                {onClose && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    aria-label="Close"
                    onClick={onClose}
                  >
                    <CanvasIcon icon="x" size={16} />
                  </Button>
                )}
              </Row>
            </Row>
          )}
        </div>
      )}
      <div
        ref={contentRef}
        className={
          scrollableContent
            ? `${PANEL_CONTENT_CLASS} overflow-y-auto`
            : `${PANEL_CONTENT_CLASS} overflow-y-hidden`
        }
      >
        {children}
      </div>
    </>
  );
}
