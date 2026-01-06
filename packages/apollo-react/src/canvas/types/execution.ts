export const ElementStatusValues = {
  Cancelled: 'Cancelled',
  UserCancelled: 'UserCancelled',
  Completed: 'Completed',
  Failed: 'Failed',
  InProgress: 'InProgress',
  NotExecuted: 'NotExecuted',
  Paused: 'Paused',
  Terminated: 'Terminated',
} as const;
export type ElementStatusValues = (typeof ElementStatusValues)[keyof typeof ElementStatusValues];
export type ElementStatus = ElementStatusValues;

export type ExecutionStatusWithCount = { status: ElementStatus; count: number };

export type ExecutionState = ExecutionStatusWithCount | ElementStatus;
