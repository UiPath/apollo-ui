import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../utils/testing';
import type { StageTaskExecution, StageTaskItem } from './StageNode.types';
import { TaskContent } from './TaskContent';

// Surface CanvasTooltip content into the DOM so assertions don't depend on
// Radix's pointer-event-driven open/close logic (unreliable in jsdom).
vi.mock('../CanvasTooltip', () => ({
  CanvasTooltip: ({
    content,
    children,
  }: {
    content: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <span
      data-testid="canvas-tooltip"
      data-tooltip-content={typeof content === 'string' ? content : ''}
    >
      {children}
    </span>
  ),
}));

const baseTask: StageTaskItem = { id: 'task-1', label: 'Run extraction' };

const renderTaskContent = (overrides?: {
  task?: Partial<StageTaskItem>;
  taskExecution?: StageTaskExecution;
}) =>
  render(
    <TaskContent
      task={{ ...baseTask, ...overrides?.task }}
      taskExecution={overrides?.taskExecution}
    />
  );

describe('TaskContent - execution status tooltip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render a status icon button when no execution status is provided', () => {
    renderTaskContent();
    // The label-only button (truncation tooltip wrapper) doesn't have aria-label
    // matching a status; no button exists for the status icon.
    expect(screen.queryByRole('button', { name: 'In progress' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Completed' })).not.toBeInTheDocument();
  });

  it('renders a status icon button with the status name as aria-label when no host message is supplied', () => {
    renderTaskContent({ taskExecution: { status: 'Completed' } });
    expect(screen.getByRole('button', { name: 'Completed' })).toBeInTheDocument();
  });

  it('uses the host-supplied message as the aria-label so screen readers match the tooltip', () => {
    renderTaskContent({
      taskExecution: { status: 'Failed', message: 'Activity X threw NullReferenceException' },
    });
    expect(
      screen.getByRole('button', { name: 'Activity X threw NullReferenceException' })
    ).toBeInTheDocument();
  });

  it('uses the host-supplied message as tooltip content', () => {
    renderTaskContent({
      taskExecution: { status: 'Failed', message: 'Activity X threw NullReferenceException' },
    });

    const button = screen.getByRole('button', {
      name: 'Activity X threw NullReferenceException',
    });
    const tooltipWrapper = button.closest('[data-testid="canvas-tooltip"]');
    expect(tooltipWrapper).toHaveAttribute(
      'data-tooltip-content',
      'Activity X threw NullReferenceException'
    );
  });

  it('falls back to the status name as tooltip content when no host message is supplied', () => {
    renderTaskContent({ taskExecution: { status: 'InProgress' } });

    const button = screen.getByRole('button', { name: 'In progress' });
    const tooltipWrapper = button.closest('[data-testid="canvas-tooltip"]');
    expect(tooltipWrapper).toHaveAttribute('data-tooltip-content', 'In progress');
  });

  it('labels NotExecuted as "Not started"', () => {
    renderTaskContent({ taskExecution: { status: 'NotExecuted' } });
    expect(screen.getByRole('button', { name: 'Not started' })).toBeInTheDocument();
  });
});

describe('TaskContent - badge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Running again" when retryCount > 1 and status is InProgress', () => {
    renderTaskContent({
      taskExecution: { status: 'InProgress', duration: '1m', retryCount: 2, badge: 'Running' },
    });
    expect(screen.getByText('Running again')).toBeInTheDocument();
  });

  it('renders "Ran N times" when retryCount > 1 and status is not InProgress', () => {
    renderTaskContent({
      taskExecution: { status: 'Completed', duration: '1m', retryCount: 2, badge: 'Ran' },
    });
    expect(screen.getByText('Ran 2 times')).toBeInTheDocument();
  });

  it('interpolates the count into the plural form', () => {
    renderTaskContent({
      taskExecution: { status: 'Failed', duration: '1m', retryCount: 3, badge: 'Ran' },
    });
    expect(screen.getByText('Ran 3 times')).toBeInTheDocument();
  });

  it('overrides the consumer-supplied badge string when retryCount > 1', () => {
    renderTaskContent({
      taskExecution: {
        status: 'Completed',
        duration: '1m',
        retryCount: 2,
        badge: 'Reworked',
      },
    });
    expect(screen.getByText('Ran 2 times')).toBeInTheDocument();
    expect(screen.queryByText('Reworked')).not.toBeInTheDocument();
  });

  it('renders the consumer-supplied badge string as-is when retryCount is 1', () => {
    renderTaskContent({
      taskExecution: { status: 'Completed', duration: '1m', retryCount: 1, badge: 'Ran' },
    });
    expect(screen.getByText('Ran')).toBeInTheDocument();
  });

  it('renders the consumer-supplied badge string as-is when retryCount is 1 and status is InProgress', () => {
    renderTaskContent({
      taskExecution: { status: 'InProgress', duration: '1m', retryCount: 1, badge: 'Running' },
    });
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders the consumer-supplied badge string when retryCount is absent', () => {
    renderTaskContent({
      taskExecution: { status: 'Completed', duration: '1m', badge: 'Action needed' },
    });
    expect(screen.getByText('Action needed')).toBeInTheDocument();
  });

  it('renders no badge when no badge string is supplied (even if retryCount > 1)', () => {
    renderTaskContent({ taskExecution: { status: 'Completed', duration: '1m', retryCount: 2 } });
    expect(screen.queryByText(/Ran|Running/)).not.toBeInTheDocument();
  });

  it('renders no badge when neither retryCount nor a badge string is supplied', () => {
    renderTaskContent({ taskExecution: { status: 'Completed', duration: '1m' } });
    expect(screen.queryByText(/Ran|Running|Reworked/)).not.toBeInTheDocument();
  });
});

describe('TaskContent - duration tooltip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('wraps the duration text with a tooltip showing the durationTooltip content', () => {
    renderTaskContent({
      taskExecution: { status: 'InProgress', duration: '6s', durationTooltip: '4s remaining' },
    });

    const durationText = screen.getByText('6s');
    const tooltipWrapper = durationText.closest('[data-testid="canvas-tooltip"]');
    expect(tooltipWrapper).toHaveAttribute('data-tooltip-content', '4s remaining');
  });

  it('renders the duration text without a tooltip wrapper when no durationTooltip is supplied', () => {
    renderTaskContent({ taskExecution: { status: 'Completed', duration: '6s' } });

    const durationText = screen.getByText('6s');
    const tooltipWrapper = durationText.closest('[data-testid="canvas-tooltip"]');
    expect(tooltipWrapper).toBeNull();
  });
});
