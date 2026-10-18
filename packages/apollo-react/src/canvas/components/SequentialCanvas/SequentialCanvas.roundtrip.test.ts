import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { sequenceFingerprint } from '../../utils/sequential/fingerprint';
import {
  applyGraphChangeSet,
  makeWireframeFixture,
  WIREFRAME_NODE_IDS,
} from '../../utils/sequential/fixtures';
import { insertAtSlot } from '../../utils/sequential/mutations';
import { projectSequence } from '../../utils/sequential/projectSequence';
import { SEQ_INSERTED_FLAG } from './edges/sequentialInsert';
import { synthesizePositionsForFlow } from './synthesizePositionsForFlow';
import { deriveSequentialGraph } from './useSequentialGraph';

/**
 * Insert a node in sequential view (via the pure insertAtSlot op), place it on toggle-to-flow,
 * and assert no overlap, no pre-existing node moved, and an identical projection on return.
 */

function boxesOverlap(a: Node, b: Node): boolean {
  const aw = a.width ?? 96;
  const ah = a.height ?? 96;
  const bw = b.width ?? 96;
  const bh = b.height ?? 96;
  return (
    a.position.x < b.position.x + bw &&
    a.position.x + aw > b.position.x &&
    a.position.y < b.position.y + bh &&
    a.position.y + ah > b.position.y
  );
}

function assertNoOverlapWithinFrames(nodes: Node[]): void {
  const byFrame = new Map<string, Node[]>();
  for (const node of nodes) {
    const frame = node.parentId ?? '__root__';
    (byFrame.get(frame) ?? byFrame.set(frame, []).get(frame)!).push(node);
  }
  for (const frameNodes of byFrame.values()) {
    for (let i = 0; i < frameNodes.length; i++) {
      for (let j = i + 1; j < frameNodes.length; j++) {
        expect(boxesOverlap(frameNodes[i]!, frameNodes[j]!)).toBe(false);
      }
    }
  }
}

function projectionSignature(nodes: Node[], edges: Edge[]) {
  const projection = projectSequence(nodes, edges);
  return {
    rows: projection.rows.map((row) => ({
      nodeId: row.nodeId,
      depth: row.depth,
      stepNumber: row.stepNumber,
    })),
    connectors: projection.connectors.map((connector) => ({
      kind: connector.kind,
      source: connector.sourceRowId,
      target: connector.targetRowId,
    })),
  };
}

describe('sequential insert round-trip (D4)', () => {
  it('inserts, places on toggle-to-flow without moving anything, and re-projects identically', () => {
    const { nodes, edges } = makeWireframeFixture();

    const initial = deriveSequentialGraph({ nodes, edges, view: 'sequential' });
    const slot = initial.projection!.slots.find(
      (candidate) => candidate.graphEdgeId === 'e-http-js'
    );
    expect(slot).toBeDefined();

    const newNode: Node = {
      id: 'inserted-1',
      type: 'uipath.slack',
      position: { x: 0, y: 0 },
      data: { display: { label: 'Send Slack' }, [SEQ_INSERTED_FLAG]: true },
    };
    const changeset = insertAtSlot(initial.projection!, slot!, newNode);
    const afterInsert = applyGraphChangeSet({ nodes, edges }, changeset);

    const insertedProjection = projectSequence(afterInsert.nodes, afterInsert.edges);
    const insertedRow = insertedProjection.rows.find((row) => row.nodeId === 'inserted-1');
    expect(insertedRow?.depth).toBe(0);

    const fingerprintBefore = sequenceFingerprint(afterInsert.nodes, afterInsert.edges, new Set());
    const signatureBefore = projectionSignature(afterInsert.nodes, afterInsert.edges);

    const flowNodes = synthesizePositionsForFlow(afterInsert.nodes, afterInsert.edges);

    assertNoOverlapWithinFrames(flowNodes);

    // Each pre-existing node comes back by identity.
    for (const id of Object.values(WIREFRAME_NODE_IDS)) {
      const original = nodes.find((node) => node.id === id)!;
      expect(flowNodes.find((node) => node.id === id)).toBe(original);
    }

    const placed = flowNodes.find((node) => node.id === 'inserted-1')!;
    expect((placed.data as Record<string, unknown>)[SEQ_INSERTED_FLAG]).toBeUndefined();

    // Positions and the cleared flag are both ignored by the projection and the fingerprint.
    const fingerprintAfter = sequenceFingerprint(flowNodes, afterInsert.edges, new Set());
    expect(fingerprintAfter).toBe(fingerprintBefore);
    expect(projectionSignature(flowNodes, afterInsert.edges)).toEqual(signatureBefore);
  });
});
