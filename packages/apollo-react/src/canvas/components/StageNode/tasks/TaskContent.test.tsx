import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DAY, HOUR, MINUTE, SECOND, WEEK } from '../../../../test/durations';
import { render, screen } from '../../../utils/testing';
import type { StageTaskExecution, StageTaskItem } from '../StageNode.types';
import { TaskContent } from './TaskContent';

// Surface CanvasTooltip content into the DOM so assertions don't depend on
// Radix's pointer-event-driven open/close logic (unreliable in jsdom).
vi.mock('../../CanvasTooltip', () => ({
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

  it('falls back to the exact duration when units were dropped to fit the row', () => {
    // 2 weeks, 19 hr, 8 min, 42 sec -> the row shows the three largest, the tooltip all four.
    renderTaskContent({
      taskExecution: {
        status: 'Completed',
        durationMs: 2 * WEEK + 19 * HOUR + 8 * MINUTE + 42 * SECOND,
      },
    });

    const durationText = screen.getByText('2w, 19h, 8m');
    expect(durationText.closest('[data-testid="canvas-tooltip"]')).toHaveAttribute(
      'data-tooltip-content',
      '2 weeks, 19 hours, 8 minutes, 42 seconds'
    );
  });

  it('adds no duration tooltip when the row already shows every unit', () => {
    renderTaskContent({ taskExecution: { status: 'Completed', durationMs: 16000 } });

    const durationText = screen.getByText('16s');
    expect(durationText.closest('[data-testid="canvas-tooltip"]')).toBeNull();
  });

  it('keeps a consumer-supplied durationTooltip in front of the exact duration', () => {
    renderTaskContent({
      taskExecution: {
        status: 'InProgress',
        durationMs: 2 * WEEK + 19 * HOUR + 8 * MINUTE + 42 * SECOND,
        durationTooltip: '4s remaining',
      },
    });

    const durationText = screen.getByText('2w, 19h, 8m');
    expect(durationText.closest('[data-testid="canvas-tooltip"]')).toHaveAttribute(
      'data-tooltip-content',
      '4s remaining'
    );
  });

  it('adds no duration tooltip to a legacy pre-formatted duration', () => {
    renderTaskContent({ taskExecution: { status: 'Completed', duration: '2w, 19h, 8m' } });

    const durationText = screen.getByText('2w, 19h, 8m');
    expect(durationText.closest('[data-testid="canvas-tooltip"]')).toBeNull();
  });

  it('shows only the three largest duration units', () => {
    // 2 days, 3 hr, 4 min, 5 sec — the seconds are dropped.
    renderTaskContent({
      taskExecution: {
        status: 'InProgress',
        durationMs: 2 * DAY + 3 * HOUR + 4 * MINUTE + 5 * SECOND,
      },
    });

    expect(screen.getByText('2d, 3h, 4m')).toBeInTheDocument();
    // Narrow renders seconds as "s", so assert the dropped value itself rather than "sec".
    expect(screen.queryByText(/5s/)).not.toBeInTheDocument();
  });

  it('renders a legacy pre-formatted duration verbatim', () => {
    renderTaskContent({
      taskExecution: { status: 'InProgress', duration: '2h 15m' },
    });

    expect(screen.getByText('2h 15m')).toBeInTheDocument();
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

  it('uses a tight SVG box around the entry-condition diamond', () => {
    const { container } = renderTaskContent({ task: { hasEntryCondition: true } });
    const icon = getEntryIcon(container);
    expect(icon).toHaveAttribute('width', '13');
    expect(icon).toHaveAttribute('height', '15');
    expect(icon).toHaveAttribute('viewBox', '3.5 2.5 13 15');
  });

  it('keeps the tight entry-condition box when the task has execution details', () => {
    const { container } = renderTaskContent({
      task: { hasEntryCondition: true },
      taskExecution: { status: 'Completed', duration: '1m' },
    });
    const icon = getEntryIcon(container);
    expect(icon).toHaveAttribute('width', '13');
    expect(icon).toHaveAttribute('height', '15');
    expect(icon).toHaveAttribute('viewBox', '3.5 2.5 13 15');
  });

  it('places the entry condition before the task-type icon in the leading group', () => {
    const { container } = renderTaskContent({ task: { hasEntryCondition: true } });
    const icon = getEntryIcon(container);
    const identity = screen.getByTestId(`stage-task-identity-${baseTask.id}`);
    const leadingIcons = identity.firstElementChild;

    expect(leadingIcons).toHaveStyle({ gap: '4px' });
    expect(icon?.closest('[data-testid="canvas-tooltip"]')).toBe(leadingIcons?.firstElementChild);
    expect(screen.getByTestId(`stage-task-actions-${baseTask.id}`)).not.toContainElement(icon);
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
