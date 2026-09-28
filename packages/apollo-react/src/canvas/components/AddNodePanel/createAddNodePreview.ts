import { Position, type ReactFlowInstance } from '@uipath/apollo-react/canvas/xyflow/react';
import { showPreviewGraph } from '../../utils/createPreviewGraph';
import { resolveHandles } from '../../utils/manifest-resolver';
import type { HandleBoundaryResolver } from '../../utils/NodeUtils';
import {
  type ContainerPreviewManifestResolver,
  resolveContainerAddNodePreview,
} from '../LoopNode/LoopNode.helpers';

export interface AddNodePreviewOptions {
  getManifestForNode?: ContainerPreviewManifestResolver;
}

/**
 * Builds a boundary resolver for the clicked source node's handles.
 *
 * Container nodes flip inner handles to the opposite side via
 * `connectionPosition`, which collapses outer + inner-flipped handles onto the
 * same React Flow `position`. Without a boundary resolver, peer-count math
 * (`computeSpreadOffset`) would treat them as siblings and shift the preview
 * away from the clicked handle's anchor. Returning a (handleId → boundary) map
 * lets `resolveHandleContext` filter peers to only those visually sharing a
 * rail.
 */
function buildSourceBoundaryResolver(
  sourceNodeId: string,
  reactFlowInstance: ReactFlowInstance,
  getManifestForNode: ContainerPreviewManifestResolver
): HandleBoundaryResolver | undefined {
  const sourceNode = reactFlowInstance.getNode(sourceNodeId);
  if (!sourceNode) return undefined;

  const manifest = getManifestForNode(sourceNode);
  if (!manifest?.handleConfiguration) return undefined;

  const resolvedGroups = resolveHandles(manifest.handleConfiguration, {
    ...sourceNode.data,
    nodeId: sourceNode.id,
  });

  const handleToBoundary = new Map<string, 'outer' | 'inner'>();
  for (const group of resolvedGroups) {
    const boundary = (group.boundary ?? 'outer') as 'outer' | 'inner';
    for (const handle of group.handles) {
      handleToBoundary.set(handle.id, boundary);
    }
  }

  return (handleId) => handleToBoundary.get(handleId);
}

/**
 * Creates a preview node and edge when a button handle is clicked.
 * Removes any existing preview node/edge before creating new ones.
 *
 * @param sourceNodeId - The ID of the source node
 * @param sourceHandleId - The ID of the source handle
 * @param reactFlowInstance - The React Flow instance
 * @param handlePosition - The position/side of the handle (defaults to Right)
 * @param sourceHandleType - Whether the source handle is a "source" or "target" (defaults to "source")
 * @param ignoredNodeTypes - Node types to ignore when calculating overlap
 * @param options - Optional add-node preview behavior
 */
export function createAddNodePreview(
  sourceNodeId: string,
  sourceHandleId: string,
  reactFlowInstance: ReactFlowInstance,
  handlePosition: Position = Position.Right,
  sourceHandleType: 'source' | 'target' = 'source',
  ignoredNodeTypes: string[] = [],
  options: AddNodePreviewOptions = {}
): void {
  const source = {
    nodeId: sourceNodeId,
    handleId: sourceHandleId,
  };
  const overrides = options.getManifestForNode
    ? resolveContainerAddNodePreview({
        source,
        sourceHandleType,
        reactFlowInstance,
        getManifestForNode: options.getManifestForNode,
      })
    : null;
  const sourceBoundaryOf = options.getManifestForNode
    ? buildSourceBoundaryResolver(sourceNodeId, reactFlowInstance, options.getManifestForNode)
    : undefined;

  showPreviewGraph({
    source,
    reactFlowInstance,
    sourceHandleType,
    handlePosition,
    ignoredNodeTypes,
    sourceBoundaryOf,
    ...(overrides ?? {}),
  });
}
