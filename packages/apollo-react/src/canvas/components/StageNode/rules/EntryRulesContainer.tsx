import { StageItemsSection } from '../StageNode.styles';
import type { SectionState, StageRule } from '../StageNode.types';
import { CollapsibleStageHeader } from '../shared/CollapsibleStageHeader';
import { StageItemsHeaderTitle } from '../shared/StageItemsHeaderTitle';
import { StageRulesContainer } from './StageRulesContainer';

interface EntryRulesContainerProps {
  id: string;
  entryRules?: StageRule[];
  sectionState?: SectionState;
  isReadOnly: boolean;
}

export const EntryRulesContainer = ({
  id,
  entryRules,
  sectionState,
  isReadOnly,
}: EntryRulesContainerProps) => {
  if (!entryRules || entryRules.length === 0) {
    return null;
  }

  let rulesContainer = (
    <StageRulesContainer rules={entryRules} ruleType="entry" isReadOnly={isReadOnly} />
  );

  if (sectionState) {
    rulesContainer = (
      <CollapsibleStageHeader
        isOpen={!sectionState.isCollapsed}
        label="Entry rules"
        testId={`entry-rules-header-${id}`}
        onToggle={sectionState.onCollapsedToggle}
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
