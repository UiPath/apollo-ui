import { describe, expect, it } from 'vitest';
import { render, screen } from '../../utils/testing';
import { TaskBreakpointDot } from './TaskBreakpointDot';

// The marker is display-only; adding/removing breakpoints is done via the task's
// right-click menu (consumer-supplied). These tests cover the marker itself.
describe('TaskBreakpointDot', () => {
  it('renders nothing when no breakpoint is set', () => {
    render(<TaskBreakpointDot taskId="t1" active={false} />);

    expect(screen.queryByTestId('stage-task-breakpoint-t1')).not.toBeInTheDocument();
  });

  it('renders a solid marker when a breakpoint is set', () => {
    render(<TaskBreakpointDot taskId="t1" active={true} />);

    expect(screen.getByTestId('stage-task-breakpoint-t1')).toBeInTheDocument();
  });

  it('is display-only and never intercepts pointer events', () => {
    // Breakpoints are managed via the task menu / hover toolbar; the marker itself
    // must let clicks/drags on the card corner pass through to the task.
    render(<TaskBreakpointDot taskId="t1" active={true} />);

    expect(screen.getByTestId('stage-task-breakpoint-t1')).toHaveClass('pointer-events-none');
  });

  it('is static: the marker never animates (matches Flow, which does not pulse)', () => {
    const { container } = render(<TaskBreakpointDot taskId="t1" active={true} />);

    expect(container.querySelector('[class*="animate-"]')).not.toBeInTheDocument();
  });
});
