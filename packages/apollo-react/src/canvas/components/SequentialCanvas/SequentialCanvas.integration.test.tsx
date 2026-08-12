import { act, render, screen } from '@testing-library/react';
import type {
  Edge,
  Node,
  NodeChange,
  NodeTypes,
  OnEdgesChange,
  OnNodesChange,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { applyEdgeChanges, applyNodeChanges } from '@uipath/apollo-react/canvas/xyflow/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREVIEW_NODE_ID, SEQ_BAR_WIDTH } from '../../constants';
import { NodeRegistryProvider } from '../../core';
import { getToolbarActionStore } from '../../hooks/ToolbarActionContext';
import type { NodeManifest } from '../../schema/node-definition';
import type { ToolbarActionEvent } from '../../schema/toolbar';
import { defaultWorkflowManifest } from '../../storybook-utils/manifests';
import { sequentialWireframeManifests } from '../../storybook-utils/sequential/wireframeManifests';
import {
  makeDiamondFixture,
  makeWireframeFixture,
  WIREFRAME_NODE_IDS,
} from '../../utils/sequential/fixtures';
import { SEQ_LANE_PLACEHOLDER_PREFIX } from '../../utils/sequential/graph-helpers';
import type { CanvasView } from '../../utils/sequential/sequential.types';
import { SequentialCanvas } from './SequentialCanvas';
import {
  SEQ_FULL_RENDER_MAX_NODES,
  SEQ_PLACEHOLDER_ROW_ID,
  SEQ_START_ROW_ID,
} from './sequentialGraph.constants';

/**
 * Integration coverage for the two architectural seams of the Sequential Canvas
 * view. Everything else in the feature is covered by pure-layer tests
 * (`utils/sequential/*`) and leaf-component tests; this file is the only one that
 * MOUNTS `SequentialCanvas` and drives it end to end.
 *
 * The two seams under test:
 *
 *  - seam 1 (D4, derivation): the sequential view is a DERIVED projection. It
 *    must never write geometry back into canonical state, so a
 *    flow -> sequential -> flow round trip has to leave every canonical
 *    position / containment / dimension untouched even after xyflow reports a
 *    full mount burst of position and dimension changes.
 *  - seam 2 (change forwarding): xyflow reports every store mutation of the
 *    DERIVED arrays through onNodesChange / onEdgesChange. The canvas translates
 *    that stream before it reaches the host: view geometry is dropped, synthetic
 *    rows are dropped, and a `replace` on a real node merges only `data` +
 *    `selected` onto the CANONICAL node.
 *
 * ## Why the assertions are about props, not pixels
 *
 * `ReactFlow` is replaced with a capturing stub (the idiom in
 * `BaseCanvas.test.tsx`), so no node component ever renders. That is not a
 * limitation here: both seams are pure data flow. `capturedFlowProps.current`
 * holds exactly what `BaseCanvas` handed xyflow, so tests read
 * `.nodes` / `.edges` to inspect the derived arrays and CALL `.onNodesChange(...)`
 * to play the role of xyflow reporting a change. That drives the real
 * `handleNodesChange` -> `forwardSequentialNodeChanges` path and asserts what
 * reaches the host's spy, which is the seam itself.
 */

const { capturedFlowProps, mockReactFlowInstance } = vi.hoisted(() => ({
  capturedFlowProps: {
    // biome-ignore lint/suspicious/noExplicitAny: holds whatever BaseCanvas passes ReactFlow
    current: undefined as any,
  },
  // SequentialCanvas reads the instance for placeholder positions and viewport
  // save/restore only; neither is under test here, so a flat stub is enough.
  mockReactFlowInstance: {
    fitView: vi.fn(),
    setViewport: vi.fn(),
    getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
    getNode: vi.fn(() => undefined),
    getNodes: vi.fn(() => []),
    getEdges: vi.fn(() => []),
    setNodes: vi.fn(),
    setEdges: vi.fn(),
    updateNodeData: vi.fn(),
    updateNode: vi.fn(),
  },
}));

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>()),
  // Capture the props instead of rendering a flow. `nodes` / `edges` / the change
  // handlers are the whole surface these tests need.
  // biome-ignore lint/suspicious/noExplicitAny: test stub
  ReactFlow: (props: any) => {
    capturedFlowProps.current = props;
    return <div data-testid="react-flow">{props.children}</div>;
  },
  Background: () => <div data-testid="background" />,
  // The real portal targets a DOM node the stubbed flow never renders; render the
  // gutter inline instead so it is still exercised on every mount.
  // biome-ignore lint/suspicious/noExplicitAny: test stub
  ViewportPortal: ({ children }: any) => <div data-testid="viewport-portal">{children}</div>,
  useReactFlow: () => mockReactFlowInstance,
}));

