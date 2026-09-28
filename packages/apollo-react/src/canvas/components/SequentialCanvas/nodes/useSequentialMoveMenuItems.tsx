import { useMemo } from 'react';
import { useSafeLingui } from '../../../../i18n';
import { CanvasIcon } from '../../../utils/icon-registry';
import { useBaseCanvasMode } from '../../BaseCanvas/BaseCanvasModeProvider';
import type { NodeMenuAction, NodeMenuItem } from '../../NodeContextMenu';
import type { SequentialMoveDirection } from '../sequentialMoveActions';
import { useOptionalSequentialMoveActions } from '../SequentialMoveActionsContext';

/**
 * Builds the four kebab "explorer-like tree move" items (Move up, Move down,
 * Move into previous step, Move out) for a Sequential Canvas step row, backed
 * by the engine's binding contract
 * (utils/sequential/mutations.ts, slotNavigation.ts). Consumed by
 * `SequentialStepNode` and passed to `BaseNode`'s `extraMenuItems` (D3: no new
 * `BaseNodeOverrideConfig` field -- a direct component prop instead).
 *
 * Disabled state comes straight from `SequentialMoveActionsContext.getMoveOptions`
 * (see `sequentialMoveActions.ts` for the disable logic, including the
 * bare-branch-owner gate extended to all four directions). Move actions are a
 * TOPOLOGY mutation (D4), so -- like the ⊕ insert affordance
 * (`SequentialConnectorEdge`'s `showInsert`) -- they only appear in design
 * mode; outside a `SequentialMoveActionsContext` provider (isolated node
 * stories/tests) this returns an empty array rather than throwing.
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
      direction: SequentialMoveDirection
    ): NodeMenuAction => {
      const slot = options[direction];
      return {
        id,
        label,
        icon: <CanvasIcon icon={icon} size={16} />,
        disabled: !slot,
        onClick: () => {
          if (slot) moveActions.commitMove(nodeId, slot, direction);
        },
      };
    };

    return [
      item('move-up', _({ id: 'sequential-canvas.move.up', message: 'Move up' }), 'arrow-up', 'up'),
      item(
        'move-down',
        _({ id: 'sequential-canvas.move.down', message: 'Move down' }),
        'arrow-down',
        'down'
      ),
      item(
        'move-indent',
        _({ id: 'sequential-canvas.move.indent', message: 'Move into previous step' }),
        'indent',
        'indent'
      ),
      item(
        'move-outdent',
        _({ id: 'sequential-canvas.move.outdent', message: 'Move out' }),
        'outdent',
        'outdent'
      ),
    ];
  }, [isDesignMode, moveActions, nodeId, _]);
}
