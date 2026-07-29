import { StageItemsSection } from '../StageNode.styles';
import type { StageNodeProps } from '../StageNode.types';
import { CollapsibleStageHeader } from '../shared/CollapsibleStageHeader';
import { StageItemsHeaderTitle } from '../shared/StageItemsHeaderTitle';
import { StageRulesContainer } from './StageRulesContainer';

interface ExitRulesContainerProps {
  props: StageNodeProps;
  isReadOnly: boolean;
}

export const ExitRulesContainer = ({ props, isReadOnly }: ExitRulesContainerProps) => {
  const { id, stageDetails } = props;
  const { exitRules, sectionStates } = stageDetails;

  if (!exitRules || exitRules.length === 0) {
    return null;
  }

  let rulesContainer = (
    <StageRulesContainer rules={exitRules} ruleType="exit" isReadOnly={isReadOnly} />
  );

  if (sectionStates?.exitRules) {
    rulesContainer = (
      <CollapsibleStageHeader
        isOpen={!sectionStates.exitRules.isCollapsed}
        label="Exit rules"
        testId={`exit-rules-header-${id}`}
        onToggle={sectionStates.exitRules.onCollapsedToggle}
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
