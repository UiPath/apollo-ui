import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import type { GraphChangeSet } from './sequential.types';

/**
 * Graph fixtures for the sequential engine tests and stories. Positions make flow-y
 * ordering deterministic. Not re-exported from index.ts.
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
 *   Trigger -> HTTP Request -> Javascript -> For Each [ If -> Then: Javascript 1 / Else: HTTP Request 1 ] -> Send Message to User
 * Both If branches wire back to the container's `continue` handle, so they dead-end
 * at the container boundary with no in-body merge.
 */
export const WIREFRAME_NODE_IDS = {
  trigger: 'trigger',
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
    node(ids.trigger, 'uipath.first-run', 'Workflow start', { y: -200 }),
    node(ids.http, 'uipath.http-request', 'HTTP Request', { y: 0 }),
    node(ids.javascript, 'uipath.script', 'Javascript', { y: 200 }),
    node(ids.forEach, 'uipath.control-flow.foreach', 'For Each', { y: 400 }),
    node(ids.sendMessage, 'uipath.send-message', 'Send Message to User', { y: 600 }),
    node(ids.ifNode, 'uipath.control-flow.decision', 'If', { parentId: ids.forEach, y: 0 }),
    node(ids.thenJs, 'uipath.script', 'Javascript 1', { parentId: ids.forEach, y: 120 }),
    node(ids.elseHttp, 'uipath.http-request', 'HTTP Request 1', { parentId: ids.forEach, y: 240 }),
  ];
  const edges: Edge[] = [
    edge('e-trigger-http', ids.trigger, 'output', ids.http, 'input'),
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

export const AGENT_RESOURCES_NODE_IDS = {
  agent: 'agent',
  after: 'after',
  tool: 'agent-tool',
  context: 'agent-context',
  memory: 'agent-memory',
} as const;

/**
 * Agent -> After, with three resources (tool, context, memory) wired to the agent's artifact
 * handles. The resources are attachments, not steps.
 */
export function makeAgentWithResourcesFixture(): GraphFixture {
  const ids = AGENT_RESOURCES_NODE_IDS;
  const nodes: Node[] = [
    node(ids.agent, 'uipath.agent', 'Agent', { y: 0 }),
    node(ids.after, 'uipath.http-request', 'After', { y: 300 }),
    node(ids.tool, 'uipath.agent.resource.tool', 'Search tool', { x: -200, y: 150 }),
    node(ids.context, 'uipath.agent.resource.context', 'Knowledge base', { x: 0, y: 150 }),
    node(ids.memory, 'uipath.agent.resource.memory', 'Session memory', { x: 200, y: 150 }),
  ];
  const edges: Edge[] = [
    edge('e-agent-after', ids.agent, 'success', ids.after, 'input'),
    edge('e-agent-tool', ids.agent, 'tools', ids.tool, 'input'),
    edge('e-agent-context', ids.agent, 'context', ids.context, 'input'),
    edge('e-agent-memory', ids.agent, 'memory', ids.memory, 'input'),
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

/** Two roots converging on M (X->M, Y->M). Triggers `unstructured-merge` and `multi-root`. */
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

/** A While loop closed by a `loopBack` target handle (A->B, B->A@loopBack). Not a cycle. */
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

/** Nested containers: Root -> C1 [ C2 [ Leaf ] ]. */
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

/** Empty Else lane: A -> If; If.true -> B -> C; If.false -> C. */
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
 * Nested If with empty else at both levels: A -> If1; If1.true -> If2; If2.true -> B -> M;
 * If2.false -> C -> M; If1.false -> M; M -> Z. Both Ifs merge at M.
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

/** A cycle closed through a branch edge: A -> B; B.true -> A; B.false -> D. */
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

/** A branch edge landing on a node an earlier lane already placed: X -> If; If.true -> M; If.false -> M2; Y -> M. */
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

/** Two 2-node cycles (no zero-in-degree entry) with an isolated orphan positioned between them. */
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

/** A linear container body with an unambiguous tail: A -> Container [ X -> Y ] -> B. */
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
 * Root -> C1 [ If -> {Then, Else} dead-end ] -> C2 [ Filler ] -> Tail. Exercises
 * `moveSubtree` relocating a bare branch owner with its lane content across a
 * container boundary. C2 needs `Filler` because containers are recognised structurally.
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
 * A body whose branch rejoins inside it: Container [ X -> If -> {Then, Else} -> M ] -> N.
 * For `findIndentSlot` tail resolution: a connector walk stops at the If, so the real
 * tail M is only reachable by row scan (skipping M's trailing append placeholder).
 */
export const MERGED_BRANCH_BODY_NODE_IDS = {
  container: 'mb-container',
  x: 'mb-x',
  ifNode: 'mb-if',
  thenNode: 'mb-then',
  elseNode: 'mb-else',
  merge: 'mb-merge',
  after: 'mb-after',
} as const;

export function makeMergedBranchBodyFixture(): GraphFixture {
  const ids = MERGED_BRANCH_BODY_NODE_IDS;
  const nodes: Node[] = [
    node(ids.container, 'uipath.control-flow.foreach', 'Container', { y: 0 }),
    node(ids.after, 'uipath.script', 'After', { y: 600 }),
    node(ids.x, 'uipath.script', 'X', { parentId: ids.container, y: 0 }),
    node(ids.ifNode, 'uipath.control-flow.decision', 'If', { parentId: ids.container, y: 100 }),
    node(ids.thenNode, 'uipath.script', 'Then', { parentId: ids.container, y: 200 }),
    node(ids.elseNode, 'uipath.script', 'Else', { parentId: ids.container, y: 300 }),
    node(ids.merge, 'uipath.script', 'Merge', { parentId: ids.container, y: 400 }),
  ];
  const edges: Edge[] = [
    edge('mb-container-x', ids.container, 'start', ids.x, 'input'),
    edge('mb-x-if', ids.x, 'output', ids.ifNode, 'input'),
    edge('mb-if-then', ids.ifNode, 'true', ids.thenNode, 'input', 'Then'),
    edge('mb-if-else', ids.ifNode, 'false', ids.elseNode, 'input', 'Else'),
    edge('mb-then-merge', ids.thenNode, 'output', ids.merge, 'input'),
    edge('mb-else-merge', ids.elseNode, 'output', ids.merge, 'input'),
    edge('mb-container-after', ids.container, 'success', ids.after, 'input'),
  ];
  return { nodes, edges };
}

/** A clean diamond: A -> If; If.true -> B -> D; If.false -> C -> D. */
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

/** Applies a {@link GraphChangeSet} the way a host's change handlers would. */
export function applyGraphChangeSet(
  fixture: GraphFixture,
  changeSet: GraphChangeSet
): GraphFixture {
  const removedNodeIds = new Set(changeSet.removeNodeIds);
  const removedEdgeIds = new Set(changeSet.removeEdgeIds);
  // A removed-and-re-added node is a move; production replaces it in place. Appending
  // would push a container behind its children, an order React Flow rejects.
  const replacements = new Map(
    changeSet.addNodes.filter((node) => removedNodeIds.has(node.id)).map((node) => [node.id, node])
  );
  const appended = changeSet.addNodes.filter((node) => !removedNodeIds.has(node.id));
  const nodes: Node[] = [];
  for (const node of fixture.nodes) {
    const replacement = replacements.get(node.id);
    if (replacement) nodes.push(replacement);
    else if (!removedNodeIds.has(node.id)) nodes.push(node);
  }
  return {
    nodes: [...nodes, ...appended],
    edges: [...fixture.edges.filter((edge) => !removedEdgeIds.has(edge.id)), ...changeSet.addEdges],
  };
}

export const SEQUENCED_CONTAINER_NODE_IDS = {
  trigger: 'sc-trigger',
  http: 'sc-http',
  container: 'sc-container',
  notify: 'sc-notify',
  validate: 'sc-validate',
  decision: 'sc-decision',
  reserve: 'sc-reserve',
  transform: 'sc-transform',
} as const;

/**
 * Flow canvas with one container whose body is a small sequence:
 *   Trigger -> HTTP -> Container [ Validate -> Decision (true: Reserve, false: straight to merge) -> Transform ] -> Notify
 * The container's inner `start` edge enters Validate; Transform exits to the container's
 * `continue` handle. Both fall outside the body scope.
 */
export function makeSequencedContainerFixture(): GraphFixture {
  const ids = SEQUENCED_CONTAINER_NODE_IDS;
  const nodes: Node[] = [
    node(ids.trigger, 'uipath.first-run', 'Trigger', { y: 0 }),
    node(ids.http, 'uipath.http-request', 'HTTP', { y: 150 }),
    node(ids.container, 'uipath.control-flow.foreach', 'For each', { y: 300 }),
    node(ids.notify, 'uipath.send-message', 'Notify', { y: 700 }),
    node(ids.validate, 'uipath.script', 'Validate', { parentId: ids.container, y: 0 }),
    node(ids.decision, 'uipath.control-flow.decision', 'Decision', {
      parentId: ids.container,
      y: 100,
    }),
    node(ids.reserve, 'uipath.script', 'Reserve', { parentId: ids.container, x: 100, y: 200 }),
    node(ids.transform, 'uipath.script', 'Transform', { parentId: ids.container, y: 300 }),
  ];
  const edges: Edge[] = [
    edge('sc-trigger-http', ids.trigger, 'output', ids.http, 'input'),
    edge('sc-http-container', ids.http, 'output', ids.container, 'input'),
    edge('sc-container-validate', ids.container, 'start', ids.validate, 'input'),
    edge('sc-validate-decision', ids.validate, 'output', ids.decision, 'input'),
    edge('sc-decision-reserve', ids.decision, 'true', ids.reserve, 'input'),
    edge('sc-decision-transform', ids.decision, 'false', ids.transform, 'input'),
    edge('sc-reserve-transform', ids.reserve, 'output', ids.transform, 'input'),
    edge('sc-transform-continue', ids.transform, 'output', ids.container, 'continue'),
    edge('sc-container-notify', ids.container, 'success', ids.notify, 'input'),
  ];
  return { nodes, edges };
}

export const RUNTIME_CONTAINER_NODE_IDS = {
  maestroA: 'rc-maestro-a',
  maestroB: 'rc-maestro-b',
  container: 'rc-api',
  agent: 'rc-agent',
  http: 'rc-http',
  javascript: 'rc-javascript',
  forEach: 'rc-foreach',
  step4: 'rc-step-4',
  step5: 'rc-step-5',
  step6: 'rc-step-6',
  step7: 'rc-step-7',
  sendMessage: 'rc-send-message',
} as const;

/**
 * Maestro A -> Maestro B -> runtime container "api" -> Agent. The runtime container is
 * self-contained: no edges touch its inner side. Its body is HTTP -> Javascript -> For Each
 * (four chained steps, entered from its inner `start` handle and closed to `continue`) ->
 * Send Message to User, so a sequence numbers the body 1 to 8.
 */
export function makeRuntimeContainerFixture(): GraphFixture {
  const ids = RUNTIME_CONTAINER_NODE_IDS;
  const step = 'uipath.data.transform';
  const nodes: Node[] = [
    node(ids.maestroA, step, 'Maestro A', { x: 0 }),
    node(ids.maestroB, step, 'Maestro B', { x: 200 }),
    node(ids.container, 'uipath.runtime-container', 'api', { x: 400 }),
    node(ids.agent, 'uipath.agent', 'Agent', { x: 1400 }),
    node(ids.http, 'uipath.http-request', 'HTTP Request', { parentId: ids.container, y: 0 }),
    node(ids.javascript, 'uipath.javascript', 'Javascript', { parentId: ids.container, y: 100 }),
    node(ids.forEach, 'uipath.control-flow.foreach', 'For Each', {
      parentId: ids.container,
      y: 200,
    }),
    node(ids.step4, step, 'Step 4', { parentId: ids.forEach, y: 0 }),
    node(ids.step5, step, 'Step 5', { parentId: ids.forEach, y: 100 }),
    node(ids.step6, step, 'Step 6', { parentId: ids.forEach, y: 200 }),
    node(ids.step7, step, 'Step 7', { parentId: ids.forEach, y: 300 }),
    node(ids.sendMessage, 'uipath.send-message', 'Send Message to User', {
      parentId: ids.container,
      y: 700,
    }),
  ];
  const edges: Edge[] = [
    edge('rc-a-b', ids.maestroA, 'output', ids.maestroB, 'input'),
    edge('rc-b-api', ids.maestroB, 'output', ids.container, 'input'),
    edge('rc-api-agent', ids.container, 'output', ids.agent, 'input'),
    edge('rc-http-js', ids.http, 'output', ids.javascript, 'input'),
    edge('rc-js-foreach', ids.javascript, 'output', ids.forEach, 'input'),
    edge('rc-foreach-start', ids.forEach, 'start', ids.step4, 'input'),
    edge('rc-4-5', ids.step4, 'output', ids.step5, 'input'),
    edge('rc-5-6', ids.step5, 'output', ids.step6, 'input'),
    edge('rc-6-7', ids.step6, 'output', ids.step7, 'input'),
    edge('rc-7-continue', ids.step7, 'output', ids.forEach, 'continue'),
    edge('rc-foreach-send', ids.forEach, 'success', ids.sendMessage, 'input'),
  ];
  return { nodes, edges };
}
