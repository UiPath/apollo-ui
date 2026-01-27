export enum TaskItemTypeValues {
  User = 'user',
  Agent = 'agent',
  AgenticProcess = 'process',
  ApiAutomation = 'api_automation',
  Automation = 'automation',
  Connector = 'connector',
}

export type TaskIconSize = 'sm' | 'md' | 'lg';

export interface TaskIconProps {
  type: TaskItemTypeValues;
  size?: TaskIconSize;
}
