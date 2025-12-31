import { useState } from 'react';

import { FontVariantToken } from '@uipath/apollo-core';
import {
  Column,
  Row,
} from '@uipath/apollo-react/canvas/layouts';
import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { ApIcon, ApTypography } from '@uipath/apollo-react/material';
import { ApIconButton } from '@uipath/portal-shell-react';

export interface StoryInfoPanelProps {
  /** Panel title */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Panel content */
  children?: React.ReactNode;
  /** Whether the panel can be collapsed */
  collapsible?: boolean;
  /** Initial collapsed state (only applies when collapsible is true) */
  defaultCollapsed?: boolean;
}

export function StoryInfoPanel({
  title,
  description,
  children,
  collapsible = false,
  defaultCollapsed = false,
}: StoryInfoPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const hasContent = description || children;

  return (
    <Panel position="top-left">
      <Column
        p={16}
        style={{
          color: 'var(--uix-canvas-foreground)',
          backgroundColor: 'var(--uix-canvas-background)',
          border: '1px solid var(--uix-canvas-border-de-emp)',
          minWidth: 200,
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
        }}
      >
        <Row justify="space-between" align="center" gap={12}>
          <ApTypography variant={FontVariantToken.fontSizeH4Bold}>{title}</ApTypography>
          {collapsible && hasContent && (
            <ApIconButton
              size="small"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              <ApIcon name={isCollapsed ? 'expand_more' : 'expand_less'} />
            </ApIconButton>
          )}
        </Row>

        {hasContent && (
          <div
            style={{
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              maxHeight: isCollapsed && collapsible ? 0 : 1000,
              opacity: isCollapsed && collapsible ? 0 : 1,
              marginTop: isCollapsed && collapsible ? 0 : undefined,
            }}
          >
            {description && (
              <ApTypography
                variant={FontVariantToken.fontSizeS}
                color="var(--uix-canvas-foreground-de-emp)"
              >
                {description}
              </ApTypography>
            )}
            {children}
          </div>
        )}
      </Column>
    </Panel>
  );
}
