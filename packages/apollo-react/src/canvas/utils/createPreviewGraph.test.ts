import { describe, expect, it, vi } from 'vitest';
import { PREVIEW_EDGE_ID, PREVIEW_NODE_ID } from '../constants';
import { createPreviewGraph, inferParentId } from './createPreviewGraph';

describe('createPreviewGraph', () => {
  const sourceNode = {
    id: 'source-1',
    position: { x: 0, y: 0 },
    data: {},
  };

  it('creates a preview graph with a trailing edge and removed edge ids', () => {
    const reactFlowInstance = {
      getNode: vi.fn().mockImplementation((id: string) => {
        if (id === sourceNode.id) return sourceNode;
        return undefined;
      }),
      getNodes: vi.fn().mockReturnValue([sourceNode]),
      getInternalNode: vi.fn(),
    } as any;

    const graph = createPreviewGraph({
      sourceNodeId: sourceNode.id,
      sourceHandleId: 'output',
      reactFlowInstance,
      position: { x: 150, y: 90 },
      targetNodeId: 'target-1',
      targetHandleId: 'input-1',
      removedEdgeIds: ['edge-1'],
    });

    expect(graph).toMatchObject({
      node: {
        id: PREVIEW_NODE_ID,
        position: { x: 150, y: 42 },
        data: {
          inputHandlePosition: 'left',
          outputHandlePosition: 'right',
        },
        type: 'preview',
      },
      removedEdgeIds: ['edge-1'],
    });
    expect(graph?.edges).toEqual([
      expect.objectContaining({
        id: PREVIEW_EDGE_ID,
        source: 'source-1',
        sourceHandle: 'output',
        target: PREVIEW_NODE_ID,
        targetHandle: 'input',
        type: 'default',
      }),
      expect.objectContaining({
        id: `${PREVIEW_NODE_ID}-target-1`,
        source: PREVIEW_NODE_ID,
        sourceHandle: 'output',
        target: 'target-1',
        targetHandle: 'input-1',
        type: 'default',
      }),
    ]);
  });

  it('creates a single-edge preview graph when no trailing target is provided', () => {
    const reactFlowInstance = {
      getNode: vi.fn().mockImplementation((id: string) => {
        if (id === sourceNode.id) return sourceNode;
        return undefined;
      }),
      getNodes: vi.fn().mockReturnValue([sourceNode]),
      getInternalNode: vi.fn(),
    } as any;

    const graph = createPreviewGraph({
      sourceNodeId: sourceNode.id,
      sourceHandleId: 'output',
      reactFlowInstance,
      position: { x: 150, y: 90 },
    });

    expect(graph).toMatchObject({
      node: {
        id: PREVIEW_NODE_ID,
        position: { x: 150, y: 42 },
      },
      removedEdgeIds: undefined,
    });
    expect(graph?.edges).toEqual([
      expect.objectContaining({
        id: PREVIEW_EDGE_ID,
      }),
    ]);
  });

  it('uses centered positioning when requested', () => {
    const loopNode = {
      id: 'loop-1',
      position: { x: 20, y: 10 },
      data: {},
    };
    const reactFlowInstance = {
      getNode: vi.fn().mockImplementation((id: string) => {
        if (id === loopNode.id) return loopNode;
        return undefined;
      }),
      getNodes: vi.fn().mockReturnValue([loopNode]),
      getInternalNode: vi.fn(),
    } as any;

    const graph = createPreviewGraph({
      sourceNodeId: loopNode.id,
      sourceHandleId: 'start',
      reactFlowInstance,
      position: { x: 200, y: 100 },
      positionMode: 'center',
      targetNodeId: loopNode.id,
      targetHandleId: 'continue',
      containerId: loopNode.id,
    });

    expect(graph?.node).toEqual(
      expect.objectContaining({
        position: { x: 132, y: 42 },
        parentId: 'loop-1',
        extent: 'parent',
      })
    );
  });

  it('reparents the preview node relative to the container absolute position', () => {
    const sourceNodeWithContainer = {
      ...sourceNode,
      parentId: 'parent-1',
    };
    const parentNode = {
      id: 'parent-1',
      position: { x: 100, y: 40 },
      data: {},
    };
    const containerNode = {
      id: 'container-1',
      position: { x: 20, y: 10 },
      parentId: 'parent-1',
      data: {},
    };
    const reactFlowInstance = {
      getNode: vi.fn().mockImplementation((id: string) => {
        if (id === sourceNode.id) return sourceNodeWithContainer;
        if (id === 'container-1') return containerNode;
        return undefined;
      }),
      getNodes: vi.fn().mockReturnValue([parentNode, containerNode, sourceNodeWithContainer]),
      getInternalNode: vi.fn(),
    } as any;

    const graph = createPreviewGraph({
      sourceNodeId: sourceNode.id,
      sourceHandleId: 'output',
      reactFlowInstance,
      position: { x: 180, y: 130 },
      targetNodeId: 'target-1',
      containerId: 'container-1',
    });

    expect(graph?.node).toEqual({
      id: PREVIEW_NODE_ID,
      type: 'preview',
      position: { x: 60, y: 32 },
      width: 96,
      height: 96,
      selected: true,
      data: {
        inputHandlePosition: 'left',
        outputHandlePosition: 'right',
      },
      parentId: 'container-1',
      extent: 'parent',
    });
  });

  it('returns null when the container cannot be found', () => {
    const reactFlowInstance = {
      getNode: vi.fn().mockImplementation((id: string) => {
        if (id === sourceNode.id) return sourceNode;
        return undefined;
      }),
      getNodes: vi.fn().mockReturnValue([sourceNode]),
      getInternalNode: vi.fn(),
    } as any;

    const graph = createPreviewGraph({
      sourceNodeId: sourceNode.id,
      sourceHandleId: 'output',
      reactFlowInstance,
      position: { x: 180, y: 130 },
      targetNodeId: 'target-1',
      containerId: 'missing-container',
    });

    expect(graph).toBeNull();
  });

  it('defaults the preview container to the source node parent', () => {
    const loopNode = {
      id: 'loop-1',
      position: { x: 20, y: 10 },
      data: {},
    };
    const sourceNodeInLoop = {
      ...sourceNode,
      parentId: 'loop-1',
    };
    const reactFlowInstance = {
      getNode: vi.fn().mockImplementation((id: string) => {
        if (id === sourceNode.id) return sourceNodeInLoop;
        if (id === loopNode.id) return loopNode;
        return undefined;
      }),
      getNodes: vi.fn().mockReturnValue([loopNode, sourceNodeInLoop]),
      getInternalNode: vi.fn(),
    } as any;

    const graph = createPreviewGraph({
      sourceNodeId: sourceNode.id,
      sourceHandleId: 'output',
      reactFlowInstance,
      position: { x: 180, y: 130 },
    });

    expect(graph?.node).toEqual(
      expect.objectContaining({
        parentId: 'loop-1',
        extent: 'parent',
        position: { x: 160, y: 72 },
      })
    );
  });

  it('infers a preview container for sibling edges inside the same parent', () => {
    expect(
      inferParentId('child-1', 'child-2', [
        { id: 'loop-1', position: { x: 0, y: 0 }, data: {} },
        { id: 'child-1', parentId: 'loop-1', position: { x: 0, y: 0 }, data: {} },
        { id: 'child-2', parentId: 'loop-1', position: { x: 20, y: 0 }, data: {} },
      ] as any)
    ).toBe('loop-1');
  });

  it('infers a preview container for loop-to-child and child-to-loop edges', () => {
    const nodes = [
      { id: 'loop-1', position: { x: 0, y: 0 }, data: {} },
      { id: 'child-1', parentId: 'loop-1', position: { x: 20, y: 0 }, data: {} },
    ] as any;

    expect(inferParentId('loop-1', 'child-1', nodes)).toBe('loop-1');
    expect(inferParentId('child-1', 'loop-1', nodes)).toBe('loop-1');
  });
});
