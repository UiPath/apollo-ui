import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo } from 'react';
import { useOptionalNodeTypeRegistry } from '../core';
import type { NodeManifest } from '../schema/node-definition';
import { getExpandedSize } from '../utils/node-size';
import {
  type ContainerFitGeometry,
  getContainerFitGeometry as getDefaultContainerFitGeometry,
  getNodeDimensions as getMeasuredNodeDimensions,
  isContainerNodeManifest,
  type NodeDimensions,
} from '../utils/container';

export type NodeManifestResolver = (node: Node) => NodeManifest | undefined;

export interface NodeLayout {
  getNodeDimensions: (node: Node) => NodeDimensions;
  isContainerNode: (node: Node) => boolean;
  getContainerFitGeometry: (node: Node) => ContainerFitGeometry | null;
}

export interface CanvasNodeLayout extends NodeLayout {
  getManifestForNode: NodeManifestResolver;
}

export function useNodeManifestResolver(): NodeManifestResolver {
  const registry = useOptionalNodeTypeRegistry();

  return useCallback(
    (node: Node) => (node.type ? registry?.getManifest(node.type) : undefined),
    [registry]
  );
}

export function useCanvasNodeLayout(): CanvasNodeLayout {
  const getManifestForNode = useNodeManifestResolver();

  return useMemo(() => {
    const getNodeDimensions = (node: Node) => {
      const manifest = getManifestForNode(node);

      return getMeasuredNodeDimensions(node, getExpandedSize(manifest?.display.shape));
    };

    const isContainerNode = (node: Node) => isContainerNodeManifest(getManifestForNode(node));

    return {
      getManifestForNode,
      getNodeDimensions,
      isContainerNode,
      getContainerFitGeometry: (node: Node) =>
        isContainerNode(node) ? getDefaultContainerFitGeometry() : null,
    };
  }, [getManifestForNode]);
}
