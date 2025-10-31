import type { AgentFlowSuggestionGroup } from "../../../types";
import { Column, FontVariantToken, Row, Spacing } from "@uipath/uix/core";
import { ApButton, ApIcon, ApIconButton, ApTypography } from "@uipath/portal-shell-react";
import { useState } from "react";

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
}

const RejectAllButton = ({ suggestionGroup, onClick }: AcceptRejectAllButtonProps) => (
  <ApButton
    variant="tertiary"
    size="small"
    label="Reject all"
    startIcon={<ApIcon variant="outlined" name="close" />}
    onClick={() => onClick(suggestionGroup.id)}
  />
);

const AcceptAllButton = ({ suggestionGroup, onClick }: AcceptRejectAllButtonProps) => (
  <ApButton
    variant="primary"
    size="small"
    label="Accept all"
    startIcon={<ApIcon variant="outlined" name="check" />}
    onClick={() => onClick(suggestionGroup.id)}
  />
);

const Divider = () => (
  <div
    style={{
      width: 1,
      height: "24px",
      backgroundColor: "var(--color-border)",
    }}
  />
);

interface SuggestionGroupNavigatorProps {
  currentIndex: number;
  total: number;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
}

const SuggestionGroupNavigator = ({ currentIndex, total, onNavigateNext, onNavigatePrevious }: SuggestionGroupNavigatorProps) => {
  const [isHoveringUp, setIsHoveringUp] = useState(false);
  const [isHoveringDown, setIsHoveringDown] = useState(false);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: Spacing.SpacingMicro, minWidth: "100px" }}>
      <ApIconButton onMouseEnter={() => setIsHoveringUp(true)} onMouseLeave={() => setIsHoveringUp(false)} onClick={onNavigatePrevious}>
        <ApIcon name="keyboard_arrow_up" color={isHoveringUp ? "var(--color-primary)" : "var(--color-foreground-de-emp)"} size="20px" />
      </ApIconButton>
      <ApTypography variant={FontVariantToken.fontSizeMBold} color="var(--color-foreground-de-emp)">
        {currentIndex + 1} of {total}
      </ApTypography>
      <ApIconButton onMouseEnter={() => setIsHoveringDown(true)} onMouseLeave={() => setIsHoveringDown(false)} onClick={onNavigateNext}>
        <ApIcon name="keyboard_arrow_down" color={isHoveringDown ? "var(--color-primary)" : "var(--color-foreground-de-emp)"} size="20px" />
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
  // Filter out standalone suggestions - they are interactive placeholders that shouldn't appear in the panel
  const nonStandaloneSuggestions = suggestionGroup?.suggestions.filter((s) => !s.isStandalone) ?? [];
  const placeholderCount = nonStandaloneSuggestions.length;

  return (
    <>
      {placeholderCount > 0 && suggestionGroup && (
        <Column
          py={Spacing.SpacingMicro}
          px={Spacing.SpacingXs}
          gap={Spacing.SpacingXs}
          style={{
            backgroundColor: "var(--color-background-secondary)",
            color: "var(--color-foreground)",
            borderRadius: "8px",
            border: "1px solid var(--color-border-de-emp)",
            boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.3)",
          }}
        >
          <Row align="center" gap={Spacing.SpacingS} justify="space-evenly">
            {onRejectAll && <RejectAllButton suggestionGroup={suggestionGroup} onClick={onRejectAll} />}
            {onAcceptAll && <AcceptAllButton suggestionGroup={suggestionGroup} onClick={onAcceptAll} />}
            <Divider />
            <SuggestionGroupNavigator
              currentIndex={currentIndex}
              total={placeholderCount}
              onNavigateNext={onNavigateNext}
              onNavigatePrevious={onNavigatePrevious}
            />
          </Row>
        </Column>
      )}
    </>
  );
};
