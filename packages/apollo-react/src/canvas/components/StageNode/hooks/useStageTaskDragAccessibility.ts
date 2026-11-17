import type { DndContextProps } from '@dnd-kit/core';
import { useMemo } from 'react';
import { useSafeLingui } from '../../../../i18n';

/** What a screen reader hears on a reorderable task row: how to open it and how to move it. */
export function useStageTaskDragAccessibility(): DndContextProps['accessibility'] {
  const { _ } = useSafeLingui();

  return useMemo(
    () => ({
      screenReaderInstructions: {
        draggable: _({
          id: 'stage-node.task-drag-instructions',
          message:
            'Press Enter to open the task. To reorder it, press Space to pick it up, use the arrow keys to move it, then press Space again to drop it, or Escape to cancel.',
        }),
      },
    }),
    [_]
  );
}
