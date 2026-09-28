import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import { Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { Button } from '@uipath/apollo-wind';
import { memo, useState } from 'react';
import { CanvasIcon } from '../../utils/icon-registry';

export interface StoryInfoPanelProps {
  /** Panel title */
  title: string;
  /** Optional description below the title */
  description?: React.ReactNode;
  /** Panel content */
  children?: React.ReactNode;
  /** Whether the panel can be collapsed */
  collapsible?: boolean;
  /** Initial collapsed state (only applies when collapsible is true) */
  defaultCollapsed?: boolean;
  /** Panel position */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const StoryInfoPanel = memo(function StoryInfoPanel({
  title,
  description,
  children,
  collapsible = false,
  defaultCollapsed = false,
  position = 'top-left',
}: StoryInfoPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const hasContent = description || children;

  return (
    <Panel position={position}>
      <Column
        p={16}
        style={{
          color: 'var(--canvas-foreground)',
          backgroundColor: 'var(--canvas-background)',
          border: '1px solid var(--canvas-border-de-emp)',
          minWidth: 200,
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
        }}
      >
        <Row justify="space-between" align="center" gap={12}>
          <span className="text-lg font-bold">{title}</span>
          {collapsible && hasContent && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              <CanvasIcon icon={isCollapsed ? 'chevron-down' : 'chevron-up'} size={16} />
            </Button>
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
            {description && <span className="text-xs text-foreground-muted">{description}</span>}
            {children}
          </div>
        )}
      </Column>
    </Panel>
  );
});
