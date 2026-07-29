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

  const onClickFunction = isReadOnly ? undefined : rule.onClick;
  const hasOnClickFunction = onClickFunction != null;
  return (
    <StageItemPill
      ref={ruleRef}
      data-testid={`stage-rule-${rule.id}`}
      onClick={onClickFunction}
      role={hasOnClickFunction ? 'button' : undefined}
      tabIndex={hasOnClickFunction ? 0 : undefined}
      style={hasOnClickFunction ? { cursor: 'pointer' } : undefined}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (hasOnClickFunction && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClickFunction();
        }
      }}
    >
      <StageRuleContent rule={rule} ruleType={ruleType} />
    </StageItemPill>
  );
};
