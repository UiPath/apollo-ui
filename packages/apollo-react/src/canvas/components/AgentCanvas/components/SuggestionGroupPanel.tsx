import { Spacing } from '@uipath/apollo-core';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import { useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { Button, cn } from '@uipath/apollo-wind';
import { useState } from 'react';
import { CANVAS_COMPACT_BREAKPOINT } from '../../../constants';
import type { AgentFlowSuggestionGroup } from '../../../types';
import { CanvasIcon } from '../../../utils/icon-registry';

interface SuggestionGroupPanelProps {
  suggestionGroup?: AgentFlowSuggestionGroup | null;
  onRejectAll?: (suggestionGroupId: string) => void;
  onAcceptAll?: (suggestionGroupId: string) => void;
  currentIndex?: number;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
}

interface AcceptRejectAllButtonProps {
  suggestionGroup: AgentFlowSuggestionGroup;
  onClick: (suggestionGroupId: string) => void;
  compact?: boolean;
}

const RejectAllButton = ({ suggestionGroup, onClick, compact }: AcceptRejectAllButtonProps) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => onClick(suggestionGroup.id)}
    className={compact ? 'text-xs min-w-0' : undefined}
  >
    <CanvasIcon icon="x" size={16} />
    Reject all
  </Button>
);

const AcceptAllButton = ({ suggestionGroup, onClick, compact }: AcceptRejectAllButtonProps) => (
  <Button
    size="sm"
    onClick={() => onClick(suggestionGroup.id)}
    className={compact ? 'text-xs min-w-0' : undefined}
  >
    <CanvasIcon icon="check" size={16} />
    Accept all
  </Button>
);

const Divider = () => (
  <div
    style={{
      width: 1,
      height: '24px',
      backgroundColor: 'var(--uix-canvas-border)',
    }}
  />
);

interface SuggestionGroupNavigatorProps {
  currentIndex: number;
  total: number;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
  compact?: boolean;
}

const SuggestionGroupNavigator = ({
  currentIndex,
  total,
  onNavigateNext,
  onNavigatePrevious,
  compact,
}: SuggestionGroupNavigatorProps) => {
  const [isHoveringUp, setIsHoveringUp] = useState(false);
  const [isHoveringDown, setIsHoveringDown] = useState(false);

  const iconSize = compact ? 16 : 20;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: Spacing.SpacingMicro,
        minWidth: compact ? '80px' : '100px',
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onMouseEnter={() => setIsHoveringUp(true)}
        onMouseLeave={() => setIsHoveringUp(false)}
        onClick={onNavigatePrevious}
      >
        <CanvasIcon
          icon="chevron-up"
          color={isHoveringUp ? 'var(--uix-canvas-primary)' : 'var(--uix-canvas-foreground-de-emp)'}
          size={iconSize}
        />
      </Button>
      <span className={cn('font-bold text-foreground-muted', compact ? 'text-xs' : 'text-sm')}>
        {currentIndex + 1} of {total}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onMouseEnter={() => setIsHoveringDown(true)}
        onMouseLeave={() => setIsHoveringDown(false)}
        onClick={onNavigateNext}
      >
        <CanvasIcon
          icon="chevron-down"
          color={
            isHoveringDown ? 'var(--uix-canvas-primary)' : 'var(--uix-canvas-foreground-de-emp)'
          }
          size={iconSize}
        />
      </Button>
    </div>
  );
};

export const SuggestionGroupPanel = ({
  suggestionGroup,
  onRejectAll,
  onAcceptAll,
  currentIndex = 0,
  onNavigateNext,
  onNavigatePrevious,
}: SuggestionGroupPanelProps) => {
  const canvasWidth = useStore((state) => state.width);
  const isCompact = canvasWidth < CANVAS_COMPACT_BREAKPOINT;

  // Filter out standalone suggestions - they are interactive placeholders that shouldn't appear in the panel
  const nonStandaloneSuggestions =
    suggestionGroup?.suggestions.filter((s) => !s.isStandalone) ?? [];
  const placeholderCount = nonStandaloneSuggestions.length;

  return (
    <>
      {placeholderCount > 0 && suggestionGroup && (
        <Column
          py={Spacing.SpacingMicro}
          px={Spacing.SpacingXs}
          gap={Spacing.SpacingXs}
          style={{
            backgroundColor: 'var(--uix-canvas-background-secondary)',
            color: 'var(--uix-canvas-foreground)',
            borderRadius: '8px',
            border: '1px solid var(--uix-canvas-border-de-emp)',
            boxShadow: '0px 6px 10px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Row
            align="center"
            gap={isCompact ? Spacing.SpacingXs : Spacing.SpacingS}
            justify="space-evenly"
            style={{ whiteSpace: 'nowrap' }}
          >
            {onRejectAll && (
              <RejectAllButton
                suggestionGroup={suggestionGroup}
                onClick={onRejectAll}
                compact={isCompact}
              />
            )}
            {onAcceptAll && (
              <AcceptAllButton
                suggestionGroup={suggestionGroup}
                onClick={onAcceptAll}
                compact={isCompact}
              />
            )}
            <Divider />
            <SuggestionGroupNavigator
              currentIndex={currentIndex}
              total={placeholderCount}
              onNavigateNext={onNavigateNext}
              onNavigatePrevious={onNavigatePrevious}
              compact={isCompact}
            />
          </Row>
        </Column>
      )}
    </>
  );
};
