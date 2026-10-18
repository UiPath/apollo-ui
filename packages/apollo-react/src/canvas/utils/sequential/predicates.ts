import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { DEFAULT_TRIGGER_NODE_TYPE } from '../../constants';
import type { NodeManifest } from '../../schema/node-definition';
import { isArtifactOnlyManifest, isContainerNodeManifest } from '../container';

export const STICKY_NOTE_NODE_TYPE = 'stickyNote';

/** Node predicates the projection, the compatibility report and the canvas must agree on. */
export interface SequencePredicates {
  /** Takes part in the sequential projection (excluded nodes are preserved untouched). */
  isSequenceNode: (node: Node) => boolean;
  /** Collapses into the synthetic start row. */
  isStartNode: (node: Node) => boolean;
  /** Structural container whose children form a body lane. */
  isContainerNode: (node: Node) => boolean;
}

/** Registry-free default: everything but sticky notes. */
export const defaultIsSequenceNode = (node: Pick<Node, 'type'>): boolean =>
  node.type !== STICKY_NOTE_NODE_TYPE;

/** Registry-free default: the first-run trigger type only. */
export const defaultIsStartNode = (node: Pick<Node, 'type'>): boolean =>
  node.type === DEFAULT_TRIGGER_NODE_TYPE;

/**
 * Builds the manifest-aware predicates from a `getManifest` lookup (normally
 * `registry.getManifest`). Without a lookup, falls back to the registry-free defaults.
 * Artifact-only resources (tools, context, memory) are not sequence nodes; trigger-category
 * manifests are start nodes; `shape: 'container'` manifests are containers.
 */
export function createSequencePredicates(
  getManifest?: (type: string) => NodeManifest | undefined
): SequencePredicates {
  const manifestOf = (node: Node): NodeManifest | undefined =>
    node.type && getManifest ? getManifest(node.type) : undefined;
  return {
    isSequenceNode: (node) =>
      defaultIsSequenceNode(node) && !isArtifactOnlyManifest(manifestOf(node)),
    isStartNode: (node) => defaultIsStartNode(node) || manifestOf(node)?.category === 'trigger',
    isContainerNode: (node) => isContainerNodeManifest(manifestOf(node)),
  };
}
