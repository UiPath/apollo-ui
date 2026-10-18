import type { Edge } from '@uipath/apollo-react/canvas/xyflow/react';
import { forwardOut, type GraphIndex, inDegreeInScope, type Scope } from './graph-helpers';

/**
 * A convergence node plus how many of its incoming edges the lanes that reached it account
 * for. A join whose every incoming edge is accounted for is closed by those lanes; one with
 * more incoming edges is also fed from outside them.
 */
interface Join {
  nodeId: string;
  arrivals: number;
}

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
  return resolveMerge(index, branchEdges, scope, indeg, visiting)?.nodeId;
}

function resolveMerge(
  index: GraphIndex,
  branchEdges: Edge[],
  scope: Scope,
  indeg: Map<string, number>,
  visiting: Set<string>
): Join | undefined {
  const lanesByJoin = new Map<string, { lanes: number; arrivals: number }>();

  for (const edge of branchEdges) {
    const join = laneJoin(index, edge.target, scope, indeg, visiting);
    if (join === undefined) continue;
    const entry = lanesByJoin.get(join.nodeId);
    if (entry) {
      entry.lanes += 1;
      entry.arrivals += join.arrivals;
    } else {
      lanesByJoin.set(join.nodeId, { lanes: 1, arrivals: join.arrivals });
    }
  }

  let merge: Join | undefined;
  let mergeLanes = 1;
  for (const [nodeId, { lanes, arrivals }] of lanesByJoin) {
    if (lanes >= 2 && lanes > mergeLanes) {
      merge = { nodeId, arrivals };
      mergeLanes = lanes;
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
): Join | undefined {
  const seen = new Set<string>();
  let current: string | undefined = startId;
  // Incoming edges of `current` this lane accounts for: one when it stepped here along its
  // spine, or every lane of a nested branch when `current` is that branch's merge.
  let arrivals = 1;

  while (current !== undefined) {
    // A node fed from outside this lane too is where the lane converges with its siblings.
    // A nested branch's own merge, closed entirely by that branch, is just the next step on
    // the spine: stopping there would hide the outer join further down.
    const inDegree = indeg.get(current) ?? 0;
    if (inDegree >= 2 && inDegree > arrivals) return { nodeId: current, arrivals };
    if (seen.has(current) || visiting.has(current)) return undefined;
    seen.add(current);

    const node = index.nodesById.get(current);
    if (!node || node.parentId !== scope) return undefined;

    const out = forwardOut(index, current, scope);
    if (out.length === 0) return undefined;
    if (out.length === 1) {
      current = out[0]!.target;
      arrivals = 1;
      continue;
    }

    visiting.add(current);
    const nestedMerge = resolveMerge(index, out, scope, indeg, visiting);
    visiting.delete(current);
    current = nestedMerge?.nodeId;
    arrivals = nestedMerge?.arrivals ?? 1;
  }
  return undefined;
}
