import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../utils/testing';
import { TaskBreakpointDot } from './TaskBreakpointDot';

describe('TaskBreakpointDot', () => {
  // Design time: no toggle handler, so the marker is inert and breakpoints are
  // managed through the task's right-click menu.
  describe('without a toggle handler', () => {
    it('renders nothing when no breakpoint is set', () => {
      render(<TaskBreakpointDot taskId="t1" active={false} />);

      expect(screen.queryByTestId('stage-task-breakpoint-t1')).not.toBeInTheDocument();
    });

    it('renders a solid marker when a breakpoint is set', () => {
      render(<TaskBreakpointDot taskId="t1" active={true} />);

      expect(screen.getByTestId('stage-task-breakpoint-t1')).toBeInTheDocument();
    });

    it('is display-only and never intercepts pointer events', () => {
      // The marker must let clicks/drags on the card corner pass through to the task.
      render(<TaskBreakpointDot taskId="t1" active={true} />);

      expect(screen.getByTestId('stage-task-breakpoint-t1')).toHaveClass('pointer-events-none');
    });

    it('offers no add affordance', () => {
      render(<TaskBreakpointDot taskId="t1" active={false} />);

      expect(screen.queryByTestId('stage-task-add-breakpoint-t1')).not.toBeInTheDocument();
    });

    it('is static while the breakpoint is only armed', () => {
      render(<TaskBreakpointDot taskId="t1" active={true} />);

      expect(screen.getByTestId('stage-task-breakpoint-t1')).not.toHaveClass('animate-glow');
    });
  });

  // The run stopping on a breakpoint is what makes its marker pulse, via apollo-wind's
  // `animate-glow` utility — which also gives it prefers-reduced-motion handling.
  describe('when the run is paused on it', () => {
    it('pulses the marker', () => {
      render(<TaskBreakpointDot taskId="t1" active={true} paused={true} />);

      expect(screen.getByTestId('stage-task-breakpoint-t1')).toHaveClass('animate-glow');
    });

    it('pulses the marker in the Debug view too, where it is a button', () => {
      render(<TaskBreakpointDot taskId="t1" active={true} paused={true} onToggle={vi.fn()} />);

      expect(screen.getByTestId('stage-task-breakpoint-t1')).toHaveClass('animate-glow');
    });

    it('does not pulse the ghosted add affordance when no breakpoint is set', () => {
      render(<TaskBreakpointDot taskId="t1" active={false} paused={true} onToggle={vi.fn()} />);

      expect(screen.getByTestId('stage-task-add-breakpoint-t1')).not.toHaveClass('animate-glow');
    });
  });

  // Debug view: the gutter becomes clickable in both directions.
  describe('with a toggle handler', () => {
    it('removes the breakpoint when the solid marker is clicked', async () => {
      const onToggle = vi.fn();
      const user = userEvent.setup();
      render(<TaskBreakpointDot taskId="t1" active={true} onToggle={onToggle} />);

      await user.click(screen.getByTestId('stage-task-breakpoint-t1'));

      expect(onToggle).toHaveBeenCalledWith('t1');
    });

    it('adds a breakpoint when the ghosted marker is clicked', async () => {
      const onToggle = vi.fn();
      const user = userEvent.setup();
      render(<TaskBreakpointDot taskId="t1" active={false} onToggle={onToggle} />);

      await user.click(screen.getByTestId('stage-task-add-breakpoint-t1'));

      expect(onToggle).toHaveBeenCalledWith('t1');
    });

    it('keeps the add affordance out of the way until the row is hovered', () => {
      render(<TaskBreakpointDot taskId="t1" active={false} onToggle={vi.fn()} />);

      // Opacity is driven by StageTask's `:hover .task-breakpoint-add` rule.
      expect(screen.getByTestId('stage-task-add-breakpoint-t1')).toHaveClass('task-breakpoint-add');
    });

    it('does not ghost a marker that is already set', () => {
      render(<TaskBreakpointDot taskId="t1" active={true} onToggle={vi.fn()} />);

      expect(screen.getByTestId('stage-task-breakpoint-t1')).not.toHaveClass('task-breakpoint-add');
    });

    it('labels each direction so the action is clear before clicking', () => {
      const { rerender } = render(
        <TaskBreakpointDot taskId="t1" active={false} onToggle={vi.fn()} />
      );
      expect(screen.getByRole('button', { name: 'Click to add a breakpoint' })).toBeInTheDocument();

      rerender(<TaskBreakpointDot taskId="t1" active={true} onToggle={vi.fn()} />);
      expect(
        screen.getByRole('button', { name: 'Click to remove the breakpoint' })
      ).toBeInTheDocument();
    });
  });
});
