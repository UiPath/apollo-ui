import type { NodeTypes } from '@uipath/apollo-react/canvas/xyflow/react';
import type { NodeManifest } from '../../schema';
import { isContainerNodeManifest } from '../../utils';
import { BaseNode } from '../BaseNode/BaseNode';
import { LoopCanvasNode } from '../LoopNode';

/** Resolves the standard Flow renderer from the manifest's semantic shape. */
export function resolveFlowNodeComponent(
  manifest: Pick<NodeManifest, 'display'> | undefined
): NodeTypes[string] {
  return isContainerNodeManifest(manifest) ? LoopCanvasNode : BaseNode;
}
