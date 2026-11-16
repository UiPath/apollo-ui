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
import { StageTaskDragPlaceholder, StageTaskWrapper } from '../StageNode.styles';
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
      // While the task is picked up its keys belong to the drag. Keys pressed on the task's own
      // controls, such as its menu button, belong to them.
      // A held key repeats its keydown; act on the first press only.
      if (isDragging || e.repeat || e.target !== e.currentTarget) {
        return;
      }
      if (e.key === 'Enter') {
        onActivate(e, taskId);
      } else {
        startKeyboardDrag?.(e);
      }
    },
    [isDragging, onActivate, startKeyboardDrag, taskId]
  );

  // Constant while idle, so canvas zoom doesn't re-render every row.
  const zoom = useStore((s) => (transform ? s.transform[2] : 1));

  const style = useMemo<CSSProperties>(
    () => ({
      transition,
      transform: CSS.Transform.toString(
        transform ? { ...transform, x: transform.x / zoom, y: transform.y / zoom } : null
      ),
      // The drop slot keeps the full task width, as it always has, even in a parallel group.
      ...(isDragging && { width: 'var(--stage-task-width, 246px)' }),
    }),
    [transform, zoom, transition, isDragging]
  );

  // The row stays mounted while the task is picked up, so keyboard focus stays on it for the whole
  // drag. The overlay carries the card; the row shows where it lands.
  return (
    <StageTaskWrapper
      ref={setNodeRef}
      style={style}
      isParallel={isParallel}
      {...attributes}
      {...listeners}
      onKeyDown={handleKeyDown}
    >
      {isDragging ? <StageTaskDragPlaceholder isTargetParallel={isParallel} /> : children}
    </StageTaskWrapper>
  );
};

export const SortableTaskRow = memo(SortableTaskRowComponent);
