import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';

enum ElementStatusValues {
  Cancelled = 'Cancelled',
  Completed = 'Completed',
  UserCancelled = 'UserCancelled',
  Failed = 'Failed',
  InProgress = 'InProgress',
  NotExecuted = 'NotExecuted',
  Paused = 'Paused',
  Terminated = 'Terminated',
}

export type TriggerStatus = `${ElementStatusValues}`;

export interface TriggerNodeProps extends NodeProps {
  details?: {
    tooltip?: string;
    icon?: React.ReactElement;
    status?: TriggerStatus;
    /**
     * Marks this trigger as the entry point used by toolbar Run and Debug actions.
     * Consumers should only set this when the flow has multiple eligible triggers;
     * a single trigger is implicitly the default and does not need an adornment.
     */
    isDefaultEntryPoint?: boolean;
    /** Overrides the standard default-entry-point treatment with custom content. */
    bottomAdornment?: React.ReactNode;
  };
}
