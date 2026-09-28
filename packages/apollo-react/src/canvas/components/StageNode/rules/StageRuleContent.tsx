import { Spacing } from '@uipath/apollo-core';
import { Row } from '@uipath/apollo-react/canvas/layouts';
import { memo, useMemo } from 'react';
import { CanvasTooltip } from '../../CanvasTooltip';
import { StageItemIcon } from '../StageNode.styles';
import type { StageRule, StageRuleType } from '../StageNode.types';
import { StageCompletionConditionIcon } from '../shared/StageCompletionConditionIcon';
import { StageEntryConditionIcon } from '../shared/StageEntryConditionIcon';
import { StageExitConditionIcon } from '../shared/StageExitConditionIcon';

export interface StageRuleContentProps {
  rule: StageRule;
  ruleType: StageRuleType;
}

export const StageRuleContent = memo(({ rule, ruleType }: StageRuleContentProps) => {
  const icon = useMemo(() => {
    if (ruleType === 'entry') return <StageEntryConditionIcon />;
    if (ruleType === 'exit') return <StageExitConditionIcon />;
    if (ruleType === 'completion') return <StageCompletionConditionIcon />;
    return null;
  }, [ruleType]);

  return (
    <Row
      flex={1}
      align="center"
      justify="space-between"
      gap={Spacing.SpacingXs}
      style={{ overflow: 'hidden' }}
    >
      <Row
        gap={Spacing.SpacingXs}
        align="center"
        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        <StageItemIcon data-testid={`stage-rule-icon-${rule.id}`}>{icon}</StageItemIcon>
        <CanvasTooltip content={rule.label} placement="top" smartTooltip>
          <span
            data-testid={`stage-rule-label-${rule.id}`}
            className="text-sm truncate"
            style={{ minWidth: 0 }}
          >
            {rule.label}
          </span>
        </CanvasTooltip>
      </Row>
    </Row>
  );
});
