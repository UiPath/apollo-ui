import { DragOverlay } from '@dnd-kit/core';
import { useViewport } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TaskContent } from './DraggableTask';
import { StageTask } from './StageNode.styles';
import type { StageTaskDragOverlayProps } from './StageNode.types';

export const StageTaskDragOverlay = ({
  activeTask,
  isActiveTaskParallel,
  taskWidthStyle,
}: StageTaskDragOverlayProps) => {
  const { zoom } = useViewport();
  const dragOverlayStyle = useMemo<React.CSSProperties>(
    () => ({
      transform: `scale(${zoom})`,
      transformOrigin: 'top left',
    }),
    [zoom]
  );

  return createPortal(
    <DragOverlay>
      {activeTask ? (
        <div style={dragOverlayStyle}>
          <StageTask
            selected
            isParallel={isActiveTaskParallel}
            style={{ cursor: 'grabbing', ...taskWidthStyle }}
          >
            <TaskContent task={activeTask} isDragging />
          </StageTask>
        </div>
      ) : null}
    </DragOverlay>,
    document.body
  );
};
