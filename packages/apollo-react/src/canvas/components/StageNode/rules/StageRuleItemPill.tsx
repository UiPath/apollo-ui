import { useRef } from 'react';
import { StageItemPill } from '../StageNode.styles';
import type { StageRule, StageRuleType } from '../StageNode.types';
import { StageRuleContent } from './StageRuleContent';

export interface StageRuleItemPillProps {
  rule: StageRule;
  ruleType: StageRuleType;
  isReadOnly: boolean;
}

export const StageRuleItemPill = ({ rule, ruleType, isReadOnly }: StageRuleItemPillProps) => {
  const ruleRef = useRef<HTMLDivElement>(null);

  return (
    <StageItemPill
      ref={ruleRef}
      data-testid={`stage-rule-${rule.id}`}
      onClick={isReadOnly ? undefined : rule.onClick}
    >
      <StageRuleContent rule={rule} ruleType={ruleType} />
    </StageItemPill>
  );
};
