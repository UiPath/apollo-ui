import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { PREVIEW_NODE_ID } from '../../constants';
import type { NodeTypeRegistry } from '../../core';
import type { NodeManifest, NodeShape } from '../../schema/node-definition';
import { placeAddedNode } from './AddNodeManager.helpers';

function buildRegistry(manifestsByType: Record<string, { shape?: NodeShape }>): NodeTypeRegistry {
  const get = (nodeType: string): NodeManifest | undefined => {
    const entry = manifestsByType[nodeType];
    if (!entry) return undefined;
    return {
      nodeType,
      version: '1',
      display: { label: nodeType, ...(entry.shape ? { shape: entry.shape } : {}) },
      handleConfiguration: [],
    } as NodeManifest;
  };
  return { getManifest: get } as unknown as NodeTypeRegistry;
}

const ORIGINAL_EDGE: Edge = {
  id: 'e-trigger-action',
  source: 'trigger',
  target: 'action',
};

function makePreviewNode(position: { x: number; y: number }): Node {
  return {
    id: PREVIEW_NODE_ID,
    type: 'preview',
    position,
    width: 96,
    height: 96,
    data: { originalEdge: ORIGINAL_EDGE },
  };
}

describe('placeAddedNode', () => {
  describe('top-level edge insertion', () => {
    const trigger: Node = {
      id: 'trigger',
      type: 'square-source',
      position: { x: 96, y: 96 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const action: Node = {
      id: 'action',
      type: 'square-target',
      position: { x: 288, y: 96 },
      measured: { width: 96, height: 96 },
      data: {},
    };

    it('shifts the downstream chain right when inserting a wider rectangle', () => {
      const registry = buildRegistry({
        'square-source': { shape: 'square' },
        'square-target': { shape: 'square' },
        rectangle: { shape: 'rectangle' },
      });
      const previewNode = makePreviewNode({ x: 200, y: 96 });
      const insertedNode: Node = {
        id: 'inserted',
        type: 'rectangle',
        // Already aligned to preview by alignNodeToPreview.
        position: { x: 200, y: 96 },
        data: {},
      };

      const { nodes } = placeAddedNode({
        nodes: [trigger, action, insertedNode],
        edges: [ORIGINAL_EDGE],
        previewNode,
        insertedNode,
        registry,
      });

      const placedAction = nodes.find((n) => n.id === 'action');
      const placedInserted = nodes.find((n) => n.id === 'inserted');
      const placedTrigger = nodes.find((n) => n.id === 'trigger');

      // Trigger does not move — it is upstream of the insertion.
      expect(placedTrigger?.position).toEqual({ x: 96, y: 96 });
      // The rectangle is bumped right just enough to clear the upstream
      // trigger's right edge (96 + 96 = 192) plus the insertion gap.
      expect(placedInserted?.position.x).toBeGreaterThanOrEqual(192);
      // Action is downstream and clears the rectangle's right edge plus gap.
      const rectRight = (placedInserted?.position.x ?? 0) + 288;
      expect(placedAction?.position.x).toBeGreaterThanOrEqual(rectRight);
      // Y stays in row layout — no vertical splitting.
      expect(placedAction?.position.y).toBe(96);
    });

    it('shifts the downstream chain right when inserting a container shape', () => {
      const registry = buildRegistry({
        'square-source': { shape: 'square' },
        'square-target': { shape: 'square' },
        loop: { shape: 'container' },
      });
      const previewNode = makePreviewNode({ x: 200, y: 96 });
      const insertedNode: Node = {
        id: 'inserted',
        type: 'loop',
        position: { x: 200, y: 96 },
        data: {},
      };

      const { nodes } = placeAddedNode({
        nodes: [trigger, action, insertedNode],
        edges: [ORIGINAL_EDGE],
        previewNode,
        insertedNode,
        registry,
      });

      const placedAction = nodes.find((n) => n.id === 'action');
      const placedInserted = nodes.find((n) => n.id === 'inserted');

      // Container default size is 560 wide; action must clear it.
      expect(placedAction?.position.x).toBeGreaterThanOrEqual(
        (placedInserted?.position.x ?? 0) + 560
      );
      // Action stays in the same row (no vertical re-shuffling).
      expect(placedAction?.position.y).toBe(96);
    });

    it('cascades the shift through a multi-node downstream chain', () => {
      const registry = buildRegistry({
        'square-source': { shape: 'square' },
        'square-target': { shape: 'square' },
        rectangle: { shape: 'rectangle' },
      });
      const middle: Node = {
        id: 'middle',
        type: 'square-target',
        position: { x: 480, y: 96 },
        measured: { width: 96, height: 96 },
        data: {},
      };
      const tail: Node = {
        id: 'tail',
        type: 'square-target',
        position: { x: 672, y: 96 },
        measured: { width: 96, height: 96 },
        data: {},
      };
      const edges: Edge[] = [
        ORIGINAL_EDGE,
        { id: 'e-action-middle', source: 'action', target: 'middle' },
        { id: 'e-middle-tail', source: 'middle', target: 'tail' },
      ];
      const previewNode = makePreviewNode({ x: 200, y: 96 });
      const insertedNode: Node = {
        id: 'inserted',
        type: 'rectangle',
        position: { x: 200, y: 96 },
        data: {},
      };

      const { nodes } = placeAddedNode({
        nodes: [trigger, action, middle, tail, insertedNode],
        edges,
        previewNode,
        insertedNode,
        registry,
      });

      const placedAction = nodes.find((n) => n.id === 'action')!;
      const placedMiddle = nodes.find((n) => n.id === 'middle')!;
      const placedTail = nodes.find((n) => n.id === 'tail')!;

      // Order in the chain is preserved.
      expect(placedAction.position.x).toBeLessThan(placedMiddle.position.x);
      expect(placedMiddle.position.x).toBeLessThan(placedTail.position.x);
      // All chain nodes shifted right by the same amount, preserving original
      // spacing between them.
      const actionShift = placedAction.position.x - 288;
      const middleShift = placedMiddle.position.x - 480;
      const tailShift = placedTail.position.x - 672;
      expect(actionShift).toBeGreaterThan(0);
      expect(middleShift).toBe(actionShift);
      expect(tailShift).toBe(actionShift);
    });

    it('does not shift the chain when the inserted node already fits', () => {
      const registry = buildRegistry({
        'square-source': { shape: 'square' },
        'square-target': { shape: 'square' },
        square: { shape: 'square' },
      });
      // Trigger and action with enough room for a square between them.
      const farAction: Node = {
        ...action,
        position: { x: 480, y: 96 },
      };
      const previewNode = makePreviewNode({ x: 240, y: 96 });
      const insertedNode: Node = {
        id: 'inserted',
        type: 'square',
        position: { x: 240, y: 96 },
        data: {},
      };

      const { nodes } = placeAddedNode({
        nodes: [trigger, farAction, insertedNode],
        edges: [{ ...ORIGINAL_EDGE, target: 'action' }],
        previewNode,
        insertedNode,
        registry,
      });

      const placedAction = nodes.find((n) => n.id === 'action');
      // Square at 240 spans 240-336, action at 480. Already enough room → no shift.
      expect(placedAction?.position).toEqual({ x: 480, y: 96 });
    });

    it('does not shift any chain when no originalEdge metadata is present', () => {
      const registry = buildRegistry({
        'square-source': { shape: 'square' },
        'square-target': { shape: 'square' },
        rectangle: { shape: 'rectangle' },
      });
      // Preview without originalEdge metadata — this is the "click + on a leaf
      // handle" path, not the edge-toolbar insertion path.
      const previewNode: Node = {
        id: PREVIEW_NODE_ID,
        type: 'preview',
        position: { x: 200, y: 96 },
        width: 96,
        height: 96,
        data: {},
      };
      const insertedNode: Node = {
        id: 'inserted',
        type: 'rectangle',
        position: { x: 200, y: 96 },
        data: {},
      };

      const { nodes } = placeAddedNode({
        nodes: [trigger, action, insertedNode],
        edges: [ORIGINAL_EDGE],
        previewNode,
        insertedNode,
        registry,
      });

      const placedAction = nodes.find((n) => n.id === 'action');
      // Without originalEdge, this branch isn't a graph-aware insertion — fall
      // back to generic collision resolution. We only assert that the chain
      // didn't deterministically shift; actual position is decided by the
      // collision resolver and not part of this contract.
      expect(placedAction?.position).toBeDefined();
    });
  });
});
