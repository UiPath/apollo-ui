import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../../../utils/testing';
import type { StageNodeProps, StageRule } from '../StageNode.types';
import { EntryRulesContainer } from './EntryRulesContainer';

vi.mock('../../CanvasTooltip', () => ({
  CanvasTooltip: ({ children }: { content: ReactNode; children: ReactNode }) => <>{children}</>,
}));

const entryRules: StageRule[] = [
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

describe('EntryRulesContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when there are no entry rules', () => {
    render(<EntryRulesContainer props={makeProps({})} isReadOnly={false} />);

    expect(screen.queryByTestId('entry-rules-container-stage-1')).not.toBeInTheDocument();
  });

  it('renders nothing when the entry rules array is empty', () => {
    render(<EntryRulesContainer props={makeProps({ entryRules: [] })} isReadOnly={false} />);

    expect(screen.queryByTestId('entry-rules-container-stage-1')).not.toBeInTheDocument();
  });

  describe('without section state (static header)', () => {
    it('renders the container, a static header and a pill per rule', () => {
      render(<EntryRulesContainer props={makeProps({ entryRules })} isReadOnly={false} />);

      expect(screen.getByTestId('entry-rules-container-stage-1')).toBeInTheDocument();
      expect(screen.getByTestId('entry-rules-header-stage-1')).toHaveTextContent('Entry rules');
      expect(screen.getByTestId('stage-rule-rule-1')).toBeInTheDocument();
      expect(screen.getByTestId('stage-rule-rule-2')).toBeInTheDocument();
    });

    it('does not render a collapsible accordion button', () => {
      render(<EntryRulesContainer props={makeProps({ entryRules })} isReadOnly={false} />);

      expect(
        screen.queryByTestId('entry-rules-header-stage-1-accordion-button')
      ).not.toBeInTheDocument();
    });
  });

  describe('with section state (collapsible header)', () => {
    it('renders a collapsible header and shows the rules when expanded', () => {
      const onCollapsedToggle = vi.fn();
      render(
        <EntryRulesContainer
          props={makeProps({
            entryRules,
            sectionStates: { entryRules: { isCollapsed: false, onCollapsedToggle } },
          })}
          isReadOnly={false}
        />
      );

      expect(screen.getByTestId('entry-rules-header-stage-1-accordion-button')).toBeInTheDocument();
      expect(screen.getByTestId('stage-rule-rule-1')).toBeInTheDocument();
    });

    it('hides the rules when collapsed', () => {
      const onCollapsedToggle = vi.fn();
      render(
        <EntryRulesContainer
          props={makeProps({
            entryRules,
            sectionStates: { entryRules: { isCollapsed: true, onCollapsedToggle } },
          })}
          isReadOnly={false}
        />
      );

      expect(screen.queryByTestId('stage-rule-rule-1')).not.toBeInTheDocument();
    });

    it('calls onCollapsedToggle when the header is clicked', async () => {
      const user = userEvent.setup();
      const onCollapsedToggle = vi.fn();
      render(
        <EntryRulesContainer
          props={makeProps({
            entryRules,
            sectionStates: { entryRules: { isCollapsed: false, onCollapsedToggle } },
          })}
          isReadOnly={false}
        />
      );

      await user.click(screen.getByTestId('entry-rules-header-stage-1-accordion-button'));

      expect(onCollapsedToggle).toHaveBeenCalledTimes(1);
    });
  });
});
