import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { MessageCircle, Settings } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { DelegatePanel } from './panel-delegate';

const navItems = [
  {
    id: 'chat',
    label: 'Chat',
    icon: <MessageCircle className="h-5 w-5" />,
    defaultOpen: true,
    children: [
      { id: 'chat-1', label: 'Invoice processing' },
      { id: 'chat-2', label: 'Expense reports' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
  },
];

describe('DelegatePanel', () => {
  it('renders expanded navigation with labels and children', () => {
    render(<DelegatePanel navItems={navItems} />);
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Invoice processing')).toBeInTheDocument();
    expect(screen.getByText('Expense reports')).toBeInTheDocument();
  });

  it('starts collapsed when defaultOpen is false, showing icon-only items', () => {
    render(<DelegatePanel defaultOpen={false} navItems={navItems} />);
    expect(screen.getByRole('button', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.queryByText('Invoice processing')).not.toBeInTheDocument();
  });

  it('collapses via the collapse button and notifies onOpenChange', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<DelegatePanel navItems={navItems} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: 'Collapse panel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('button', { name: 'Collapse panel' })).not.toBeInTheDocument();
  });

  it('expands again when a collapsed nav icon is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onNavChange = vi.fn();
    render(
      <DelegatePanel
        defaultOpen={false}
        navItems={navItems}
        onOpenChange={onOpenChange}
        onNavChange={onNavChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(onNavChange).toHaveBeenCalledWith('settings');
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: 'Collapse panel' })).toBeInTheDocument();
  });

  it('fires onChildSelect when a nav child is clicked', async () => {
    const user = userEvent.setup();
    const onChildSelect = vi.fn();
    render(<DelegatePanel navItems={navItems} onChildSelect={onChildSelect} />);

    await user.click(screen.getByText('Expense reports'));
    expect(onChildSelect).toHaveBeenCalledWith('chat-2');
  });

  it('toggles a collapsible section closed and fires onNavChange', async () => {
    const user = userEvent.setup();
    const onNavChange = vi.fn();
    render(<DelegatePanel navItems={navItems} onNavChange={onNavChange} />);

    await user.click(screen.getByText('Chat'));
    expect(onNavChange).toHaveBeenCalledWith('chat');
    expect(screen.queryByText('Invoice processing')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<DelegatePanel navItems={navItems} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
