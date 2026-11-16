import { memo, type RefObject, useCallback } from 'react';
import { FloatingCanvasPanel } from '../../FloatingCanvasPanel';
import { type ListItem, Toolbox } from '../../Toolbox';
import type { StageNodeProps, TaskStateReference } from '../StageNode.types';
import { useStageNodeLabels } from '../useStageNodeLabels';

interface StageNodeReplaceTaskToolboxInnerProps {
  id: string;
  taskOptions: ListItem[];
  replaceTaskToolboxTitle?: string;
  isReadOnly: boolean;
  taskStateReference: RefObject<TaskStateReference>;
  onTaskToolboxSearch: StageNodeProps['onTaskToolboxSearch'];
  onReplaceTaskFromToolbox: StageNodeProps['onReplaceTaskFromToolbox'];
  isReplacingTask: boolean;
  setIsReplacingTask: (isReplacingTask: boolean) => void;
}

const StageNodeReplaceTaskToolboxInner = ({
  id,
  taskOptions = [],
  replaceTaskToolboxTitle,
  isReadOnly,
  taskStateReference,
  onTaskToolboxSearch,
  onReplaceTaskFromToolbox,
  isReplacingTask,
  setIsReplacingTask,
}: StageNodeReplaceTaskToolboxInnerProps) => {
  const labels = useStageNodeLabels();

  const handleReplaceTaskToolboxClose = useCallback(
    () => setIsReplacingTask(false),
    [setIsReplacingTask]
  );

  const handleReplaceTaskToolboxItemSelected = useCallback(
    (item: ListItem) => {
      onReplaceTaskFromToolbox?.(
        item,
        taskStateReference.current.groupIndex,
        taskStateReference.current.taskIndex
      );
      setIsReplacingTask(false);
    },
    [onReplaceTaskFromToolbox, taskStateReference, setIsReplacingTask]
  );

  if (!onReplaceTaskFromToolbox || !isReplacingTask || isReadOnly) {
    return null;
  }

  // Panels are mounted only while open: FloatingCanvasPanel subscribes to the
  // node's internals (useInternalNode), so a permanently mounted panel re-renders
  // on every drag/measure frame of the stage even though it renders nothing.
  return (
    <FloatingCanvasPanel nodeId={id} offset={15}>
      <Toolbox
        title={replaceTaskToolboxTitle || labels.replaceTask}
        initialItems={taskOptions}
        onClose={handleReplaceTaskToolboxClose}
        onItemSelect={handleReplaceTaskToolboxItemSelected}
        onSearch={onTaskToolboxSearch}
      />
    </FloatingCanvasPanel>
  );
};

export const StageNodeReplaceTaskToolbox = memo(StageNodeReplaceTaskToolboxInner);
