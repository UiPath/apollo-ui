import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { StoryTabs, type StoryTabsProps } from './StoryPage';

describe('StoryTabs', () => {
  it('shows the selected comparison when a node tab is activated', async () => {
    const user = userEvent.setup();
    const tabs: StoryTabsProps['tabs'] = [
      { value: 'agent', label: 'AgentNode', content: 'Agent comparison' },
      { value: 'loop', label: 'LoopNode', content: 'Loop comparison' },
    ];

    render(<StoryTabs label="Specialized node renderers" tabs={tabs} />);

    expect(screen.getByRole('tablist', { name: 'Specialized node renderers' })).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Agent comparison');

    await user.click(screen.getByRole('tab', { name: 'LoopNode' }));

    expect(screen.getByRole('tab', { name: 'LoopNode' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Loop comparison');
    expect(screen.queryByText('Agent comparison')).not.toBeInTheDocument();
  });
});
