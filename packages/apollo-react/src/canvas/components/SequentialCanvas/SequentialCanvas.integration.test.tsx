import { act, fireEvent, render, screen } from '@testing-library/react';
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
  AGENT_RESOURCES_NODE_IDS,
  makeAgentWithResourcesFixture,
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
 * The only suite that mounts SequentialCanvas. It covers the derivation seam (the view never
 * writes geometry back to canonical state) and the change-forwarding seam. ReactFlow is a
 * capturing stub: tests read the derived arrays off `capturedFlowProps` and call its change
 * handlers to play xyflow, then assert what reaches the host's spies.
 */

const { capturedFlowProps, mockReactFlowInstance } = vi.hoisted(() => ({
  capturedFlowProps: {
    // biome-ignore lint/suspicious/noExplicitAny: holds whatever BaseCanvas passes ReactFlow
    current: undefined as any,
  },
  // Only placeholder positions and viewport save/restore read the instance; neither is under test.
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
  // Capture the props instead of rendering a flow.
  // biome-ignore lint/suspicious/noExplicitAny: test stub
  ReactFlow: (props: any) => {
    capturedFlowProps.current = props;
    return <div data-testid="react-flow">{props.children}</div>;
  },
  Background: () => <div data-testid="background" />,
  // The real portal targets a DOM node the stubbed flow never renders; render inline instead.
  // biome-ignore lint/suspicious/noExplicitAny: test stub
  ViewportPortal: ({ children }: any) => <div data-testid="viewport-portal">{children}</div>,
  useReactFlow: () => mockReactFlowInstance,
}));

/**
 * A node whose spine is named `next` and declared only via `isDefaultForType`. No Storybook
 * manifest exercises that rule: `uipath.agent` flags a default, but its spine is `success`,
 * which the name heuristic catches anyway.
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
        // Not `output` / `success`, so only the flagged default can identify the spine.
        { id: 'next', type: 'source', handleType: 'output', isDefaultForType: true },
        { id: 'error', label: 'Error', type: 'source', handleType: 'output' },
      ],
    },
  ],
};

/** Manifests for the wireframe's two non-Storybook node types, merged additively. */
const testManifest = {
  ...defaultWorkflowManifest,
  nodes: [...defaultWorkflowManifest.nodes, ...sequentialWireframeManifests, customSpineManifest],
};

/** Spies the harness wraps the host callbacks in, re-created per test. */
let hostNodesChange: ReturnType<typeof vi.fn>;
let hostEdgesChange: ReturnType<typeof vi.fn>;
let hostToolbarAction: ReturnType<typeof vi.fn>;

/** Live mirror of the harness's canonical state, written during render. */
const canonical: { nodes: Node[]; edges: Edge[] } = { nodes: [], edges: [] };

interface HarnessProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  view: CanvasView;
  mode?: 'design' | 'view' | 'readonly';
  /** False models a host that owns mutations itself and wires neither change callback. */
  wireChangeHandlers?: boolean;
  /** Models a host that owns the flow view's node renderers outright. */
  flowNodeTypes?: NodeTypes;
  readOnlyNodeIds?: readonly string[];
  onPrimaryAction?: (nodeId: string) => void;
}

