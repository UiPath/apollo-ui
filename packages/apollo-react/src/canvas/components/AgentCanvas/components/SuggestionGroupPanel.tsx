import { useTheme } from '@mui/material';
import { FontVariantToken, Spacing } from '@uipath/apollo-core';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import { useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { ApButton, ApIcon, ApIconButton, ApTypography } from '@uipath/apollo-react/material';
import { useState } from 'react';

import type { AgentFlowSuggestionGroup } from '../../../types';

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
  <ApButton
    variant="tertiary"
    size="small"
    label="Reject all"
    startIcon={<ApIcon variant="outlined" name="close" />}
    onClick={() => onClick(suggestionGroup.id)}
    sx={compact ? { fontSize: '0.75rem', minWidth: 'auto' } : undefined}
  />
);

const AcceptAllButton = ({ suggestionGroup, onClick, compact }: AcceptRejectAllButtonProps) => (
  <ApButton
    variant="primary"
    size="small"
    label="Accept all"
    startIcon={<ApIcon variant="outlined" name="check" />}
    onClick={() => onClick(suggestionGroup.id)}
    sx={compact ? { fontSize: '0.75rem', minWidth: 'auto' } : undefined}
  />
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

  const iconSize = compact ? '16px' : '20px';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: Spacing.SpacingMicro,
        minWidth: compact ? '80px' : '100px',
      }}
    >
      <ApIconButton
        onMouseEnter={() => setIsHoveringUp(true)}
        onMouseLeave={() => setIsHoveringUp(false)}
        onClick={onNavigatePrevious}
      >
        <ApIcon
          name="keyboard_arrow_up"
          color={isHoveringUp ? 'var(--uix-canvas-primary)' : 'var(--uix-canvas-foreground-de-emp)'}
          size={iconSize}
        />
      </ApIconButton>
      <ApTypography
        variant={compact ? FontVariantToken.fontSizeSBold : FontVariantToken.fontSizeMBold}
        color="var(--uix-canvas-foreground-de-emp)"
      >
        {currentIndex + 1} of {total}
      </ApTypography>
      <ApIconButton
        onMouseEnter={() => setIsHoveringDown(true)}
        onMouseLeave={() => setIsHoveringDown(false)}
        onClick={onNavigateNext}
      >
        <ApIcon
          name="keyboard_arrow_down"
          color={
            isHoveringDown ? 'var(--uix-canvas-primary)' : 'var(--uix-canvas-foreground-de-emp)'
          }
          size={iconSize}
        />
      </ApIconButton>
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
  const theme = useTheme();
  const canvasWidth = useStore((state) => state.width);
  const smBreakpoint = theme.breakpoints.values.sm;
  const isCompact = canvasWidth < smBreakpoint;

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
