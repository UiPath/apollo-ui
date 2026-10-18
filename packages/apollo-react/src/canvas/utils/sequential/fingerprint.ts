import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  buildGraphIndex,
  defaultIsSequenceEdge,
  forwardOut,
  isSequentialContinuationEdge,
  sortByFlow,
} from './graph-helpers';

/**
 * Structural fingerprint for memoizing the projection and layout. Excludes `data` and
 * raw positions so data-only changes stay cached, but encodes each scope's resolved
 * entry order and each branch's lane order so a drag that reorders them invalidates.
 * Covers graph inputs only: callers must also key on the projection's option results.
 * Values are JSON-encoded so separator characters cannot blur field boundaries.
 */
export function sequenceFingerprint(
  nodes: Node[],
  edges: Edge[],
  collapsed: ReadonlySet<string>
): string {
  const nodeParts = nodes
    .map((node) => JSON.stringify([node.id, node.type ?? '', node.parentId ?? '']))
    .sort();
  const edgeParts = edges
    .map((edge) =>
      JSON.stringify([
        edge.id,
        edge.source,
        edge.sourceHandle ?? '',
        edge.target,
        edge.targetHandle ?? '',
        isSequentialContinuationEdge(edge),
      ])
    )
    .sort();
  const collapsedParts = [...collapsed].sort().map((id) => JSON.stringify(id));

  const index = buildGraphIndex(nodes, edges, defaultIsSequenceEdge);
  const orderParts = [...index.childrenByParent.entries()]
    .map(([scope, children]) =>
      JSON.stringify([scope ?? '', sortByFlow(children).map((node) => node.id)])
    )
    .sort();
  const laneParts = [...index.seqEdgesBySource.keys()]
    .map((sourceId) => {
      const out = forwardOut(index, sourceId, index.nodesById.get(sourceId)?.parentId);
      return out.length > 1 ? JSON.stringify([sourceId, out.map((edge) => edge.id)]) : undefined;
    })
    .filter((part): part is string => part !== undefined)
    .sort();

  return [
    `n=${nodeParts.length}`,
    nodeParts.join('|'),
    `e=${edgeParts.length}`,
    edgeParts.join('|'),
    `c=${collapsedParts.length}`,
    collapsedParts.join('|'),
    `o=${orderParts.length}`,
    orderParts.join('|'),
    `l=${laneParts.length}`,
    laneParts.join('|'),
  ].join('#');
}
