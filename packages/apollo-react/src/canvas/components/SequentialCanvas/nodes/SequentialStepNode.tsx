import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo } from 'react';
import { areNodePropsEqualIgnoringPosition } from '../../../utils/nodePropsEqual';
import type { BaseNodeData } from '../../BaseNode/BaseNode.types';
import { BaseNodeBarNode } from '../../BaseNode/BaseNodeBarNode';
import { useSequentialCollapsedRows } from '../SequentialCollapsedRowsContext';
import { useSequentialMoveMenuItems } from './useSequentialMoveMenuItems';

/**
 * Sequential Canvas step row. A thin wrapper around the manifest-backed bar
 * renderer. BaseNodeBarNode and BaseNode are sibling renderers that share
 * presentation resolution without routing one view through the other.
 *
 * Register this for every real manifest node type in the sequential nodeTypes
 * map (the node keeps its real `type`, so BaseNodeBarNode resolves the manifest).
 *
 * Reads the view-local collapsed row-id set from context rather than
 * `node.data`, so a collapsed collapsible row's bar renders BaseContainer's
 * `isStacked` treatment without mutating the sequential clone's data (D12).
 * `React.memo`'s prop comparator only gates re-renders from prop changes;
 * context updates always re-render consuming descendants regardless, so this
 * stays correctly reactive to collapse toggles under
 * `areNodePropsEqualIgnoringPosition`.
 *
 * Also computes the four explorer-like tree-move kebab items from
 * `SequentialMoveActionsContext` via `useSequentialMoveMenuItems`,
 * passed through `BaseNode.extraMenuItems` (D3). Same context-updates-always-
 * re-render reasoning applies: a projection change (which changes which
 * moves are available) re-renders this node even though it's memoized.
 *
 * Appendable branch tails are followed by the same full-width dashed
 * SequentialPlaceholderNode used for empty branches, so this wrapper contains
 * no separate leaf-specific add affordance.
 */
function SequentialStepNodeComponent(props: NodeProps<Node<BaseNodeData>>) {
  const collapsedRowIds = useSequentialCollapsedRows();
  const extraMenuItems = useSequentialMoveMenuItems(props.id);

  return (
    <BaseNodeBarNode
      {...props}
      stacked={collapsedRowIds.has(props.id)}
      extraMenuItems={extraMenuItems}
    />
  );
}

export const SequentialStepNode = memo(
  SequentialStepNodeComponent,
  areNodePropsEqualIgnoringPosition
);