/**
 * A node whose spine output is named `next` rather than `output` / `success`, and
 * which declares that fact the only way a manifest can: `isDefaultForType`.
 *
 * This manifest exists because NO Storybook manifest discriminates
 * `resolveBranchHandleIds` rule 1. `uipath.agent` is the only one that flags a
 * default, and its spine happens to be called `success`, so rule 2 would resolve
 * it even if rule 1 were removed entirely. Without a `next`-named spine there is
 * no mounted-canvas coverage of the gate at all, which is precisely the case the
 * fix was written for.
 */
const CUSTOM_SPINE_NODE_TYPE = 'test.custom-spine';
const customSpineManifest: NodeManifest = {
  nodeType: CUSTOM_SPINE_NODE_TYPE,
  version: '1',
  category: 'connector',
  tags: ['test'],
  description: 'A node whose forward output is named `next` and flagged as the type default',
  display: { label: 'Custom Spine', icon: 'globe' },
  handleConfiguration: [
    {
      position: 'left',
      handles: [{ id: 'input', type: 'target', handleType: 'input' }],
    },
    {
      position: 'right',
      handles: [
        // Deliberately NOT named `output` / `success`, so the name heuristic cannot
        // rescue it and only the flagged default can identify the spine.
        { id: 'next', type: 'source', handleType: 'output', isDefaultForType: true },
        { id: 'error', label: 'Error', type: 'source', handleType: 'output' },
      ],
    },
  ],
};

/**
 * The wireframe fixture uses two node types ("HTTP Request", "Send Message to
 * User") that have no Storybook manifest of their own. Merged additively, the
 * same way `SequentialCanvasStoryHarness` does it, so the shared
 * `defaultWorkflowManifest` every other canvas test relies on is untouched.
 */
const testManifest = {
  ...defaultWorkflowManifest,
  nodes: [...defaultWorkflowManifest.nodes, ...sequentialWireframeManifests, customSpineManifest],
};

/** Spies the harness wraps the host callbacks in, re-created per test. */
let hostNodesChange: ReturnType<typeof vi.fn>;
let hostEdgesChange: ReturnType<typeof vi.fn>;
let hostToolbarAction: ReturnType<typeof vi.fn>;

/**
 * Live mirror of the harness's canonical state, written during render. Lets a
 * test read the canonical graph after driving changes through the seam without
 * threading a callback out of the component tree.
 */
const canonical: { nodes: Node[]; edges: Edge[] } = { nodes: [], edges: [] };

interface HarnessProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  view: CanvasView;
  mode?: 'design' | 'view' | 'readonly';
  /**
   * Set false to model a host that owns mutations itself and wires neither change
   * callback. The canvas then has no channel to emit on, which is a distinct case
   * from "not in design mode" for anything that reports whether it acted.
   */
  wireChangeHandlers?: boolean;
  /** Models a host that owns the flow view's node renderers outright. */
  flowNodeTypes?: NodeTypes;
}

/**
 * A realistic controlled host: canonical `nodes`/`edges` in state, mutated ONLY
 * through xyflow's own reducers, with the host callbacks wrapped in spies. This
 * is the shape every consumer is expected to have (and what
 * `SequentialCanvasStoryHarness` does), so a change that only "works" against a
 * stubbed host would fail here.
 */
