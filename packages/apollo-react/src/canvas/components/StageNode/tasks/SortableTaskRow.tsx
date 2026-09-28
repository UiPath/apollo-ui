import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { type CSSProperties, memo, type ReactNode, useMemo } from 'react';
import {
  StageTaskDragPlaceholder,
  StageTaskDragPlaceholderWrapper,
  StageTaskWrapper,
} from '../StageNode.styles';

/** Wraps a task row in a sortable, leaving how it renders alone. Mounted only where the section
 * has a DndContext, so `useSortable` never runs outside its provider. */
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
    >
      {children}
    </StageTaskWrapper>
  );
};

export const SortableTaskRow = memo(SortableTaskRowComponent);
