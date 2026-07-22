import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';

/**
 * Shared, dependency-free graph fixtures for the sequential engine tests and for
 * consumers' stories/tests. Every fixture is a plain
 * `{ nodes, edges }` graph in the canonical (flow-view) shape; positions are set
 * so flow-view-y ordering is deterministic. These are NOT re-exported from the
 * package barrel (index.ts) so test fixtures never ship to consumers; import them
 * directly from `utils/sequential/fixtures`.
 */

export interface GraphFixture {
  nodes: Node[];
  edges: Edge[];
}

interface NodeOptions {
  parentId?: string;
  x?: number;
  y?: number;
}

function node(id: string, type: string, label: string, options: NodeOptions = {}): Node {
  return {
    id,
    type,
    position: { x: options.x ?? 0, y: options.y ?? 0 },
    data: { display: { label } },
    ...(options.parentId ? { parentId: options.parentId } : {}),
  };
}

function edge(
  id: string,
  source: string,
  sourceHandle: string | undefined,
  target: string,
  targetHandle: string | undefined,
  label?: string
): Edge {
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    ...(label ? { data: { label } } : {}),
  };
}

/**
 * The wireframe reference graph:
 *   HTTP Request -> Javascript -> For Each [ If -> Then: Javascript 1 / Else: HTTP Request 1 ] -> Send Message to User
 *
 * `For Each` is a container; `If` is its sole body child; the If's two branches
 * both wire back to the container's `continue` handle (loop iteration), so they
 * dead-end at the container boundary with no in-body merge. The synthetic start
 * bar + trailing placeholder are injected view-only by the assembly, not by the projection.
 *
 * Expected projection: 7 numbered rows (HTTP=1, Javascript=2, For Each=3, If=4,
 * Javascript 1=5, HTTP Request 1=6, Send Message=7); depths 0,0,0,1,2,2,0; six
 * connectors (three `step`, three `branch-entry`: Body/Then/Else); no diagnostics.
 */
export const WIREFRAME_NODE_IDS = {
  http: 'http',
  javascript: 'javascript',
  forEach: 'for-each',
  ifNode: 'if',
  thenJs: 'javascript-1',
  elseHttp: 'http-request-1',
  sendMessage: 'send-message',
} as const;

export function makeWireframeFixture(): GraphFixture {
  const ids = WIREFRAME_NODE_IDS;
  const nodes: Node[] = [
    node(ids.http, 'uipath.http-request', 'HTTP Request', { y: 0 }),
    node(ids.javascript, 'uipath.script', 'Javascript', { y: 200 }),
    node(ids.forEach, 'uipath.control-flow.foreach', 'For Each', { y: 400 }),
    node(ids.sendMessage, 'uipath.send-message', 'Send Message to User', { y: 600 }),
    node(ids.ifNode, 'uipath.control-flow.decision', 'If', { parentId: ids.forEach, y: 0 }),
    node(ids.thenJs, 'uipath.script', 'Javascript 1', { parentId: ids.forEach, y: 120 }),
    node(ids.elseHttp, 'uipath.http-request', 'HTTP Request 1', { parentId: ids.forEach, y: 240 }),
  ];
  const edges: Edge[] = [
    edge('e-http-js', ids.http, 'output', ids.javascript, 'input'),
    edge('e-js-foreach', ids.javascript, 'success', ids.forEach, 'input'),
    edge('e-foreach-if', ids.forEach, 'start', ids.ifNode, 'input'),
    edge('e-if-then', ids.ifNode, 'true', ids.thenJs, 'input', 'Then'),
    edge('e-if-else', ids.ifNode, 'false', ids.elseHttp, 'input', 'Else'),
    edge('e-then-continue', ids.thenJs, 'success', ids.forEach, 'continue'),
    edge('e-else-continue', ids.elseHttp, 'output', ids.forEach, 'continue'),
    edge('e-foreach-send', ids.forEach, 'success', ids.sendMessage, 'input'),
  ];
  return { nodes, edges };
}

