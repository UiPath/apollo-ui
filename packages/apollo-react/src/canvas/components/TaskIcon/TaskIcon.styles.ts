import styled from '@emotion/styled';
import { TaskItemTypeValues } from './TaskIcon.types';

export enum CategoryColor {
  Purple = 'linear-gradient(135deg, var(--color-gradient-agent-start) 4.81%, var(--color-gradient-agent-end) 97.27%)',
  Green = 'linear-gradient(135deg, var(--color-gradient-invoked-start) 0%, var(--color-gradient-invoked-end) 100%)',
  Blue = 'linear-gradient(135deg, var(--color-gradient-human-start) 2.77%, var(--color-gradient-human-end) 97.93%)',
  Grey = 'linear-gradient(135deg, var(--color-gradient-general-start) 0%, var(--color-gradient-general-end) 100%)',
}

export const TASK_ICON_GRADIENTS: Record<TaskItemTypeValues, string> = {
  [TaskItemTypeValues.Agent]: CategoryColor.Purple,
  [TaskItemTypeValues.Automation]: CategoryColor.Green,
  [TaskItemTypeValues.ApiAutomation]: CategoryColor.Green,
  [TaskItemTypeValues.User]: CategoryColor.Blue,
  [TaskItemTypeValues.AgenticProcess]: CategoryColor.Grey,
  [TaskItemTypeValues.Connector]: CategoryColor.Grey,
  [TaskItemTypeValues.ExternalAgent]: CategoryColor.Purple,
  [TaskItemTypeValues.Timer]: CategoryColor.Grey,
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
