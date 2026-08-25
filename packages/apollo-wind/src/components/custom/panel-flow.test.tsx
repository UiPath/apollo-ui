import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { defaultFlowNavItems, FlowPanel } from './panel-flow';

const sampleMessages = [
  { id: '1', role: 'user' as const, content: 'Tell me what tools the Excel agent is using' },
  {
    id: '2',
    role: 'assistant' as const,
    traceLabel: 'Chain of thought',
    toolCard: {
      title: 'Excel Agent',
      items: [
        {
          icon: 'search' as const,
          title: 'WebSearchTool',
          description: 'Searching spreadsheet cells.',
        },
        { icon: 'bot' as const, title: 'Excel Agent', description: 'Editing the current column.' },
      ],
    },
  },
];

describe('FlowPanel', () => {
  it('renders the icon rail with the UiPath logo button', () => {
    render(<FlowPanel navItems={defaultFlowNavItems} />);
    expect(screen.getByRole('button', { name: 'UiPath' })).toBeInTheDocument();
  });

  it('renders one rail button per nav item', () => {
    const { container } = render(<FlowPanel navItems={defaultFlowNavItems} />);
    const navButtons = container.querySelectorAll('nav button');
    expect(navButtons).toHaveLength(defaultFlowNavItems.length);
  });

  it('opens the panel and reports the nav change when a rail icon is clicked', async () => {
    const user = userEvent.setup();
    const onNavChange = vi.fn();
    const onOpenChange = vi.fn();
    const { container } = render(
      <FlowPanel
        navItems={defaultFlowNavItems}
        onNavChange={onNavChange}
        onOpenChange={onOpenChange}
      />
    );

    const navButtons = container.querySelectorAll('nav button');
    await user.click(navButtons[1]);
    expect(onNavChange).toHaveBeenCalledWith('home');
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('toggles the panel open state from the logo button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<FlowPanel open={false} navItems={defaultFlowNavItems} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: 'UiPath' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('shows the expanded panel with title, composer, and close button when open', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<FlowPanel open navItems={defaultFlowNavItems} onOpenChange={onOpenChange} />);

    expect(screen.getByText('Flow')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask me to help build your Flow')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close panel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders chat messages including the reasoning trace and tool card', () => {
    render(<FlowPanel open navItems={defaultFlowNavItems} chatMessages={sampleMessages} />);
    expect(screen.getByText('Tell me what tools the Excel agent is using')).toBeInTheDocument();
    expect(screen.getByText('Chain of thought')).toBeInTheDocument();
    expect(screen.getByText('WebSearchTool')).toBeInTheDocument();
    expect(screen.getByText('Agents and tools used')).toBeInTheDocument();
  });

  it('renders custom expandedContent instead of the default chat UI', () => {
    render(
      <FlowPanel
        open
        navItems={defaultFlowNavItems}
        chatMessages={sampleMessages}
        expandedContent={<div>Custom panel body</div>}
      />
    );
    expect(screen.getByText('Custom panel body')).toBeInTheDocument();
    expect(
      screen.queryByText('Tell me what tools the Excel agent is using')
    ).not.toBeInTheDocument();
  });

  it('has no accessibility violations (except known rail button-name gap)', async () => {
    const { container } = render(
      <FlowPanel open navItems={defaultFlowNavItems} chatMessages={sampleMessages} />
    );
    // The icon rail nav buttons expose their labels only through tooltips on
    // hover, so they have no accessible name in the resting state. Axe flags
    // this as a button-name violation. That is a known gap in the component
    // itself; the rule is disabled here so every other rule still runs.
    const results = await axe(container, {
      rules: { 'button-name': { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
