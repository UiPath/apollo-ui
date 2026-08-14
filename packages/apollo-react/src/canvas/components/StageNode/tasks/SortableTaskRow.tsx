import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useMemo } from 'react';
import { StageTaskWrapper } from '../StageNode.styles';

/**
 * Makes an existing task row draggable without changing how it renders — the flat sections keep
 * their own row components and this supplies only the sortable wrapper and the drag transform.
 * With `disabled` it renders nothing of its own, so a read-only stage is byte-identical to before.
 */
const SortableTaskRowComponent = ({
  taskId,
  disabled,
  children,
}: {
  taskId: string;
  disabled?: boolean;
  children: React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transition, transform } = useSortable({
    id: taskId,
    disabled,
  });

  // Zoom only matters while a drag transform exists; idle rows resolve a constant so canvas
  // zoom changes don't re-render every task. Mirrors DraggableTask.
  const zoom = useStore((s) => (transform ? s.transform[2] : 1));

  const style = useMemo<React.CSSProperties>(
    () => ({
      transition,
      transform: CSS.Transform.toString(
        transform ? { ...transform, x: transform.x / zoom, y: transform.y / zoom } : null
      ),
    }),
    [transform, zoom, transition]
  );

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <StageTaskWrapper ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </StageTaskWrapper>
  );
};

export const SortableTaskRow = memo(SortableTaskRowComponent);