/** A realistic controlled host: canonical state mutated only through xyflow's reducers. */
function ControlledHarness({
  initialNodes,
  initialEdges,
  view,
  mode = 'design',
  wireChangeHandlers = true,
  flowNodeTypes,
  readOnlyNodeIds,
  onPrimaryAction,
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
      readOnlyNodeIds={readOnlyNodeIds}
      onPrimaryAction={onPrimaryAction}
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

/** Every canonical field the sequential view is forbidden to write. */
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
 * An agent feeding one step. `uipath.agent` flags `isDefaultForType` on `success` and carries
 * five artifact source handles, so it is the real production case for the registry default.
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

    // Flow view passes the canonical graph through, so this is the real canonical geometry.
    const before = geometryOf(canonical.nodes);
    const identitiesBefore = new Map(canonical.nodes.map((node) => [node.id, node]));
    expect(before).toHaveLength(nodes.length);

    rerenderWith({ view: 'sequential' });

    // The mount burst xyflow produces: a position + dimensions change per bar, all describing
    // layout-owned geometry of a flattened clone.
    const realRowIds = derivedNodeIds().filter(
      (id) => id !== SEQ_START_ROW_ID && id !== SEQ_PLACEHOLDER_ROW_ID
    );
    // Guard against vacuity: the burst must target every canonical row (the trigger is
    // absorbed into the start bar, so it has none).
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
    // Stronger than value equality: nothing was forwarded, so the host's reducer never ran.
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

  // xyflow drops a node whose type is unregistered, so `preview` must resolve in both views,
  // and to different ghosts: the square flow ghost reads as an empty slab at bar aspect.
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
    // Anything the host registered under `preview` wins.
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

    // The host may not be called at all; what matters is that no geometry change reaches it.
    const geometryChanges = forwardedNodeChanges().filter(
      (change) => change.type === 'position' || change.type === 'dimensions'
    );
    expect(geometryChanges).toEqual([]);

    // Selection is canonical state and passes through untouched.
    reportNodeChanges([{ id: target, type: 'select', selected: true }]);
    expect(hostNodesChange).toHaveBeenCalledWith([{ id: target, type: 'select', selected: true }]);
    expect(canonical.nodes.find((node) => node.id === target)?.selected).toBe(true);
  });

  it('rewrites a replace to merge only data and selected onto the canonical node', () => {
    const { nodes, edges } = makeWireframeFixture();
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential' });

    // `if` is contained (parentId: for-each) and the clone is flattened, so a verbatim replace
    // would erase the containment.
    const targetId = WIREFRAME_NODE_IDS.ifNode;
    const canonicalBefore = canonical.nodes.find((node) => node.id === targetId);
    expect(canonicalBefore?.parentId).toBe(WIREFRAME_NODE_IDS.forEach);
    const derivedClone = derivedNodes().find((node) => node.id === targetId);
    // The clone must really carry view-only geometry, or the assertion below is vacuous.
    expect(derivedClone?.width).toBe(SEQ_BAR_WIDTH);
    expect(derivedClone?.parentId).toBeUndefined();
    expect(derivedClone?.draggable).toBe(false);

    // What an inline rename via `updateNodeData` produces.
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

    // (a) The derivation injects the start bar, the terminal placeholder, and one lane
    //     placeholder per empty branch lane (every `uipath.script` has an unused `error` lane).
    const ids = derivedNodeIds();
    expect(ids).toContain(SEQ_START_ROW_ID);
    expect(ids).toContain(SEQ_PLACEHOLDER_ROW_ID);
    const lanePlaceholderIds = ids.filter((id) => id.startsWith(SEQ_LANE_PLACEHOLDER_PREFIX));
    expect(lanePlaceholderIds.length).toBeGreaterThan(0);
    // The canonical trigger is absorbed into the start bar and has no row of its own.
    expect(ids).not.toContain(WIREFRAME_NODE_IDS.trigger);

    // The controlled canvas receives the Add Node preview as an `add` change; driving it
    // proves the local-capture path, not just the filter.
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
   * Bars never render under the stubbed flow, so the handler is read back out of the
   * module-level toolbar action store BaseCanvas wires, exactly as the real resolver does.
   */
  const dispatchToolbarAction = (event: ToolbarActionEvent) => {
    const handler = getToolbarActionStore().onToolbarAction;
    expect(handler).toBeTypeOf('function');
    act(() => {
      handler?.(event);
    });
  };

  it('keeps the toolbar handler identity across a rename, so bars reading it do not re-render', () => {
    const { nodes, edges } = makeDiamondFixture();
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential', mode: 'design' });
    const before = getToolbarActionStore().onToolbarAction;
    expect(before).toBeTypeOf('function');

    const a = nodes.find((node) => node.id === 'a')!;
    reportNodeChanges([
      {
        type: 'replace',
        id: 'a',
        item: { ...a, data: { ...a.data, display: { label: 'Renamed' } } },
      },
    ]);

    expect(canonical.nodes.find((node) => node.id === 'a')?.data).toMatchObject({
      display: { label: 'Renamed' },
    });
    expect(getToolbarActionStore().onToolbarAction).toBe(before);
  });

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

    // The seam is healed: A feeds D directly and every edge touching a removed node is gone.
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
    // A `delete` the canvas cannot act on must reach the host instead of being swallowed.
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
    // Design mode with no change callbacks: there is no channel to emit the removal on, so
    // the canvas must not claim the action.
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
    // 140 steps plus the two synthetic rows must stay under the ceiling.
    const { nodes, edges } = makeChainFixture(140);
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential' });

    expect(derivedNodes().length).toBeLessThanOrEqual(SEQ_FULL_RENDER_MAX_NODES);
    expect(capturedFlowProps.current.onlyRenderVisibleElements).toBe(false);
    expect(capturedFlowProps.current['aria-hidden']).toBeUndefined();
    // Not aria-hidden, so the rows stay in the tab order and ARE the reading order.
    expect(capturedFlowProps.current.nodesFocusable).toBe(true);
    expect(capturedFlowProps.current.edgesFocusable).toBe(true);
    expect(screen.queryByRole('list', { name: ACCESSIBLE_LIST_LABEL })).toBeNull();
    expect(screen.getByTestId('sequential-gutter')).toBeInTheDocument();
  });

  it('counts numbered steps, not derived rows, so the ceiling is exact', () => {
    // Exactly SEQ_FULL_RENDER_MAX_NODES real steps; the synthetic rows must not tip it over.
    const { nodes, edges } = makeChainFixture(SEQ_FULL_RENDER_MAX_NODES);
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential' });

    expect(derivedNodes().length).toBeGreaterThan(SEQ_FULL_RENDER_MAX_NODES);
    expect(capturedFlowProps.current.onlyRenderVisibleElements).toBe(false);
    expect(capturedFlowProps.current['aria-hidden']).toBeUndefined();
  });

  it('re-enables virtualization above the ceiling and substitutes the accessible list', () => {
    const { nodes, edges } = makeChainFixture(160);
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential' });

    expect(derivedNodes().length).toBeGreaterThan(SEQ_FULL_RENDER_MAX_NODES);
    expect(capturedFlowProps.current.onlyRenderVisibleElements).toBe(true);
    // The visual subtree is hidden from assistive tech; the list is the only reading order left.
    expect(capturedFlowProps.current['aria-hidden']).toBe(true);
    // ...and must leave the tab order too: xyflow defaults both to true and renders tabIndex=0
    // on each wrapper, an `aria-hidden-focus` violation inside a hidden subtree.
    expect(capturedFlowProps.current.nodesFocusable).toBe(false);
    expect(capturedFlowProps.current.edgesFocusable).toBe(false);
    const list = screen.getByRole('list', { name: ACCESSIBLE_LIST_LABEL });
    expect(list.querySelectorAll('li')).toHaveLength(160);
    // The gutter's chevrons are real buttons and would be the same violation.
    expect(screen.queryByTestId('sequential-gutter')).toBeNull();
  });
});

