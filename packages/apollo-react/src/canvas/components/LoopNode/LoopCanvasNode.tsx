import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useMemo } from 'react';
import { useOptionalNodeTypeRegistry } from '../../core';
import { areNodePropsEqualIgnoringPosition } from '../../utils/nodePropsEqual';
import { LoopNode } from './LoopNode';
import { resolveContainerPreviewConnectionHandles } from './LoopNode.helpers';
import type { LoopNodeData } from './LoopNode.types';
import { showCenteredContainerPreview } from './LoopNodePreview';

function LoopCanvasNodeComponent(props: NodeProps<Node<LoopNodeData>>) {
  const reactFlow = useReactFlow();
  const nodeTypeRegistry = useOptionalNodeTypeRegistry();

  const nodeManifest = useMemo(
    () => (props.type ? nodeTypeRegistry?.getManifest(props.type) : undefined),
    [nodeTypeRegistry, props.type]
  );

  const containerPreviewHandles = useMemo(
    () =>
      resolveContainerPreviewConnectionHandles(nodeManifest, {
        ...(props.data ?? {}),
        nodeId: props.id,
      }),
    [nodeManifest, props.data, props.id]
  );

  const handleAddFirstChild = useCallback(() => {
    if (!containerPreviewHandles) return;

    showCenteredContainerPreview({
      containerId: props.id,
      reactFlowInstance: reactFlow,
      previewHandles: containerPreviewHandles,
    });
  }, [containerPreviewHandles, props.id, reactFlow]);

  return (
    <LoopNode
      {...props}
      onAddFirstChild={containerPreviewHandles ? handleAddFirstChild : undefined}
    />
  );
}

export const LoopCanvasNode = memo(LoopCanvasNodeComponent, areNodePropsEqualIgnoringPosition);