/** Two disconnected linear chains: A->B and C->D. Triggers `multi-root`. */
export function makeMultiRootFixture(): GraphFixture {
  const nodes: Node[] = [
    node('a', 'uipath.script', 'A', { y: 0 }),
    node('b', 'uipath.script', 'B', { y: 100 }),
    node('c', 'uipath.script', 'C', { y: 400 }),
    node('d', 'uipath.script', 'D', { y: 500 }),
  ];
  const edges: Edge[] = [
    edge('a-b', 'a', 'output', 'b', 'input'),
    edge('c-d', 'c', 'output', 'd', 'input'),
  ];
  return { nodes, edges };
}

/**
 * Two roots converging on one node (X->M, Y->M): M is placed under its first
 * incomer (X) and Y draws a `goto`. Triggers `unstructured-merge` (and, since
 * the two roots are independent, `multi-root`).
 */
export function makeUnstructuredMergeFixture(): GraphFixture {
  const nodes: Node[] = [
    node('x', 'uipath.script', 'X', { y: 0 }),
    node('y', 'uipath.script', 'Y', { y: 300 }),
    node('m', 'uipath.script', 'M', { y: 150 }),
  ];
  const edges: Edge[] = [
    edge('x-m', 'x', 'output', 'm', 'input'),
    edge('y-m', 'y', 'output', 'm', 'input'),
  ];
  return { nodes, edges };
}

/** A non-loopBack cycle A->B->C->A. Triggers `cycle` with a `goto` connector. */
export function makeCycleFixture(): GraphFixture {
  const nodes: Node[] = [
    node('a', 'uipath.script', 'A', { y: 0 }),
    node('b', 'uipath.script', 'B', { y: 100 }),
    node('c', 'uipath.script', 'C', { y: 200 }),
  ];
  const edges: Edge[] = [
    edge('a-b', 'a', 'output', 'b', 'input'),
    edge('b-c', 'b', 'output', 'c', 'input'),
    edge('c-a', 'c', 'output', 'a', 'input'),
  ];
  return { nodes, edges };
}

/**
 * A While-style loop closed by a `loopBack` target handle (A->B, B->A@loopBack).
 * The loopBack edge is consumed as loop closure, so this is NOT a cycle.
 */
export function makeLoopBackFixture(): GraphFixture {
  const nodes: Node[] = [
    node('a', 'uipath.control-flow.while', 'While', { y: 0 }),
    node('b', 'uipath.script', 'Body', { y: 100 }),
  ];
  const edges: Edge[] = [
    edge('a-b', 'a', 'body', 'b', 'input'),
    edge('b-a', 'b', 'output', 'a', 'loopBack'),
  ];
  return { nodes, edges };
}

/** A linear chain plus a fully disconnected node Z. Triggers `orphan`. */
export function makeOrphanFixture(): GraphFixture {
  const nodes: Node[] = [
    node('a', 'uipath.script', 'A', { y: 0 }),
    node('b', 'uipath.script', 'B', { y: 100 }),
    node('z', 'uipath.script', 'Z', { y: 900 }),
  ];
  const edges: Edge[] = [edge('a-b', 'a', 'output', 'b', 'input')];
  return { nodes, edges };
}

/**
 * Nested containers: Root -> C1 [ C2 [ Leaf ] ]. Exercises depth accumulation
 * across container nesting (Root/C1 depth 0, C2 depth 1, Leaf depth 2).
 */
export function makeDeepNestingFixture(): GraphFixture {
  const nodes: Node[] = [
    node('root', 'uipath.script', 'Root', { y: 0 }),
    node('c1', 'uipath.control-flow.foreach', 'Outer', { y: 100 }),
    node('c2', 'uipath.control-flow.foreach', 'Inner', { parentId: 'c1', y: 0 }),
    node('leaf', 'uipath.script', 'Leaf', { parentId: 'c2', y: 0 }),
  ];
  const edges: Edge[] = [
    edge('root-c1', 'root', 'output', 'c1', 'input'),
    edge('c1-c2', 'c1', 'start', 'c2', 'input'),
    edge('c2-leaf', 'c2', 'start', 'leaf', 'input'),
  ];
  return { nodes, edges };
}

