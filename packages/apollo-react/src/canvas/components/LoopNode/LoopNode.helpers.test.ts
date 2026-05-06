import type { Edge, Node, ReactFlowInstance } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import type { NodeManifest } from '../../schema/node-definition';
import { getInnerHandleContainerId, resolveContainerAddNodePreview } from './LoopNode.helpers';

type PreviewManifest = Pick<NodeManifest, 'display' | 'handleConfiguration'>;

function createReactFlowInstance({
  nodes,
  edges = [],
}: {
  nodes: Node[];
  edges?: Edge[];
}): ReactFlowInstance {
  return {
    getNode: (id: string) => nodes.find((node) => node.id === id),
    getNodes: () => nodes,
    getEdges: () => edges,
  } as unknown as ReactFlowInstance;
}

const loopManifest: PreviewManifest = {
  display: { label: 'Loop', icon: 'repeat', shape: 'container' },
  handleConfiguration: [
    {
      position: 'right',
      boundary: 'outer',
      handles: [{ id: 'done', type: 'source', handleType: 'output' }],
    },
    {
      position: 'left',
      boundary: 'inner',
      handles: [{ id: 'start', type: 'source', handleType: 'output' }],
    },
    {
      position: 'right',
      boundary: 'inner',
      handles: [{ id: 'continue', type: 'target', handleType: 'input' }],
    },
  ],
};

const agentManifest: PreviewManifest = {
  display: { label: 'Agent', icon: 'agent', shape: 'rectangle' },
  handleConfiguration: [
    {
      position: 'bottom',
      handles: [{ id: 'tools', type: 'source', handleType: 'artifact', label: 'Tools' }],
    },
    {
      position: 'right',
      handles: [{ id: 'success', type: 'source', handleType: 'output', label: 'Agent' }],
    },
  ],
};

const taskManifest: PreviewManifest = {
  display: { label: 'Task', icon: 'box', shape: 'square' },
  handleConfiguration: [
    {
      position: 'left',
      handles: [{ id: 'input', type: 'target', handleType: 'input' }],
    },
    {
      position: 'right',
      handles: [{ id: 'output', type: 'source', handleType: 'output' }],
    },
  ],
};

const manifestsByType: Record<string, PreviewManifest> = {
  agent: agentManifest,
  loop: loopManifest,
  task: taskManifest,
};

function getManifestForNode(node: Node): PreviewManifest | undefined {
  return node.type ? manifestsByType[node.type] : undefined;
}

