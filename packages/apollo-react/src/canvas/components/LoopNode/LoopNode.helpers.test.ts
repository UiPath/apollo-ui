import type { Edge, Node, ReactFlowInstance } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import type { NodeManifest } from '../../schema/node-definition';
import {
  applyHandleOffsets,
  collectOccupiedWallOffsets,
  getInnerHandleContainerId,
  HANDLE_DRAG_CORNER_MARGIN_PX,
  HANDLE_DRAG_TOP_MARGIN_PX,
  resolveContainerAddNodePreview,
  resolveHandleWallDrag,
} from './LoopNode.helpers';

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
    expect(previewOverrides).not.toHaveProperty('positionMode');
    expect(previewOverrides).not.toHaveProperty('position');
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

  it('uses the parent container sequence for nested container outer outputs', () => {
    const innerLoopNode: Node = {
      id: 'inner-loop',
      type: 'loop',
      parentId: loopNode.id,
      position: { x: 160, y: 112 },
      style: { width: 560, height: 320 },
      data: {},
    };
    const targetNode: Node = {
      id: 'task-1',
      type: 'task',
      parentId: loopNode.id,
      position: { x: 800, y: 112 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const existingEdge: Edge = {
      id: 'inner-loop-task-1',
      source: innerLoopNode.id,
      sourceHandle: 'done',
      target: targetNode.id,
      targetHandle: 'input',
    };
    const reactFlowInstance = createReactFlowInstance({
      nodes: [loopNode, innerLoopNode, targetNode],
      edges: [existingEdge],
    });

    const previewOverrides = resolveContainerAddNodePreview({
      source: { nodeId: innerLoopNode.id, handleId: 'done' },
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
          sourceNodeId: innerLoopNode.id,
          targetNodeId: targetNode.id,
          mode: 'sequence',
        },
      },
    });
  });

  it('appends nested container outer outputs through the parent container continuation', () => {
    const innerLoopNode: Node = {
      id: 'inner-loop',
      type: 'loop',
      parentId: loopNode.id,
      position: { x: 160, y: 112 },
      style: { width: 560, height: 320 },
      data: {},
    };
    const reactFlowInstance = createReactFlowInstance({
      nodes: [loopNode, innerLoopNode],
    });

    const previewOverrides = resolveContainerAddNodePreview({
      source: { nodeId: innerLoopNode.id, handleId: 'done' },
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
          sourceNodeId: innerLoopNode.id,
          targetNodeId: loopNode.id,
          mode: 'sequence',
        },
      },
    });
    expect(previewOverrides).not.toHaveProperty('positionMode');
    expect(previewOverrides).not.toHaveProperty('position');
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

describe('applyHandleOffsets', () => {
  const makeGroup = (position: string, ids: string[], extra: Record<string, unknown> = {}) =>
    ({
      position,
      boundary: 'inner',
      alwaysVisible: true,
      slotCount: 2,
      ...extra,
      handles: ids.map((id) => ({ id, type: 'target', handleType: 'input', visible: true })),
    }) as never;

  it('returns groups unchanged when there are no offsets', () => {
    const groups = [makeGroup('right', ['onComplete', 'onExit'])];
    expect(applyHandleOffsets(groups, undefined)).toBe(groups);
    expect(applyHandleOffsets(groups, {})).toBe(groups);
  });

  it('moves an offset handle into a synthetic group on the dragged wall', () => {
    const groups = [makeGroup('right', ['onComplete', 'onExit'])];
    const result = applyHandleOffsets(groups, { onExit: { position: 'bottom', offset: 160 } });

    expect(result).toHaveLength(2);
    expect(result[0]?.position).toBe('right');
    expect(result[0]?.handles.map((h) => h.id)).toEqual(['onComplete']);
    expect(result[1]?.position).toBe('bottom');
    expect(result[1]?.handles.map((h) => h.id)).toEqual(['onExit']);
    expect((result[1]?.handles[0] as { offsetPx?: number }).offsetPx).toBe(160);
    // Synthetic groups drop slot layout so the explicit offset wins.
    expect(result[1]?.slotCount).toBeUndefined();
    // Group traits like boundary and alwaysVisible carry over.
    expect(result[1]?.boundary).toBe('inner');
    expect((result[1] as { alwaysVisible?: boolean }).alwaysVisible).toBe(true);
  });

  it('drops the source group entirely when all its handles moved', () => {
    const groups = [makeGroup('left', ['onEnter'])];
    const result = applyHandleOffsets(groups, { onEnter: { position: 'left', offset: 128 } });

    expect(result).toHaveLength(1);
    expect((result[0]?.handles[0] as { offsetPx?: number }).offsetPx).toBe(128);
  });
});

