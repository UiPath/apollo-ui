import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo } from 'react';
import { areNodePropsEqualIgnoringPosition } from '../../../utils/nodePropsEqual';
import type { BaseNodeData } from '../../BaseNode/BaseNode.types';
import { BaseNodeBarNode } from '../../BaseNode/BaseNodeBarNode';
import { useSequentialAttachments } from '../SequentialAttachmentsContext';
import { useSequentialCollapsedRows } from '../SequentialCollapsedRowsContext';
import { useSequentialMoveMenuItems } from './useSequentialMoveMenuItems';

/**
 * Sequential step row: a thin wrapper over BaseNodeBarNode, registered for every
 * manifest node type. Collapsed state, move actions, and attachments come from context,
 * not `node.data`; context updates bypass the memo comparator, so this stays reactive.
 */
function SequentialStepNodeComponent(props: NodeProps<Node<BaseNodeData>>) {
  const collapsedRowIds = useSequentialCollapsedRows();
  const extraMenuItems = useSequentialMoveMenuItems(props.id);
  const attachments = useSequentialAttachments(props.id);

  return (
    <BaseNodeBarNode
      {...props}
      stacked={collapsedRowIds.has(props.id)}
      extraMenuItems={extraMenuItems}
      attachments={attachments}
    />
  );
}

export const SequentialStepNode = memo(
  SequentialStepNodeComponent,
  areNodePropsEqualIgnoringPosition
);
