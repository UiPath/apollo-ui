import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DAY, HOUR, MINUTE, SECOND, WEEK } from '../../../test/durations';
import { act, fireEvent, render, screen } from '../../utils/testing';
import { StageHeaderChipType, type StageNodeProps } from './StageNode.types';
import { StageNodeHeader } from './StageNodeHeader';

// Uses the real Radix tooltip (the shared setup stubs it out) to cover that the exact duration
// opens only when the header dropped units. Radix does not portal in happy-dom, so assertions
// use the trigger's `data-state`.
vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const renderHeader = (durationMs: number) => {
  const props = {
    id: 'stage-1',
    stageDetails: { label: 'Stage 1', tasks: [] },
    execution: { stageStatus: { durationMs }, taskStatus: {} },
  } as unknown as StageNodeProps;

  return render(
    <ReactFlowProvider>
      <StageNodeHeader
        props={props}
        isReadOnly={true}
        status={undefined}
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

describe('StageNodeHeader status pill tooltip (real CanvasTooltip)', () => {
  it('opens on keyboard focus and closes on blur and Escape', async () => {
    const user = userEvent.setup();
    const props = {
      id: 'stage-1',
      stageDetails: {
        label: 'Stage 1',
        tasks: [],
        headerChips: [
          { type: StageHeaderChipType.Optional, tooltip: 'Not required for case completion' },
        ],
      },
    } as unknown as StageNodeProps;
    render(
      <ReactFlowProvider>
        <StageNodeHeader
          props={props}
          isReadOnly={true}
          status={undefined}
          handleTaskAddClick={vi.fn()}
        />
      </ReactFlowProvider>
    );
    const pill = screen.getByTestId('stage-optional-badge-stage-1');

    await user.tab();
    expect(pill).toHaveFocus();
    expect(pill).toHaveAttribute('data-state', 'instant-open');

    await user.tab();
    expect(pill).toHaveAttribute('data-state', 'closed');

    await user.tab({ shift: true });
    expect(pill).toHaveAttribute('data-state', 'instant-open');
    await user.keyboard('{Escape}');
    expect(pill).toHaveAttribute('data-state', 'closed');
  });
});
