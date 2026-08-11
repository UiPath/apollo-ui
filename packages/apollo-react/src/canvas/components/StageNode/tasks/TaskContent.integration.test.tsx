import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '../../../utils/testing';
import type { StageTaskExecution, StageTaskItem } from '../StageNode.types';
import { DraggableTask } from './DraggableTask';
import { TaskContent } from './TaskContent';

vi.mock('@uipath/apollo-react/canvas/xyflow/react', () => ({
  useStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ transform: [0, 0, 1] }),
}));

// Uses the real Radix tooltip (the shared setup stubs it out) to cover which element is the
// trigger and which one truncation measures. Radix does not portal in happy-dom, so assertions
// use the trigger's `data-state`.
vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const baseTask: StageTaskItem = { id: 'task-1', label: 'A very long task name that is truncated' };

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

// happy-dom resolves no Tailwind classes, so report the `truncate` styles for the
// element under test and drive scroll/client width to decide if it overflows.
function mockTruncation(element: HTMLElement, { overflowing }: { overflowing: boolean }) {
  const originalGetComputedStyle = window.getComputedStyle;
  vi.spyOn(window, 'getComputedStyle').mockImplementation((target) => {
    const style = originalGetComputedStyle.call(window, target);
    if (target !== element) {
      return style;
    }

    return new Proxy(style, {
      get(proxyTarget, prop, receiver) {
        if (prop === 'textOverflow') return 'ellipsis';
        if (prop === 'overflow') return 'hidden';
        if (prop === 'whiteSpace') return 'nowrap';
        // Report no line clamp so the width-based branch is the one exercised.
        if (prop === 'getPropertyValue') {
          return (property: string) =>
            property === '-webkit-line-clamp' ? '' : proxyTarget.getPropertyValue(property);
        }
        return Reflect.get(proxyTarget, prop, receiver);
      },
    });
  });

  Object.defineProperties(element, {
    clientWidth: { configurable: true, value: 120 },
    scrollWidth: { configurable: true, value: overflowing ? 320 : 120 },
  });
}

// Radix opens on pointer move (mouse only) after its delay.
function hover(element: HTMLElement) {
  fireEvent.mouseEnter(element);
  fireEvent.pointerMove(element, { pointerType: 'mouse' });
  act(() => {
    vi.advanceTimersByTime(500);
  });
}

describe('TaskContent tooltips (real CanvasTooltip)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('makes the truncating label element itself the tooltip trigger', () => {
    renderTaskContent();

    // Smart truncation measures its own trigger, so the trigger has to be the
    // element that ellipsises. A wrapper row never overflows (the span inside
    // it truncates instead), which would read as "not truncated" forever.
    expect(screen.getByTestId('stage-task-label-task-1')).toHaveAttribute('data-state');
  });

  it('shows the name tooltip on hover when the label is truncated', () => {
    vi.useFakeTimers();
    renderTaskContent();

    const label = screen.getByTestId('stage-task-label-task-1');
    mockTruncation(label, { overflowing: true });
    hover(label);

    expect(label).toHaveAttribute('data-state', 'delayed-open');
  });

  it('keeps the name tooltip closed when the label is not truncated', () => {
    vi.useFakeTimers();
    renderTaskContent({ task: { label: 'Short' } });

    const label = screen.getByTestId('stage-task-label-task-1');
    mockTruncation(label, { overflowing: false });
    hover(label);

    expect(label).toHaveAttribute('data-state', 'closed');
  });

  it('opens the runs chip tooltip on hover regardless of truncation', () => {
    vi.useFakeTimers();
    renderTaskContent({ taskExecution: { status: 'Completed', retryCount: 2 } });

    // The chip is a Badge, i.e. a component rather than a DOM element: it has to
    // forward the trigger ref so Radix has an anchor to position against.
    const chip = screen.getByTestId('stage-task-runs-task-1');
    hover(chip);

    expect(chip).toHaveAttribute('data-state', 'delayed-open');
  });

  it('opens the rework chip tooltip on hover', () => {
    vi.useFakeTimers();
    renderTaskContent({ taskExecution: { status: 'Completed', retryDuration: '25m' } });

    const chip = screen.getByTestId('stage-task-rework-task-1');
    hover(chip);

    expect(chip).toHaveAttribute('data-state', 'delayed-open');
  });

  // Read-only rows (monitoring, instance view) go through the same content, and
  // read-only is exactly where the run counts and full names matter most.
  it('keeps the name and runs chip tooltips on a read-only task row', () => {
    vi.useFakeTimers();
    render(
      <DraggableTask
        task={baseTask}
        taskExecution={{ status: 'Completed', retryCount: 2 }}
        isSelected={false}
        isParallel={false}
        onTaskClick={vi.fn()}
        isDragDisabled
        isReadOnly
      />
    );

    const label = screen.getByTestId('stage-task-label-task-1');
    mockTruncation(label, { overflowing: true });
    hover(label);
    expect(label).toHaveAttribute('data-state', 'delayed-open');

    const chip = screen.getByTestId('stage-task-runs-task-1');
    hover(chip);
    expect(chip).toHaveAttribute('data-state', 'delayed-open');
  });
});
