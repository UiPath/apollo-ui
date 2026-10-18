import { renderHook } from '@testing-library/react';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import {
  PREVIEW_NODE_ID,
  SEQ_BAR_HEIGHT,
  SEQ_BAR_WIDTH,
  SEQ_INDENT_PX,
  SEQ_PLACEHOLDER_NODE_TYPE,
  SEQ_ROW_GAP,
  SEQ_START_NODE_TYPE,
} from '../../constants';
import {
  makeDeepNestingFixture,
  makeOrphanFixture,
  makeWireframeFixture,
  WIREFRAME_NODE_IDS,
} from '../../utils/sequential/fixtures';
import { SEQUENTIAL_BAR_HANDLE_IDS } from './nodes';
import {
  SEQ_CONNECTOR_EDGE_TYPE,
  SEQ_PLACEHOLDER_ROW_ID,
  SEQ_START_ROW_ID,
} from './sequentialGraph.constants';
import { deriveSequentialGraph, useSequentialGraph } from './useSequentialGraph';

describe('deriveSequentialGraph', () => {
  it('clones every row keeping the real type, bar width, and non-draggable flag', () => {
    const { nodes, edges } = makeWireframeFixture();
    const graph = deriveSequentialGraph({ nodes, edges, view: 'sequential' });

    // 7 real rows + 2 populated-branch placeholders + synthetic start/tail.
    expect(graph.nodes).toHaveLength(11);
    expect(graph.nodes[0]?.id).toBe(SEQ_START_ROW_ID);
    expect(graph.nodes[0]?.type).toBe(SEQ_START_NODE_TYPE);
    expect(graph.nodes.some((node) => node.id === WIREFRAME_NODE_IDS.trigger)).toBe(false);
    expect(graph.nodes.at(-1)?.id).toBe(SEQ_PLACEHOLDER_ROW_ID);
    expect(graph.nodes.at(-1)?.type).toBe(SEQ_PLACEHOLDER_NODE_TYPE);

    const http = graph.nodes.find((node) => node.id === WIREFRAME_NODE_IDS.http)!;
    expect(http.type).toBe('uipath.http-request');
    expect(http.width).toBe(SEQ_BAR_WIDTH);
    expect(http.draggable).toBe(false);
    expect(http.parentId).toBeUndefined();
  });

  // Every clone and both synthetic rows must declare an explicit height matching BaseNode's
  // `computedHeight`, or the controlled array and BaseNode fight through updateNodeInternals.
  it('stamps every row with an explicit height so the store height never churns', () => {
    const { nodes, edges } = makeWireframeFixture();
    const graph = deriveSequentialGraph({ nodes, edges, view: 'sequential' });

    for (const node of graph.nodes) {
      // Append plus overlays are row-gap tall; every other row declares the fixed bar height.
      const isAppendOverlay = (node.data as { variant?: string } | undefined)?.variant === 'plus';
      expect(node.height).toBe(isAppendOverlay ? SEQ_ROW_GAP : SEQ_BAR_HEIGHT);
    }
  });

  it('keeps clickable synthetic rows hit-testable by ReactFlow', () => {
    const { nodes, edges } = makeWireframeFixture();
    const graph = deriveSequentialGraph({
      nodes,
      edges,
      view: 'sequential',
      onAddTrigger: () => {},
      onPlaceholderAdd: () => {},
    });

    expect(graph.nodes.find((node) => node.id === SEQ_START_ROW_ID)?.selectable).toBe(true);
    expect(graph.nodes.find((node) => node.id === SEQ_PLACEHOLDER_ROW_ID)?.selectable).toBe(true);
  });

  it('renders a populated lane tail as a plus placeholder carrying its slot id', () => {
    const { nodes, edges } = makeWireframeFixture();
    const graph = deriveSequentialGraph({ nodes, edges, view: 'sequential', canAddToLane: true });
    const slotId = `slot:leaf:${WIREFRAME_NODE_IDS.thenJs}`;
    const placeholder = graph.nodes.find(
      (node) => (node.data as { insertionSlotId?: string } | undefined)?.insertionSlotId === slotId
    );

    expect(placeholder).toMatchObject({
      type: SEQ_PLACEHOLDER_NODE_TYPE,
      selectable: true,
    });
    // A populated lane's trailing add point is the between-step plus, not the dashed row.
    expect((placeholder?.data as { variant?: string } | undefined)?.variant).toBe('plus');
    // The click travels by slot id through SequentialLaneAddContext, never a data closure.
    expect((placeholder?.data as { onAdd?: unknown } | undefined)?.onAdd).toBeUndefined();
    const slot = graph.projection?.rows.find(
      (row) => row.lanePlaceholder?.id === slotId
    )?.lanePlaceholder;
    expect(slot).toEqual(
      expect.objectContaining({
        id: slotId,
        source: { nodeId: WIREFRAME_NODE_IDS.thenJs },
        containerId: WIREFRAME_NODE_IDS.forEach,
      })
    );
    const join = graph.edges.find(
      (edge) => edge.source === WIREFRAME_NODE_IDS.thenJs && edge.target === placeholder?.id
    );
    expect(join).toBeDefined();
    // No arrowhead into an add affordance.
    expect((join?.data as { hideArrowHead?: boolean } | undefined)?.hideArrowHead).toBe(true);
  });

  it('renders the terminal tail as a plus when there are steps, and a dashed row when empty', () => {
    const { nodes, edges } = makeWireframeFixture();
    const populated = deriveSequentialGraph({
      nodes,
      edges,
      view: 'sequential',
      onPlaceholderAdd: () => {},
    });
    const populatedTail = populated.nodes.find((node) => node.id === SEQ_PLACEHOLDER_ROW_ID);
    expect((populatedTail?.data as { variant?: string } | undefined)?.variant).toBe('plus');

    const empty = deriveSequentialGraph({
      nodes: [],
      edges: [],
      view: 'sequential',
      onPlaceholderAdd: () => {},
    });
    const emptyTail = empty.nodes.find((node) => node.id === SEQ_PLACEHOLDER_ROW_ID);
    expect((emptyTail?.data as { variant?: string } | undefined)?.variant).toBe('row');
  });

  it('renders an empty container body as a dashed Add step row, not a plus', () => {
    const nodes: Node[] = [{ id: 'loop', type: 'loop', position: { x: 0, y: 0 }, data: {} }];
    const graph = deriveSequentialGraph({
      nodes,
      edges: [],
      view: 'sequential',
      isContainerNode: (node) => node.id === 'loop',
      canAddToLane: true,
    });
    const bodyPlaceholder = graph.nodes.find((node) =>
      (node.data as { insertionSlotId?: string } | undefined)?.insertionSlotId?.startsWith(
        'slot:lane:loop'
      )
    );
    expect(bodyPlaceholder).toBeDefined();
    expect((bodyPlaceholder?.data as { variant?: string } | undefined)?.variant).toBe('row');
  });

  it('flattens container children and indents them by depth', () => {
    const { nodes, edges } = makeWireframeFixture();
    const graph = deriveSequentialGraph({ nodes, edges, view: 'sequential' });

    // The If is a body child of For Each -> depth 1 -> x = 1 * indent, parentId cleared.
    const ifNode = graph.nodes.find((node) => node.id === WIREFRAME_NODE_IDS.ifNode)!;
    expect(ifNode.parentId).toBeUndefined();
    expect(ifNode.position.x).toBe(SEQ_INDENT_PX);
  });

  it('applies custom node dimensions, indentation, and vertical gap to the real layout', () => {
    const { nodes, edges } = makeWireframeFixture();
    const customWidth = 640;
    const customHeight = 80;
    const customIndent = 128;
    const customGap = 80;
    const graph = deriveSequentialGraph({
      nodes,
      edges,
      view: 'sequential',
      layoutOptions: {
        barWidth: customWidth,
        barHeight: customHeight,
        indent: customIndent,
        rowGap: customGap,
      },
    });

    expect(graph.nodes.every((node) => node.width === customWidth)).toBe(true);
    expect(graph.nodes.every((node) => node.height === customHeight)).toBe(true);
    expect(graph.nodes.find((node) => node.id === WIREFRAME_NODE_IDS.ifNode)?.position.x).toBe(
      customIndent
    );
    const httpY = graph.nodes.find((node) => node.id === WIREFRAME_NODE_IDS.http)?.position.y ?? 0;
    const javascriptY =
      graph.nodes.find((node) => node.id === WIREFRAME_NODE_IDS.javascript)?.position.y ?? 0;
    expect(javascriptY - httpY).toBe(customHeight + customGap);
  });

  it('preserves the canonical data reference and selection passthrough', () => {
    const { nodes, edges } = makeWireframeFixture();
    const selected = nodes.map((node) =>
      node.id === WIREFRAME_NODE_IDS.http ? { ...node, selected: true } : node
    );
    const canonicalHttp = selected.find((node) => node.id === WIREFRAME_NODE_IDS.http)!;
    const graph = deriveSequentialGraph({ nodes: selected, edges, view: 'sequential' });

    const http = graph.nodes.find((node) => node.id === WIREFRAME_NODE_IDS.http)!;
    expect(http.data).toBe(canonicalHttp.data);
    expect(http.selected).toBe(true);
  });

  it('builds connector edges with the bar handle ids plus synthetic joins', () => {
    const { nodes, edges } = makeWireframeFixture();
    const graph = deriveSequentialGraph({ nodes, edges, view: 'sequential' });

    for (const edge of graph.edges) {
      expect(edge.type).toBe(SEQ_CONNECTOR_EDGE_TYPE);
      expect(edge.sourceHandle).toBe(SEQUENTIAL_BAR_HANDLE_IDS.source);
      // Branch/container-entry connectors enter mid-left; every other kind drops into the top.
      expect(edge.targetHandle).toBe(
        edge.data?.kind === 'branch-entry'
          ? SEQUENTIAL_BAR_HANDLE_IDS.branchTarget
          : SEQUENTIAL_BAR_HANDLE_IDS.target
      );
    }
    // Every projection connector + 2 synthetic joins (start->first, last->placeholder).
    expect(graph.edges).toHaveLength((graph.projection?.connectors.length ?? 0) + 2);
    expect(graph.edges.some((edge) => edge.source === SEQ_START_ROW_ID)).toBe(true);
    expect(graph.edges.some((edge) => edge.target === SEQ_PLACEHOLDER_ROW_ID)).toBe(true);

    const startEdge = graph.edges.find((edge) => edge.source === SEQ_START_ROW_ID);
    expect(startEdge?.data?.hideArrowHead).toBe(false);
    expect(startEdge?.data?.slot).toEqual({
      id: `slot:head:${WIREFRAME_NODE_IDS.http}`,
      target: { nodeId: WIREFRAME_NODE_IDS.http },
    });
  });

  describe('insert anchors (accessible names for the ⊕ buttons)', () => {
    /** The anchor names each insert button; it must appear on exactly the connectors that render one. */
    it('pairs an anchor with every slot-bearing connector, and with nothing else', () => {
      const { nodes, edges } = makeWireframeFixture();
      const graph = deriveSequentialGraph({ nodes, edges, view: 'sequential' });

      expect(graph.edges.length).toBeGreaterThan(0);
      for (const edge of graph.edges) {
        expect(edge.data?.insertAnchor !== undefined).toBe(edge.data?.slot !== undefined);
      }
      const names = graph.edges
        .filter((edge) => edge.data?.insertAnchor)
        .map((edge) => JSON.stringify(edge.data?.insertAnchor));
      expect(new Set(names).size).toBe(names.length);
    });

    it('anchors the start-bar gap on the step it precedes, since the start bar is unnumbered', () => {
      const { nodes, edges } = makeWireframeFixture();
      const graph = deriveSequentialGraph({ nodes, edges, view: 'sequential' });

      const startEdge = graph.edges.find((edge) => edge.source === SEQ_START_ROW_ID);
      expect(startEdge?.data?.insertAnchor).toEqual({ kind: 'before', stepNumber: 1 });
    });

    it('anchors a labeled lane head on both the lane and its owning step', () => {
      const { nodes, edges } = makeWireframeFixture();
      const graph = deriveSequentialGraph({ nodes, edges, view: 'sequential' });

      const laneEdge = graph.edges.find(
        (edge) => edge.data?.kind === 'branch-entry' && edge.data?.slot && edge.data?.label
      );
      expect(laneEdge?.data?.insertAnchor).toMatchObject({
        kind: 'branch',
        branchLabel: laneEdge?.data?.label,
      });
      expect((laneEdge?.data?.insertAnchor as { stepNumber: number }).stepNumber).toBeGreaterThan(
        0
      );
    });

    it('drops the anchor with the slot on a connector hidden by a collapsed ancestor', () => {
      const { nodes, edges } = makeWireframeFixture();
      const graph = deriveSequentialGraph({
        nodes,
        edges,
        view: 'sequential',
        collapsedStepIds: new Set([WIREFRAME_NODE_IDS.forEach]),
      });

      const hidden = graph.edges.filter((edge) => edge.data?.slot === undefined);
      expect(hidden.length).toBeGreaterThan(0);
      for (const edge of hidden) {
        expect(edge.data?.insertAnchor).toBeUndefined();
      }
    });

    it('keeps announced numbers stable when a container collapses (D7)', () => {
      // Numbers come off the projection's pre-order counter, so a collapse must not renumber.
      const { nodes, edges } = makeWireframeFixture();
      const anchorsFor = (collapsed?: Set<string>) =>
        deriveSequentialGraph({
          nodes,
          edges,
          view: 'sequential',
          ...(collapsed ? { collapsedStepIds: collapsed } : {}),
        })
          .edges.filter((edge) => edge.data?.insertAnchor)
          .map((edge) => [edge.id, JSON.stringify(edge.data?.insertAnchor)] as const);

      const collapsedAnchors = new Map(anchorsFor(new Set([WIREFRAME_NODE_IDS.forEach])));
      for (const [edgeId, anchor] of anchorsFor()) {
        // Only compare gaps that survive the collapse; the folded ones are gone.
        if (collapsedAnchors.has(edgeId)) {
          expect(collapsedAnchors.get(edgeId)).toBe(anchor);
        }
      }
    });
  });

  it('renders a split preview with the same projected connectors as the committed row', () => {
    const { nodes, edges } = makeWireframeFixture();
    const base = deriveSequentialGraph({ nodes, edges, view: 'sequential' });
    const slot = base.projection?.connectors.find(
      (connector) =>
        connector.sourceRowId === WIREFRAME_NODE_IDS.http &&
        connector.targetRowId === WIREFRAME_NODE_IDS.javascript
    )?.slot;
    expect(slot).toBeDefined();

    const graph = deriveSequentialGraph({ nodes, edges, view: 'sequential', insertSlot: slot });
    const previewEdges = graph.edges.filter(
      (edge) => edge.source === PREVIEW_NODE_ID || edge.target === PREVIEW_NODE_ID
    );

    expect(previewEdges).toHaveLength(2);
    expect(previewEdges.every((edge) => edge.data?.preview === true)).toBe(true);
    expect(previewEdges.every((edge) => edge.data?.slot === undefined)).toBe(true);
    expect(previewEdges.every((edge) => edge.style?.opacity === 0.8)).toBe(true);
  });

  it('opens a real gap before the first row without moving the start bar into the preview', () => {
    const { nodes, edges } = makeWireframeFixture();
    const base = deriveSequentialGraph({ nodes, edges, view: 'sequential' });
    const startEdge = base.edges.find((edge) => edge.source === SEQ_START_ROW_ID);
    const slot = startEdge?.data?.slot;
    expect(slot).toBeDefined();

    const graph = deriveSequentialGraph({ nodes, edges, view: 'sequential', insertSlot: slot });
    const start = graph.nodes.find((node) => node.id === SEQ_START_ROW_ID)!;
    const previewY = graph.layout?.positions.get(PREVIEW_NODE_ID)?.y;
    const firstY = graph.layout?.positions.get(WIREFRAME_NODE_IDS.http)?.y;

    expect(previewY).toBeDefined();
    expect(firstY).toBeDefined();
    expect(start.position.y).toBe((previewY ?? 0) - (SEQ_BAR_HEIGHT + SEQ_ROW_GAP));
    expect(firstY).toBe((previewY ?? 0) + SEQ_BAR_HEIGHT + SEQ_ROW_GAP);
    expect(new Set([start.position.y, previewY, firstY]).size).toBe(3);
  });

  it('keeps a branch preview on the branch-entry elbow and left target handle', () => {
    const { nodes, edges } = makeWireframeFixture();
    const base = deriveSequentialGraph({ nodes, edges, view: 'sequential' });
    const slot = base.projection?.connectors.find(
      (connector) =>
        connector.sourceRowId === WIREFRAME_NODE_IDS.ifNode &&
        connector.targetRowId === WIREFRAME_NODE_IDS.thenJs
    )?.slot;
    expect(slot).toBeDefined();

    const graph = deriveSequentialGraph({ nodes, edges, view: 'sequential', insertSlot: slot });
    const incoming = graph.edges.find((edge) => edge.target === PREVIEW_NODE_ID);

    expect(incoming?.data?.kind).toBe('branch-entry');
    expect(incoming?.targetHandle).toBe(SEQUENTIAL_BAR_HANDLE_IDS.branchTarget);
    expect(incoming?.data?.waypoints).toHaveLength(2);
  });

  it('draws the tail preview through to the placeholder without materializing that visual join', () => {
    const { nodes, edges } = makeWireframeFixture();
    const graph = deriveSequentialGraph({
      nodes,
      edges,
      view: 'sequential',
      insertSlot: {
        id: 'slot:tail',
        source: { nodeId: WIREFRAME_NODE_IDS.sendMessage, handleId: 'output' },
      },
    });
    const placeholderJoin = graph.edges.find(
      (edge) => edge.source === PREVIEW_NODE_ID && edge.target === SEQ_PLACEHOLDER_ROW_ID
    );

    expect(placeholderJoin).toMatchObject({
      sourceHandle: 'output',
      data: { preview: true, ignorePreviewConnection: true },
    });
  });

  it('places the placeholder before de-emphasized orphan rows', () => {
    const { nodes, edges } = makeOrphanFixture();
    const graph = deriveSequentialGraph({ nodes, edges, view: 'sequential' });
    expect(graph.nodes.map((node) => node.id)).toEqual([
      SEQ_START_ROW_ID,
      'a',
      'b',
      SEQ_PLACEHOLDER_ROW_ID,
      'z',
    ]);
    expect(graph.nodes.at(-1)?.className).toContain('opacity-60');
    expect(graph.nodes.find((node) => node.id === SEQ_PLACEHOLDER_ROW_ID)?.position.y).toBeLessThan(
      graph.nodes.find((node) => node.id === 'z')?.position.y ?? 0
    );
  });

  it('places the placeholder below a trailing container body, not inside it', () => {
    // root -> c1 (container: c2 -> leaf). c1's body extends below it, and the terminal
    // placeholder must sit under the whole stack.
    const { nodes, edges } = makeDeepNestingFixture();
    const graph = deriveSequentialGraph({ nodes, edges, view: 'sequential' });
    const placeholderY =
      graph.nodes.find((node) => node.id === SEQ_PLACEHOLDER_ROW_ID)?.position.y ?? 0;
    const leafY = graph.nodes.find((node) => node.id === 'leaf')?.position.y ?? 0;
    const c1Y = graph.nodes.find((node) => node.id === 'c1')?.position.y ?? 0;
    expect(leafY).toBeGreaterThan(c1Y);
    expect(placeholderY).toBeGreaterThan(leafY);
  });

  it('passes the canonical graph through unchanged in flow view', () => {
    const { nodes, edges } = makeWireframeFixture();
    const graph = deriveSequentialGraph({ nodes, edges, view: 'flow' });
    // deriveSequentialGraph always projects; only the hook short-circuits flow view.
    expect(graph.projection).not.toBeNull();
  });

  it('keeps preview edges on guaranteed bar handles while carrying canonical handles for filtering', () => {
    const nodes: Node[] = [
      { id: 'javascript', type: 'script', position: { x: 0, y: 0 }, data: {} },
      { id: 'for-each', type: 'foreach', position: { x: 0, y: 100 }, data: {} },
    ];
    const edges: Edge[] = [
      {
        id: 'javascript-success-for-each',
        source: 'javascript',
        sourceHandle: 'success',
        target: 'for-each',
        targetHandle: 'input',
      },
    ];
    const getBranchHandles = (node: Node) =>
      node.id === 'javascript' ? [{ id: 'error', label: 'Error' }] : [];
    const base = deriveSequentialGraph({
      nodes,
      edges,
      view: 'sequential',
      getBranchHandles,
    });
    const slot = base.projection?.connectors.find(
      (connector) => connector.sourceRowId === 'javascript' && connector.targetRowId === 'for-each'
    )?.slot;

    expect(slot).toMatchObject({
      source: { nodeId: 'javascript', handleId: 'success' },
      target: { nodeId: 'for-each', handleId: 'input' },
    });

    const preview = deriveSequentialGraph({
      nodes,
      edges,
      view: 'sequential',
      getBranchHandles,
      insertSlot: slot,
    });
    const incoming = preview.edges.find(
      (edge) => edge.source === 'javascript' && edge.target === PREVIEW_NODE_ID
    );
    const outgoing = preview.edges.find(
      (edge) => edge.source === PREVIEW_NODE_ID && edge.target === 'for-each'
    );

    expect(incoming).toMatchObject({
      sourceHandle: SEQUENTIAL_BAR_HANDLE_IDS.source,
      targetHandle: 'input',
      data: { previewConnectionHandleId: 'success' },
    });
    expect(outgoing).toMatchObject({
      sourceHandle: 'output',
      targetHandle: SEQUENTIAL_BAR_HANDLE_IDS.target,
      data: { previewConnectionHandleId: 'input' },
    });
  });
});