function ControlledHarness({
  initialNodes,
  initialEdges,
  view,
  mode = 'design',
  wireChangeHandlers = true,
  flowNodeTypes,
}: HarnessProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  canonical.nodes = nodes;
  canonical.edges = edges;

  const onNodesChange: OnNodesChange = (changes) => {
    hostNodesChange(changes);
    setNodes((current) => applyNodeChanges(changes, current));
  };
  const onEdgesChange: OnEdgesChange = (changes) => {
    hostEdgesChange(changes);
    setEdges((current) => applyEdgeChanges(changes, current));
  };

  return (
    <SequentialCanvas
      view={view}
      mode={mode}
      nodes={nodes}
      edges={edges}
      onNodesChange={wireChangeHandlers ? onNodesChange : undefined}
      onEdgesChange={wireChangeHandlers ? onEdgesChange : undefined}
      onToolbarAction={hostToolbarAction}
      flowNodeTypes={flowNodeTypes}
    />
  );
}

function renderCanvas(props: HarnessProps) {
  const result = render(
    <NodeRegistryProvider manifest={testManifest}>
      <ControlledHarness {...props} />
    </NodeRegistryProvider>
  );
  const rerenderWith = (next: Partial<HarnessProps>) =>
    result.rerender(
      <NodeRegistryProvider manifest={testManifest}>
        <ControlledHarness {...props} {...next} />
      </NodeRegistryProvider>
    );
  return { ...result, rerenderWith };
}

/** The derived arrays `BaseCanvas` last handed xyflow. */
const derivedNodes = (): Node[] => capturedFlowProps.current.nodes;
const derivedNodeIds = (): string[] => derivedNodes().map((node) => node.id);

/** Plays the role of xyflow reporting node changes on the derived array. */
function reportNodeChanges(changes: NodeChange[]): void {
  act(() => {
    capturedFlowProps.current.onNodesChange(changes);
  });
}

/** Every canonical field the sequential view is forbidden to write (D4). */
function geometryOf(nodes: readonly Node[]) {
  return nodes.map((node) => ({
    id: node.id,
    position: { ...node.position },
    parentId: node.parentId,
    extent: node.extent,
    width: node.width,
    height: node.height,
  }));
}

/** All node changes the host received, flattened across every call. */
function forwardedNodeChanges(): NodeChange[] {
  return hostNodesChange.mock.calls.flatMap((call) => call[0] as NodeChange[]);
}

function changeIds(changes: readonly NodeChange[], type: NodeChange['type']): string[] {
  return changes
    .filter((change) => change.type === type)
    .map((change) => ('id' in change ? change.id : change.item.id));
}

/** A flat chain of single-output nodes, so no branch-lane placeholder rows are added. */
function makeChainFixture(length: number): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = Array.from({ length }, (_, index) => ({
    id: `step-${index}`,
    type: 'uipath.http-request',
    position: { x: 0, y: index * 100 },
    data: { display: { label: `Step ${index}` } },
  }));
  const edges: Edge[] = nodes.slice(1).map((node, index) => ({
    id: `chain-${index}`,
    source: `step-${index}`,
    sourceHandle: 'output',
    target: node.id,
    targetHandle: 'input',
  }));
  return { nodes, edges };
}

/**
 * An agent node feeding one downstream step. `uipath.agent` is the one manifest in
 * the Storybook set that flags `isDefaultForType` on its spine (`success`), and it
 * also carries five `artifact` source handles, so it is the real production case
 * for `resolveBranchHandleIds` rule 1.
 */
function makeAgentFixture(): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      {
        id: 'agent',
        type: 'uipath.agent',
        position: { x: 0, y: 0 },
        data: { display: { label: 'Agent' } },
      },
      {
        id: 'after',
        type: 'uipath.http-request',
        position: { x: 0, y: 200 },
        data: { display: { label: 'After' } },
      },
    ],
    edges: [
      {
        id: 'agent-after',
        source: 'agent',
        sourceHandle: 'success',
        target: 'after',
        targetHandle: 'input',
      },
    ],
  };
}

/** `<spine node> --next--> <step>`, plus an untouched `error` lane. */
function makeCustomSpineFixture(): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      {
        id: 'spine',
        type: CUSTOM_SPINE_NODE_TYPE,
        position: { x: 0, y: 0 },
        data: { display: { label: 'Custom Spine' } },
      },
      {
        id: 'after',
        type: 'uipath.http-request',
        position: { x: 0, y: 200 },
        data: { display: { label: 'After' } },
      },
    ],
    edges: [
      {
        id: 'spine-after',
        source: 'spine',
        sourceHandle: 'next',
        target: 'after',
        targetHandle: 'input',
      },
    ],
  };
}

