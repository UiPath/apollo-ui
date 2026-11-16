import { type KeyboardEvent, useCallback, useMemo } from 'react';
import type { StageTaskActivationEvent } from '../StageNode.types';

/**
 * Makes a task card that no sortable row wraps its own tab stop, opened with Enter or Space as a
 * click opens it. A sortable row is the tab stop of the cards it wraps, so `enabled` is false there.
 */
export function useTaskCardActivation(
  taskId: string,
  onTaskClick: (e: StageTaskActivationEvent, taskId: string) => void,
  enabled: boolean
) {
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'Enter' && e.key !== ' ') {
        return;
      }
      // The canvas node would otherwise take the key as a request to select the stage.
      e.stopPropagation();
      // Keys pressed on the card's own controls, such as its breakpoint, belong to them.
      if (e.target !== e.currentTarget) {
        return;
      }
      e.preventDefault();
      onTaskClick(e, taskId);
    },
    [onTaskClick, taskId]
  );

  return useMemo(
    () => (enabled ? { role: 'button', tabIndex: 0, onKeyDown } : undefined),
    [enabled, onKeyDown]
  );
}