describe('presentation-only node preservation', () => {
  it('omits excluded nodes and their edges from sequential without mutating canonical state', () => {
    const { nodes, edges } = makeWireframeFixture();
    const sticky: Node = {
      id: 'note',
      type: 'stickyNote',
      position: { x: 900, y: 700 },
      data: { content: 'Keep me in Flow' },
    };
    const annotationEdge: Edge = {
      id: 'note-http',
      source: sticky.id,
      target: WIREFRAME_NODE_IDS.http,
    };

    const graph = deriveSequentialGraph({
      nodes: [...nodes, sticky],
      edges: [...edges, annotationEdge],
      view: 'sequential',
      isSequenceNode: (node) => node.type !== 'stickyNote',
    });

    expect(graph.nodes.some((node) => node.id === sticky.id)).toBe(false);
    expect(graph.edges.some((edge) => edge.id === annotationEdge.id)).toBe(false);
    expect(sticky.position).toEqual({ x: 900, y: 700 });
    expect(graph.projection?.rows.filter((row) => !row.lanePlaceholder)).toHaveLength(7);
  });
});

describe('deriveSequentialGraph / useSequentialGraph projection parity', () => {
  /**
   * Tests assert against `deriveSequentialGraph` while production renders `useSequentialGraph`;
   * this pins from the outside that the two project identically.
   */
  const projectionCases = [
    { name: 'the wireframe', fixture: makeWireframeFixture },
    { name: 'deep nesting', fixture: makeDeepNestingFixture },
    { name: 'orphans', fixture: makeOrphanFixture },
  ] as const;

  for (const { name, fixture } of projectionCases) {
    it(`projects ${name} identically through the pure function and the hook`, () => {
      const { nodes, edges } = fixture();
      // Registry-shaped predicates, so the parity holds on what the canvas actually passes.
      const args = {
        nodes,
        edges,
        view: 'sequential' as const,
        isSequenceNode: (node: Node) => node.type !== 'stickyNote',
        // The fixtures' real trigger type, so the start-node exclusion is exercised.
        isStartNode: (node: Node) => node.type === 'uipath.first-run',
      };

      const pure = deriveSequentialGraph(args).projection;
      const { result } = renderHook(() => useSequentialGraph(args));

      expect(result.current.projection).toEqual(pure);
    });
  }
});

