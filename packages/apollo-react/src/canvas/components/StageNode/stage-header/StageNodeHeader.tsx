import { memo } from 'react';
import { StageHeader } from '../StageNode.styles';
import type {
  StageHeaderChip,
  StageNodeBaseProps,
  StageNodeStageExecution,
  StageStatus,
} from '../StageNode.types';
import { StageNodeHeaderChipsSection } from './header-chips/StageNodeHeaderChipsSection';
import { StageNodeHeaderDuration } from './header-duration/StageNodeHeaderDuration';
import { StageNodeHeaderTopRow } from './header-top/StageNodeHeaderTopRow';

interface StageNodeHeaderInnerProps {
  id: string;
  stageLabel: string;
  stageIcon?: React.ReactElement;
  headerChips?: StageHeaderChip[];
  stageStatus?: StageNodeStageExecution;
  loadingTaskIds?: ReadonlySet<string>;
  isReadOnly: boolean;
  isException?: boolean;
  status?: StageStatus;
  onStatusClick: StageNodeBaseProps['onStatusClick'];
  onTaskAdd: StageNodeBaseProps['onTaskAdd'];
  onAddTaskFromToolbox: StageNodeBaseProps['onAddTaskFromToolbox'];
  onStageTitleChange: StageNodeBaseProps['onStageTitleChange'];
  handleTaskAddClick: (event: React.MouseEvent) => void;
}

const StageNodeHeaderInner = ({
  id,
  stageLabel,
  stageIcon,
  headerChips,
  stageStatus,
  loadingTaskIds,
  isReadOnly,
  isException,
  status,
  onStatusClick,
  onTaskAdd,
  onAddTaskFromToolbox,
  onStageTitleChange,
  handleTaskAddClick,
}: StageNodeHeaderInnerProps) => {
  return (
    <StageHeader isException={isException} data-testid={`stage-header-${id}`}>
      <StageNodeHeaderTopRow
        id={id}
        stageLabel={stageLabel}
        stageIcon={stageIcon}
        statusLabel={stageStatus?.label}
        loadingTaskIds={loadingTaskIds}
        isReadOnly={isReadOnly}
        status={status}
        onStatusClick={onStatusClick}
        onTaskAdd={onTaskAdd}
        onAddTaskFromToolbox={onAddTaskFromToolbox}
        onStageTitleChange={onStageTitleChange}
        handleTaskAddClick={handleTaskAddClick}
      />
      <StageNodeHeaderChipsSection
        id={id}
        headerChips={headerChips}
        slaText={stageStatus?.slaText}
        slaIcon={stageStatus?.slaIcon}
      />
      <StageNodeHeaderDuration
        id={id}
        durationMs={stageStatus?.durationMs}
        durationLabel={stageStatus?.durationLabel}
        duration={stageStatus?.duration}
      />
    </StageHeader>
  );
};

export const StageNodeHeader = memo(StageNodeHeaderInner);
