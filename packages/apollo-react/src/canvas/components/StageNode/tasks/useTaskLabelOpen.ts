import { type KeyboardEvent, useCallback } from 'react';
import type { StageTaskActivationEvent } from '../StageNode.types';

/**
 * Keyboard opening for a task card that no sortable row wraps. Its label is then a button, and
 * Enter or Space on it opens the task as a click on the card does. A sortable row is the tab stop
 * of the cards it wraps, so `enabled` is false there and the label stays plain text.
 */
export function useTaskLabelOpen(
  taskId: string,
  onTaskClick: (e: StageTaskActivationEvent, taskId: string) => void,
  enabled: boolean
) {
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key !== 'Enter' && e.key !== ' ') {
        return;
      }
      // Opening on keydown hands the host the keypress; preventing it stops the button's own click.
      e.preventDefault();
      onTaskClick(e, taskId);
    },
    [onTaskClick, taskId]
  );

  return enabled ? onKeyDown : undefined;
}
