import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../../utils/testing';
import type { StageRule } from '../StageNode.types';
import { StageRulesContainer } from './StageRulesContainer';

vi.mock('../../CanvasTooltip', () => ({
  CanvasTooltip: ({ children }: { content: ReactNode; children: ReactNode }) => <>{children}</>,
}));

const rules: StageRule[] = [
  { id: 'rule-1', label: 'Rule 1' },
  { id: 'rule-2', label: 'Rule 2' },
  { id: 'rule-3', label: 'Rule 3' },
];

describe('StageRulesContainer', () => {
  it('renders nothing when there are no rules', () => {
    const { container } = render(
      <StageRulesContainer rules={[]} ruleType="entry" isReadOnly={false} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders one pill per rule', () => {
    render(<StageRulesContainer rules={rules} ruleType="entry" isReadOnly={false} />);

    expect(screen.getByTestId('stage-rule-rule-1')).toBeInTheDocument();
    expect(screen.getByTestId('stage-rule-rule-2')).toBeInTheDocument();
    expect(screen.getByTestId('stage-rule-rule-3')).toBeInTheDocument();
  });

  it('renders the pills in the order they are supplied', () => {
    render(<StageRulesContainer rules={rules} ruleType="entry" isReadOnly={false} />);

    const rendered = screen
      .getAllByTestId(/^stage-rule-rule-/)
      .map((el) => el.getAttribute('data-testid'));
    expect(rendered).toEqual(['stage-rule-rule-1', 'stage-rule-rule-2', 'stage-rule-rule-3']);
  });
});
