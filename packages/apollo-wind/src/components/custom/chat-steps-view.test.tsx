import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { StepsView } from './chat-steps-view';

describe('StepsView', () => {
  it('renders default flow name, status, and stats', () => {
    render(<StepsView />);
    expect(screen.getByText('Flow name')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('Last run')).toBeInTheDocument();
    expect(screen.getByText('Total runs')).toBeInTheDocument();
    expect(screen.getByText('32')).toBeInTheDocument();
  });

  it('renders custom flow metadata', () => {
    render(
      <StepsView
        flowName="Invoice pipeline"
        flowDescription="Processes vendor invoices"
        status="PAUSED"
        totalRuns={7}
      />
    );
    expect(screen.getByText('Invoice pipeline')).toBeInTheDocument();
    expect(screen.getByText('Processes vendor invoices')).toBeInTheDocument();
    expect(screen.getByText('PAUSED')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders the tab bar labels', () => {
    render(<StepsView />);
    expect(screen.getByText('Steps')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
  });

  it('renders provided steps including loop annotations', () => {
    render(
      <StepsView
        steps={[
          {
            id: 's1',
            title: 'Outlook',
            stepRange: 'Steps 1 - 3',
            description: 'Read unread messages',
          },
          {
            id: 's2',
            title: 'Excel loop',
            stepRange: 'Steps 4 - 8',
            description: 'unused when loop is set',
            loop: 'For each row in the sheet.',
          },
        ]}
      />
    );
    expect(screen.getByText('Outlook')).toBeInTheDocument();
    expect(screen.getByText('Read unread messages')).toBeInTheDocument();
    expect(screen.getByText('Excel loop')).toBeInTheDocument();
    expect(screen.getByText('Loop')).toBeInTheDocument();
    expect(screen.getByText(/For each row in the sheet\./)).toBeInTheDocument();
  });

  it('fires onBack when the back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<StepsView onBack={onBack} />);
    await user.click(screen.getByRole('button', { name: 'Go back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('fires onEdit and onPause from the action buttons', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onPause = vi.fn();
    render(<StepsView onEdit={onEdit} onPause={onPause} />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<StepsView />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