beforeEach(() => {
  hostNodesChange = vi.fn();
  hostEdgesChange = vi.fn();
  hostToolbarAction = vi.fn();
  capturedFlowProps.current = undefined;
  canonical.nodes = [];
  canonical.edges = [];
});

describe('SequentialCanvas view toggle (seam 1, D4)', () => {
  it('leaves every canonical position, containment, and dimension untouched across a flow -> sequential -> flow round trip', () => {
    const { nodes, edges } = makeWireframeFixture();
    const { rerenderWith } = renderCanvas({
      initialNodes: nodes,
      initialEdges: edges,
      view: 'flow',
    });

    // Flow view passes the canonical graph straight through, so this snapshot is
    // the real canonical geometry, taken before sequential has ever derived.
    const before = geometryOf(canonical.nodes);
    const identitiesBefore = new Map(canonical.nodes.map((node) => [node.id, node]));
    expect(before).toHaveLength(nodes.length);

    rerenderWith({ view: 'sequential' });

    // The mount burst xyflow really produces: it measures every rendered bar and
    // reports a position + dimensions change for each one. In sequential view
    // those describe LAYOUT-owned geometry of a flattened 896px clone, so
    // forwarding any of them would overwrite the canonical graph. Drive the
    // whole burst through the seam at once.
    const realRowIds = derivedNodeIds().filter(
      (id) => id !== SEQ_START_ROW_ID && id !== SEQ_PLACEHOLDER_ROW_ID
    );
    // Guards the test against silently going vacuous: the burst has to actually
    // target every canonical row (the trigger is absorbed into the start bar, so
    // it has no row of its own). The neighbouring `select` test proves this same
    // channel is live, so nothing here can pass merely by never arriving.
    for (const id of Object.values(WIREFRAME_NODE_IDS)) {
      if (id === WIREFRAME_NODE_IDS.trigger) continue;
      expect(realRowIds).toContain(id);
    }
    reportNodeChanges([
      ...realRowIds.map(
        (id, index): NodeChange => ({
          id,
          type: 'position',
          position: { x: 64, y: index * 120 },
          dragging: false,
        })
      ),
      ...realRowIds.map(
        (id): NodeChange => ({
          id,
          type: 'dimensions',
          dimensions: { width: SEQ_BAR_WIDTH, height: 56 },
          resizing: false,
        })
      ),
    ]);

    rerenderWith({ view: 'flow' });

    expect(geometryOf(canonical.nodes)).toEqual(before);
    // Stronger than value equality and the real promise of D4: canonical nodes
    // are not even re-created, because the seam produced no forwardable change
    // at all and the host's reducer was never invoked.
    for (const node of canonical.nodes) {
      expect(node).toBe(identitiesBefore.get(node.id));
    }
  });

  it('disables connections in sequential view and restores them in flow view (documented v1 constraint)', () => {
    const { nodes, edges } = makeWireframeFixture();
    const { rerenderWith } = renderCanvas({
      initialNodes: nodes,
      initialEdges: edges,
      view: 'sequential',
    });
    expect(capturedFlowProps.current.nodesConnectable).toBe(false);

    rerenderWith({ view: 'flow' });
    expect(capturedFlowProps.current.nodesConnectable).toBe(true);
  });

  // A host can render its own AddNodeManager through `children` in flow view, and
  // xyflow drops a node whose type is unregistered, so `preview` must resolve in
  // both views. The two registrations must also DIFFER: the square flow ghost
  // reads as an empty slab at the bar's 16:1 aspect ratio.
  it("registers a `preview` node type in BOTH views, with each view's own ghost", () => {
    const { nodes, edges } = makeWireframeFixture();
    const { rerenderWith } = renderCanvas({
      initialNodes: nodes,
      initialEdges: edges,
      view: 'sequential',
    });
    const sequentialPreview = capturedFlowProps.current.nodeTypes.preview;
    expect(sequentialPreview).toBeDefined();

    rerenderWith({ view: 'flow' });
    const flowPreview = capturedFlowProps.current.nodeTypes.preview;
    expect(flowPreview).toBeDefined();
    expect(flowPreview).not.toBe(sequentialPreview);
  });

  it('registers `preview` even when the host owns flowNodeTypes, without displacing it', () => {
    // The host that supplies its own renderers is the one most likely to also
    // render its own panel, so the registration has to survive that path rather
    // than only the derived one. Anything the host put under `preview` wins.
    const { nodes, edges } = makeWireframeFixture();
    const HostNode = () => null;

    const { rerenderWith } = renderCanvas({
      initialNodes: nodes,
      initialEdges: edges,
      view: 'flow',
      flowNodeTypes: { task: HostNode },
    });

    expect(capturedFlowProps.current.nodeTypes.task).toBe(HostNode);
    expect(capturedFlowProps.current.nodeTypes.preview).toBeDefined();

    rerenderWith({ flowNodeTypes: { task: HostNode, preview: HostNode } });
    expect(capturedFlowProps.current.nodeTypes.preview).toBe(HostNode);
  });
});

