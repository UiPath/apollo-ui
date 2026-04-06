import { Spacing } from '@uipath/apollo-core';
import { ApCircularProgress, ApIconButton, ApTooltip } from '@uipath/apollo-react/material';
import debounce from 'debounce';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { PlayIcon } from '../../icons';
import type { NodeMenuItem } from '../NodeContextMenu';
import { TaskContent } from './DraggableTask';
import { StageTask } from './StageNode.styles';
import type { StageTaskExecution, StageTaskItem } from './StageNode.types';
import { TaskMenu, type TaskMenuHandle } from './TaskMenu';

const AdhocTaskPlayButton = memo(
  ({ taskId, onTaskPlay }: { taskId: string; onTaskPlay: (taskId: string) => Promise<void> }) => {
    const [playLoading, setPlayLoading] = useState(false);

    const debouncedTaskPlay = useMemo(
      () =>
        debounce(
          async (id: string) => {
            setPlayLoading(true);
            try {
              await onTaskPlay(id);
            } catch {
              // Do nothing
            } finally {
              setPlayLoading(false);
            }
          },
          500,
          { immediate: true }
        ),
      [onTaskPlay]
    );

    const handlePlayClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        debouncedTaskPlay(taskId);
      },
      [debouncedTaskPlay, taskId]
    );

    return (
      <ApTooltip content="Trigger task" placement="top">
        <ApIconButton
          data-testid={`stage-task-play-${taskId}`}
          onClick={handlePlayClick}
          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
          className="task-menu-icon-button"
          sx={{
            color: 'var(--uix-canvas-primary) !important',
            minWidth: 'unset !important',
            width: `${Spacing.SpacingL} !important`,
            height: `${Spacing.SpacingL} !important`,
            padding: '0 !important',
          }}
        >
          {playLoading ? <ApCircularProgress size={20} /> : <PlayIcon w={20} h={20} />}
        </ApIconButton>
      </ApTooltip>
    );
  }
);

interface AdhocTaskItemProps {
  task: StageTaskItem;
  taskExecution?: StageTaskExecution;
  isSelected: boolean;
  getContextMenuItems?: () => NodeMenuItem[];
  onTaskClick: (e: React.MouseEvent, taskId: string) => void;
  onTaskPlay?: (taskId: string) => Promise<void>;
}

const AdhocTaskItemComponent = ({
  task,
  taskExecution,
  isSelected,
  getContextMenuItems,
  onTaskClick,
  onTaskPlay,
}: AdhocTaskItemProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const taskRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<TaskMenuHandle>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isMenuOpen) return;
      onTaskClick(e, task.id);
    },
    [isMenuOpen, onTaskClick, task.id]
  );

  const handleMenuOpenChange = useCallback((isOpen: boolean) => {
    setIsMenuOpen(isOpen);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    menuRef.current?.handleContextMenu(e);
  }, []);

  return (
    <StageTask
      ref={taskRef}
      data-testid={`stage-task-${task.id}`}
      selected={isSelected}
      status={taskExecution?.status}
      onClick={handleClick}
      {...(getContextMenuItems && { onContextMenu: handleContextMenu })}
    >
      <TaskContent task={task} taskExecution={taskExecution} />
      {onTaskPlay && <AdhocTaskPlayButton taskId={task.id} onTaskPlay={onTaskPlay} />}
      {getContextMenuItems && (
        <TaskMenu
          ref={menuRef}
          taskId={task.id}
          getContextMenuItems={getContextMenuItems}
          onMenuOpenChange={handleMenuOpenChange}
          taskRef={taskRef}
        />
      )}
    </StageTask>
  );
};

export const AdhocTaskItem = memo(AdhocTaskItemComponent);
