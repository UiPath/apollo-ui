import { DragOverlay } from '@dnd-kit/core';
import { useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { StageTask } from './StageNode.styles';
import type { StageTaskDragOverlayProps } from './StageNode.types';
import { TaskContent } from './TaskContent';

export const StageTaskDragOverlay = ({
  activeTask,
  isActiveTaskParallel,
  taskWidthStyle,
}: StageTaskDragOverlayProps) => {
  // Only track zoom while a drag is active; otherwise the selector returns a
  // constant so idle overlays don't re-render on every canvas zoom change.
  const zoom = useStore((state) => (activeTask ? state.transform[2] : 1));
  const dragOverlayStyle = useMemo<React.CSSProperties>(
    () => ({
      transform: `scale(${zoom})`,
      transformOrigin: 'top left',
    }),
    [zoom]
  );

  if (!activeTask) {
    return null;
  }

  return createPortal(
    <DragOverlay>
      <div style={dragOverlayStyle}>
        <StageTask
          selected
          isParallel={isActiveTaskParallel}
          style={{ cursor: 'grabbing', ...taskWidthStyle }}
        >
          <TaskContent task={activeTask} isDragging />
        </StageTask>
      </div>
    </DragOverlay>,
    document.body
  );
};
