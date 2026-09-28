import { StageItemsSection } from '../StageNode.styles';
import type { StageNodeProps } from '../StageNode.types';
import { CollapsibleStageHeader } from '../shared/CollapsibleStageHeader';
import { StageItemsHeaderTitle } from '../shared/StageItemsHeaderTitle';
import { StageRulesContainer } from './StageRulesContainer';

interface EntryRulesContainerProps {
  props: StageNodeProps;
  isReadOnly: boolean;
}

export const EntryRulesContainer = ({ props, isReadOnly }: EntryRulesContainerProps) => {
  const { id, stageDetails } = props;
  const { entryRules, sectionStates } = stageDetails;

  if (!entryRules || entryRules.length === 0) {
    return null;
  }

  let rulesContainer = (
    <StageRulesContainer rules={entryRules} ruleType="entry" isReadOnly={isReadOnly} />
  );

  if (sectionStates?.entryRules) {
    rulesContainer = (
      <CollapsibleStageHeader
        isOpen={!sectionStates.entryRules.isCollapsed}
        label="Entry rules"
        testId={`entry-rules-header-${id}`}
        onToggle={sectionStates.entryRules.onCollapsedToggle}
      >
        {rulesContainer}
      </CollapsibleStageHeader>
    );
  } else {
    rulesContainer = (
      <StageItemsSection>
        <StageItemsHeaderTitle title="Entry rules" testId={`entry-rules-header-${id}`} />
        {rulesContainer}
      </StageItemsSection>
    );
  }

  return <div data-testid={`entry-rules-container-${id}`}>{rulesContainer}</div>;
};
