export enum TaskItemTypeValues {
  User = 'user',
  Agent = 'agent',
  ExternalAgent = 'external_agent',
  AgenticProcess = 'process',
  ApiAutomation = 'api_automation',
  Automation = 'automation',
  Connector = 'connector',
  Timer = 'timer',
  CaseManagement = 'case_management',
}

export type TaskIconSize = 'sm' | 'md' | 'lg';

export interface TaskIconProps {
  type: TaskItemTypeValues;
  size?: TaskIconSize;
}