/**
 * A Decision whose `false` branch wires straight to the join (empty Else lane):
 * A -> If; If.true -> B -> C; If.false -> C. Produces an empty-branch-body slot
 * for the Else lane and a `merge-back` from B to C.
 */
export function makeEmptyBranchFixture(): GraphFixture {
  const nodes: Node[] = [
    node('a', 'uipath.script', 'A', { y: 0 }),
    node('if', 'uipath.control-flow.decision', 'If', { y: 100 }),
    node('b', 'uipath.script', 'B', { y: 200 }),
    node('c', 'uipath.script', 'C', { y: 300 }),
  ];
  const edges: Edge[] = [
    edge('a-if', 'a', 'output', 'if', 'input'),
    edge('if-b', 'if', 'true', 'b', 'input', 'Then'),
    edge('if-c', 'if', 'false', 'c', 'input', 'Else'),
    edge('b-c', 'b', 'output', 'c', 'input'),
  ];
  return { nodes, edges };
}

/**
 * An if-inside-if with an empty else at both levels: A -> If1; If1.true -> If2;
 * If2.true -> B -> M; If2.false -> C -> M; If1.false -> M; M -> Z. The nested
 * If2's own merge (M) must be resolved before If1's outer merge detection can
 * see that both of ITS lanes (the If2 subtree, and the direct false edge) join
 * at M. Regression fixture for the nested-branch post-dominator fix.
 */
export function makeNestedBranchFixture(): GraphFixture {
  const nodes: Node[] = [
    node('a', 'uipath.script', 'A', { y: 0 }),
    node('if1', 'uipath.control-flow.decision', 'If1', { y: 100 }),
    node('if2', 'uipath.control-flow.decision', 'If2', { y: 200 }),
    node('b', 'uipath.script', 'B', { y: 300 }),
    node('c', 'uipath.script', 'C', { y: 400 }),
    node('m', 'uipath.script', 'M', { y: 500 }),
    node('z', 'uipath.script', 'Z', { y: 600 }),
  ];
  const edges: Edge[] = [
    edge('a-if1', 'a', 'output', 'if1', 'input'),
    edge('if1-if2', 'if1', 'true', 'if2', 'input', 'Then'),
    edge('if1-m', 'if1', 'false', 'm', 'input', 'Else'),
    edge('if2-b', 'if2', 'true', 'b', 'input', 'Then'),
    edge('if2-c', 'if2', 'false', 'c', 'input', 'Else'),
    edge('b-m', 'b', 'output', 'm', 'input'),
    edge('c-m', 'c', 'output', 'm', 'input'),
    edge('m-z', 'm', 'output', 'z', 'input'),
  ];
  return { nodes, edges };
}

/**
 * A cycle closed through one of a branch node's two out-edges: A -> B;
 * B.true -> A (closes the cycle); B.false -> D. Regression fixture for
 * classifying branch-edge targets (onStack/visited) before rendering them as
 * an insertable branch-entry lane.
 */
export function makeBranchCycleFixture(): GraphFixture {
  const nodes: Node[] = [
    node('a', 'uipath.script', 'A', { y: 0 }),
    node('b', 'uipath.control-flow.decision', 'B', { y: 100 }),
    node('d', 'uipath.script', 'D', { y: 200 }),
  ];
  const edges: Edge[] = [
    edge('a-b', 'a', 'output', 'b', 'input'),
    edge('b-a', 'b', 'true', 'a', 'input', 'Retry'),
    edge('b-d', 'b', 'false', 'd', 'input', 'Done'),
  ];
  return { nodes, edges };
}

/**
 * Two independent roots (X, Y) whose branch edges both jump straight to an
 * already-visited node (M is placed by X's lane; Y's branch edge then targets
 * M too): X -> If; If.true -> M; If.false -> M2; Y -> M. Regression fixture
 * for a branch edge landing on a node visited by an unrelated earlier lane.
 */
