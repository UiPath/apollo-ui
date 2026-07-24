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

describe('TaskContent - runs chip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the total-run count (retryCount + 1) with a "Ran N times" tooltip when not InProgress', () => {
    renderTaskContent({
      taskExecution: { status: 'Completed', duration: '1m', retryCount: 2 },
    });
    // retryCount = 2 re-runs => 3 total runs.
    const chip = screen.getByText('3');
    expect(chip.closest('[data-testid="canvas-tooltip"]')).toHaveAttribute(
      'data-tooltip-content',
      'Ran 3 times'
    );
  });

  it('shows a "Running again" tooltip while the task is InProgress', () => {
    renderTaskContent({
      taskExecution: { status: 'InProgress', duration: '1m', retryCount: 2 },
    });
    const chip = screen.getByText('3');
    expect(chip.closest('[data-testid="canvas-tooltip"]')).toHaveAttribute(
      'data-tooltip-content',
      'Running again'
    );
  });

  it('interpolates the total-run count into the plural tooltip form', () => {
    renderTaskContent({
      taskExecution: { status: 'Failed', duration: '1m', retryCount: 3 },
    });
    const chip = screen.getByText('4');
    expect(chip.closest('[data-testid="canvas-tooltip"]')).toHaveAttribute(
      'data-tooltip-content',
      'Ran 4 times'
    );
  });

  it('shows the runs chip for a single re-run (retryCount 1 => 2 runs)', () => {
    renderTaskContent({
      taskExecution: { status: 'Completed', duration: '1m', retryCount: 1 },
    });
    const chip = screen.getByText('2');
    expect(chip.closest('[data-testid="canvas-tooltip"]')).toHaveAttribute(
      'data-tooltip-content',
      'Ran 2 times'
    );
  });

  it('does not show the runs chip when there were no re-runs', () => {
    renderTaskContent({ taskExecution: { status: 'Completed', duration: '1m' } });
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('suppresses a retry-driven consumer badge string in favour of the runs chip', () => {
    renderTaskContent({
      taskExecution: { status: 'Completed', duration: '1m', retryCount: 2, badge: 'Ran 3 times' },
    });
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('Ran 3 times', { selector: 'div' })).not.toBeInTheDocument();
  });
});

describe('TaskContent - rework chip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the rework chip with the added-time tooltip when a rework duration is present', () => {
    const { container } = renderTaskContent({
      taskExecution: {
        status: 'Completed',
        duration: '1h 30m',
        retryCount: 2,
        retryDuration: '25m',
      },
    });
    const tooltip = container.querySelector('[data-tooltip-content="Reworked (+25m)"]');
    expect(tooltip).not.toBeNull();
  });

  it('does not show the rework chip when there is no rework duration', () => {
    const { container } = renderTaskContent({
      taskExecution: { status: 'Completed', duration: '1m', retryCount: 2 },
    });
    expect(container.querySelector('[data-tooltip-content^="Reworked"]')).toBeNull();
  });
});

describe('TaskContent - badge suppression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render a consumer-supplied badge string (only runs/rework chips are shown)', () => {
    renderTaskContent({
      taskExecution: { status: 'Completed', duration: '1m', badge: 'Action needed' },
    });
    expect(screen.queryByText('Action needed')).not.toBeInTheDocument();
  });

  it('renders no chip when there are no runs and no rework', () => {
    renderTaskContent({ taskExecution: { status: 'Completed', duration: '1m' } });
    expect(screen.queryByText(/Ran|Running|Reworked|Action/)).not.toBeInTheDocument();
  });
});

describe('TaskContent - required marker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the "*" marker for a required non-adhoc task', () => {
    renderTaskContent({ task: { isRequired: true } });
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('hides the "*" marker for a required adhoc task (isAdhoc)', () => {
    renderTaskContent({ task: { isRequired: true, isAdhoc: true } });
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('hides the "*" marker for a required adhoc task (taskGroupType)', () => {
    renderTaskContent({ task: { isRequired: true, taskGroupType: 'adhoc' } });
    expect(screen.queryByText('*')).not.toBeInTheDocument();
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

  it('renders a 20px entry-condition diamond even when the task has execution details', () => {
    const { container } = renderTaskContent({
      task: { hasEntryCondition: true },
      taskExecution: { status: 'Completed', duration: '1m' },
    });
    const icon = getEntryIcon(container);
    expect(icon).toHaveAttribute('width', '20');
    expect(icon).toHaveAttribute('height', '20');
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

  it('renders the play button for executed tasks alongside their execution details', () => {
    renderTaskContent({
      onTaskPlay: vi.fn(async () => {}),
      taskExecution: { status: 'Completed', duration: '1m' },
    });
    const playButton = screen.getByTestId(playButtonId);
    expect(playButton).toBeInTheDocument();
    // Now rendered inline on the single row — no shrunk "small" variant.
    expect(playButton.className).not.toContain('[&_svg]:size-3.5');
  });

  it('renders no play button for executed tasks without a play handler', () => {
    renderTaskContent({ taskExecution: { status: 'Completed', duration: '1m' } });
    expect(screen.queryByTestId(playButtonId)).not.toBeInTheDocument();
  });
});
