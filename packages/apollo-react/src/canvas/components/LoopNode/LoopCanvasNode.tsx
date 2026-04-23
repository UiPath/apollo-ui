import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useMemo } from 'react';
import { useOptionalNodeTypeRegistry } from '../../core';
import type { NodeManifest } from '../../schema/node-definition';
import { selectCurrentCanvas, selectUpdateNodes, useCanvasStore } from '../../stores/canvasStore';
import { snapToGrid } from '../../utils/NodeUtils';
import { BaseNode } from '../BaseNode';
import { LoopNode } from './LoopNode';
import { DEFAULT_LOOP_NODE_TYPE } from './LoopNode.constants';
import { resolveLoopPreviewConnectionHandles } from './LoopNode.helpers';
import type { LoopNodeData, LoopNodeProps } from './LoopNode.types';
import { showCenteredContainerPreview } from './LoopNodePreview';

function shouldRenderLoopContainer(manifest: NodeManifest | undefined): boolean {
  // Container-style loop UIs declare inner handles; older loop manifests do not.
  return manifest?.handleConfiguration.some((group) => group.boundary === 'inner') ?? false;
}

function LoopCanvasNodeComponent(props: NodeProps<Node<LoopNodeData>>) {
  const reactFlow = useReactFlow();
  const nodeTypeRegistry = useOptionalNodeTypeRegistry();
  const updateNodes = useCanvasStore(selectUpdateNodes);
  const nodeVersion = typeof props.data?.version === 'string' ? props.data.version : undefined;

  const loopManifest = useMemo(
    () => nodeTypeRegistry?.getManifest(props.type ?? DEFAULT_LOOP_NODE_TYPE, nodeVersion),
    [nodeTypeRegistry, props.type, nodeVersion]
  );

  const shouldUseLoopContainer = useMemo(
    () => shouldRenderLoopContainer(loopManifest),
    [loopManifest]
  );

  const loopPreviewHandles = useMemo(
    () =>
      shouldUseLoopContainer
        ? resolveLoopPreviewConnectionHandles(loopManifest, {
            ...(props.data ?? {}),
            nodeId: props.id,
          })
        : null,
    [shouldUseLoopContainer, loopManifest, props.data, props.id]
  );

  const handleAddFirstChild = useCallback<NonNullable<LoopNodeProps['onAddFirstChild']>>(() => {
    if (!loopPreviewHandles) return;

    showCenteredContainerPreview({
      containerId: props.id,
      reactFlowInstance: reactFlow,
      previewHandles: loopPreviewHandles,
    });
  }, [loopPreviewHandles, props.id, reactFlow]);

  const handleResize = useCallback<NonNullable<LoopNodeProps['onResize']>>(
    ({ width, height }) => {
      const currentCanvas = selectCurrentCanvas(useCanvasStore.getState());
      if (!currentCanvas) return;

      const nextWidth = snapToGrid(width);
      const nextHeight = snapToGrid(height);

      updateNodes(
        currentCanvas.nodes.map((node) =>
          node.id !== props.id
            ? node
            : {
                ...node,
                width: nextWidth,
                height: nextHeight,
                style: {
                  ...(node.style ?? {}),
                  width: nextWidth,
                  height: nextHeight,
                },
              }
        )
      );
    },
    [props.id, updateNodes]
  );

  if (loopManifest && !shouldUseLoopContainer) {
    return <BaseNode {...props} />;
  }

  return (
    <LoopNode
      {...props}
      onAddFirstChild={loopPreviewHandles ? handleAddFirstChild : undefined}
      onResize={handleResize}
    />
  );
}

export const LoopCanvasNode = memo(LoopCanvasNodeComponent);
