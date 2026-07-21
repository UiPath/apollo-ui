import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { buildGraphIndex, defaultIsSequenceEdge, sortByFlow } from './graph-helpers';

/**
 * Structural fingerprint used to memoize the projection and layout (D12): node
 * ids + node types + parentId (structural nesting) + edge ids/endpoints/handles
 * + each scope's resolved entry order + the collapsed set. Deliberately
 * excludes `node.data` and raw `node.position`, so data-only changes (rename
 * keystrokes touch node.data per keypress) reuse the cached projection and
 * positions unchanged.
 *
 * Every channel value is JSON-encoded before joining so a value containing a
 * separator character (`:`, `|`, `#`) can never be confused with a field
 * boundary (e.g. `{id:'a:b', type:'c'}` must not fingerprint identically to
 * `{id:'a', type:'b:c'}`).
 *
 * Row order is not purely a function of node/edge identity: each scope's entry
 * nodes (top-level roots, and any container body with more than one
 * independent entry) are ordered by flow-view position (`entriesForScope`,
 * D9), so a position-only change that reorders them must invalidate the cache
 * even though every node/edge identity is unchanged. Rather than fingerprint
 * raw coordinates (which would invalidate the cache on every drag even when
 * relative order is untouched), each scope's RESOLVED entry-id order is
 * encoded, using the same default sequence-edge predicate `projectSequence`
 * falls back to; a caller-supplied `isSequenceEdge` may classify a handful of
 * edges differently, but the ordering signal only needs to invalidate the
 * cache when it changes, not reproduce the projection exactly.
 *
 * Sorting each channel makes the fingerprint order-independent, so reordering
 * the input arrays without changing structure keeps the cache warm.
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

  return [
    `n=${nodeParts.length}`,
    nodeParts.join('|'),
    `e=${edgeParts.length}`,
    edgeParts.join('|'),
    `c=${collapsedParts.length}`,
    collapsedParts.join('|'),
    `o=${orderParts.length}`,
    orderParts.join('|'),
  ].join('#');
}