describe('resolveHandleWallDrag', () => {
  const size = { nodeWidth: 640, nodeHeight: 480 };

  it('snaps the offset to the 16px grid', () => {
    const result = resolveHandleWallDrag({
      ...size,
      localX: 630,
      localY: 201,
      allowedWalls: ['right'],
    });
    expect(result).toEqual({ position: 'right', offset: 208 });
  });

  it('picks the nearest allowed wall', () => {
    const nearBottom = resolveHandleWallDrag({
      ...size,
      localX: 320,
      localY: 470,
      allowedWalls: ['right', 'bottom'],
    });
    expect(nearBottom?.position).toBe('bottom');

    const nearRight = resolveHandleWallDrag({
      ...size,
      localX: 630,
      localY: 240,
      allowedWalls: ['right', 'bottom'],
    });
    expect(nearRight?.position).toBe('right');
  });

  it('ignores walls that are not allowed', () => {
    const result = resolveHandleWallDrag({
      ...size,
      localX: 2,
      localY: 240,
      allowedWalls: ['left'],
    });
    expect(result?.position).toBe('left');

    // Pointer hugs the (disallowed) left wall: the drag falls back to the
    // nearest allowed wall instead.
    const constrained = resolveHandleWallDrag({
      ...size,
      localX: 2,
      localY: 240,
      allowedWalls: ['right', 'bottom'],
    });
    expect(constrained?.position).toBe('bottom');
  });

  it('keeps side-wall offsets clear of the header and the corners', () => {
    const nearTop = resolveHandleWallDrag({
      ...size,
      localX: 638,
      localY: 0,
      allowedWalls: ['right'],
    });
    expect(nearTop?.offset).toBe(HANDLE_DRAG_TOP_MARGIN_PX);

    const nearBottomCorner = resolveHandleWallDrag({
      ...size,
      localX: 638,
      localY: 479,
      allowedWalls: ['right'],
    });
    expect(nearBottomCorner?.offset).toBe(432); // 480 - 48, already grid-aligned
  });

  it('keeps bottom-wall offsets clear of both corners', () => {
    const nearLeftCorner = resolveHandleWallDrag({
      ...size,
      localX: 0,
      localY: 479,
      allowedWalls: ['bottom'],
    });
    expect(nearLeftCorner?.offset).toBe(HANDLE_DRAG_CORNER_MARGIN_PX);

    const nearRightCorner = resolveHandleWallDrag({
      ...size,
      localX: 639,
      localY: 479,
      allowedWalls: ['bottom'],
    });
    expect(nearRightCorner?.offset).toBe(592); // 640 - 48, already grid-aligned
  });

  it('returns null when the wall is too small for a corner-safe slot', () => {
    const result = resolveHandleWallDrag({
      nodeWidth: 80,
      nodeHeight: 480,
      localX: 40,
      localY: 479,
      allowedWalls: ['bottom'],
    });
    expect(result).toBeNull();
  });

  it('derives the side-wall top clamp from the measured header, symmetric with the bottom', () => {
    // Header bottom (= dashed frame top) measured at 90px. The top clamp keeps
    // the pill 48 - 10 (frame inset) = 38px below the frame top: 90 + 38 = 128.
    const nearTop = resolveHandleWallDrag({
      ...size,
      localX: 638,
      localY: 0,
      allowedWalls: ['right'],
      contentTopPx: 90,
    });
    expect(nearTop?.offset).toBe(128);

    // Symmetric frame clearances at both extremes: 128 - 90 = 38 below the
    // frame top, and (480 - 10) - 432 = 38 above the frame bottom.
    const nearBottom = resolveHandleWallDrag({
      ...size,
      localX: 638,
      localY: 479,
      allowedWalls: ['right'],
      contentTopPx: 90,
    });
    expect(nearBottom?.offset).toBe(432);
  });

  it('grid-aligns the header-derived top clamp', () => {
    // 100 + 38 = 138 is off-grid; the clamp rounds up to the next slot, 144.
    const result = resolveHandleWallDrag({
      ...size,
      localX: 638,
      localY: 0,
      allowedWalls: ['right'],
      contentTopPx: 100,
    });
    expect(result?.offset).toBe(144);
  });

  it('keeps the pill at least 32px away from other handles on the same wall', () => {
    // Pointer snaps onto an occupied slot (208): the nearest free slots sit
    // 32px away on either side, and the pointer leans up (201 < 208), so the
    // pill settles at 176.
    const upward = resolveHandleWallDrag({
      ...size,
      localX: 638,
      localY: 201,
      allowedWalls: ['right'],
      occupiedOffsets: { right: [208] },
    });
    expect(upward).toEqual({ position: 'right', offset: 176 });

    // Leaning down (215 still snaps to 208) resolves to the slot below, 240.
    const downward = resolveHandleWallDrag({
      ...size,
      localX: 638,
      localY: 215,
      allowedWalls: ['right'],
      occupiedOffsets: { right: [208] },
    });
    expect(downward).toEqual({ position: 'right', offset: 240 });
  });

  it('allows exactly 32px of separation', () => {
    const result = resolveHandleWallDrag({
      ...size,
      localX: 638,
      localY: 208,
      allowedWalls: ['right'],
      occupiedOffsets: { right: [240] },
    });
    expect(result?.offset).toBe(208);
  });

  it('ignores occupied offsets on other walls', () => {
    const result = resolveHandleWallDrag({
      ...size,
      localX: 638,
      localY: 208,
      allowedWalls: ['right'],
      occupiedOffsets: { bottom: [208] },
    });
    expect(result?.offset).toBe(208);
  });

  it('returns null when every slot on the wall is blocked', () => {
    // A 160px bottom wall offers slots 48..112; siblings at 64 and 96 leave no
    // slot 32px clear of both, so the drag keeps its previous position.
    const result = resolveHandleWallDrag({
      nodeWidth: 160,
      nodeHeight: 480,
      localX: 80,
      localY: 479,
      allowedWalls: ['bottom'],
      occupiedOffsets: { bottom: [64, 96] },
    });
    expect(result).toBeNull();
  });
});

