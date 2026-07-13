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
  onTaskPlay?: (taskId: string) => Promise<void>;
}) =>
  render(
    <TaskContent
      task={{ ...baseTask, ...overrides?.task }}
      taskExecution={overrides?.taskExecution}
      onTaskPlay={overrides?.onTaskPlay}
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

describe('TaskContent - entry-condition icon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getEntryIcon = (container: HTMLElement) =>
    container.querySelector('[data-tooltip-content="Entry condition"] svg');

  it('renders no entry-condition icon when the task has none', () => {
    const { container } = renderTaskContent();
    expect(getEntryIcon(container)).toBeNull();
  });

  it('renders a 20px entry-condition diamond on a single-row task', () => {
    const { container } = renderTaskContent({ task: { hasEntryCondition: true } });
    const icon = getEntryIcon(container);
    expect(icon).toHaveAttribute('width', '20');
    expect(icon).toHaveAttribute('height', '20');
  });

  it('renders a 16px entry-condition diamond on a task with second-row content', () => {
    const { container } = renderTaskContent({
      task: { hasEntryCondition: true },
      taskExecution: { status: 'Completed', duration: '1m' },
    });
    const icon = getEntryIcon(container);
    expect(icon).toHaveAttribute('width', '16');
    expect(icon).toHaveAttribute('height', '16');
  });
});

describe('TaskContent - play button placement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const playButtonId = `stage-task-play-${baseTask.id}`;

  it('renders a play button with an accessible name when a play handler is supplied', () => {
    renderTaskContent({ onTaskPlay: vi.fn(async () => {}) });
    expect(screen.getByRole('button', { name: 'Trigger task' })).toBeInTheDocument();
    expect(screen.getByTestId(playButtonId)).toBeInTheDocument();
  });

  it('renders no play button when no play handler is supplied', () => {
    renderTaskContent();
    expect(screen.queryByTestId(playButtonId)).not.toBeInTheDocument();
  });

  it('renders the small play button on the second row for executed tasks with row content', () => {
    renderTaskContent({
      onTaskPlay: vi.fn(async () => {}),
      taskExecution: { status: 'Completed', duration: '1m' },
    });
    const playButton = screen.getByTestId(playButtonId);
    // small variant shrinks the icon via the button's descendant selector
    expect(playButton.className).toContain('[&_svg]:size-3.5');
  });

  it('renders no play button for executed tasks without a play handler', () => {
    renderTaskContent({ taskExecution: { status: 'Completed', duration: '1m' } });
    expect(screen.queryByTestId(playButtonId)).not.toBeInTheDocument();
  });
});
