import { StageItemsSection } from '../StageNode.styles';
import type { StageNodeProps } from '../StageNode.types';
import { CollapsibleStageHeader } from '../shared/CollapsibleStageHeader';
import { StageItemsHeaderTitle } from '../shared/StageItemsHeaderTitle';
import { StageRulesContainer } from './StageRulesContainer';

interface CompletionRulesContainerProps {
  props: StageNodeProps;
  isReadOnly: boolean;
}

export const CompletionRulesContainer = ({ props, isReadOnly }: CompletionRulesContainerProps) => {
  const { id, stageDetails } = props;
  const { completionRules, sectionStates } = stageDetails;

  if (!completionRules || completionRules.length === 0) {
    return null;
  }

  let rulesContainer = (
    <StageRulesContainer rules={completionRules} ruleType="completion" isReadOnly={isReadOnly} />
  );

  if (sectionStates?.completionRules) {
    rulesContainer = (
      <CollapsibleStageHeader
        isOpen={!sectionStates.completionRules.isCollapsed}
        label="Completion rules"
        testId={`completion-rules-header-${id}`}
        onToggle={sectionStates.completionRules.onCollapsedToggle}
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
