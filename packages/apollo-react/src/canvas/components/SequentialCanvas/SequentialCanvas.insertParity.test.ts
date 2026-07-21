import type { Edge, EdgeChange, Node, NodeChange } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SOURCE_HANDLE_ID, DEFAULT_TARGET_HANDLE_ID } from '../../constants';
import { NodeTypeRegistry } from '../../core';
import { defaultWorkflowManifest } from '../../storybook-utils/manifests';
import { sequentialWireframeManifests } from '../../storybook-utils/sequential/wireframeManifests';
import { applyGraphChangeSet, makeWireframeFixture } from '../../utils/sequential/fixtures';
import { SEQ_CONTINUATION_EDGE_KEY } from '../../utils/sequential/graph-helpers';
import { insertAtSlot } from '../../utils/sequential/mutations';
import type { GraphChangeSet, InsertionSlot } from '../../utils/sequential/sequential.types';
import {
  SEQ_INSERTED_FLAG,
  SEQ_SPLIT_EDGE_ID_KEY,
  sequentialOnBeforeNodeAdded,
} from './edges/sequentialInsert';
import {
  forwardSequentialEdgeChanges,
  forwardSequentialNodeChanges,
} from './sequentialChangeFilters';
import { deriveSequentialGraph } from './useSequentialGraph';

/**
 * Equivalence test between the TWO insert paths that exist in this feature.
 *
 * `insertAtSlot` (utils/sequential/mutations.ts) is the pure semantic op, and it
 * is used ONLY by tests. Production inserts never call it: they run through
 * AddNodeManager -> `sequentialOnBeforeNodeAdded` -> `forwardSequential*Changes`.
 * `SequentialCanvas.roundtrip.test.ts` uses `insertAtSlot` as a stand-in for
 * "exactly what the change-forwarding produces" but never proves the two agree,
 * which leaves the pure op's whole test suite anchored to an unverified claim.
 * This file is that proof.
 *
 * The comparison is on CANONICAL TOPOLOGY, since that is all the projection ever
 * reads back: the set of node ids, and the set of
 * `source -> sourceHandle -> target -> targetHandle` tuples, plus the set of
 * removed edge ids and the continuation markers.
 *
 * Two normalizations are applied, both for stated reasons rather than to make the
 * test pass:
 *
 *  1. The inserted node's id. `sequentialOnBeforeNodeAdded` deliberately re-ids
 *     with `crypto.randomUUID()` (the pipeline seeds a `type-Date.now()` id that
 *     can collide inside one millisecond) and rebuilds every edge id from its
 *     endpoints, so ids can never match literally.
 *  2. The INSERTED node's own handle ids. The two paths genuinely differ here and
 *     it is intentional: the production path keeps the handles AddNodeManager
 *     resolved from the inserted node's own manifest, while `insertAtSlot` leaves
 *     them `undefined` (default-handle semantics, resolved identically downstream
 *     by `findResolvedHandle` / `DEFAULT_*_HANDLE_ID`). The difference is asserted
 *     EXPLICITLY below rather than hidden, so it stays a documented equivalence
 *     and not a silent divergence.
 *
 * Everything else -- endpoints, the EXISTING nodes' canonical handles, the split
 * edge removal, containment, and the continuation flags -- must match exactly.
 */

const registry = new NodeTypeRegistry();
registry.registerManifest(
  [...defaultWorkflowManifest.nodes, ...sequentialWireframeManifests],
  defaultWorkflowManifest.categories
);

/** The node type the user picks in the Add Node panel for this test. */
const INSERTED_TYPE = 'uipath.http-request';

interface EdgeTuple {
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  continuation: boolean;
}

/**
 * Canonical topology of an edge, with `insertedId` collapsed to a stable token and
 * the inserted node's OWN handle collapsed to `undefined` (see normalization 2).
 */