describe('SequentialCanvas read-only nodes', () => {
  const dispatchToolbarAction = (event: ToolbarActionEvent) => {
    const handler = getToolbarActionStore().onToolbarAction;
    act(() => {
      handler?.(event);
    });
  };

  it('passes readOnlyNodeIds through to BaseCanvas', () => {
    const { nodes, edges } = makeDiamondFixture();
    renderCanvas({
      initialNodes: nodes,
      initialEdges: edges,
      view: 'sequential',
      mode: 'design',
      readOnlyNodeIds: ['b'],
    });
    // BaseCanvas consumes the prop itself, so the observable contract is that every row renders.
    expect(derivedNodeIds()).toContain('b');
  });

  it('does not delete a locked step and lets the host decide instead', () => {
    const { nodes, edges } = makeDiamondFixture();
    renderCanvas({
      initialNodes: nodes,
      initialEdges: edges,
      view: 'sequential',
      mode: 'design',
      readOnlyNodeIds: ['b'],
    });

    dispatchToolbarAction({ actionId: 'delete', nodeId: 'b', mode: 'design' });

    expect(changeIds(forwardedNodeChanges(), 'remove')).toEqual([]);
    expect(canonical.nodes.map((node) => node.id)).toContain('b');
    expect(hostToolbarAction).toHaveBeenCalledWith(
      expect.objectContaining({ actionId: 'delete', nodeId: 'b' })
    );

    // An unlocked sibling in the same canvas still deletes through the canvas.
    dispatchToolbarAction({ actionId: 'delete', nodeId: 'c', mode: 'design' });
    expect(changeIds(forwardedNodeChanges(), 'remove')).toContain('c');
  });
});