describe('collectOccupiedWallOffsets', () => {
  const size = { nodeWidth: 640, nodeHeight: 480 };
  const innerGroup = (
    position: string,
    handles: Array<Record<string, unknown>>,
    slotCount?: number
  ) => ({ position, boundary: 'inner', slotCount, handles }) as never;

  it('reports default slot positions for undragged inner handles, skipping excluded ids', () => {
    const groups = [
      // 1 handle laid out across 2 slots: occupies the first of [160, 320].
      innerGroup('left', [{ id: 'onEnter', type: 'source', handleType: 'output' }], 2),
      innerGroup('right', [
        { id: 'onComplete', type: 'target', handleType: 'input' },
        { id: 'onExit', type: 'target', handleType: 'input' },
      ]),
    ];

    const occupied = collectOccupiedWallOffsets(groups, {
      ...size,
      excludeHandleIds: ['onExit', 'exit'],
    });

    expect(occupied.left).toEqual([160]);
    expect(occupied.right).toEqual([160]); // onComplete's slot; onExit (320) excluded
  });

  it('uses the explicit offsetPx of already-dragged handles', () => {
    const groups = [
      innerGroup('bottom', [{ id: 'onExit', type: 'target', handleType: 'input', offsetPx: 480 }]),
    ];

    const occupied = collectOccupiedWallOffsets(groups, { ...size, excludeHandleIds: [] });
    expect(occupied.bottom).toEqual([480]);
  });

  it('ignores outer groups: pills only collide with inner siblings', () => {
    const groups = [
      {
        position: 'right',
        boundary: 'outer',
        handles: [
          { id: 'complete', type: 'source', handleType: 'output' },
          { id: 'exit', type: 'source', handleType: 'output' },
        ],
      } as never,
    ];

    expect(collectOccupiedWallOffsets(groups, { ...size, excludeHandleIds: [] })).toEqual({});
  });
});
