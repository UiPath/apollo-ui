import { memo } from 'react';

export interface TaskBreakpointDotProps {
  /** Whether a breakpoint is set (placed) on this task. */
  active: boolean;
  /** Task id, used for a stable test id. */
  taskId: string;
}

/**
 * Breakpoint marker for a stage task, at the top-left corner of the task card.
 *
 * Mirrors the Flow/BPMN canvas breakpoint (`DebugBreakpoint`): a 14px solid circle
 * filled with the canvas error-icon color, no border, shadow, or animation.
 *
 * Display only: it renders nothing until a breakpoint is set and never intercepts
 * pointer events. Adding and removing breakpoints is done through the task's
 * right-click menu (items supplied by the consumer via `getTaskContextMenuItems`).
 */
function TaskBreakpointDotInner({ active, taskId }: TaskBreakpointDotProps) {
  if (!active) {
    return null;
  }

  return (
    <span
      data-testid={`stage-task-breakpoint-${taskId}`}
      className="pointer-events-none absolute -top-1.5 -left-1.5 z-10 h-3.5 w-3.5 rounded-full bg-(--canvas-error-icon)"
    />
  );
}

export const TaskBreakpointDot = memo(TaskBreakpointDotInner);
