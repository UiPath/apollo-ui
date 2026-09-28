export const ElementStatusValues = {
  ActionNeeded: 'ActionNeeded',
  Cancelled: 'Cancelled',
  UserCancelled: 'UserCancelled',
  Completed: 'Completed',
  Failed: 'Failed',
  InProgress: 'InProgress',
  NotExecuted: 'NotExecuted',
  Paused: 'Paused',
  Terminated: 'Terminated',
  Warning: 'Warning',
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
  /**
   * @deprecated No longer read. The bottom-right adornment slot is owned by the
   * consumer: supply `adornments.bottomRight` through `BaseNodeOverrideConfig`
   * instead. Setting this has no effect and the field will be removed in the
   * next major.
   */
  isOutputPinned?: boolean;
}

export type ExecutionState = NodeExecutionStateWithDebug | ElementStatus;