describe('useSequentialGraph memoization (D12)', () => {
  it('hands routed preview connectors to ReactFlow while an insertion slot is active', () => {
    const { nodes, edges } = makeWireframeFixture();
    const base = deriveSequentialGraph({ nodes, edges, view: 'sequential' });
    const slot = base.projection?.connectors.find(
      (connector) =>
        connector.sourceRowId === WIREFRAME_NODE_IDS.http &&
        connector.targetRowId === WIREFRAME_NODE_IDS.javascript
    )?.slot;
    expect(slot).toBeDefined();

    const { result } = renderHook(() =>
      useSequentialGraph({ nodes, edges, view: 'sequential', insertSlot: slot })
    );
    const previewEdges = result.current.edges.filter(
      (edge) => edge.source === PREVIEW_NODE_ID || edge.target === PREVIEW_NODE_ID
    );

    expect(previewEdges).toHaveLength(2);
    expect(previewEdges.every((edge) => edge.data?.preview === true)).toBe(true);
    expect(result.current.layout?.positions.get(PREVIEW_NODE_ID)).toBeDefined();
  });

  it('reuses the connector-edge array across data-only changes but reflects new data on nodes', () => {
    const { nodes, edges } = makeWireframeFixture();
    const { result, rerender } = renderHook(
      (props: { nodes: Node[]; edges: Edge[] }) =>
        useSequentialGraph({ nodes: props.nodes, edges: props.edges, view: 'sequential' }),
      { initialProps: { nodes, edges } }
    );

    const firstEdges = result.current.edges;
    const firstNodes = result.current.nodes;

    // Data-only change: rename one node (structure/fingerprint unchanged).
    const renamed = nodes.map((node) =>
      node.id === WIREFRAME_NODE_IDS.http
        ? { ...node, data: { display: { label: 'Renamed' } } }
        : node
    );
    rerender({ nodes: renamed, edges });

    // Edges are reference-stable across data-only changes.
    expect(result.current.edges).toBe(firstEdges);
    // Nodes recompute so the rename is reflected.
    expect(result.current.nodes).not.toBe(firstNodes);
    const http = result.current.nodes.find((node) => node.id === WIREFRAME_NODE_IDS.http)!;
    expect((http.data as { display: { label: string } }).display.label).toBe('Renamed');
  });

  // The central perf claim: a data-only edit must not recompute the projection or the layout.
  // Asserted on object references, since that is what the memo guarantees.
  it('reuses the projection and layout objects across a data-only change, but not a structural one', () => {
    const { nodes, edges } = makeWireframeFixture();
    const { result, rerender } = renderHook(
      (props: { nodes: Node[]; edges: Edge[] }) =>
        useSequentialGraph({ nodes: props.nodes, edges: props.edges, view: 'sequential' }),
      { initialProps: { nodes, edges } }
    );
    const firstProjection = result.current.projection;
    const firstLayout = result.current.layout;
    expect(firstProjection).not.toBeNull();
    expect(firstLayout).not.toBeNull();

    // One node gets a fresh `data` object; the fingerprint string is identical.
    const renamed = nodes.map((node) =>
      node.id === WIREFRAME_NODE_IDS.http
        ? { ...node, data: { ...node.data, display: { label: 'Renamed' } } }
        : node
    );
    rerender({ nodes: renamed, edges });

    expect(result.current.projection).toBe(firstProjection);
    expect(result.current.layout).toBe(firstLayout);
    // ...while the derived rows still pick up the new data.
    const http = result.current.nodes.find((node) => node.id === WIREFRAME_NODE_IDS.http)!;
    expect((http.data as { display: { label: string } }).display.label).toBe('Renamed');

    // Negative control: a real structural change must re-project and re-lay out.
    const extraEdge: Edge = {
      id: 'extra-http-send',
      source: WIREFRAME_NODE_IDS.http,
      target: WIREFRAME_NODE_IDS.sendMessage,
    };
    rerender({ nodes: renamed, edges: [...edges, extraEdge] });

    expect(result.current.projection).not.toBe(firstProjection);
    expect(result.current.layout).not.toBe(firstLayout);
  });

  it('reuses every unchanged derived node across a single-node selection update', () => {
    const { nodes, edges } = makeWireframeFixture();
    const { result, rerender } = renderHook(
      (props: { nodes: Node[] }) =>
        useSequentialGraph({ nodes: props.nodes, edges, view: 'sequential' }),
      { initialProps: { nodes } }
    );
    const firstNodesById = new Map(result.current.nodes.map((node) => [node.id, node]));
    const selectedId = WIREFRAME_NODE_IDS.http;
    const selected = nodes.map((node) =>
      node.id === selectedId ? { ...node, selected: true } : node
    );

    rerender({ nodes: selected });

    for (const node of result.current.nodes) {
      if (node.id === selectedId) {
        expect(node).not.toBe(firstNodesById.get(node.id));
        expect(node.selected).toBe(true);
      } else {
        expect(node).toBe(firstNodesById.get(node.id));
      }
    }
  });

  it('reuses lane placeholder node objects across a data-only change', () => {
    const { nodes, edges } = makeWireframeFixture();
    const { result, rerender } = renderHook(
      (props: { nodes: Node[] }) =>
        useSequentialGraph({ nodes: props.nodes, edges, view: 'sequential', canAddToLane: true }),
      { initialProps: { nodes } }
    );
    const placeholdersBefore = result.current.nodes.filter(
      (node) => node.type === SEQ_PLACEHOLDER_NODE_TYPE
    );
    expect(placeholdersBefore.length).toBeGreaterThan(1);

    const renamed = nodes.map((node) =>
      node.id === WIREFRAME_NODE_IDS.http
        ? { ...node, data: { display: { label: 'Renamed' } } }
        : node
    );
    rerender({ nodes: renamed });

    const after = new Map(result.current.nodes.map((node) => [node.id, node]));
    for (const placeholder of placeholdersBefore) {
      expect(after.get(placeholder.id)).toBe(placeholder);
    }
  });

  it('reuses projection when equivalent registry predicates change identity on rename', () => {
    const { nodes, edges } = makeWireframeFixture();
    const { result, rerender } = renderHook(
      (props: { nodes: Node[]; predicateVersion: number }) =>
        useSequentialGraph({
          nodes: props.nodes,
          edges,
          view: 'sequential',
          isSequenceEdge: (edge) => !!edge.id && props.predicateVersion >= 0,
          isStartNode: (node) => node.type === 'uipath.first-run' && props.predicateVersion >= 0,
          resolveBranchLabel: (_nodeId, handleId) =>
            props.predicateVersion >= 0 ? handleId : handleId,
        }),
      { initialProps: { nodes, predicateVersion: 0 } }
    );
    const firstProjection = result.current.projection;
    const renamed = nodes.map((node) =>
      node.id === WIREFRAME_NODE_IDS.http
        ? { ...node, data: { display: { label: 'Renamed' } } }
        : node
    );

    rerender({ nodes: renamed, predicateVersion: 1 });
    expect(result.current.projection).toBe(firstProjection);
  });

  it('rebuilds the connector-edge array on a structural change', () => {
    const { nodes, edges } = makeWireframeFixture();
    const { result, rerender } = renderHook(
      (props: { nodes: Node[]; edges: Edge[] }) =>
        useSequentialGraph({ nodes: props.nodes, edges: props.edges, view: 'sequential' }),
      { initialProps: { nodes, edges } }
    );
    const firstEdges = result.current.edges;

    // Structural change: drop an edge.
    const fewerEdges = edges.slice(0, -1);
    rerender({ nodes, edges: fewerEdges });

    expect(result.current.edges).not.toBe(firstEdges);
  });

  it('refreshes connector labels when edge data changes without a topology change', () => {
    const { nodes, edges } = makeWireframeFixture();
    const { result, rerender } = renderHook(
      (props: { edges: Edge[] }) =>
        useSequentialGraph({ nodes, edges: props.edges, view: 'sequential' }),
      { initialProps: { edges } }
    );
    const firstProjection = result.current.projection;
    const relabeled = edges.map((edge) =>
      edge.id === 'e-if-then' ? { ...edge, data: { ...edge.data, label: 'When true' } } : edge
    );

    rerender({ edges: relabeled });
    expect(result.current.projection).not.toBe(firstProjection);
    expect(
      result.current.projection?.connectors.find(
        (connector) =>
          connector.sourceRowId === WIREFRAME_NODE_IDS.ifNode &&
          connector.targetRowId === WIREFRAME_NODE_IDS.thenJs
      )?.label
    ).toBe('When true');
  });

  it('returns the canonical graph in flow view', () => {
    const { nodes, edges } = makeWireframeFixture();
    const { result } = renderHook(() => useSequentialGraph({ nodes, edges, view: 'flow' }));
    expect(result.current.nodes).toBe(nodes);
    expect(result.current.edges).toBe(edges);
    expect(result.current.projection).toBeNull();
  });

  it('exposes the layout result so consumers (e.g. SequentialGutter) can read row positions', () => {
    const { nodes, edges } = makeWireframeFixture();
    const { result } = renderHook(() => useSequentialGraph({ nodes, edges, view: 'sequential' }));
    expect(result.current.layout).not.toBeNull();
    expect(result.current.layout?.positions.get(WIREFRAME_NODE_IDS.http)).toBeDefined();
  });

  it('returns layout: null in flow view', () => {
    const { nodes, edges } = makeWireframeFixture();
    const { result } = renderHook(() => useSequentialGraph({ nodes, edges, view: 'flow' }));
    expect(result.current.layout).toBeNull();
  });
});

