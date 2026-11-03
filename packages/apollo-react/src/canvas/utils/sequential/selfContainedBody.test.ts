import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { PREVIEW_NODE_ID } from '../../constants';
import { analyzeSequentialCompatibility } from './compatibility';
import {
  applyGraphChangeSet,
  makeRuntimeContainerFixture,
  RUNTIME_CONTAINER_NODE_IDS,
} from './fixtures';
import { bodyStartRowId, lanePlaceholderId, SELF_CONTAINED_BODY_LANE } from './graph-helpers';
import { insertAtSlot, moveSubtree } from './mutations';
import { projectionWithPreviewRow } from './previewRow';
import { projectSequence } from './projectSequence';
import type { ProjectSequenceOptions, SequenceProjection } from './sequential.types';
import { findIndentSlot, findMoveUpSlot } from './slotNavigation';

const ids = RUNTIME_CONTAINER_NODE_IDS;
const RUNTIME_TYPE = 'uipath.runtime-container';
const CONTAINER_TYPES = new Set([RUNTIME_TYPE, 'uipath.control-flow.foreach']);

const options: ProjectSequenceOptions = {
  isContainerNode: (node) => CONTAINER_TYPES.has(node.type ?? ''),
  isSelfContainedContainer: (node) => node.type === RUNTIME_TYPE,
};

const startRowId = bodyStartRowId(ids.container);

function project(nodes: Node[], edges: Edge[]): SequenceProjection {
  return projectSequence(nodes, edges, options);
}

/** The runtime fixture with its body emptied. */
function makeEmptyRuntimeFixture(): { nodes: Node[]; edges: Edge[] } {
  const { nodes, edges } = makeRuntimeContainerFixture();
  const outer = new Set<string>([ids.maestroA, ids.maestroB, ids.container, ids.agent]);
  return {
    nodes: nodes.filter((node) => outer.has(node.id)),
    edges: edges.filter((edge) => outer.has(edge.source) && outer.has(edge.target)),
  };
}

/** Every slot that would create an edge out of `nodeId`. */
function slotsSourcedFrom(projection: SequenceProjection, nodeId: string) {
  return [
    ...projection.slots,
    ...projection.connectors.flatMap((connector) => (connector.slot ? [connector.slot] : [])),
  ].filter((slot) => slot.source?.nodeId === nodeId);
}