export function makeBranchVisitedTargetFixture(): GraphFixture {
  const nodes: Node[] = [
    node('x', 'uipath.script', 'X', { y: 0 }),
    node('if', 'uipath.control-flow.decision', 'If', { y: 100 }),
    node('m', 'uipath.script', 'M', { y: 200 }),
    node('m2', 'uipath.script', 'M2', { y: 300 }),
    node('y', 'uipath.script', 'Y', { y: 400 }),
  ];
  const edges: Edge[] = [
    edge('x-if', 'x', 'output', 'if', 'input'),
    edge('if-m', 'if', 'true', 'm', 'input', 'Then'),
    edge('if-m2', 'if', 'false', 'm2', 'input', 'Else'),
    edge('y-m', 'y', 'output', 'm', 'input'),
  ];
  return { nodes, edges };
}

/** A lone node with zero edges: the simplest possible valid sequence. */
export function makeSingleNodeFixture(): GraphFixture {
  return { nodes: [node('only', 'uipath.script', 'Only', { y: 0 })], edges: [] };
}

/**
 * Two independent components with no zero-in-degree entry (each a 2-node
 * cycle, so every node has in-degree 1) plus a fully isolated orphan
 * positioned, in flow-view y, BETWEEN the two components. Regression fixture
 * proving orphans always land in a trailing section instead of splitting two
 * components' rows apart.
 */
export function makeInterleavedOrphanFixture(): GraphFixture {
  const nodes: Node[] = [
    node('p1', 'uipath.script', 'P1', { y: 0 }),
    node('p2', 'uipath.script', 'P2', { y: 50 }),
    node('orphan', 'uipath.script', 'Orphan', { y: 75 }),
    node('q1', 'uipath.script', 'Q1', { y: 100 }),
    node('q2', 'uipath.script', 'Q2', { y: 150 }),
  ];
  const edges: Edge[] = [
    edge('p1-p2', 'p1', 'output', 'p2', 'input'),
    edge('p2-p1', 'p2', 'output', 'p1', 'input'),
    edge('q1-q2', 'q1', 'output', 'q2', 'input'),
    edge('q2-q1', 'q2', 'output', 'q1', 'input'),
  ];
  return { nodes, edges };
}

/**
 * A plain (non-branching) container body flanked by top-level siblings:
 * A -> Container [ X -> Y ] -> B. Used for indent/outdent/moveSubtree tests
 * that need an unambiguous body "tail" - unlike the wireframe's `For Each`,
 * whose sole body content (`If`) dead-ends via a hidden loop-closing edge and
 * has no single linear tail to append after.
 */
export const CONTAINER_CHAIN_NODE_IDS = {
  a: 'chain-a',
  container: 'chain-container',
  x: 'chain-x',
  y: 'chain-y',
  b: 'chain-b',
} as const;

export function makeContainerChainFixture(): GraphFixture {
  const ids = CONTAINER_CHAIN_NODE_IDS;
  const nodes: Node[] = [
    node(ids.a, 'uipath.script', 'A', { y: 0 }),
    node(ids.container, 'uipath.control-flow.foreach', 'Container', { y: 100 }),
    node(ids.b, 'uipath.script', 'B', { y: 300 }),
    node(ids.x, 'uipath.script', 'X', { parentId: ids.container, y: 0 }),
    node(ids.y, 'uipath.script', 'Y', { parentId: ids.container, y: 100 }),
  ];
  const edges: Edge[] = [
    edge('chain-a-container', ids.a, 'output', ids.container, 'input'),
    edge('chain-container-x', ids.container, 'start', ids.x, 'input'),
    edge('chain-x-y', ids.x, 'output', ids.y, 'input'),
    edge('chain-container-b', ids.container, 'success', ids.b, 'input'),
  ];
  return { nodes, edges };
}

