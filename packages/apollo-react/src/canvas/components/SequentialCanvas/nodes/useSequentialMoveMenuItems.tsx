import { useMemo } from 'react';
import { useSafeLingui } from '../../../../i18n';
import { CanvasIcon } from '../../../utils/icon-registry';
import { useBaseCanvasMode } from '../../BaseCanvas/BaseCanvasModeProvider';
import type { NodeMenuAction, NodeMenuItem } from '../../NodeContextMenu';
import { useOptionalSequentialMoveActions } from '../SequentialMoveActionsContext';

/**
 * Kebab items for the four tree moves (up, down, into previous step, out), backed
 * by SequentialMoveActionsContext. Design mode only; returns an empty array
 * outside a provider so isolated stories and tests do not throw.
 */
export function useSequentialMoveMenuItems(nodeId: string): NodeMenuItem[] {
  const { _ } = useSafeLingui();
  const isDesignMode = useBaseCanvasMode().mode === 'design';
  const moveActions = useOptionalSequentialMoveActions();

  return useMemo<NodeMenuItem[]>(() => {
    if (!isDesignMode || !moveActions) return [];
    const options = moveActions.getMoveOptions(nodeId);

    const item = (
      id: string,
      label: string,
      icon: string,
      slot: (typeof options)['up']
    ): NodeMenuAction => ({
      id,
      label,
      icon: <CanvasIcon icon={icon} size={16} />,
      disabled: !slot,
      onClick: () => {
        if (slot) moveActions.commitMove(nodeId, slot);
      },
    });

    return [
      item(
        'move-up',
        _({ id: 'sequential-canvas.move.up', message: 'Move up' }),
        'arrow-up',
        options.up
      ),
      item(
        'move-down',
        _({ id: 'sequential-canvas.move.down', message: 'Move down' }),
        'arrow-down',
        options.down
      ),
      item(
        'move-indent',
        _({ id: 'sequential-canvas.move.indent', message: 'Move into previous step' }),
        'indent',
        options.indent
      ),
      item(
        'move-outdent',
        _({ id: 'sequential-canvas.move.outdent', message: 'Move out' }),
        'outdent',
        options.outdent
      ),
    ];
  }, [isDesignMode, moveActions, nodeId, _]);
}
