import styled from '@emotion/styled';
import { Row } from '@uipath/apollo-react/canvas/layouts';
import { Button } from '@uipath/apollo-wind';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { CanvasIcon } from '../../utils/icon-registry';

const PanelHeader = styled.div`
  border-bottom: 1px solid var(--canvas-border-de-emp);
  padding: 8px 16px;
  background-color: var(--canvas-background);
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
`;

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--canvas-background-secondary);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--canvas-border);
    border-radius: 3px;

    &:hover {
      background: var(--canvas-border-de-emp);
    }
  }
`;

export interface PanelChromeProps {
  title?: ReactNode;
  header?: ReactNode;
  headerActions?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;
  scrollKey?: string;
}

export function PanelChrome({
  title,
  header,
  headerActions,
  children,
  onClose,
  scrollKey,
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
        <PanelHeader>
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
        </PanelHeader>
      )}
      <PanelContent ref={contentRef}>{children}</PanelContent>
    </>
  );
}
