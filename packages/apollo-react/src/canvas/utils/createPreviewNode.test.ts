import type { Edge, Node, ReactFlowInstance } from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREVIEW_EDGE_ID, PREVIEW_NODE_ID } from '../constants';
import { removePreviewFromReactFlow } from './createPreviewNode';

interface MockInstance {
  getNodes: () => Node[];
  getEdges: () => Edge[];
  setNodes: ReturnType<typeof vi.fn>;
  setEdges: ReturnType<typeof vi.fn>;
}

function createReactFlowInstance(nodes: Node[] = [], edges: Edge[] = []): MockInstance {
  return {
    getNodes: () => nodes,
    getEdges: () => edges,
    setNodes: vi.fn(),
    setEdges: vi.fn(),
  };
}

const asInstance = (m: MockInstance) => m as unknown as ReactFlowInstance;

const previewNode: Node = {
  id: PREVIEW_NODE_ID,
  type: 'preview',
  position: { x: 0, y: 0 },
  data: {},
};
const regularNode: Node = {
  id: 'node-1',
  type: 'default',
  position: { x: 0, y: 0 },
  data: {},
};
const previewEdge: Edge = {
  id: PREVIEW_EDGE_ID,
  source: PREVIEW_NODE_ID,
  target: 'node-1',
};
const regularEdge: Edge = { id: 'edge-1', source: 'node-1', target: 'node-2' };

describe('removePreviewFromReactFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not touch nodes or edges when no preview is present', () => {
    const rf = createReactFlowInstance([regularNode], [regularEdge]);
    removePreviewFromReactFlow(asInstance(rf));
    expect(rf.setNodes).not.toHaveBeenCalled();
    expect(rf.setEdges).not.toHaveBeenCalled();
  });

  it('does nothing on an empty canvas', () => {
    const rf = createReactFlowInstance();
    removePreviewFromReactFlow(asInstance(rf));
    expect(rf.setNodes).not.toHaveBeenCalled();
    expect(rf.setEdges).not.toHaveBeenCalled();
  });

  it('removes the preview node when present', () => {
    const rf = createReactFlowInstance([regularNode, previewNode]);
    removePreviewFromReactFlow(asInstance(rf));

    expect(rf.setNodes).toHaveBeenCalledTimes(1);
    const updater = rf.setNodes.mock.calls[0]?.[0] as (nodes: Node[]) => Node[];
    expect(updater([regularNode, previewNode])).toEqual([regularNode]);
    // No preview edge, so edges are left untouched.
    expect(rf.setEdges).not.toHaveBeenCalled();
  });

  it('removes preview edges when present', () => {
    const rf = createReactFlowInstance([regularNode], [regularEdge, previewEdge]);
    removePreviewFromReactFlow(asInstance(rf));

    expect(rf.setEdges).toHaveBeenCalledTimes(1);
    const updater = rf.setEdges.mock.calls[0]?.[0] as (edges: Edge[]) => Edge[];
    expect(updater([regularEdge, previewEdge])).toEqual([regularEdge]);
    // No preview node, so nodes are left untouched.
    expect(rf.setNodes).not.toHaveBeenCalled();
  });

  it('removes both the preview node and its edges when both are present', () => {
    const rf = createReactFlowInstance([regularNode, previewNode], [regularEdge, previewEdge]);
    removePreviewFromReactFlow(asInstance(rf));

    expect(rf.setNodes).toHaveBeenCalledTimes(1);
    expect(rf.setEdges).toHaveBeenCalledTimes(1);
  });
});
