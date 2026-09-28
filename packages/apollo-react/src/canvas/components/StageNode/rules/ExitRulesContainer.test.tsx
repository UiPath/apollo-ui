import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../../../utils/testing';
import type { StageNodeProps, StageRule } from '../StageNode.types';
import { ExitRulesContainer } from './ExitRulesContainer';

vi.mock('../../CanvasTooltip', () => ({
  CanvasTooltip: ({ children }: { content: ReactNode; children: ReactNode }) => <>{children}</>,
}));

const exitRules: StageRule[] = [
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

describe('ExitRulesContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when there are no exit rules', () => {
    render(<ExitRulesContainer props={makeProps({})} isReadOnly={false} />);

    expect(screen.queryByTestId('exit-rules-container-stage-1')).not.toBeInTheDocument();
  });

  it('renders a static header and a pill per rule when no section state is provided', () => {
    render(<ExitRulesContainer props={makeProps({ exitRules })} isReadOnly={false} />);

    expect(screen.getByTestId('exit-rules-container-stage-1')).toBeInTheDocument();
    expect(screen.getByTestId('exit-rules-header-stage-1')).toHaveTextContent('Exit rules');
    expect(screen.getByTestId('stage-rule-rule-1')).toBeInTheDocument();
    expect(screen.getByTestId('stage-rule-rule-2')).toBeInTheDocument();
    expect(
      screen.queryByTestId('exit-rules-header-stage-1-accordion-button')
    ).not.toBeInTheDocument();
  });

  it('renders a collapsible header and toggles via onCollapsedToggle', async () => {
    const user = userEvent.setup();
    const onCollapsedToggle = vi.fn();
    render(
      <ExitRulesContainer
        props={makeProps({
          exitRules,
          sectionStates: { exitRules: { isCollapsed: false, onCollapsedToggle } },
        })}
        isReadOnly={false}
      />
    );

    expect(screen.getByTestId('stage-rule-rule-1')).toBeInTheDocument();
    await user.click(screen.getByTestId('exit-rules-header-stage-1-accordion-button'));
    expect(onCollapsedToggle).toHaveBeenCalledTimes(1);
  });

  it('hides the rules when the collapsible section is collapsed', () => {
    render(
      <ExitRulesContainer
        props={makeProps({
          exitRules,
          sectionStates: { exitRules: { isCollapsed: true, onCollapsedToggle: vi.fn() } },
        })}
        isReadOnly={false}
      />
    );

    expect(screen.queryByTestId('stage-rule-rule-1')).not.toBeInTheDocument();
  });
});
