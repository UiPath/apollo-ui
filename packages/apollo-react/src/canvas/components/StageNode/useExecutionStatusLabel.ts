import { useCallback } from 'react';
import { useSafeLingui } from '../../../i18n';
import type { StageStatus, StageTaskStatus } from './StageNode.types';

/**
 * Returns a function that maps a stage/task execution status to its localized,
 * human-readable label (e.g. "In progress", "Completed"). Used for tooltip text
 * and `aria-label` on the execution-state icons.
 *
 * Falls back to English via `useSafeLingui` when no `I18nProvider` is mounted.
 */
export function useExecutionStatusLabel() {
  const { _ } = useSafeLingui();

  return useCallback(
    (status: StageStatus | StageTaskStatus | undefined): string => {
      switch (status) {
        case 'InProgress':
          return _({ id: 'stage-node.status.in-progress', message: 'In progress' });
        case 'Completed':
          return _({ id: 'stage-node.status.completed', message: 'Completed' });
        case 'Paused':
          return _({ id: 'stage-node.status.paused', message: 'Paused' });
        case 'Failed':
          return _({ id: 'stage-node.status.failed', message: 'Failed' });
        case 'Cancelled':
        case 'UserCancelled':
          return _({ id: 'stage-node.status.cancelled', message: 'Cancelled' });
        case 'Terminated':
          return _({ id: 'stage-node.status.terminated', message: 'Terminated' });
        case 'NotExecuted':
          return _({ id: 'stage-node.status.not-executed', message: 'Not started' });
        case 'Warning':
          return _({ id: 'stage-node.status.warning', message: 'Warning' });
        default:
          return '';
      }
    },
    [_]
  );
}
