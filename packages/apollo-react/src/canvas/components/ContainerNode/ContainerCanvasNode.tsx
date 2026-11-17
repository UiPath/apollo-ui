import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useMemo } from 'react';
import { useOptionalNodeTypeRegistry } from '../../core';
import { isSelfContainedContainerManifest } from '../../utils/container';
import { areNodePropsEqualIgnoringPosition } from '../../utils/nodePropsEqual';
import { LoopNode } from '../LoopNode/LoopNode';
import { ContainerNode } from './ContainerNode';
import { resolveContainerPreviewConnectionHandles } from './ContainerNode.helpers';
import type { ContainerNodeData } from './ContainerNode.types';
import {
  showCenteredContainerPreview,
  showUnconnectedContainerPreview,
} from './ContainerNodePreview';

/**
 * Canvas wrapper for any `shape: 'container'` manifest. It wires the
 * add-first-step preview and picks the preset: the loop look when the manifest
 * has no `display.container` (or sets `kind: 'loop'`), the generic
 * `ContainerNode` otherwise.
 */
function ContainerCanvasNodeComponent(props: NodeProps<Node<ContainerNodeData>>) {
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

  // A self-contained (runtime) container has no inner handle to wire a first step to, so
  // its first step is added as an unconnected child instead.
  const isSelfContained = useMemo(
    () => isSelfContainedContainerManifest(nodeManifest),
    [nodeManifest]
  );

  const handleAddFirstChild = useCallback(() => {
    if (containerPreviewHandles) {
      showCenteredContainerPreview({
        containerId: props.id,
        reactFlowInstance: reactFlow,
        previewHandles: containerPreviewHandles,
      });
      return;
    }
    if (isSelfContained) {
      showUnconnectedContainerPreview({ containerId: props.id, reactFlowInstance: reactFlow });
    }
  }, [containerPreviewHandles, isSelfContained, props.id, reactFlow]);

  const onAddFirstChild =
    containerPreviewHandles || isSelfContained ? handleAddFirstChild : undefined;
  const containerDisplay = nodeManifest?.display?.container;
  const usesLoopPreset = !containerDisplay || containerDisplay.kind === 'loop';

  return usesLoopPreset ? (
    <LoopNode {...props} onAddFirstChild={onAddFirstChild} />
  ) : (
    <ContainerNode {...props} onAddFirstChild={onAddFirstChild} />
  );
}

export const ContainerCanvasNode = memo(
  ContainerCanvasNodeComponent,
  areNodePropsEqualIgnoringPosition
);