/**
 * Two top-level containers: C1 holds a Decision (`If`) whose Then/Else
 * branches dead-end (no shared merge, mirroring the wireframe's loop-body
 * idiom); C2 holds a single plain leaf (`Filler`) - NOT a truly childless
 * container, since this structural engine has no manifest access and can
 * only recognize a node as a container via `isContainerNode` (at least one
 * OTHER node pointing at it via `parentId`; see graph-helpers.ts). Root -> C1
 * -> C2 -> Tail. Purpose-built to exercise `moveSubtree` relocating a BARE
 * BRANCH OWNER (not itself a container) together with its lane content
 * across a container boundary (`If`'s subtree moves from C1's body to
 * append after C2's `Filler`) via a source-only slot, so the move only ADDS
 * an incoming edge to `If` and never a competing outgoing one - see
 * moveSubtree's doc comment on why splicing a new OUTGOING edge onto a bare
 * branch owner is unsound (it always reads as a third lane, not a "next
 * step").
 */
export const CROSS_CONTAINER_BRANCH_NODE_IDS = {
  root: 'cc-root',
  c1: 'cc-c1',
  ifNode: 'cc-if',
  thenLeaf: 'cc-then',
  elseLeaf: 'cc-else',
  c2: 'cc-c2',
  filler: 'cc-filler',
  tail: 'cc-tail',
} as const;

export function makeCrossContainerBranchFixture(): GraphFixture {
  const ids = CROSS_CONTAINER_BRANCH_NODE_IDS;
  const nodes: Node[] = [
    node(ids.root, 'uipath.script', 'Root', { y: 0 }),
    node(ids.c1, 'uipath.control-flow.foreach', 'C1', { y: 100 }),
    node(ids.c2, 'uipath.control-flow.foreach', 'C2', { y: 300 }),
    node(ids.tail, 'uipath.script', 'Tail', { y: 500 }),
    node(ids.ifNode, 'uipath.control-flow.decision', 'If', { parentId: ids.c1, y: 0 }),
    node(ids.thenLeaf, 'uipath.script', 'Then', { parentId: ids.c1, y: 100 }),
    node(ids.elseLeaf, 'uipath.script', 'Else', { parentId: ids.c1, y: 200 }),
    node(ids.filler, 'uipath.script', 'Filler', { parentId: ids.c2, y: 0 }),
  ];
  const edges: Edge[] = [
    edge('cc-root-c1', ids.root, 'output', ids.c1, 'input'),
    edge('cc-c1-if', ids.c1, 'start', ids.ifNode, 'input'),
    edge('cc-if-then', ids.ifNode, 'true', ids.thenLeaf, 'input', 'Then'),
    edge('cc-if-else', ids.ifNode, 'false', ids.elseLeaf, 'input', 'Else'),
    edge('cc-c2-filler', ids.c2, 'start', ids.filler, 'input'),
    edge('cc-c1-c2', ids.c1, 'success', ids.c2, 'input'),
    edge('cc-c2-tail', ids.c2, 'success', ids.tail, 'input'),
  ];
  return { nodes, edges };
}

/**
 * A single-root diamond that findMerge resolves cleanly: A -> If;
 * If.true -> B -> D; If.false -> C -> D. D is the immediate post-dominator;
 * both lane tails draw `merge-back` connectors into it, D is emitted once.
 */
export function makeDiamondFixture(): GraphFixture {
  const nodes: Node[] = [
    node('a', 'uipath.script', 'A', { y: 0 }),
    node('if', 'uipath.control-flow.decision', 'If', { y: 100 }),
    node('b', 'uipath.script', 'B', { y: 200 }),
    node('c', 'uipath.script', 'C', { y: 300 }),
    node('d', 'uipath.script', 'D', { y: 400 }),
  ];
  const edges: Edge[] = [
    edge('a-if', 'a', 'output', 'if', 'input'),
    edge('if-b', 'if', 'true', 'b', 'input', 'Then'),
    edge('if-c', 'if', 'false', 'c', 'input', 'Else'),
    edge('b-d', 'b', 'output', 'd', 'input'),
    edge('c-d', 'c', 'output', 'd', 'input'),
  ];
  return { nodes, edges };
}
