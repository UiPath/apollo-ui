import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { type ComponentType, createContext, memo, useContext } from 'react';
import { PREVIEW_NODE_ID } from '../../../constants';
import { areNodePropsEqualIgnoringPosition } from '../../../utils/nodePropsEqual';
import { EMPTY_SET } from '../../BaseCanvas/set-utils';
import type { BaseNodeData } from '../../BaseNode/BaseNode.types';
import { SequentialInsertPreviewNode } from './SequentialInsertPreviewNode';
import { SequentialStepNode } from './SequentialStepNode';

/**
 * Ids rendered as bars on a flow canvas: the children of every sequenced container, plus the
 * Add Node preview while its slot sits inside one. View state, never node data, so the
 * canonical nodes stay untouched when a container switches presentation.
 */
export const BarNodeIdsContext = createContext<ReadonlySet<string>>(EMPTY_SET);

type FlowNodeComponent = ComponentType<NodeProps<Node<BaseNodeData>>>;

const wrapperByComponent = new WeakMap<FlowNodeComponent, FlowNodeComponent>();

/**
 * Wraps a flow node component so the same manifest type renders as a card or a bar per node
 * id. Wrappers are cached per component so `nodeTypes` identities stay stable.
 */
export function createFlowOrBarNodeType(FlowComponent: FlowNodeComponent): FlowNodeComponent {
  const cached = wrapperByComponent.get(FlowComponent);
  if (cached) return cached;

  const FlowOrBarNode = memo(function FlowOrBarNode(props: NodeProps<Node<BaseNodeData>>) {
    const barIds = useContext(BarNodeIdsContext);
    if (!barIds.has(props.id)) return <FlowComponent {...props} />;
    return props.id === PREVIEW_NODE_ID ? (
      <SequentialInsertPreviewNode {...props} />
    ) : (
      <SequentialStepNode {...props} />
    );
  }, areNodePropsEqualIgnoringPosition);

  wrapperByComponent.set(FlowComponent, FlowOrBarNode);
  return FlowOrBarNode;
}
