import { memo } from 'react';
import { StageItemsList } from '../StageNode.styles';
import type { StageRule, StageRuleType } from '../StageNode.types';
import { StageRuleItemPill } from './StageRuleItemPill';

interface StageRulesContainerProps {
  rules: StageRule[];
  ruleType: StageRuleType;
  isReadOnly: boolean;
}

const StageRulesContainerInner = ({ rules, ruleType, isReadOnly }: StageRulesContainerProps) => {
  if (rules.length === 0) {
    return null;
  }
  return (
    <StageItemsList>
      {rules.map((rule) => {
        return (
          <StageRuleItemPill
            key={rule.id}
            rule={rule}
            ruleType={ruleType}
            isReadOnly={isReadOnly}
          />
        );
      })}
    </StageItemsList>
  );
};

export const StageRulesContainer = memo(StageRulesContainerInner);