describe('SequentialCanvas synthetic row clicks', () => {
  it('keeps the current step selected when a synthetic row is clicked', () => {
    const { nodes, edges } = makeDiamondFixture();
    const selected = nodes.map((node) => (node.id === 'a' ? { ...node, selected: true } : node));
    renderCanvas({
      initialNodes: selected,
      initialEdges: edges,
      view: 'sequential',
      mode: 'design',
    });

    // A start-bar click arrives as "select it, deselect the rest" in one batch. The synthetic
    // select is dropped, and the deselect must go with it.
    reportNodeChanges([
      { id: SEQ_START_ROW_ID, type: 'select', selected: true },
      { id: 'a', type: 'select', selected: false },
    ]);

    expect(forwardedNodeChanges()).toEqual([]);
    expect(canonical.nodes.find((node) => node.id === 'a')?.selected).toBe(true);

    // A click on a REAL row still moves selection normally.
    reportNodeChanges([
      { id: 'if', type: 'select', selected: true },
      { id: 'a', type: 'select', selected: false },
    ]);
    expect(canonical.nodes.find((node) => node.id === 'a')?.selected).toBe(false);
    expect(canonical.nodes.find((node) => node.id === 'if')?.selected).toBe(true);
  });
});

describe('SequentialCanvas keyboard scope', () => {
  it('fires Enter on the selected step in sequential view only', () => {
    const { nodes, edges } = makeDiamondFixture();
    const selected = nodes.map((node) => (node.id === 'a' ? { ...node, selected: true } : node));
    const onPrimaryAction = vi.fn();
    const { rerenderWith } = renderCanvas({
      initialNodes: selected,
      initialEdges: edges,
      view: 'flow',
      mode: 'design',
      onPrimaryAction,
    });

    // The handler sits on the wrapper div around the (stubbed) flow and accepts keys fired on
    // the wrapper itself or on a canvas surface inside it.
    const wrapper = screen.getByTestId('react-flow').parentElement!;
    fireEvent.keyDown(wrapper, { key: 'Enter' });
    expect(onPrimaryAction).not.toHaveBeenCalled();

    rerenderWith({ view: 'sequential' });
    fireEvent.keyDown(wrapper, { key: 'Enter' });
    expect(onPrimaryAction).toHaveBeenCalledWith('a');
  });
});