describe('self-contained container body in the whole-canvas sequence', () => {
  it('opens the body with its own start row instead of a lane on a frame handle', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const projection = project(nodes, edges);

    const start = projection.rows.find((row) => row.nodeId === startRowId);
    expect(start).toMatchObject({
      bodyStart: ids.container,
      parentRowId: ids.container,
      depth: 1,
    });
    expect(start?.stepNumber).toBeUndefined();
    const order = projection.rows.map((row) => row.nodeId);
    expect(order.indexOf(startRowId)).toBe(order.indexOf(ids.container) + 1);
    expect(order.indexOf(ids.http)).toBe(order.indexOf(startRowId) + 1);

    const entry = projection.connectors.find((c) => c.targetRowId === startRowId);
    expect(entry).toMatchObject({ kind: 'branch-entry', sourceRowId: ids.container });
    expect(entry?.slot).toBeUndefined();
    expect(entry?.label).toBeUndefined();

    // Only the container's own continuation leaves it; nothing uses the `start` handle it lacks.
    expect(
      new Set(slotsSourcedFrom(projection, ids.container).map((slot) => slot.source?.handleId))
    ).toEqual(new Set(['output']));
  });

  it('inserts above the first step through a target-only slot scoped to the container', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const projection = project(nodes, edges);
    const head = projection.connectors.find(
      (c) => c.sourceRowId === startRowId && c.targetRowId === ids.http
    );
    expect(head).toMatchObject({ kind: 'step' });
    expect(head?.slot).toEqual({
      id: `slot:head:${ids.container}:${ids.http}`,
      target: { nodeId: ids.http },
      containerId: ids.container,
    });

    const added: Node = { id: 'new', position: { x: 0, y: 0 }, data: {} };
    const changes = insertAtSlot(projection, head!.slot!, added);
    expect(changes.addNodes[0]).toMatchObject({ parentId: ids.container, extent: 'parent' });
    expect(changes.addEdges).toEqual([
      expect.objectContaining({ source: 'new', target: ids.http }),
    ]);
    expect(changes.removeEdgeIds).toEqual([]);
  });

  it('numbers the body from the first real step and leaves the start row unnumbered', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const projection = project(nodes, edges);
    const numbered = projection.rows.filter((row) => row.stepNumber !== undefined);
    expect(numbered.map((row) => row.nodeId).slice(0, 4)).toEqual([
      ids.maestroA,
      ids.maestroB,
      ids.container,
      ids.http,
    ]);
  });

  it('gives an empty body a start row and an unconnected Add step placeholder', () => {
    const { nodes, edges } = makeEmptyRuntimeFixture();
    const projection = project(nodes, edges);
    const placeholderId = lanePlaceholderId(ids.container, SELF_CONTAINED_BODY_LANE);

    const placeholder = projection.rows.find((row) => row.nodeId === placeholderId);
    expect(placeholder?.lanePlaceholder).toEqual({
      id: `slot:lane:${ids.container}:${SELF_CONTAINED_BODY_LANE}`,
      containerId: ids.container,
      unconnected: true,
    });
    expect(placeholder?.parentRowId).toBe(ids.container);
    expect(projection.connectors.find((c) => c.targetRowId === placeholderId)?.sourceRowId).toBe(
      startRowId
    );

    const changes = insertAtSlot(projection, placeholder!.lanePlaceholder!, {
      id: 'first',
      position: { x: 0, y: 0 },
      data: {},
    });
    expect(changes.addNodes[0]?.parentId).toBe(ids.container);
    expect(changes.addEdges).toEqual([]);
  });

  it("appends an otherwise empty body's first step to its lone trigger", () => {
    const { nodes, edges } = makeEmptyRuntimeFixture();
    const trigger: Node = {
      id: 'body-trigger',
      type: 'test.trigger',
      parentId: ids.container,
      position: { x: 0, y: 0 },
      data: {},
    };
    const projection = projectSequence([...nodes, trigger], edges, {
      ...options,
      isStartNode: (node) => node.type === 'test.trigger',
    });
    const placeholderId = lanePlaceholderId(ids.container, SELF_CONTAINED_BODY_LANE);
    const slot = projection.rows.find((row) => row.nodeId === placeholderId)?.lanePlaceholder;
    expect(slot).toEqual({
      id: `slot:lane:${ids.container}:${SELF_CONTAINED_BODY_LANE}`,
      containerId: ids.container,
      source: { nodeId: trigger.id },
    });

    const changes = insertAtSlot(projection, slot!, {
      id: 'first',
      position: { x: 0, y: 0 },
      data: {},
    });
    expect(changes.addNodes[0]?.parentId).toBe(ids.container);
    expect(changes.addEdges.map((edge) => [edge.source, edge.target])).toEqual([
      [trigger.id, 'first'],
    ]);

    // The folded trigger has no row, so the preview stays drawn from the body start row.
    const preview = projectionWithPreviewRow(projection, slot!);
    const incoming = preview.connectors.filter((c) => c.targetRowId === PREVIEW_NODE_ID);
    expect(incoming.map((c) => c.sourceRowId)).toEqual([startRowId]);
  });

  it('folds a trigger inside the body into the body start row', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const trigger: Node = {
      id: 'body-trigger',
      type: 'test.trigger',
      parentId: ids.container,
      position: { x: 0, y: -100 },
      data: {},
    };
    const triggerEdge: Edge = {
      id: 'e-trigger-http',
      source: trigger.id,
      sourceHandle: 'output',
      target: ids.http,
      targetHandle: 'input',
    };
    const projection = projectSequence([...nodes, trigger], [...edges, triggerEdge], {
      ...options,
      isStartNode: (node) => node.type === 'test.trigger',
    });
    expect(projection.rows.some((row) => row.nodeId === trigger.id)).toBe(false);
    expect(projection.connectors.find((c) => c.sourceRowId === startRowId)?.targetRowId).toBe(
      ids.http
    );
  });

  it('hides the start row with the rest of the body when the container is collapsed', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const projection = projectSequence(nodes, edges, {
      ...options,
      collapsedStepIds: new Set([ids.container]),
    });
    expect(projection.rows.find((row) => row.nodeId === startRowId)?.visible).toBe(false);
    expect(projection.rows.find((row) => row.nodeId === ids.http)?.visible).toBe(false);
  });

  it('keeps railed containers on their inner start handle when the predicate is absent', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const projection = projectSequence(nodes, edges, { isContainerNode: options.isContainerNode });
    expect(projection.rows.some((row) => row.bodyStart !== undefined)).toBe(false);
    // The For Each keeps its real `start` edge.
    expect(
      projection.connectors.find((c) => c.sourceRowId === ids.forEach && c.kind === 'branch-entry')
        ?.slot?.source?.handleId
    ).toBe('start');
  });
});

