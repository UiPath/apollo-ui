import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { MaestroHeader } from './global-header';

describe('MaestroHeader', () => {
  it('renders the default title in a banner', () => {
    render(<MaestroHeader />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Maestro')).toBeInTheDocument();
  });

  it('renders a custom title and tenant name', () => {
    render(<MaestroHeader title="Orchestrator" tenantName="Production" />);
    expect(screen.getByText('Orchestrator')).toBeInTheDocument();
    expect(screen.getByText('Production')).toBeInTheDocument();
  });

  it('renders the search and AI actions as disabled', () => {
    render(<MaestroHeader />);
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'AI' })).toBeDisabled();
  });

  it('does not fire onSearchClick while search is disabled', async () => {
    const user = userEvent.setup();
    const onSearchClick = vi.fn();
    render(<MaestroHeader onSearchClick={onSearchClick} />);
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(onSearchClick).not.toHaveBeenCalled();
  });

  it('opens the notifications popover on click', async () => {
    const user = userEvent.setup();
    render(<MaestroHeader />);
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText('System update available')).toBeInTheDocument();
    expect(screen.getByText('Flow completed')).toBeInTheDocument();
  });

  it('switches tenants through the tenant selector popover', async () => {
    const user = userEvent.setup();
    render(<MaestroHeader tenantName="Select" />);

    await user.click(screen.getByText('Select'));
    await user.click(screen.getByRole('button', { name: 'Staging' }));
    // Close the popover so only the trigger's tenant label remains
    await user.keyboard('{Escape}');
    expect(screen.getByText('Staging')).toBeInTheDocument();
    expect(screen.queryByText('Select')).not.toBeInTheDocument();
  });

  it('toggles the app-launcher drawer when menuContent is provided', async () => {
    const user = userEvent.setup();
    render(<MaestroHeader menuContent={<div>Launcher items</div>} />);

    expect(screen.queryByText('Launcher items')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'App launcher' }));
    expect(screen.getByText('Launcher items')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<MaestroHeader />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