describe('SequentialCanvas branch-lane resolution wiring', () => {
  /**
   * The seam between `resolveBranchHandleIds` and the registry: candidates are filtered to
   * visible non-artifact sources and the default is passed only when `isDefaultForType` is
   * set. Observed as the indent depth the downstream row lands at.
   */
  it('keeps a `next`-named spine on the spine because the manifest flags it (rule 1)', () => {
    // The headline regression: a spine named `next` beside a second source handle used to be
    // classified as a lane, indenting the node's whole forward flow under it.
    const { nodes, edges } = makeCustomSpineFixture();
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential' });

    const ids = derivedNodeIds();
    // `error` is a genuine empty lane, so lane detection is demonstrably live.
    expect(ids).toContain(`${SEQ_LANE_PLACEHOLDER_PREFIX}spine::error`);

    // `after` must sit at the spine's depth; without the `isDefaultForType` wiring it would
    // indent one level.
    const spineRow = derivedNodes().find((node) => node.id === 'spine');
    const afterRow = derivedNodes().find((node) => node.id === 'after');
    expect(spineRow?.position.x).toBe(0);
    expect(afterRow?.position.x).toBe(0);
  });

  it('filters artifact source handles out before lane resolution', () => {
    const { nodes, edges } = makeAgentFixture();
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential' });

    const ids = derivedNodeIds();
    // `error` is a genuine empty lane, so lane detection is demonstrably live.
    expect(ids).toContain(`${SEQ_LANE_PLACEHOLDER_PREFIX}agent::error`);
    // The five artifact source handles are filtered out, so none may become a lane.
    for (const artifactHandle of ['memory', 'memory2', 'escalation', 'context', 'tools']) {
      expect(ids).not.toContain(`${SEQ_LANE_PLACEHOLDER_PREFIX}agent::${artifactHandle}`);
    }

    // `success` is populated, so laning it would produce no placeholder row; it would push
    // `after` down one indent level instead. Equal x is the claim that the flow stayed on the spine.
    const agentRow = derivedNodes().find((node) => node.id === 'agent');
    const afterRow = derivedNodes().find((node) => node.id === 'after');
    expect(agentRow?.position.x).toBe(0);
    expect(afterRow?.position.x).toBe(agentRow?.position.x);
  });
});

describe('SequentialCanvas artifact nodes', () => {
  const RESOURCE_IDS = [
    AGENT_RESOURCES_NODE_IDS.tool,
    AGENT_RESOURCES_NODE_IDS.context,
    AGENT_RESOURCES_NODE_IDS.memory,
  ];

  it('derives no row for a resource node and numbers only the steps', () => {
    const { nodes, edges } = makeAgentWithResourcesFixture();
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential' });

    const ids = derivedNodeIds();
    expect(ids).toContain(AGENT_RESOURCES_NODE_IDS.agent);
    expect(ids).toContain(AGENT_RESOURCES_NODE_IDS.after);
    for (const resourceId of RESOURCE_IDS) expect(ids).not.toContain(resourceId);

    const after = derivedNodes().find((node) => node.id === AGENT_RESOURCES_NODE_IDS.after);
    expect(after?.ariaLabel).toBe('Step 2 of 2: After');

    // Artifact edges are never drawn as connectors.
    const derivedEdges: Edge[] = capturedFlowProps.current.edges;
    for (const edge of derivedEdges) {
      expect(RESOURCE_IDS).not.toContain(edge.source);
      expect(RESOURCE_IDS).not.toContain(edge.target);
    }
  });

  it('returns the resources and their artifact edges untouched in flow view', () => {
    const { nodes, edges } = makeAgentWithResourcesFixture();
    const { rerenderWith } = renderCanvas({
      initialNodes: nodes,
      initialEdges: edges,
      view: 'sequential',
    });

    rerenderWith({ view: 'flow' });

    expect(geometryOf(derivedNodes())).toEqual(geometryOf(nodes));
    expect(capturedFlowProps.current.edges.map((edge: Edge) => edge.id).sort()).toEqual(
      edges.map((edge) => edge.id).sort()
    );
    expect(hostNodesChange).not.toHaveBeenCalled();
    expect(hostEdgesChange).not.toHaveBeenCalled();
  });

  it('deleting the step removes its artifact edges and leaves the resource nodes in place', () => {
    const { nodes, edges } = makeAgentWithResourcesFixture();
    renderCanvas({ initialNodes: nodes, initialEdges: edges, view: 'sequential', mode: 'design' });

    const handler = getToolbarActionStore().onToolbarAction;
    act(() => {
      handler?.({ actionId: 'delete', nodeId: AGENT_RESOURCES_NODE_IDS.agent, mode: 'design' });
    });

    expect(changeIds(forwardedNodeChanges(), 'remove')).toEqual([AGENT_RESOURCES_NODE_IDS.agent]);
    expect(canonical.nodes.map((node) => node.id).sort()).toEqual(
      [AGENT_RESOURCES_NODE_IDS.after, ...RESOURCE_IDS].sort()
    );
    // Nothing is healed: the agent had no incomer, and its artifact edges go with it.
    expect(canonical.edges).toEqual([]);
  });
});
