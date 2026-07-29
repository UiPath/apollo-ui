import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../../../utils/testing';
import type { StageNodeProps, StageRule } from '../StageNode.types';
import { CompletionRulesContainer } from './CompletionRulesContainer';

vi.mock('../../CanvasTooltip', () => ({
  CanvasTooltip: ({ children }: { content: ReactNode; children: ReactNode }) => <>{children}</>,
}));

const completionRules: StageRule[] = [
  { id: 'rule-1', label: 'Rule 1' },
  { id: 'rule-2', label: 'Rule 2' },
];

const makeProps = (stageDetails: Partial<StageNodeProps['stageDetails']>): StageNodeProps =>
  ({
    id: 'stage-1',
    selected: false,
    dragging: false,
    width: 300,
    stageDetails: { label: 'Test Stage', tasks: [], ...stageDetails },
  }) as StageNodeProps;

describe('CompletionRulesContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when there are no completion rules', () => {
    render(<CompletionRulesContainer props={makeProps({})} isReadOnly={false} />);

    expect(screen.queryByTestId('completion-rules-container-stage-1')).not.toBeInTheDocument();
  });

  it('renders a static header and a pill per rule when no section state is provided', () => {
    render(<CompletionRulesContainer props={makeProps({ completionRules })} isReadOnly={false} />);

    expect(screen.getByTestId('completion-rules-container-stage-1')).toBeInTheDocument();
    expect(screen.getByTestId('completion-rules-header-stage-1')).toHaveTextContent(
      'Completion rules'
    );
    expect(screen.getByTestId('stage-rule-rule-1')).toBeInTheDocument();
    expect(screen.getByTestId('stage-rule-rule-2')).toBeInTheDocument();
    expect(
      screen.queryByTestId('completion-rules-header-stage-1-accordion-button')
    ).not.toBeInTheDocument();
  });

  it('renders a collapsible header and toggles via onCollapsedToggle', async () => {
    const user = userEvent.setup();
    const onCollapsedToggle = vi.fn();
    render(
      <CompletionRulesContainer
        props={makeProps({
          completionRules,
          sectionStates: { completionRules: { isCollapsed: false, onCollapsedToggle } },
        })}
        isReadOnly={false}
      />
    );

    expect(screen.getByTestId('stage-rule-rule-1')).toBeInTheDocument();
    await user.click(screen.getByTestId('completion-rules-header-stage-1-accordion-button'));
    expect(onCollapsedToggle).toHaveBeenCalledTimes(1);
  });

  it('hides the rules when the collapsible section is collapsed', () => {
    render(
      <CompletionRulesContainer
        props={makeProps({
          completionRules,
          sectionStates: { completionRules: { isCollapsed: true, onCollapsedToggle: vi.fn() } },
        })}
        isReadOnly={false}
      />
    );

    expect(screen.queryByTestId('stage-rule-rule-1')).not.toBeInTheDocument();
  });
});