describe('SequentialCanvas change forwarding (seam 2)', () => {
  it('drops position and dimension changes, and passes selection through', () => {
    const { nodes, edges } = makeWireframeFixture();
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential' });

    const target = WIREFRAME_NODE_IDS.javascript;
    expect(derivedNodeIds()).toContain(target);

    reportNodeChanges([
      { id: target, type: 'position', position: { x: 999, y: 999 }, dragging: true },
      { id: target, type: 'dimensions', dimensions: { width: 12, height: 34 }, resizing: true },
    ]);

    // The canvas may not call the host at all when nothing survives the filter;
    // what matters is that no position/dimension change ever reaches it.
    const geometryChanges = forwardedNodeChanges().filter(
      (change) => change.type === 'position' || change.type === 'dimensions'
    );
    expect(geometryChanges).toEqual([]);

    // Selection is real canonical state and must pass through untouched, which is
    // what keeps keyboard nav and pointer selection indistinguishable to the host.
    reportNodeChanges([{ id: target, type: 'select', selected: true }]);
    expect(hostNodesChange).toHaveBeenCalledWith([{ id: target, type: 'select', selected: true }]);
    expect(canonical.nodes.find((node) => node.id === target)?.selected).toBe(true);
  });

  it('rewrites a replace to merge only data and selected onto the canonical node', () => {
    const { nodes, edges } = makeWireframeFixture();
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential' });

    // `if` is the interesting case: it is a CONTAINED node (parentId: for-each),
    // and the sequential clone is flattened, so a verbatim replace would erase
    // the containment the flow view depends on.
    const targetId = WIREFRAME_NODE_IDS.ifNode;
    const canonicalBefore = canonical.nodes.find((node) => node.id === targetId);
    expect(canonicalBefore?.parentId).toBe(WIREFRAME_NODE_IDS.forEach);
    const derivedClone = derivedNodes().find((node) => node.id === targetId);
    // Sanity-check that the clone really carries view-only geometry, otherwise
    // the assertion below would pass for the wrong reason.
    expect(derivedClone?.width).toBe(SEQ_BAR_WIDTH);
    expect(derivedClone?.parentId).toBeUndefined();
    expect(derivedClone?.draggable).toBe(false);

    // What an inline rename via `updateNodeData` produces: a replace whose item
    // is the derived clone with new `data`.
    const renamed: Node = {
      ...(derivedClone as Node),
      data: { display: { label: 'Renamed' } },
      selected: true,
    };
    reportNodeChanges([{ id: targetId, type: 'replace', item: renamed }]);

    const replaces = forwardedNodeChanges().filter((change) => change.type === 'replace');
    expect(replaces).toHaveLength(1);
    const forwarded = replaces[0] as Extract<NodeChange, { type: 'replace' }>;

    // Only the two host-owned fields come from the clone...
    expect(forwarded.item.data).toEqual({ display: { label: 'Renamed' } });
    expect(forwarded.item.selected).toBe(true);
    // ...every geometry / structure field comes from the CANONICAL node.
    expect(forwarded.item.position).toEqual(canonicalBefore?.position);
    expect(forwarded.item.parentId).toBe(WIREFRAME_NODE_IDS.forEach);
    expect(forwarded.item.width).toBe(canonicalBefore?.width);
    expect(forwarded.item.draggable).toBe(canonicalBefore?.draggable);
    expect(forwarded.item.type).toBe(canonicalBefore?.type);

    // And the containment survives in the host's state after the reducer runs.
    expect(canonical.nodes.find((node) => node.id === targetId)?.parentId).toBe(
      WIREFRAME_NODE_IDS.forEach
    );
  });

  it('renders synthetic rows but never forwards changes that reference them', () => {
    const { nodes, edges } = makeWireframeFixture();
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential' });

    // (a) The derivation injects them: the start bar, the terminal placeholder,
    //     and one lane placeholder per empty branch lane (every `uipath.script`
    //     node declares an unused `error` lane).
    const ids = derivedNodeIds();
    expect(ids).toContain(SEQ_START_ROW_ID);
    expect(ids).toContain(SEQ_PLACEHOLDER_ROW_ID);
    const lanePlaceholderIds = ids.filter((id) => id.startsWith(SEQ_LANE_PLACEHOLDER_PREFIX));
    expect(lanePlaceholderIds.length).toBeGreaterThan(0);
    // The canonical trigger is absorbed INTO the synthetic start bar, so it must
    // not appear as a row of its own.
    expect(ids).not.toContain(WIREFRAME_NODE_IDS.trigger);

    // The Add Node pipeline drops its `preview` node in through the same change
    // stream (this canvas is controlled, so `instance.setNodes` arrives as an
    // `add` change). Driving the real `add` proves the local-capture path, not
    // just the filter.
    const previewNode: Node = {
      id: PREVIEW_NODE_ID,
      type: 'preview',
      position: { x: 0, y: 0 },
      data: {},
    };
    reportNodeChanges([{ type: 'add', item: previewNode }]);
    expect(derivedNodeIds()).toContain(PREVIEW_NODE_ID);

    // (b) Nothing referencing any of them may reach the host.
    hostNodesChange.mockClear();
    const syntheticIds = [
      SEQ_START_ROW_ID,
      SEQ_PLACEHOLDER_ROW_ID,
      PREVIEW_NODE_ID,
      ...lanePlaceholderIds,
    ];
    reportNodeChanges([
      ...syntheticIds.map((id): NodeChange => ({ id, type: 'select', selected: true })),
      ...syntheticIds.map((id): NodeChange => ({ id, type: 'remove' })),
    ]);
    const referenced = forwardedNodeChanges().filter((change) =>
      syntheticIds.includes('id' in change ? change.id : change.item.id)
    );
    expect(referenced).toEqual([]);
    // And no synthetic id leaked into canonical state along the way.
    for (const id of syntheticIds) {
      expect(canonical.nodes.some((node) => node.id === id)).toBe(false);
    }
  });
});