describe('resolveContainerAddNodePreview', () => {
  const loopNode: Node = {
    id: 'loop-1',
    type: 'loop',
    position: { x: 100, y: 80 },
    style: { width: 704, height: 368 },
    data: {},
  };

  it('keeps artifact handle previews on the generic attachment path inside containers', () => {
    const agentNode: Node = {
      id: 'agent-1',
      type: 'agent',
      parentId: loopNode.id,
      position: { x: 240, y: 112 },
      measured: { width: 288, height: 96 },
      data: {},
    };
    const reactFlowInstance = createReactFlowInstance({
      nodes: [loopNode, agentNode],
    });

    const previewOverrides = resolveContainerAddNodePreview({
      source: { nodeId: agentNode.id, handleId: 'tools' },
      sourceHandleType: 'source',
      reactFlowInstance,
      getManifestForNode,
    });

    expect(previewOverrides).toBeNull();
  });

  it('keeps unresolved handles on the generic attachment path inside containers', () => {
    const agentNode: Node = {
      id: 'agent-1',
      type: 'agent',
      parentId: loopNode.id,
      position: { x: 240, y: 112 },
      measured: { width: 288, height: 96 },
      data: {},
    };
    const reactFlowInstance = createReactFlowInstance({
      nodes: [loopNode, agentNode],
    });

    const previewOverrides = resolveContainerAddNodePreview({
      source: { nodeId: agentNode.id, handleId: 'runtime-tools' },
      sourceHandleType: 'source',
      reactFlowInstance,
      getManifestForNode,
    });

    expect(previewOverrides).toBeNull();
  });

  it('uses per-instance handle configuration when classifying clicked handles', () => {
    const taskNode: Node = {
      id: 'task-1',
      type: 'task',
      parentId: loopNode.id,
      position: { x: 240, y: 112 },
      measured: { width: 96, height: 96 },
      data: {
        handleConfigurations: [
          {
            position: 'right',
            handles: [{ id: 'runtime-output', type: 'source', handleType: 'output' }],
          },
        ],
      },
    };
    const reactFlowInstance = createReactFlowInstance({
      nodes: [loopNode, taskNode],
    });

    const previewOverrides = resolveContainerAddNodePreview({
      source: { nodeId: taskNode.id, handleId: 'runtime-output' },
      sourceHandleType: 'source',
      reactFlowInstance,
      getManifestForNode,
    });

    expect(previewOverrides).toMatchObject({
      containerId: loopNode.id,
      target: {
        nodeId: loopNode.id,
        handleId: 'continue',
      },
      data: {
        placement: {
          containerId: loopNode.id,
          sourceNodeId: taskNode.id,
          targetNodeId: loopNode.id,
          mode: 'sequence',
        },
      },
    });
  });

  it('treats an empty per-instance handle configuration as an explicit override', () => {
    const taskNode: Node = {
      id: 'task-1',
      type: 'task',
      parentId: loopNode.id,
      position: { x: 240, y: 112 },
      measured: { width: 96, height: 96 },
      data: {
        handleConfigurations: [],
      },
    };
    const reactFlowInstance = createReactFlowInstance({
      nodes: [loopNode, taskNode],
    });

    const previewOverrides = resolveContainerAddNodePreview({
      source: { nodeId: taskNode.id, handleId: 'output' },
      sourceHandleType: 'source',
      reactFlowInstance,
      getManifestForNode,
    });

    expect(previewOverrides).toBeNull();
  });

  it('continues to append workflow output handles to the container continuation', () => {
    const taskNode: Node = {
      id: 'task-1',
      type: 'task',
      parentId: loopNode.id,
      position: { x: 240, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const reactFlowInstance = createReactFlowInstance({
      nodes: [loopNode, taskNode],
    });

    const previewOverrides = resolveContainerAddNodePreview({
      source: { nodeId: taskNode.id, handleId: 'output' },
      sourceHandleType: 'source',
      reactFlowInstance,
      getManifestForNode,
    });

    expect(previewOverrides).toMatchObject({
      containerId: loopNode.id,
      positionMode: 'center',
      target: {
        nodeId: loopNode.id,
        handleId: 'continue',
      },
      data: {
        placement: {
          containerId: loopNode.id,
          sourceNodeId: taskNode.id,
          targetNodeId: loopNode.id,
          mode: 'sequence',
        },
      },
    });
  });

  it('continues to insert workflow output handles between container children', () => {
    const sourceNode: Node = {
      id: 'task-1',
      type: 'task',
      parentId: loopNode.id,
      position: { x: 160, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const targetNode: Node = {
      id: 'task-2',
      type: 'task',
      parentId: loopNode.id,
      position: { x: 432, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const existingEdge: Edge = {
      id: 'task-1-task-2',
      source: sourceNode.id,
      sourceHandle: 'output',
      target: targetNode.id,
      targetHandle: 'input',
    };
    const reactFlowInstance = createReactFlowInstance({
      nodes: [loopNode, sourceNode, targetNode],
      edges: [existingEdge],
    });

    const previewOverrides = resolveContainerAddNodePreview({
      source: { nodeId: sourceNode.id, handleId: 'output' },
      sourceHandleType: 'source',
      reactFlowInstance,
      getManifestForNode,
    });

    expect(previewOverrides).toMatchObject({
      containerId: loopNode.id,
      positionMode: 'center',
      target: {
        nodeId: targetNode.id,
        handleId: 'input',
      },
      data: {
        originalEdge: existingEdge,
        placement: {
          containerId: loopNode.id,
          sourceNodeId: sourceNode.id,
          targetNodeId: targetNode.id,
          mode: 'sequence',
        },
      },
    });
  });

  it('keeps empty container inner source handles on the generic add path', () => {
    const reactFlowInstance = createReactFlowInstance({
      nodes: [loopNode],
    });

    const previewOverrides = resolveContainerAddNodePreview({
      source: { nodeId: loopNode.id, handleId: 'start' },
      sourceHandleType: 'source',
      reactFlowInstance,
      getManifestForNode,
    });

    expect(previewOverrides).toBeNull();
  });

  it('does not treat container outer outputs as container-body previews', () => {
    const reactFlowInstance = createReactFlowInstance({
      nodes: [loopNode],
    });

    const previewOverrides = resolveContainerAddNodePreview({
      source: { nodeId: loopNode.id, handleId: 'done' },
      sourceHandleType: 'source',
      reactFlowInstance,
      getManifestForNode,
    });

    expect(previewOverrides).toBeNull();
  });

  it('continues to insert from an occupied container inner source handle', () => {
    const childNode: Node = {
      id: 'task-1',
      type: 'task',
      parentId: loopNode.id,
      position: { x: 240, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const existingEdge: Edge = {
      id: 'loop-1-task-1',
      source: loopNode.id,
      sourceHandle: 'start',
      target: childNode.id,
      targetHandle: 'input',
    };
    const reactFlowInstance = createReactFlowInstance({
      nodes: [loopNode, childNode],
      edges: [existingEdge],
    });

    const previewOverrides = resolveContainerAddNodePreview({
      source: { nodeId: loopNode.id, handleId: 'start' },
      sourceHandleType: 'source',
      reactFlowInstance,
      getManifestForNode,
    });

    expect(previewOverrides).toMatchObject({
      containerId: loopNode.id,
      positionMode: 'center',
      target: {
        nodeId: childNode.id,
        handleId: 'input',
      },
      data: {
        originalEdge: existingEdge,
        placement: {
          containerId: loopNode.id,
          sourceNodeId: loopNode.id,
          targetNodeId: childNode.id,
          mode: 'sequence',
        },
      },
    });
  });
});

describe('getInnerHandleContainerId', () => {
  const loopNode: Node = {
    id: 'loop-1',
    type: 'loop',
    position: { x: 100, y: 80 },
    style: { width: 704, height: 368 },
    data: {},
  };

  it.each([
    'start',
    'continue',
  ])('returns the container id for inner %s handle drags from the container itself', (handleId) => {
    const reactFlowInstance = createReactFlowInstance({
      nodes: [loopNode],
    });

    expect(
      getInnerHandleContainerId({
        source: { nodeId: loopNode.id, handleId },
        reactFlowInstance,
        getManifestForNode,
      })
    ).toBe(loopNode.id);
  });

  it('does not scope child node drags', () => {
    const childNode: Node = {
      id: 'task-1',
      type: 'task',
      parentId: loopNode.id,
      position: { x: 240, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const reactFlowInstance = createReactFlowInstance({
      nodes: [loopNode, childNode],
    });

    expect(
      getInnerHandleContainerId({
        source: { nodeId: childNode.id, handleId: 'output' },
        reactFlowInstance,
        getManifestForNode,
      })
    ).toBeUndefined();
  });

  it('does not scope outer container output drags', () => {
    const reactFlowInstance = createReactFlowInstance({
      nodes: [loopNode],
    });

    expect(
      getInnerHandleContainerId({
        source: { nodeId: loopNode.id, handleId: 'done' },
        reactFlowInstance,
        getManifestForNode,
      })
    ).toBeUndefined();
  });
});