describe('useSequentialGraph flow view pass-through', () => {
  it('returns the canonical arrays by identity when parents already precede children', () => {
    const { nodes, edges } = makeDeepNestingFixture();
    const { result } = renderHook(() => useSequentialGraph({ nodes, edges, view: 'flow' }));

    expect(result.current.nodes).toBe(nodes);
    expect(result.current.edges).toBe(edges);
    expect(result.current.projection).toBeNull();
  });
});

describe('useSequentialGraph step aria labeling (D8)', () => {
  it('stamps node.ariaLabel as "Step N of Total: Label" on every numbered row', () => {
    const { nodes, edges } = makeWireframeFixture();
    const { result } = renderHook(() => useSequentialGraph({ nodes, edges, view: 'sequential' }));

    // The wireframe fixture has 7 numbered rows (see fixtures.ts's doc comment).
    const http = result.current.nodes.find((node) => node.id === WIREFRAME_NODE_IDS.http)!;
    expect(http.ariaLabel).toBe('Step 1 of 7: HTTP Request');

    const javascript = result.current.nodes.find(
      (node) => node.id === WIREFRAME_NODE_IDS.javascript
    )!;
    expect(javascript.ariaLabel).toBe('Step 2 of 7: Javascript');
  });

  it('does not stamp an ariaLabel on the synthetic start/placeholder rows', () => {
    const { nodes, edges } = makeWireframeFixture();
    const { result } = renderHook(() => useSequentialGraph({ nodes, edges, view: 'sequential' }));

    expect(result.current.nodes[0]?.id).toBe(SEQ_START_ROW_ID);
    expect(result.current.nodes[0]?.ariaLabel).toBeUndefined();
    expect(result.current.nodes.at(-1)?.id).toBe(SEQ_PLACEHOLDER_ROW_ID);
    expect(result.current.nodes.at(-1)?.ariaLabel).toBeUndefined();
  });

  it('keeps the total stable when a container collapses (D7 numbering stability)', () => {
    const { nodes, edges } = makeWireframeFixture();
    const { result } = renderHook(() =>
      useSequentialGraph({
        nodes,
        edges,
        view: 'sequential',
        collapsedStepIds: new Set([WIREFRAME_NODE_IDS.forEach]),
      })
    );

    const http = result.current.nodes.find((node) => node.id === WIREFRAME_NODE_IDS.http)!;
    expect(http.ariaLabel).toBe('Step 1 of 7: HTTP Request');
  });
});
