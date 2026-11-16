import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  type CSSProperties,
  type KeyboardEvent,
  memo,
  type ReactNode,
  useCallback,
  useMemo,
} from 'react';
import {
  StageTaskDragPlaceholder,
  StageTaskDragPlaceholderWrapper,
  StageTaskWrapper,
} from '../StageNode.styles';
import type { StageTaskActivationEvent } from '../StageNode.types';

/** Wraps a task row in a sortable, leaving how it renders alone. Mounted only where the section
 * has a DndContext, so `useSortable` never runs outside its provider.
 *
 * The row is the task's tab stop: Enter opens the task through `onActivate`, as a click does, and
 * Space picks it up to reorder it. */
const SortableTaskRowComponent = ({
  taskId,
  isParallel,
  onActivate,
  children,
}: {
  taskId: string;
  isParallel?: boolean;
  onActivate: (e: StageTaskActivationEvent, taskId: string) => void;
  children: ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transition, transform, isDragging } = useSortable({
    id: taskId,
  });

  const startKeyboardDrag = listeners?.onKeyDown;
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      // Enter and Space act on the task or one of its controls, so the canvas node must not also
      // take them as a request to select the stage.
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopPropagation();
      }
      // Keys pressed on the task's own controls, such as its menu button, belong to them.
      if (e.target !== e.currentTarget) {
        return;
      }
      if (e.key === 'Enter') {
        onActivate(e, taskId);
      } else {
        startKeyboardDrag?.(e);
      }
    },
    [onActivate, startKeyboardDrag, taskId]
  );

  // Constant while idle, so canvas zoom doesn't re-render every row.
  const zoom = useStore((s) => (transform ? s.transform[2] : 1));

  const style = useMemo<CSSProperties>(
    () => ({
      transition,
      transform: CSS.Transform.toString(
        transform ? { ...transform, x: transform.x / zoom, y: transform.y / zoom } : null
      ),
    }),
    [transform, zoom, transition]
  );

  // The overlay carries the card; this slot shows where it lands.
  if (isDragging) {
    return (
      <StageTaskDragPlaceholderWrapper ref={setNodeRef} style={style}>
        <StageTaskDragPlaceholder isTargetParallel={isParallel} />
      </StageTaskDragPlaceholderWrapper>
    );
  }

  return (
    <StageTaskWrapper
      ref={setNodeRef}
      style={style}
      isParallel={isParallel}
      {...attributes}
      {...listeners}
      onKeyDown={handleKeyDown}
    >
      {children}
    </StageTaskWrapper>
  );
};

export const SortableTaskRow = memo(SortableTaskRowComponent);
