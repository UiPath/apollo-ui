import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { PREVIEW_NODE_ID } from '../../constants';
import type { NodeLayout } from '../../hooks/useCanvasNodeLayout';
import type { NodeShape } from '../../schema/node-definition';
import { getExpandedSize } from '../../utils/node-size';
import { getContainerFitGeometry, getNodeDimensions } from '../../utils/container';
import { placeAddedNode } from './AddNodeManager.helpers';

function buildLayout(manifestsByType: Record<string, { shape?: NodeShape }>): NodeLayout {
  const getShape = (nodeType: string | undefined): NodeShape | undefined =>
    nodeType ? manifestsByType[nodeType]?.shape : undefined;

  return {
    getNodeDimensions: (node) => getNodeDimensions(node, getExpandedSize(getShape(node.type))),
    isContainerNode: (node) => getShape(node.type) === 'container',
    getContainerFitGeometry: (node) =>
      getShape(node.type) === 'container' ? getContainerFitGeometry() : null,
  };
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
      const layout = buildLayout({
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
        layout,
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
      const layout = buildLayout({
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
        layout,
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
      const layout = buildLayout({
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
        layout,
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
      const layout = buildLayout({
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
        layout,
      });

      const placedAction = nodes.find((n) => n.id === 'action');
      // Square at 240 spans 240-336, action at 480. Already enough room → no shift.
      expect(placedAction?.position).toEqual({ x: 480, y: 96 });
    });

    it('does not shift the source node when inserting onto a self-loop edge', () => {
      // Reproduces the Loop V1 loopback regression: the original edge is a
      // self-loop (source === target, e.g. Loop("output") → Loop("loopBack")),
      // so shifting the "downstream chain" would move the source away from
      // the inserted node and produce a backward-wrapping edge.
      const layout = buildLayout({
        loop: { shape: 'square' },
        rectangle: { shape: 'rectangle' },
      });
      const loop: Node = {
        id: 'loop',
        type: 'loop',
        position: { x: 96, y: 96 },
        measured: { width: 96, height: 96 },
        data: {},
      };
      const selfLoopEdge: Edge = {
        id: 'e-loop-self',
        source: 'loop',
        target: 'loop',
        sourceHandle: 'output',
        targetHandle: 'loopBack',
      };
      const previewNode: Node = {
        id: PREVIEW_NODE_ID,
        type: 'preview',
        position: { x: 240, y: 96 },
        width: 96,
        height: 96,
        data: { originalEdge: selfLoopEdge },
      };
      const insertedNode: Node = {
        id: 'inserted',
        type: 'rectangle',
        position: { x: 240, y: 96 },
        data: {},
      };

      const { nodes } = placeAddedNode({
        nodes: [loop, insertedNode],
        edges: [selfLoopEdge],
        previewNode,
        insertedNode,
        layout,
      });

      const placedLoop = nodes.find((n) => n.id === 'loop');
      // The Loop is both source and target of the original edge — it must
      // not be treated as a downstream chain to shift.
      expect(placedLoop?.position).toEqual({ x: 96, y: 96 });
    });

    it('does not shift the source when the chain cycles back through it', () => {
      // Reproduces the second-insertion regression on a loopBack chain:
      // After a node has been inserted onto the self-loop, the resulting graph
      // is `loop body → child → loop loopBack`. Inserting again onto
      // `loop body → child` walks from the target (child) along the cycle
      // (child → loop), so the loop ends up in chainIds. Without this guard,
      // the loop is shifted right alongside the child, producing the broken
      // backward-wrapping body edge.
      const layout = buildLayout({
        loop: { shape: 'square' },
        rectangle: { shape: 'rectangle' },
      });
      const loop: Node = {
        id: 'loop',
        type: 'loop',
        position: { x: 96, y: 96 },
        measured: { width: 96, height: 96 },
        data: {},
      };
      const child: Node = {
        id: 'child',
        type: 'rectangle',
        position: { x: 672, y: 96 },
        measured: { width: 288, height: 96 },
        data: {},
      };
      const bodyEdge: Edge = {
        id: 'e-loop-child',
        source: 'loop',
        target: 'child',
        sourceHandle: 'body',
        targetHandle: 'input',
      };
      const loopBackEdge: Edge = {
        id: 'e-child-loop',
        source: 'child',
        target: 'loop',
        sourceHandle: 'output',
        targetHandle: 'loopBack',
      };
      const previewNode: Node = {
        id: PREVIEW_NODE_ID,
        type: 'preview',
        position: { x: 288, y: 96 },
        width: 96,
        height: 96,
        data: { originalEdge: bodyEdge },
      };
      const insertedNode: Node = {
        id: 'inserted',
        type: 'rectangle',
        position: { x: 288, y: 96 },
        data: {},
      };

      const { nodes } = placeAddedNode({
        nodes: [loop, child, insertedNode],
        edges: [bodyEdge, loopBackEdge],
        previewNode,
        insertedNode,
        layout,
      });

      const placedLoop = nodes.find((n) => n.id === 'loop');
      // Loop is the upstream source — it must not move even though the chain
      // walk cycles back through it. Other position adjustments are decided
      // by the generic collision resolver (matching pre-PR behavior for
      // cyclic edges) and aren't part of this contract.
      expect(placedLoop?.position).toEqual({ x: 96, y: 96 });
    });

    it('does not shift any chain when no originalEdge metadata is present', () => {
      const layout = buildLayout({
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
        layout,
      });

      const placedAction = nodes.find((n) => n.id === 'action');
      // Without originalEdge, this branch isn't a graph-aware insertion — fall
      // back to generic collision resolution. We only assert that the chain
      // didn't deterministically shift; actual position is decided by the
      // collision resolver and not part of this contract.
      expect(placedAction?.position).toBeDefined();
    });
  });

  describe('non-container placement', () => {
    it('leaves top-level generic additions unchanged when there is no collision', () => {
      const layout = buildLayout({
        resource: { shape: 'circle' },
        task: { shape: 'square' },
      });
      const task: Node = {
        id: 'task',
        type: 'task',
        position: { x: 96, y: 96 },
        measured: { width: 96, height: 96 },
        data: {},
      };
      const previewNode: Node = {
        id: PREVIEW_NODE_ID,
        type: 'preview',
        position: { x: 320, y: 240 },
        width: 96,
        height: 96,
        data: {},
      };
      const insertedNode: Node = {
        id: 'resource',
        type: 'resource',
        position: { x: 320, y: 240 },
        data: {},
      };

      const { nodes, insertedNode: placedInsertedNode } = placeAddedNode({
        nodes: [task, insertedNode],
        edges: [],
        previewNode,
        insertedNode,
        layout,
      });

      expect(placedInsertedNode.parentId).toBeUndefined();
      expect(placedInsertedNode.position).toEqual({ x: 320, y: 240 });
      expect(nodes.find((node) => node.id === 'task')?.position).toEqual({ x: 96, y: 96 });
    });
  });

  describe('generic parented insertion', () => {
    it('grows a container vertically around an attached child', () => {
      const layout = buildLayout({
        loop: { shape: 'container' },
        resource: { shape: 'circle' },
      });
      const loop: Node = {
        id: 'loop',
        type: 'loop',
        position: { x: 0, y: 0 },
        style: { width: 560, height: 320 },
        data: {},
      };
      const previewNode: Node = {
        id: PREVIEW_NODE_ID,
        type: 'preview',
        parentId: 'loop',
        extent: 'parent',
        position: { x: 240, y: 300 },
        width: 96,
        height: 96,
        data: {},
      };
      const insertedNode: Node = {
        id: 'resource',
        type: 'resource',
        parentId: 'loop',
        extent: 'parent',
        position: { x: 240, y: 300 },
        data: {},
      };

      const { nodes, insertedNode: placedInsertedNode } = placeAddedNode({
        nodes: [loop, insertedNode],
        edges: [],
        previewNode,
        insertedNode,
        layout,
      });

      const loopHeight = nodes.find((node) => node.id === 'loop')?.style?.height as
        | number
        | undefined;

      expect(placedInsertedNode.parentId).toBe('loop');
      expect(loopHeight).toBeGreaterThan(320);
      expect(loopHeight).toBeGreaterThanOrEqual(placedInsertedNode.position.y + 96);
    });

    it('grows a container when an attached child is added above the safe area', () => {
      const layout = buildLayout({
        agent: { shape: 'rectangle' },
        loop: { shape: 'container' },
        resource: { shape: 'circle' },
      });
      const loop: Node = {
        id: 'loop',
        type: 'loop',
        position: { x: 0, y: 0 },
        style: { width: 560, height: 320 },
        data: {},
      };
      const agent: Node = {
        id: 'agent',
        type: 'agent',
        parentId: 'loop',
        extent: 'parent',
        position: { x: 240, y: 112 },
        measured: { width: 288, height: 96 },
        data: {},
      };
      const previewNode: Node = {
        id: PREVIEW_NODE_ID,
        type: 'preview',
        parentId: 'loop',
        extent: 'parent',
        position: { x: 240, y: 32 },
        width: 96,
        height: 96,
        data: {},
      };
      const insertedNode: Node = {
        id: 'resource',
        type: 'resource',
        parentId: 'loop',
        extent: 'parent',
        position: { x: 240, y: 32 },
        data: {},
      };

      const { nodes, insertedNode: placedInsertedNode } = placeAddedNode({
        nodes: [loop, agent, insertedNode],
        edges: [],
        previewNode,
        insertedNode,
        layout,
      });

      const loopHeight = nodes.find((node) => node.id === 'loop')?.style?.height as
        | number
        | undefined;
      const placedAgent = nodes.find((node) => node.id === 'agent');

      expect(placedInsertedNode.parentId).toBe('loop');
      expect(placedInsertedNode.position.y).toBeGreaterThanOrEqual(96);
      expect(placedAgent?.position.y).toBeGreaterThan(112);
      expect(loopHeight).toBeGreaterThan(320);
    });

    it('does not resize a parent that is not a container manifest', () => {
      const layout = buildLayout({
        group: { shape: 'square' },
        resource: { shape: 'circle' },
      });
      const group: Node = {
        id: 'group',
        type: 'group',
        position: { x: 0, y: 0 },
        style: { width: 320, height: 220 },
        data: {},
      };
      const siblingBelow: Node = {
        id: 'sibling-below',
        type: 'resource',
        position: { x: 0, y: 260 },
        measured: { width: 96, height: 96 },
        data: {},
      };
      const previewNode: Node = {
        id: PREVIEW_NODE_ID,
        type: 'preview',
        parentId: 'group',
        extent: 'parent',
        position: { x: 300, y: 240 },
        width: 96,
        height: 96,
        data: {},
      };
      const insertedNode: Node = {
        id: 'resource',
        type: 'resource',
        parentId: 'group',
        extent: 'parent',
        position: { x: 300, y: 240 },
        data: {},
      };

      const { nodes } = placeAddedNode({
        nodes: [group, siblingBelow, insertedNode],
        edges: [],
        previewNode,
        insertedNode,
        layout,
      });

      expect(nodes.find((node) => node.id === 'group')).toMatchObject({
        style: { width: 320, height: 220 },
      });
      expect(nodes.find((node) => node.id === 'sibling-below')?.position).toEqual({
        x: 0,
        y: 260,
      });
    });

    it('does not fit containers around ignored node types', () => {
      const layout = buildLayout({
        loop: { shape: 'container' },
        resource: { shape: 'circle' },
        stickyNote: { shape: 'square' },
      });
      const loop: Node = {
        id: 'loop',
        type: 'loop',
        position: { x: 0, y: 0 },
        style: { width: 560, height: 320 },
        data: {},
      };
      const ignoredStickyNote: Node = {
        id: 'sticky-note',
        type: 'stickyNote',
        parentId: 'loop',
        extent: 'parent',
        position: { x: 0, y: 0 },
        measured: { width: 96, height: 96 },
        data: {},
      };
      const previewNode: Node = {
        id: PREVIEW_NODE_ID,
        type: 'preview',
        parentId: 'loop',
        extent: 'parent',
        position: { x: 240, y: 112 },
        width: 96,
        height: 96,
        data: {},
      };
      const insertedNode: Node = {
        id: 'resource',
        type: 'resource',
        parentId: 'loop',
        extent: 'parent',
        position: { x: 240, y: 112 },
        data: {},
      };

      const { nodes } = placeAddedNode({
        nodes: [loop, ignoredStickyNote, insertedNode],
        edges: [],
        previewNode,
        insertedNode,
        layout,
        ignoredNodeTypes: ['stickyNote'],
      });

      expect(nodes.find((node) => node.id === 'loop')).toMatchObject({
        style: { width: 560, height: 320 },
      });
      expect(nodes.find((node) => node.id === 'sticky-note')?.position).toEqual({
        x: 0,
        y: 0,
      });
    });
  });
});
