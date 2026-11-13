import { memo, useCallback } from 'react';
import { FloatingCanvasPanel } from '../../FloatingCanvasPanel';
import { useSetNodeSelection } from '../../NodePropertiesPanel/hooks';
import { type ListItem, Toolbox } from '../../Toolbox';
import type { StageNodeProps } from '../StageNode.types';
import { useStageNodeLabels } from '../useStageNodeLabels';

interface StageNodeAddTaskToolboxInnerProps {
  id: string;
  taskOptions: ListItem[];
  isReadOnly: boolean;
  onAddTaskFromToolbox: StageNodeProps['onAddTaskFromToolbox'];
  onTaskToolboxSearch: StageNodeProps['onTaskToolboxSearch'];
  isAddingTask: boolean;
  setIsAddingTask: (isAddingTask: boolean) => void;
}

const StageNodeAddTaskToolboxInner = ({
  id,
  taskOptions = [],
  isReadOnly,
  onAddTaskFromToolbox,
  onTaskToolboxSearch,
  isAddingTask,
  setIsAddingTask,
}: StageNodeAddTaskToolboxInnerProps) => {
  const labels = useStageNodeLabels();

  const { setSelectedNodeId } = useSetNodeSelection();

  const handleAddTaskToolboxItemSelected = useCallback(
    (item: ListItem) => {
      onAddTaskFromToolbox?.(item);
      setIsAddingTask(false);
      setSelectedNodeId(id);
    },
    [onAddTaskFromToolbox, setSelectedNodeId, id, setIsAddingTask]
  );

  const handleAddTaskToolboxClose = useCallback(() => setIsAddingTask(false), [setIsAddingTask]);
  if (!onAddTaskFromToolbox || !isAddingTask || isReadOnly) {
    return null;
  }

  // /* Panels are mounted only while open: FloatingCanvasPanel subscribes to the
  // node's internals (useInternalNode), so a permanently mounted panel re-renders
  // on every drag/measure frame of the stage even though it renders nothing. */
  return (
    <FloatingCanvasPanel nodeId={id} offset={15}>
      <Toolbox
        title={labels.addTask}
        initialItems={taskOptions}
        onClose={handleAddTaskToolboxClose}
        onItemSelect={handleAddTaskToolboxItemSelected}
        onSearch={onTaskToolboxSearch}
      />
    </FloatingCanvasPanel>
  );
};

export const StageNodeAddTaskToolbox = memo(StageNodeAddTaskToolboxInner);
