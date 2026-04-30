import type { Edge, Node, ReactFlowInstance } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SOURCE_HANDLE_ID, PREVIEW_EDGE_ID, PREVIEW_NODE_ID } from '../constants';
import { applyPreviewGraphToReactFlow, createPreviewGraph } from './createPreviewGraph';

function createReactFlowInstance({
  nodes,
  edges = [],
}: {
  nodes: Node[];
  edges?: Edge[];
}): ReactFlowInstance {
  let currentNodes = nodes;
  let currentEdges = edges;

  return {
    getNode: (id: string) => currentNodes.find((node) => node.id === id),
    getInternalNode: () => undefined,
    getNodes: () => currentNodes,
    getEdges: () => currentEdges,
    setNodes: (updater: Node[] | ((nodes: Node[]) => Node[])) => {
      currentNodes = typeof updater === 'function' ? updater(currentNodes) : updater;
    },
    setEdges: (updater: Edge[] | ((edges: Edge[]) => Edge[])) => {
      currentEdges = typeof updater === 'function' ? updater(currentEdges) : updater;
    },
  } as unknown as ReactFlowInstance;
}

describe('createPreviewGraph', () => {
  const sourceNode: Node = {
    id: 'source-node',
    type: 'source',
    position: { x: 0, y: 0 },
    data: {},
  };
  const targetNode: Node = {
    id: 'target-node',
    type: 'target',
    position: { x: 400, y: 0 },
    data: {},
  };

  beforeEach(() => {
    vi.useRealTimers();
  });

  it('creates a trailing preview edge with the requested id and handles', () => {
    const reactFlowInstance = createReactFlowInstance({
      nodes: [sourceNode, targetNode],
    });

    const preview = createPreviewGraph({
      source: {
        nodeId: sourceNode.id,
        handleId: 'source-output',
      },
      reactFlowInstance,
      position: { x: 200, y: 100 },
      handlePosition: Position.Right,
      target: {
        nodeId: targetNode.id,
        handleId: 'target-input',
      },
      trailingEdgeId: 'preview-to-target',
    });

    expect(preview?.edges).toEqual([
      expect.objectContaining({
        id: PREVIEW_EDGE_ID,
        source: sourceNode.id,
        sourceHandle: 'source-output',
        target: PREVIEW_NODE_ID,
        targetHandle: 'input',
      }),
      expect.objectContaining({
        id: 'preview-to-target',
        source: PREVIEW_NODE_ID,
        sourceHandle: DEFAULT_SOURCE_HANDLE_ID,
        target: targetNode.id,
        targetHandle: 'target-input',
      }),
    ]);
  });

  it('converts preview positions from absolute coordinates to container-relative coordinates', () => {
    const containerNode: Node = {
      id: 'container-node',
      type: 'loop',
      position: { x: 100, y: 50 },
      data: {},
    };
    const reactFlowInstance = createReactFlowInstance({
      nodes: [containerNode, sourceNode],
    });

    const preview = createPreviewGraph({
      source: {
        nodeId: sourceNode.id,
        handleId: 'source-output',
      },
      reactFlowInstance,
      position: { x: 240, y: 170 },
      positionMode: 'center',
      previewNodeSize: { width: 80, height: 40 },
      handlePosition: Position.Right,
      containerId: containerNode.id,
    });

    expect(preview?.node).toMatchObject({
      id: PREVIEW_NODE_ID,
      parentId: containerNode.id,
      extent: 'parent',
      position: { x: 100, y: 100 },
    });
  });

  it('infers the source parent as the preview container for child node button handles', () => {
    const containerNode: Node = {
      id: 'loop-node',
      type: 'loop',
      position: { x: 100, y: 50 },
      data: {},
    };
    const childNode: Node = {
      id: 'child-node',
      type: 'activity',
      parentId: containerNode.id,
      position: { x: 80, y: 120 },
      measured: { width: 120, height: 64 },
      data: {},
    };
    const reactFlowInstance = createReactFlowInstance({
      nodes: [containerNode, childNode],
    });

    const preview = createPreviewGraph({
      source: {
        nodeId: childNode.id,
        handleId: 'output',
      },
      reactFlowInstance,
      handlePosition: Position.Right,
    });

    expect(preview?.node).toMatchObject({
      id: PREVIEW_NODE_ID,
      parentId: containerNode.id,
      extent: 'parent',
    });
    expect(preview?.node.position.x).toBeGreaterThan(childNode.position.x);
  });

  it('filters original edges only when the preview graph is applied', () => {
    vi.useFakeTimers();

    const replacedEdge: Edge = {
      id: 'edge-to-replace',
      source: sourceNode.id,
      sourceHandle: 'source-output',
      target: targetNode.id,
      targetHandle: 'target-input',
    };
    const retainedEdge: Edge = {
      id: 'edge-to-keep',
      source: 'other-source',
      target: 'other-target',
    };
    const reactFlowInstance = createReactFlowInstance({
      nodes: [sourceNode, targetNode],
      edges: [replacedEdge, retainedEdge],
    });

    const preview = createPreviewGraph({
      source: {
        nodeId: sourceNode.id,
        handleId: 'source-output',
      },
      reactFlowInstance,
      position: { x: 200, y: 100 },
      handlePosition: Position.Right,
      data: { originalEdge: replacedEdge },
      target: {
        nodeId: targetNode.id,
        handleId: 'target-input',
      },
    });

    expect(preview?.node.data?.originalEdge).toEqual(replacedEdge);
    expect(reactFlowInstance.getEdges()).toEqual([replacedEdge, retainedEdge]);

    applyPreviewGraphToReactFlow(preview!, reactFlowInstance);
    vi.runOnlyPendingTimers();

    expect(reactFlowInstance.getEdges()).toEqual([
      retainedEdge,
      expect.objectContaining({
        id: PREVIEW_EDGE_ID,
        source: sourceNode.id,
        target: PREVIEW_NODE_ID,
      }),
      expect.objectContaining({
        source: PREVIEW_NODE_ID,
        target: targetNode.id,
      }),
    ]);
  });
});