describe('compatibility of a self-contained body', () => {
  it('reports the runtime fixture as exact and lists no synthetic row as projected', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const report = analyzeSequentialCompatibility(nodes, edges, options);
    expect(report.level).toBe('exact');
    expect(report.projectedNodeIds).not.toContain(startRowId);
  });
});

describe('moves around a self-contained body', () => {
  it('moves the first body step out, before the container', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const projection = project(nodes, edges);
    expect(findMoveUpSlot(projection, ids.http)?.target?.nodeId).toBe(ids.container);
  });

  it('moves the second body step above the first through the head slot', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const projection = project(nodes, edges);
    expect(findMoveUpSlot(projection, ids.javascript)).toMatchObject({
      target: { nodeId: ids.http },
      containerId: ids.container,
    });
  });

  it('indents into a populated body by appending to its tail', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const projection = project(nodes, edges);
    expect(findIndentSlot(projection, ids.agent)).toMatchObject({
      source: { nodeId: ids.sendMessage },
      containerId: ids.container,
    });
  });

  it('indents into an empty body as its unconnected first step', () => {
    const { nodes, edges } = makeEmptyRuntimeFixture();
    const projection = project(nodes, edges);
    const slot = findIndentSlot(projection, ids.agent);
    expect(slot).toMatchObject({ containerId: ids.container, unconnected: true });

    const next = applyGraphChangeSet(
      { nodes, edges },
      moveSubtree(projection, ids.agent, slot!, { nodes, edges })
    );
    expect(next.nodes.find((node) => node.id === ids.agent)?.parentId).toBe(ids.container);
    expect(
      next.edges.some((edge) => edge.source === ids.container && edge.target === ids.agent)
    ).toBe(false);
  });
});

describe('preview row for an unconnected slot', () => {
  it('opens a top-level gap in an otherwise empty scoped projection', () => {
    const empty: SequenceProjection = { rows: [], connectors: [], slots: [] };
    const next = projectionWithPreviewRow(empty, {
      id: 'slot:tail:api',
      containerId: 'api',
      unconnected: true,
    });
    expect(next.rows).toEqual([
      expect.objectContaining({ nodeId: PREVIEW_NODE_ID, depth: 0, parentRowId: undefined }),
    ]);
  });

  it('swaps an empty body placeholder for the preview row at the body depth', () => {
    const { nodes, edges } = makeEmptyRuntimeFixture();
    const projection = project(nodes, edges);
    const placeholderId = lanePlaceholderId(ids.container, SELF_CONTAINED_BODY_LANE);
    const slot = projection.rows.find((row) => row.nodeId === placeholderId)!.lanePlaceholder!;
    const next = projectionWithPreviewRow(projection, slot);
    expect(next.rows.find((row) => row.nodeId === PREVIEW_NODE_ID)).toMatchObject({
      depth: 1,
      parentRowId: ids.container,
    });
    expect(next.connectors.find((c) => c.targetRowId === PREVIEW_NODE_ID)?.sourceRowId).toBe(
      startRowId
    );
  });
});
