import type { Edge } from '@uipath/apollo-react/canvas/xyflow/react';
import { forwardOut, type GraphIndex, inDegreeInScope, type Scope } from './graph-helpers';

/**
 * Approximate immediate post-dominator for a branch node: each lane is followed to
 * the first node with in-scope forward in-degree >= 2, and the join shared by two or
 * more lanes is the merge. `undefined` when lanes do not converge. Nested branches are
 * resolved recursively; `visiting` guards against self-referencing recursion.
 */
export function findMerge(
  index: GraphIndex,
  branchEdges: Edge[],
  scope: Scope,
  indeg: Map<string, number> = inDegreeInScope(index, scope),
  visiting: Set<string> = new Set()
): string | undefined {
  const joinCounts = new Map<string, number>();

  for (const edge of branchEdges) {
    const join = laneJoin(index, edge.target, scope, indeg, visiting);
    if (join !== undefined) joinCounts.set(join, (joinCounts.get(join) ?? 0) + 1);
  }

  let merge: string | undefined;
  let mergeCount = 1;
  for (const [nodeId, count] of joinCounts) {
    if (count >= 2 && count > mergeCount) {
      merge = nodeId;
      mergeCount = count;
    }
  }
  return merge;
}

/** First convergence node on a lane's spine, or `undefined` if it dead-ends, leaves scope or loops. */
function laneJoin(
  index: GraphIndex,
  startId: string,
  scope: Scope,
  indeg: Map<string, number>,
  visiting: Set<string>
): string | undefined {
  const seen = new Set<string>();
  let current: string | undefined = startId;

  while (current !== undefined) {
    // Checked first so a resolved nested merge counts as a convergence point too.
    if ((indeg.get(current) ?? 0) >= 2) return current;
    if (seen.has(current) || visiting.has(current)) return undefined;
    seen.add(current);

    const node = index.nodesById.get(current);
    if (!node || node.parentId !== scope) return undefined;

    const out = forwardOut(index, current, scope);
    if (out.length === 0) return undefined;
    if (out.length === 1) {
      current = out[0]!.target;
      continue;
    }

    visiting.add(current);
    const nestedMerge = findMerge(index, out, scope, indeg, visiting);
    visiting.delete(current);
    current = nestedMerge;
  }
  return undefined;
}
