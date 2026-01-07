import styled from '@emotion/styled';
import { TaskItemTypeValues } from './TaskIcon.types';

export const TASK_ICON_GRADIENTS: Record<TaskItemTypeValues, string> = {
  [TaskItemTypeValues.Agent]:
    'linear-gradient(135deg, var(--color-gradient-agent-start) 4.81%, var(--color-gradient-agent-end) 97.27%)',
  [TaskItemTypeValues.Automation]:
    'linear-gradient(135deg, var(--color-gradient-invoked-start) 0%, var(--color-gradient-invoked-end) 100%)',
  [TaskItemTypeValues.ApiAutomation]:
    'linear-gradient(135deg, var(--color-gradient-invoked-start) 0%, var(--color-gradient-invoked-end) 100%)',
  [TaskItemTypeValues.User]:
    'linear-gradient(135deg, var(--color-gradient-human-start) 2.77%, var(--color-gradient-human-end) 97.93%)',
  [TaskItemTypeValues.AgenticProcess]:
    'linear-gradient(135deg, var(--color-gradient-general-start) 0%, var(--color-gradient-general-end) 100%)',
};

interface TaskIconContainerProps {
  $size: number;
  $taskType: TaskItemTypeValues;
  $borderRadius: number;
}

export const TaskIconContainer = styled.div<TaskIconContainerProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: ${({ $borderRadius }) => $borderRadius}px;
  color: var(--uix-canvas-foreground-emp);
  background: ${({ $taskType }) => TASK_ICON_GRADIENTS[$taskType]};
`;
