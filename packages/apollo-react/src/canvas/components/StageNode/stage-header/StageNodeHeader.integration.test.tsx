import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DAY, HOUR, MINUTE, SECOND, WEEK } from '../../../../test/durations';
import { act, fireEvent, render, screen } from '../../../utils/testing';
import { StageNodeHeader } from './StageNodeHeader';

// Uses the real Radix tooltip (the shared setup stubs it out) to cover that the exact duration
// opens only when the header dropped units. Radix does not portal in happy-dom, so assertions
// use the trigger's `data-state`.
vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const renderHeader = (durationMs: number) => {
  return render(
    <ReactFlowProvider>
      <StageNodeHeader
        id="stage-1"
        stageLabel="Stage 1"
        stageStatus={{ durationMs }}
        isReadOnly={true}
        onStatusClick={undefined}
        onTaskAdd={undefined}
        onAddTaskFromToolbox={undefined}
        onStageTitleChange={undefined}
        handleTaskAddClick={vi.fn()}
      />
    </ReactFlowProvider>
  );
};

function hover(element: HTMLElement) {
  fireEvent.mouseEnter(element);
  fireEvent.pointerMove(element, { pointerType: 'mouse' });
  act(() => {
    vi.advanceTimersByTime(500);
  });
}

describe('StageNodeHeader duration tooltip (real CanvasTooltip)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('opens the exact duration when the header dropped units', () => {
    vi.useFakeTimers();
    renderHeader(3 * WEEK + 1 * DAY + 20 * HOUR + 14 * MINUTE + 3 * SECOND);

    const duration = screen.getByTestId('stage-duration-stage-1');
    expect(duration).toHaveTextContent('3w, 1d, 20h');

    hover(duration);
    expect(duration).toHaveAttribute('data-state', 'delayed-open');
  });

  it('stays closed when the header already shows every unit', () => {
    vi.useFakeTimers();
    renderHeader(2 * HOUR + 4 * MINUTE);

    const duration = screen.getByTestId('stage-duration-stage-1');
    expect(duration).toHaveTextContent('2h, 4m');

    hover(duration);
    expect(duration).toHaveAttribute('data-state', 'closed');
  });
});
