import { StageItemsSection } from '../StageNode.styles';
import type { SectionState, StageRule } from '../StageNode.types';
import { CollapsibleStageHeader } from '../shared/CollapsibleStageHeader';
import { StageItemsHeaderTitle } from '../shared/StageItemsHeaderTitle';
import { StageRulesContainer } from './StageRulesContainer';

interface CompletionRulesContainerProps {
  id: string;
  completionRules?: StageRule[];
  sectionState?: SectionState;
  isReadOnly: boolean;
}

export const CompletionRulesContainer = ({
  id,
  completionRules,
  sectionState,
  isReadOnly,
}: CompletionRulesContainerProps) => {
  if (!completionRules || completionRules.length === 0) {
    return null;
  }

  let rulesContainer = (
    <StageRulesContainer rules={completionRules} ruleType="completion" isReadOnly={isReadOnly} />
  );

  if (sectionState) {
    rulesContainer = (
      <CollapsibleStageHeader
        isOpen={!sectionState.isCollapsed}
        label="Completion rules"
        testId={`completion-rules-header-${id}`}
        onToggle={sectionState.onCollapsedToggle}
      >
        {rulesContainer}
      </CollapsibleStageHeader>
    );
  } else {
    rulesContainer = (
      <StageItemsSection>
        <StageItemsHeaderTitle title="Completion rules" testId={`completion-rules-header-${id}`} />
        {rulesContainer}
      </StageItemsSection>
    );
  }

  return <div data-testid={`completion-rules-container-${id}`}>{rulesContainer}</div>;
};
