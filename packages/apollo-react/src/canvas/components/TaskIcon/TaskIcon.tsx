import { AgentProject, BusinessProcessProject, ConnectorBuilderProject } from '../../icons';
import { ApiProject } from '../../icons/ApiProject';
import { HumanIcon } from '../../icons/HumanIcon';
import { RpaProject } from '../../icons/RpaProject';
import { TaskIconContainer } from './TaskIcon.styles';
import { type TaskIconProps, type TaskIconSize, TaskItemTypeValues } from './TaskIcon.types';

const SIZE_CONFIG: Record<TaskIconSize, { container: number; icon: number; borderRadius: number }> =
  {
    sm: { container: 24, icon: 16, borderRadius: 4 },
    md: { container: 32, icon: 24, borderRadius: 8 },
    lg: { container: 72, icon: 48, borderRadius: 8 },
  };

const getIconForType = (type: TaskItemTypeValues, iconSize: number): React.ReactElement => {
  switch (type) {
    case TaskItemTypeValues.Agent:
      return <AgentProject w={iconSize} h={iconSize} />;
    case TaskItemTypeValues.Automation:
      return <RpaProject w={iconSize} h={iconSize} />;
    case TaskItemTypeValues.ApiAutomation:
      return <ApiProject w={iconSize} h={iconSize} />;
    case TaskItemTypeValues.User:
      return <HumanIcon w={iconSize} h={iconSize} />;
    case TaskItemTypeValues.AgenticProcess:
      return <BusinessProcessProject w={iconSize} h={iconSize} />;
    case TaskItemTypeValues.Connector:
      return <ConnectorBuilderProject w={iconSize} h={iconSize} />;
  }
};

export const TaskIcon = ({ type, size = 'md' }: TaskIconProps) => {
  const { container, icon, borderRadius } = SIZE_CONFIG[size];
  const displayIcon = getIconForType(type, icon);

  return (
    <TaskIconContainer $size={container} $taskType={type} $borderRadius={borderRadius}>
      {displayIcon}
    </TaskIconContainer>
  );
};
