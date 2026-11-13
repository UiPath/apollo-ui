import { StageItemsSection } from '../StageNode.styles';
import type { SectionState, StageRule } from '../StageNode.types';
import { CollapsibleStageHeader } from '../shared/CollapsibleStageHeader';
import { StageItemsHeaderTitle } from '../shared/StageItemsHeaderTitle';
import { StageRulesContainer } from './StageRulesContainer';

interface ExitRulesContainerProps {
  id: string;
  exitRules?: StageRule[];
  sectionState?: SectionState;
  isReadOnly: boolean;
}

export const ExitRulesContainer = ({
  id,
  exitRules,
  sectionState,
  isReadOnly,
}: ExitRulesContainerProps) => {
  if (!exitRules || exitRules.length === 0) {
    return null;
  }

  let rulesContainer = (
    <StageRulesContainer rules={exitRules} ruleType="exit" isReadOnly={isReadOnly} />
  );

  if (sectionState) {
    rulesContainer = (
      <CollapsibleStageHeader
        isOpen={!sectionState.isCollapsed}
        label="Exit rules"
        testId={`exit-rules-header-${id}`}
        onToggle={sectionState.onCollapsedToggle}
      >
        {rulesContainer}
      </CollapsibleStageHeader>
    );
  } else {
    rulesContainer = (
      <StageItemsSection>
        <StageItemsHeaderTitle title="Exit rules" testId={`exit-rules-header-${id}`} />
        {rulesContainer}
      </StageItemsSection>
    );
  }

  return <div data-testid={`exit-rules-container-${id}`}>{rulesContainer}</div>;
};