describe('SequentialCanvas toolbar delete', () => {
  /**
   * The toolbar reaches the canvas through the module-level toolbar action store
   * (`useToolbarActionStore`, wired by BaseCanvas), not through a rendered
   * button, and the sequential bars are never rendered under the stubbed flow.
   * Reading the handler back out of that store dispatches through exactly the
   * function the real toolbar resolver calls.
   */
  const dispatchToolbarAction = (event: ToolbarActionEvent) => {
    const handler = getToolbarActionStore().onToolbarAction;
    expect(handler).toBeTypeOf('function');
    act(() => {
      handler?.(event);
    });
  };

  it('cascades a branch owner and its lane descendants, and heals the seam', () => {
    // The diamond is the clean case: A -> If; If.true -> B -> D; If.false -> C -> D.
    // Deleting `If` must take BOTH populated lanes with it and reconnect A to D.
    const { nodes, edges } = makeDiamondFixture();
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential', mode: 'design' });

    dispatchToolbarAction({ actionId: 'delete', nodeId: 'if', mode: 'design' });

    const removedIds = changeIds(forwardedNodeChanges(), 'remove');
    expect(removedIds).toContain('if');
    expect(removedIds).toContain('b');
    expect(removedIds).toContain('c');
    // The upstream node and the merge point survive.
    expect(removedIds).not.toContain('a');
    expect(removedIds).not.toContain('d');
    expect(canonical.nodes.map((node) => node.id).sort()).toEqual(['a', 'd']);

    // The seam is healed rather than left dangling: A now feeds D directly, and
    // every edge that touched a removed node is gone.
    const healed = canonical.edges.find((edge) => edge.source === 'a' && edge.target === 'd');
    expect(healed).toBeDefined();
    const survivingIds = new Set(canonical.nodes.map((node) => node.id));
    for (const edge of canonical.edges) {
      expect(survivingIds.has(edge.source)).toBe(true);
      expect(survivingIds.has(edge.target)).toBe(true);
    }

    // The canvas handled it, so the host's own handler is NOT also invoked.
    expect(hostToolbarAction).not.toHaveBeenCalled();
  });

  it('falls through to the host handler for a delete raised outside design mode', () => {
    // The interception guard lives only in `deleteStep`, which returns whether it
    // acted; a `delete` it cannot act on must reach the host instead of being
    // silently swallowed.
    const { nodes, edges } = makeDiamondFixture();
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential', mode: 'view' });

    const event: ToolbarActionEvent = { actionId: 'delete', nodeId: 'if', mode: 'view' };
    dispatchToolbarAction(event);

    expect(hostToolbarAction).toHaveBeenCalledWith(event);
    // Nothing was deleted behind the host's back.
    expect(canonical.nodes).toHaveLength(nodes.length);
    expect(forwardedNodeChanges().filter((change) => change.type === 'remove')).toEqual([]);
  });

  it('always forwards a non-delete action to the host', () => {
    const { nodes, edges } = makeDiamondFixture();
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential', mode: 'design' });

    const event: ToolbarActionEvent = { actionId: 'duplicate', nodeId: 'b', mode: 'design' };
    dispatchToolbarAction(event);

    expect(hostToolbarAction).toHaveBeenCalledWith(event);
  });

  it('falls through to the host handler when no change callback is wired', () => {
    // Design mode and a live projection, but no onNodesChange/onEdgesChange: there
    // is no channel to emit the removal on, so `deleteStep` has not acted and must
    // not claim the action. A host that owns mutations itself and handles `delete`
    // through onToolbarAction alone would otherwise see it silently swallowed.
    const { nodes, edges } = makeDiamondFixture();
    renderCanvas({
      initialNodes: nodes,
      initialEdges: edges,
      view: 'sequential',
      mode: 'design',
      wireChangeHandlers: false,
    });

    const event: ToolbarActionEvent = { actionId: 'delete', nodeId: 'if', mode: 'design' };
    dispatchToolbarAction(event);

    expect(hostToolbarAction).toHaveBeenCalledWith(event);
    expect(canonical.nodes).toHaveLength(nodes.length);
  });
});

