import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../../utils/testing';
import type { StageRule } from '../StageNode.types';
import { StageRuleContent } from './StageRuleContent';

// Surface CanvasTooltip content into the DOM so the label copy can be asserted
// without relying on Radix's hover-driven open/close (unreliable in happy-dom).
vi.mock('../../CanvasTooltip', () => ({
  CanvasTooltip: ({ content, children }: { content: ReactNode; children: ReactNode }) => (
    <span
      data-testid="canvas-tooltip"
      data-tooltip-content={typeof content === 'string' ? content : ''}
    >
      {children}
    </span>
  ),
}));

const rule: StageRule = { id: 'rule-1', label: 'Amount > 1000' };

describe('StageRuleContent', () => {
  it('renders the rule label under a rule-scoped test id', () => {
    render(<StageRuleContent rule={rule} ruleType="entry" />);

    const label = screen.getByTestId('stage-rule-label-rule-1');
    expect(label).toHaveTextContent('Amount > 1000');
  });

  it('wraps the label in a tooltip showing the rule label', () => {
    const { container } = render(<StageRuleContent rule={rule} ruleType="entry" />);

    expect(container.querySelector('[data-tooltip-content="Amount > 1000"]')).not.toBeNull();
  });

  it('renders the entry-condition icon for an entry rule', () => {
    render(<StageRuleContent rule={rule} ruleType="entry" />);

    expect(screen.getByTestId('stage-rule-icon-rule-1')).toBeInTheDocument();
    expect(screen.getByTestId('entry-condition-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('exit-condition-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('completion-condition-icon')).not.toBeInTheDocument();
  });

  it('renders the exit-condition icon for an exit rule', () => {
    render(<StageRuleContent rule={rule} ruleType="exit" />);

    expect(screen.getByTestId('exit-condition-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('entry-condition-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('completion-condition-icon')).not.toBeInTheDocument();
  });

  it('renders the completion-condition icon for a completion rule', () => {
    render(<StageRuleContent rule={rule} ruleType="completion" />);

    expect(screen.getByTestId('completion-condition-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('entry-condition-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('exit-condition-icon')).not.toBeInTheDocument();
  });
});
