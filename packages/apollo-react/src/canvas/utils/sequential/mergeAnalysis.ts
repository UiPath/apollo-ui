import type { Edge } from '@uipath/apollo-react/canvas/xyflow/react';
import { forwardOut, type GraphIndex, inDegreeInScope, type Scope } from './graph-helpers';

/**
 * Approximate immediate post-dominator ("merge point") for a branch node.
 *
 * A full dominator computation is overkill for the small, mostly-structured
 * scopes the projection walks. Instead each branch is descended along its
 * single-successor spine; a branch's "join" is the first node it reaches whose
 * in-scope forward in-degree is >= 2 (a convergence point). When two or more
 * branches converge on the same join, that node is the merge: lanes stop before
 * it, it is emitted once at the branch owner's depth, and lane tails draw
 * merge-back connectors into it. Irregular convergence (no shared join) returns
 * `undefined`, which the projection degrades into first-incomer-wins + goto
 * connectors (D9, precedent utils/coded-agents/d3-layout.ts:97-98).
 *
 * A lane's spine can itself split again (a branch nested inside a branch). Such
 * a lane's own merge is resolved recursively (findMerge called on the nested
 * branch's out-edges) and the walk continues from THAT merge, so a nested
 * branch never defeats the outer branch's convergence detection. `visiting`
 * threads a shared guard set through the whole recursive resolution so
 * pathologically self-referencing nested branches degrade to `undefined`
 * instead of recursing forever.
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

/**
 * Follows one branch's single-successor spine and returns the first convergence
 * node (forward in-degree >= 2) it reaches, or `undefined` if the branch
 * dead-ends, leaves scope, or loops before converging. When the spine itself
 * splits (a nested branch), the nested branch's own merge is resolved first
 * (recursively) and the walk resumes from it, rather than bailing out.
 */
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
    // A convergence point is recognized regardless of how we arrived at it
    // (a direct step or a resolved nested merge), so check it first.
    if ((indeg.get(current) ?? 0) >= 2) return current;
    if (seen.has(current) || visiting.has(current)) return undefined; // loops without converging
    seen.add(current);

    const node = index.nodesById.get(current);
    if (!node || node.parentId !== scope) return undefined;

    const out = forwardOut(index, current, scope);
    if (out.length === 0) return undefined; // dead-end: never converges
    if (out.length === 1) {
      current = out[0]!.target;
      continue;
    }

    // Nested branch: resolve its own merge first, then continue from there.
    visiting.add(current);
    const nestedMerge = findMerge(index, out, scope, indeg, visiting);
    visiting.delete(current);
    current = nestedMerge;
  }
  return undefined;
}
