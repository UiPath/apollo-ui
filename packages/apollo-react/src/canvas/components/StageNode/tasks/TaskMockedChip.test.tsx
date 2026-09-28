import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../../utils/testing';
import { TaskMockedChip } from './TaskMockedChip';

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

describe('TaskMockedChip', () => {
  it('renders nothing when the task is not mocked', () => {
    render(<TaskMockedChip taskId="t1" mocked={false} />);

    expect(screen.queryByTestId('stage-task-mocked-t1')).not.toBeInTheDocument();
  });

  it('renders a corner marker with an outputs-mocked tooltip when the task is mocked', () => {
    render(<TaskMockedChip taskId="t1" mocked={true} />);

    const chip = screen.getByTestId('stage-task-mocked-t1');
    expect(chip.closest('[data-testid="canvas-tooltip"]')).toHaveAttribute(
      'data-tooltip-content',
      "This task's outputs are mocked"
    );
  });

  it('sits at the top-right corner of the task card, mirroring the breakpoint dot', () => {
    render(<TaskMockedChip taskId="t1" mocked={true} />);

    expect(screen.getByTestId('stage-task-mocked-t1').parentElement).toHaveClass(
      'absolute',
      '-top-1.5',
      '-right-1.5'
    );
  });

  it('labels the marker for screen readers', () => {
    render(<TaskMockedChip taskId="t1" mocked={true} />);

    expect(screen.getByRole('img', { name: "This task's outputs are mocked" })).toBeInTheDocument();
  });
});
