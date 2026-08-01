import { memo, useCallback } from 'react';
import { useSafeLingui } from '../../../i18n';
import { CanvasTooltip } from '../CanvasTooltip';

export interface TaskBreakpointDotProps {
  /** Whether a breakpoint is set (placed) on this task. */
  active: boolean;
  /** Task id, used for a stable test id. */
  taskId: string;
  /**
   * Whether the run is currently stopped on this breakpoint. A set breakpoint is a static dot;
   * the one execution is paused at pulses, so it can be found without reading the whole stage.
   */
  paused?: boolean;
  /**
   * Adds or removes this task's breakpoint. Supplied only in the Debug view: there the marker
   * becomes a button, and an empty gutter offers a ghosted dot on hover. Omit it and the marker
   * stays display-only, as it is at design time — where a red dot on every hover would be noise
   * and breakpoints belong in the right-click menu.
   */
  onToggle?: (taskId: string) => void;
}

const DOT = 'absolute -top-1.5 -left-1.5 z-10 h-3.5 w-3.5 rounded-full bg-(--canvas-error-icon)';

/**
 * Breakpoint marker for a stage task, at the top-left corner of the task card.
 *
 * Mirrors the Flow/BPMN canvas breakpoint (`ExecutionBreakpoint`): a 14px solid circle filled
 * with the canvas error-icon color, no border or shadow; an unset one ghosts in at 0.5 opacity
 * while the row is hovered, and a click toggles it. While the run is stopped on it, a ring pulses
 * out of it (`.task-breakpoint-paused`, see StageNode.styles).
 *
 * Without `onToggle` it renders nothing until a breakpoint is set and never intercepts pointer
 * events — the display-only marker used at design time.
 */
function TaskBreakpointDotInner({ active, taskId, paused, onToggle }: TaskBreakpointDotProps) {
  const { _ } = useSafeLingui();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // The corner sits on the task card, which selects on click and drags on pointer-down.
      e.stopPropagation();
      onToggle?.(taskId);
    },
    [onToggle, taskId]
  );

  const stopPointerDown = useCallback((e: React.PointerEvent) => e.stopPropagation(), []);
  const pulse = active && paused ? 'task-breakpoint-paused ' : '';

  if (!onToggle) {
    return active ? (
      <span
        data-testid={`stage-task-breakpoint-${taskId}`}
        className={`${pulse}pointer-events-none ${DOT}`}
      />
    ) : null;
  }

  const label = active
    ? _({ id: 'stage-node.breakpoint.remove', message: 'Click to remove the breakpoint' })
    : _({ id: 'stage-node.breakpoint.add', message: 'Click to add a breakpoint' });

  return (
    <CanvasTooltip content={label} placement="top">
      <button
        type="button"
        data-testid={
          active ? `stage-task-breakpoint-${taskId}` : `stage-task-add-breakpoint-${taskId}`
        }
        aria-label={label}
        className={active ? `${pulse}${DOT}` : `task-breakpoint-add ${DOT}`}
        onClick={handleClick}
        onPointerDown={stopPointerDown}
      />
    </CanvasTooltip>
  );
}

export const TaskBreakpointDot = memo(TaskBreakpointDotInner);
