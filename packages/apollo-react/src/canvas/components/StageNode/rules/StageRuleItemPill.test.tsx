import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../../../utils/testing';
import type { StageRule } from '../StageNode.types';
import { StageRuleItemPill } from './StageRuleItemPill';

vi.mock('../../CanvasTooltip', () => ({
  CanvasTooltip: ({ children }: { content: ReactNode; children: ReactNode }) => <>{children}</>,
}));

const createRule = (onClick?: () => void): StageRule => ({
  id: 'rule-1',
  label: 'Amount > 1000',
  onClick,
});

describe('StageRuleItemPill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the pill with a rule-scoped test id and its label', () => {
    render(<StageRuleItemPill rule={createRule()} ruleType="entry" isReadOnly={false} />);

    const pill = screen.getByTestId('stage-rule-rule-1');
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveTextContent('Amount > 1000');
  });

  it('invokes the rule onClick when clicked and not read-only', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<StageRuleItemPill rule={createRule(onClick)} ruleType="entry" isReadOnly={false} />);

    await user.click(screen.getByTestId('stage-rule-rule-1'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not invoke the rule onClick when read-only', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<StageRuleItemPill rule={createRule(onClick)} ruleType="entry" isReadOnly={true} />);

    await user.click(screen.getByTestId('stage-rule-rule-1'));

    expect(onClick).not.toHaveBeenCalled();
  });
});