function edgeTuple(edge: Edge, insertedId: string): EdgeTuple {
  const isFromInserted = edge.source === insertedId;
  const isToInserted = edge.target === insertedId;
  return {
    source: isFromInserted ? '<inserted>' : edge.source,
    sourceHandle: isFromInserted ? undefined : (edge.sourceHandle ?? undefined),
    target: isToInserted ? '<inserted>' : edge.target,
    targetHandle: isToInserted ? undefined : (edge.targetHandle ?? undefined),
    continuation:
      (edge.data as Record<string, unknown> | undefined)?.[SEQ_CONTINUATION_EDGE_KEY] === true,
  };
}

function sortTuples(tuples: EdgeTuple[]): EdgeTuple[] {
  return [...tuples].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

/**
 * The `newNode` / `newEdges` AddNodeManager hands `onBeforeNodeAdded` for a slot
 * that splits an existing edge (two `previewNodeConnectionInfo` entries, so two
 * edges: existing -> preview, preview -> existing).
 *
 * The existing endpoints deliberately carry the WRONG handle ids here. In the
 * real pipeline they come from the preview graph, whose handles are chosen for
 * registry filtering and rendering rather than for canonical correctness (see
 * `buildSequentialPreviewOptions`), so `sequentialOnBeforeNodeAdded` has to
 * restore the slot's canonical handles. Feeding it bar-shaped handles is what
 * makes that restoration observable instead of coincidental.
 */
function buildPipelineAddition(slot: InsertionSlot): { newNode: Node; newEdges: Edge[] } {
  const previewMaterializedId = `${INSERTED_TYPE}-${Date.now()}`;
  const insertedTargetHandle = registry.getDefaultHandle(INSERTED_TYPE, 'target')?.id;
  const insertedSourceHandle = registry.getDefaultHandle(INSERTED_TYPE, 'source')?.id;

  const newNode: Node = {
    id: previewMaterializedId,
    type: INSERTED_TYPE,
    position: { x: 12, y: 34 },
    selected: true,
    data: { label: 'HTTP Request' },
  };
  const newEdges: Edge[] = [
    {
      id: `edge_${slot.source?.nodeId}-seq-source-${previewMaterializedId}-${insertedTargetHandle}`,
      source: slot.source?.nodeId ?? '',
      sourceHandle: 'seq-source',
      target: previewMaterializedId,
      targetHandle: insertedTargetHandle,
      type: 'default',
    },
    {
      id: `edge_${previewMaterializedId}-${insertedSourceHandle}-${slot.target?.nodeId}-seq-target`,
      source: previewMaterializedId,
      sourceHandle: insertedSourceHandle,
      target: slot.target?.nodeId ?? '',
      targetHandle: 'seq-target',
      type: 'default',
    },
  ];
  return { newNode, newEdges };
}

/** Applies a change stream to a canonical graph the way a controlled host does. */
function applyForwardedChanges(
  nodes: Node[],
  edges: Edge[],
  nodeChanges: NodeChange[],
  edgeChanges: EdgeChange[]
): { nodes: Node[]; edges: Edge[] } {
  const removedNodeIds = new Set(
    nodeChanges.filter((change) => change.type === 'remove').map((change) => change.id)
  );
  const removedEdgeIds = new Set(
    edgeChanges.filter((change) => change.type === 'remove').map((change) => change.id)
  );
  return {
    nodes: [
      ...nodes.filter((node) => !removedNodeIds.has(node.id)),
      ...nodeChanges.filter((change) => change.type === 'add').map((change) => change.item),
    ],
    edges: [
      ...edges.filter((edge) => !removedEdgeIds.has(edge.id)),
      ...edgeChanges.filter((change) => change.type === 'add').map((change) => change.item),
    ],
  };
}

/** Applies a pure {@link GraphChangeSet} the same way. */

describe('sequential insert: production pipeline vs the pure insertAtSlot op', () => {
  const { nodes, edges } = makeWireframeFixture();
  // The registry-driven predicates SequentialCanvas passes down, so the slots
  // below are the ones production actually offers: containers keep their body
  // scope (which is where `slot.containerId` comes from) and the canonical
  // trigger is absorbed into the synthetic start row.
  const projection = deriveSequentialGraph({
    nodes,
    edges,
    view: 'sequential',
    isContainerNode: (node) =>
      registry.getManifest(node.type ?? '')?.display?.shape === 'container',
    isStartNode: (node) => registry.getManifest(node.type ?? '')?.category === 'trigger',
  }).projection;

  /**
   * Two structurally different slots: a plain top-level step split, and a split
   * INSIDE a container body (so `containerId` participates). Both are ordinary
   * slots the projection offers, taken by their backing canonical edge id.
   */
  const slotCases = [
    { name: 'a top-level step slot (HTTP -> Javascript)', graphEdgeId: 'e-http-js' },
    { name: 'a slot inside a container body (For Each -> If)', graphEdgeId: 'e-foreach-if' },
  ] as const;

  for (const slotCase of slotCases) {
    describe(slotCase.name, () => {
      const slot = projection?.slots.find(
        (candidate) => candidate.graphEdgeId === slotCase.graphEdgeId
      );

      /** The production path: AddNodeManager -> onBeforeNodeAdded -> change forwarding. */
      function runProductionPath() {
        const { newNode, newEdges } = buildPipelineAddition(slot as InsertionSlot);
        const { newNode: finalNode, newEdges: finalEdges } = sequentialOnBeforeNodeAdded(
          newNode,
          newEdges,
          {
            sourceNodeId: slot?.source?.nodeId,
            targetNodeId: slot?.target?.nodeId,
            graphEdgeId: slot?.graphEdgeId,
            sourceHandleId: slot?.source?.handleId,
            targetHandleId: slot?.target?.handleId,
            containerId: slot?.containerId,
            splitEdgeWasContinuation: slot?.continuation,
          }
        );

        const nodeChanges = forwardSequentialNodeChanges(
          [{ type: 'add', item: finalNode }],
          new Set(),
          new Map(nodes.map((node) => [node.id, node]))
        );
        const edgeChanges = forwardSequentialEdgeChanges(
          finalEdges.map((edge) => ({ type: 'add' as const, item: edge })),
          new Set(edges.map((edge) => edge.id)),
          edges
        );
        return {
          insertedId: finalNode.id,
          finalNode,
          finalEdges,
          nodeChanges,
          edgeChanges,
          graph: applyForwardedChanges(nodes, edges, nodeChanges, edgeChanges),
        };
      }

      /** The pure path, given the same slot and an equivalent new node. */
      function runPurePath() {
        const insertedId = 'pure-inserted';
        const changeSet = insertAtSlot(
          projection as NonNullable<typeof projection>,
          slot as InsertionSlot,
          {
            id: insertedId,
            type: INSERTED_TYPE,
            position: { x: 0, y: 0 },
            data: { label: 'HTTP Request', [SEQ_INSERTED_FLAG]: true },
          }
        );
        return { insertedId, changeSet, graph: applyGraphChangeSet({ nodes, edges }, changeSet) };
      }

      it('produces the same canonical topology', () => {
        expect(slot).toBeDefined();
        const production = runProductionPath();
        const pure = runPurePath();

        // Same node set (with each path's generated id collapsed).
        const normalizeIds = (graph: { nodes: Node[] }, insertedId: string) =>
          graph.nodes.map((node) => (node.id === insertedId ? '<inserted>' : node.id)).sort();
        expect(normalizeIds(production.graph, production.insertedId)).toEqual(
          normalizeIds(pure.graph, pure.insertedId)
        );

        // Same edge topology, including the continuation markers that decide
        // whether the downstream sequence stays on the spine or is reinterpreted
        // as one of the inserted node's own lanes.
        expect(
          sortTuples(production.graph.edges.map((edge) => edgeTuple(edge, production.insertedId)))
        ).toEqual(sortTuples(pure.graph.edges.map((edge) => edgeTuple(edge, pure.insertedId))));

        // Same edge REMOVED: the split canonical edge, and only it.
        const productionRemoved = production.edgeChanges
          .filter((change) => change.type === 'remove')
          .map((change) => change.id)
          .sort();
        expect(productionRemoved).toEqual([...pure.changeSet.removeEdgeIds].sort());
        expect(productionRemoved).toEqual([slotCase.graphEdgeId]);

        // Same containment.
        const productionInserted = production.graph.nodes.find(
          (node) => node.id === production.insertedId
        );
        const pureInserted = pure.graph.nodes.find((node) => node.id === pure.insertedId);
        expect(productionInserted?.parentId).toBe(pureInserted?.parentId);
        expect(productionInserted?.parentId).toBe(slot?.containerId);
      });

      it('restores the slot canonical handles on the existing endpoints', () => {
        expect(slot).toBeDefined();
        const { insertedId, finalEdges } = runProductionPath();

        const incoming = finalEdges.find((edge) => edge.target === insertedId);
        const outgoing = finalEdges.find((edge) => edge.source === insertedId);
        // The bar-shaped handles the pipeline supplied are gone; the slot's
        // canonical handles are back.
        expect(incoming?.sourceHandle).toBe(slot?.source?.handleId);
        expect(outgoing?.targetHandle).toBe(slot?.target?.handleId);
        expect(incoming?.sourceHandle).not.toBe('seq-source');
        expect(outgoing?.targetHandle).not.toBe('seq-target');
      });

      it('keeps the inserted node manifest-resolved handles, where insertAtSlot leaves defaults', () => {
        expect(slot).toBeDefined();
        const production = runProductionPath();
        const pure = runPurePath();

        const productionIncoming = production.finalEdges.find(
          (edge) => edge.target === production.insertedId
        );
        const productionOutgoing = production.finalEdges.find(
          (edge) => edge.source === production.insertedId
        );
        const pureIncoming = pure.changeSet.addEdges.find(
          (edge) => edge.target === pure.insertedId
        );
        const pureOutgoing = pure.changeSet.addEdges.find(
          (edge) => edge.source === pure.insertedId
        );

        // This is the ONE documented divergence between the two paths, pinned
        // here so it cannot drift unnoticed: the production path carries the
        // inserted node's manifest defaults...
        expect(productionIncoming?.targetHandle).toBe(
          registry.getDefaultHandle(INSERTED_TYPE, 'target')?.id
        );
        expect(productionOutgoing?.sourceHandle).toBe(
          registry.getDefaultHandle(INSERTED_TYPE, 'source')?.id
        );
        // ...while the pure op leaves them undefined, which downstream resolves to
        // the same handles via DEFAULT_*_HANDLE_ID / the registry default.
        expect(pureIncoming?.targetHandle).toBeUndefined();
        expect(pureOutgoing?.sourceHandle).toBeUndefined();
        expect(productionIncoming?.targetHandle).toBe(DEFAULT_TARGET_HANDLE_ID);
        expect(productionOutgoing?.sourceHandle).toBe(DEFAULT_SOURCE_HANDLE_ID);
      });

      it('strips the split marker and stamps the inserted flag before reaching the host', () => {
        expect(slot).toBeDefined();
        const { nodeChanges, edgeChanges, insertedId } = runProductionPath();

        // The node survives the node filter only because it is flagged
        // `seqInserted`; every other `add` in this view is a derivation artifact.
        expect(nodeChanges).toHaveLength(1);
        const added = nodeChanges[0] as Extract<NodeChange, { type: 'add' }>;
        expect(added.item.id).toBe(insertedId);
        expect((added.item.data as Record<string, unknown>)[SEQ_INSERTED_FLAG]).toBe(true);

        // The internal split marker is a message to the edge filter only, and must
        // never land in the host's canonical edge data.
        for (const change of edgeChanges) {
          if (change.type !== 'add') continue;
          expect(
            (change.item.data as Record<string, unknown> | undefined)?.[SEQ_SPLIT_EDGE_ID_KEY]
          ).toBeUndefined();
        }
      });
    });
  }
});
