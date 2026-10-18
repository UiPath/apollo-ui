import type { Edge, EdgeChange, Node, NodeChange } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SOURCE_HANDLE_ID, DEFAULT_TARGET_HANDLE_ID } from '../../constants';
import { NodeTypeRegistry } from '../../core';
import { defaultWorkflowManifest } from '../../storybook-utils/manifests';
import { sequentialWireframeManifests } from '../../storybook-utils/sequential/wireframeManifests';
import { applyGraphChangeSet, makeWireframeFixture } from '../../utils/sequential/fixtures';
import { SEQ_CONTINUATION_EDGE_KEY } from '../../utils/sequential/graph-helpers';
import { insertAtSlot } from '../../utils/sequential/mutations';
import type { InsertionSlot } from '../../utils/sequential/sequential.types';
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
 * Proves the pure `insertAtSlot` op (used only by tests) and the production path
 * (AddNodeManager -> `sequentialOnBeforeNodeAdded` -> change forwarding) produce the same
 * canonical topology. Two normalizations: the inserted node's id (production re-ids with
 * randomUUID) and the inserted node's own handle ids (production keeps manifest defaults,
 * the pure op leaves them undefined; asserted explicitly below). Everything else must match.
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

/** Canonical edge topology with `insertedId` and the inserted node's own handle normalized. */
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
 * What AddNodeManager hands `onBeforeNodeAdded` for an edge-splitting slot. The existing
 * endpoints carry the bar-shaped preview handles, as in the real pipeline, so the canonical
 * handle restoration is observable rather than coincidental.
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

/** Applies a pure `GraphChangeSet` the same way. */

describe('sequential insert: production pipeline vs the pure insertAtSlot op', () => {
  const { nodes, edges } = makeWireframeFixture();
  // The registry-driven predicates SequentialCanvas passes down, so the slots below are the
  // ones production offers (containers keep their body scope, the trigger is absorbed).
  const projection = deriveSequentialGraph({
    nodes,
    edges,
    view: 'sequential',
    isContainerNode: (node) =>
      registry.getManifest(node.type ?? '')?.display?.shape === 'container',
    isStartNode: (node) => registry.getManifest(node.type ?? '')?.category === 'trigger',
  }).projection;

  /** A top-level step split and a split inside a container body (so `containerId` participates). */
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

        // Same edge topology, including the continuation markers.
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
        // `extent` travels with `parentId`; comparing only the latter let the paths drift before.
        expect(productionInserted?.extent).toBe(pureInserted?.extent);
      });

      it('restores the slot canonical handles on the existing endpoints', () => {
        expect(slot).toBeDefined();
        const { insertedId, finalEdges } = runProductionPath();

        const incoming = finalEdges.find((edge) => edge.target === insertedId);
        const outgoing = finalEdges.find((edge) => edge.source === insertedId);
        // The bar-shaped preview handles are gone; the slot's canonical handles are back.
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

        // The one documented divergence: production carries the manifest defaults...
        expect(productionIncoming?.targetHandle).toBe(
          registry.getDefaultHandle(INSERTED_TYPE, 'target')?.id
        );
        expect(productionOutgoing?.sourceHandle).toBe(
          registry.getDefaultHandle(INSERTED_TYPE, 'source')?.id
        );
        // ...while the pure op leaves them undefined, which resolves to the same handles downstream.
        expect(pureIncoming?.targetHandle).toBeUndefined();
        expect(pureOutgoing?.sourceHandle).toBeUndefined();
        expect(productionIncoming?.targetHandle).toBe(DEFAULT_TARGET_HANDLE_ID);
        expect(productionOutgoing?.sourceHandle).toBe(DEFAULT_SOURCE_HANDLE_ID);
      });

      it('strips the split marker and stamps the inserted flag before reaching the host', () => {
        expect(slot).toBeDefined();
        const { nodeChanges, edgeChanges, insertedId } = runProductionPath();

        // The node survives the filter only because it is flagged `seqInserted`.
        expect(nodeChanges).toHaveLength(1);
        const added = nodeChanges[0] as Extract<NodeChange, { type: 'add' }>;
        expect(added.item.id).toBe(insertedId);
        expect((added.item.data as Record<string, unknown>)[SEQ_INSERTED_FLAG]).toBe(true);

        // The split marker is for the edge filter only and must not reach canonical edge data.
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
