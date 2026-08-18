import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { type CSSProperties, memo, type ReactNode, useMemo } from 'react';
import {
  StageTaskDragPlaceholder,
  StageTaskDragPlaceholderWrapper,
  StageTaskWrapper,
} from '../StageNode.styles';

/**
 * Makes an existing task row draggable without changing how it renders — the flat sections keep
 * their own row components and this supplies only the sortable wrapper and the drag transform.
 *
 * Rendered only when the section is reorderable: `useSortable` belongs under a `DndContext` +
 * `SortableContext`, and a read-only section mounts neither, so its rows render bare and produce
 * the same markup they did before reordering existed. Used by all three sections.
 */
const SortableTaskRowComponent = ({
  taskId,
  isParallel,
  children,
}: {
  taskId: string;
  isParallel?: boolean;
  children: ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transition, transform, isDragging } = useSortable({
    id: taskId,
  });

  // Zoom only matters while a drag transform exists; idle rows resolve a constant so canvas
  // zoom changes don't re-render every task.
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

  // While the row is being dragged the overlay carries the card, so its own slot shows a dashed
  // outline of where it will land.
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
    >
      {children}
    </StageTaskWrapper>
  );
};

export const SortableTaskRow = memo(SortableTaskRowComponent);
