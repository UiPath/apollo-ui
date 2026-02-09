export const ElementStatusValues = {
  Cancelled: 'Cancelled',
  UserCancelled: 'UserCancelled',
  Completed: 'Completed',
  Failed: 'Failed',
  InProgress: 'InProgress',
  NotExecuted: 'NotExecuted',
  Paused: 'Paused',
  Terminated: 'Terminated',
  None: 'None',
} as const;
export type ElementStatusValues = (typeof ElementStatusValues)[keyof typeof ElementStatusValues];
export type ElementStatus = ElementStatusValues;

/**
 * Extended execution state that includes debug info (breakpoints)
 */
export interface NodeExecutionStateWithDebug {
  status: ElementStatus;
  count?: number;
  debug?: boolean;
  isExecutionStartPoint?: boolean;
  isOutputPinned?: boolean;
}

export type ExecutionState = NodeExecutionStateWithDebug | ElementStatus;