describe('SequentialCanvas virtualization ceiling', () => {
  const ACCESSIBLE_LIST_LABEL = 'Workflow steps';

  it('renders every row into the DOM below SEQ_FULL_RENDER_MAX_NODES (D8)', () => {
    // 140 chain steps + the synthetic start bar + the terminal placeholder, which
    // must stay under the ceiling for this case to mean anything.
    const { nodes, edges } = makeChainFixture(140);
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential' });

    expect(derivedNodes().length).toBeLessThanOrEqual(SEQ_FULL_RENDER_MAX_NODES);
    expect(capturedFlowProps.current.onlyRenderVisibleElements).toBe(false);
    expect(capturedFlowProps.current['aria-hidden']).toBeUndefined();
    // Not aria-hidden, so the rows stay in the tab order and ARE the reading order.
    expect(capturedFlowProps.current.nodesFocusable).toBe(true);
    expect(capturedFlowProps.current.edgesFocusable).toBe(true);
    expect(screen.queryByRole('list', { name: ACCESSIBLE_LIST_LABEL })).toBeNull();
  });

  it('re-enables virtualization above the ceiling and substitutes the accessible list', () => {
    const { nodes, edges } = makeChainFixture(160);
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential' });

    expect(derivedNodes().length).toBeGreaterThan(SEQ_FULL_RENDER_MAX_NODES);
    expect(capturedFlowProps.current.onlyRenderVisibleElements).toBe(true);
    // The visual subtree is hidden from assistive tech, so the list below is the
    // only reading order that remains.
    expect(capturedFlowProps.current['aria-hidden']).toBe(true);
    // ...which means it must also leave the tab order. xyflow defaults both of
    // these to true and renders tabIndex=0 on each wrapper; keeping that inside an
    // aria-hidden subtree is the `aria-hidden-focus` violation, i.e. 160 controls a
    // keyboard user reaches but no screen reader can announce.
    expect(capturedFlowProps.current.nodesFocusable).toBe(false);
    expect(capturedFlowProps.current.edgesFocusable).toBe(false);
    const list = screen.getByRole('list', { name: ACCESSIBLE_LIST_LABEL });
    expect(list.querySelectorAll('li')).toHaveLength(160);
  });
});

