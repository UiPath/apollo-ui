import type { ReactNode } from 'react';
import { useRef, useEffect } from 'react';
import { ApIcon, ApIconButton, ApTypography } from '@uipath/portal-shell-react';
import { FontVariantToken } from '@uipath/apollo-core';
import { Row } from '@uipath/apollo-react/canvas/layouts';
import styled from '@emotion/styled';

const PanelHeader = styled.div`
  border-bottom: 1px solid var(--uix-canvas-border-de-emp);
  padding: 8px 16px;
  background-color: var(--uix-canvas-background);
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
    background: var(--uix-canvas-background-secondary);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--uix-canvas-border);
    border-radius: 3px;

    &:hover {
      background: var(--uix-canvas-border-de-emp);
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
              <ApTypography
                color="var(--uix-canvas-foreground)"
                variant={FontVariantToken.fontSizeLBold}
              >
                {title}
              </ApTypography>
              <Row gap={8} align="center">
                {headerActions}
                {onClose && (
                  <ApIconButton color="secondary" onClick={onClose}>
                    <ApIcon name="close" />
                  </ApIconButton>
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