describe('SequentialCanvas branch-lane resolution wiring', () => {
  /**
   * `resolveBranchHandleIds` is unit-tested exhaustively in
   * `SequentialCanvas.branchHandles.test.ts`. What that cannot cover is the SEAM
   * between it and the registry: `getBranchHandles` filters the candidate handles
   * to visible non-artifact sources, and passes the registry default ONLY when the
   * manifest actually set `isDefaultForType`. These two tests assert that wiring
   * end to end through a mounted canvas, observed as the indent depth the
   * downstream row lands at.
   */
  it('keeps a `next`-named spine on the spine because the manifest flags it (rule 1)', () => {
    // The headline regression, end to end. Before the fix a spine named
    // `next` / `then` / `done` / `out` alongside any second source handle was
    // classified as a LANE, so the node's entire forward flow was indented
    // underneath it and the spine was left empty.
    const { nodes, edges } = makeCustomSpineFixture();
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential' });

    const ids = derivedNodeIds();
    // `error` is a genuine empty lane, so lane detection is demonstrably live.
    expect(ids).toContain(`${SEQ_LANE_PLACEHOLDER_PREFIX}spine::error`);

    // `next` carries the forward flow, so `after` must sit at the spine's own
    // indent depth. If the `isDefaultForType` gate stopped being wired, rule 2
    // could not rescue a handle named `next` and `after` would indent one level.
    const spineRow = derivedNodes().find((node) => node.id === 'spine');
    const afterRow = derivedNodes().find((node) => node.id === 'after');
    expect(spineRow?.position.x).toBe(0);
    expect(afterRow?.position.x).toBe(0);
  });

  it('filters artifact source handles out before lane resolution', () => {
    const { nodes, edges } = makeAgentFixture();
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential' });

    const ids = derivedNodeIds();
    // `error` is a genuine empty lane, so it gets a placeholder row: proof that
    // lane detection is live at all and this test is not passing by doing nothing.
    expect(ids).toContain(`${SEQ_LANE_PLACEHOLDER_PREFIX}agent::error`);
    // The five artifact source handles are filtered out before the helper sees
    // them, so none may become a lane.
    for (const artifactHandle of ['memory', 'memory2', 'escalation', 'context', 'tools']) {
      expect(ids).not.toContain(`${SEQ_LANE_PLACEHOLDER_PREFIX}agent::${artifactHandle}`);
    }

    // This is the assertion with the teeth. `success` is POPULATED (it feeds
    // `after`), so laning it would produce no placeholder row to look for. It
    // would instead push `after` down one indent level. Depth 0 rows sit at x=0
    // and each level indents by SEQ_INDENT_PX, so equal x is exactly the claim
    // "the agent's forward flow stayed on the spine" -- which is what breaks if
    // the `isDefaultForType` gate or the candidate guard regresses.
    const agentRow = derivedNodes().find((node) => node.id === 'agent');
    const afterRow = derivedNodes().find((node) => node.id === 'after');
    expect(agentRow?.position.x).toBe(0);
    expect(afterRow?.position.x).toBe(agentRow?.position.x);
  });
});
