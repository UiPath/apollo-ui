import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREVIEW_EDGE_ID, PREVIEW_NODE_ID } from '../../constants';
import type { PreviewNodeConnectionInfo } from '../../hooks/usePreviewNode';
import { render, screen } from '../../utils/testing';
import type { ListItem } from '../Toolbox';
import { AddNodeManager } from './AddNodeManager';

// --- Shared mock state ---

let mockNodes: Node[] = [];
let mockEdges: Edge[] = [];
let mockRegistry: unknown = null;

vi.mock('@uipath/apollo-react/canvas/xyflow/react', () => ({
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right',
  },
  useReactFlow: () => ({
    getNode: (id: string) => mockNodes.find((n) => n.id === id),
    getNodes: () => mockNodes,
    getEdges: () => mockEdges,
    setNodes: (updater: unknown) => {
      mockNodes = typeof updater === 'function' ? updater(mockNodes) : updater;
    },
    setEdges: (updater: unknown) => {
      mockEdges = typeof updater === 'function' ? updater(mockEdges) : updater;
    },
  }),
}));

const mockPreviewNodeReturn = vi.fn();
vi.mock('../../hooks/usePreviewNode', () => ({
  usePreviewNode: () => mockPreviewNodeReturn(),
}));

vi.mock('../../core', () => ({
  useOptionalNodeTypeRegistry: () => mockRegistry,
}));

vi.mock('../../utils', () => ({
  resolveCollisions: (nodes: Node[]) => nodes,
}));

vi.mock('../FloatingCanvasPanel', () => ({
  FloatingCanvasPanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="floating-panel">{children}</div>
  ),
}));

vi.mock('./AddNodePanel', () => ({
  AddNodePanel: () => null,
}));

// --- Tests ---

describe('AddNodeManager', () => {
  const existingNode: Node = {
    id: 'existing-node-1',
    type: 'existing',
    position: { x: 0, y: 0 },
    data: {},
  };

  const previewNode: Node = {
    id: PREVIEW_NODE_ID,
    type: 'preview',
    position: { x: 100, y: 200 },
    selected: true,
    data: {},
  };

  const previewEdge: Edge = {
    id: 'preview-edge-1',
    source: PREVIEW_NODE_ID,
    sourceHandle: 'output',
    target: 'existing-node-1',
    targetHandle: 'input-1',
  };

  const connectionInfo: PreviewNodeConnectionInfo[] = [
    {
      existingNodeId: 'existing-node-1',
      existingHandleId: 'input-1',
      existingNodeManifest: undefined,
      existingHandleManifest: undefined,
      addNewNodeAsSource: true,
      previewEdgeId: 'preview-edge-1',
    },
  ];

  // Test component used as customPanel to trigger node selection
  const TestPanel = ({
    onNodeSelect,
  }: {
    onNodeSelect: (item: ListItem) => void;
    onClose: () => void;
  }) => (
    <button
      type="button"
      data-testid="select-node"
      onClick={() =>
        onNodeSelect({
          id: 'test-item',
          name: 'Test Node',
          description: 'A test node',
          data: { type: 'test-node' },
        })
      }
    >
      Select
    </button>
  );

  const ClosePanel = ({ onClose }: { onClose: () => void }) => (
    <button type="button" data-testid="close-panel" onClick={onClose}>
      Close
    </button>
  );

  const LoopNodePanel = ({
    onNodeSelect,
  }: {
    onNodeSelect: (item: ListItem) => void;
    onClose: () => void;
  }) => (
    <button
      type="button"
      data-testid="select-loop"
      onClick={() =>
        onNodeSelect({
          id: 'loop-item',
          name: 'For Each',
          description: 'Loop over items',
          data: { type: 'loop' },
        })
      }
    >
      Select loop
    </button>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(1234567890);

    mockNodes = [existingNode, previewNode];
    mockEdges = [previewEdge];
    mockRegistry = null;

    mockPreviewNodeReturn.mockReturnValue({
      previewNode,
      previewNodeConnectionInfo: connectionInfo,
    });
  });

  it('preserves preview parent scope when replacing a loop child preview', () => {
    const parentedPreviewNode: Node = {
      ...previewNode,
      parentId: 'loop-1',
      extent: 'parent',
    };
    mockNodes = [existingNode, parentedPreviewNode];
    mockPreviewNodeReturn.mockReturnValue({
      previewNode: parentedPreviewNode,
      previewNodeConnectionInfo: connectionInfo,
    });

    render(<AddNodeManager customPanel={TestPanel} />);

    screen.getByTestId('select-node').click();

    const addedNode = mockNodes.find((n) => n.id === 'test-node-1234567890');
    expect(addedNode).toMatchObject({
      id: 'test-node-1234567890',
      parentId: 'loop-1',
      extent: 'parent',
      position: parentedPreviewNode.position,
    });
  });

  it('applies onBeforeNodeAdded transforms when node is added as source', () => {
    const onBeforeNodeAdded = vi.fn((node: Node, edges: Edge[]) => ({
      newNode: {
        ...node,
        id: 'custom-id-123',
        data: { ...node.data, customProp: 'transformed' },
        position: { x: 300, y: 400 },
      },
      newEdges: edges.map((e) => ({
        ...e,
        target: e.target === node.id ? 'custom-id-123' : e.target,
        source: e.source === node.id ? 'custom-id-123' : e.source,
        type: 'custom-edge',
      })),
    }));
    const onNodeAdded = vi.fn();

    render(
      <AddNodeManager
        customPanel={TestPanel}
        onBeforeNodeAdded={onBeforeNodeAdded}
        onNodeAdded={onNodeAdded}
      />
    );

    screen.getByTestId('select-node').click();

    // Verify onBeforeNodeAdded was called with the original node and edges
    expect(onBeforeNodeAdded).toHaveBeenCalledOnce();
    const [originalNode, originalEdges] = onBeforeNodeAdded.mock.calls[0] ?? [];
    expect(originalNode).toMatchObject({
      id: 'test-node-1234567890',
      type: 'test-node',
      position: { x: 100, y: 200 },
    });
    expect(originalEdges?.[0]).toMatchObject({
      source: 'test-node-1234567890',
      target: 'existing-node-1',
      targetHandle: 'input-1',
      type: 'default',
    });

    // The preview node should be removed and replaced by the transformed node
    expect(mockNodes.find((n) => n.id === PREVIEW_NODE_ID)).toBeUndefined();
    const addedNode = mockNodes.find((n) => n.id === 'custom-id-123');
    expect(addedNode).toMatchObject({
      id: 'custom-id-123',
      data: expect.objectContaining({ customProp: 'transformed' }),
      position: { x: 300, y: 400 },
    });

    // The preview edge should be removed and replaced by the transformed edge
    expect(mockEdges.find((e) => e.id === 'preview-edge-1')).toBeUndefined();
    const addedEdge = mockEdges.find((e) => e.type === 'custom-edge');
    expect(addedEdge).toMatchObject({
      type: 'custom-edge',
      source: 'custom-id-123',
      target: 'existing-node-1',
      targetHandle: 'input-1',
    });

    // onNodeAdded should receive the transformed node ID as source (addNewNodeAsSource: true)
    expect(onNodeAdded).toHaveBeenCalledOnce();
    expect(onNodeAdded).toHaveBeenCalledWith(
      'custom-id-123',
      'output',
      expect.objectContaining({
        id: 'custom-id-123',
        data: expect.objectContaining({ customProp: 'transformed' }),
        position: { x: 300, y: 400 },
      })
    );
  });

  it('applies onBeforeNodeAdded transforms when node is added as target', () => {
    // Override shared setup for this test: existing node is the source
    mockEdges = [
      {
        id: 'preview-edge-1',
        source: 'existing-node-1',
        sourceHandle: 'output-1',
        target: PREVIEW_NODE_ID,
        targetHandle: 'input',
      },
    ];
    mockPreviewNodeReturn.mockReturnValue({
      previewNode,
      previewNodeConnectionInfo: [
        {
          existingNodeId: 'existing-node-1',
          existingHandleId: 'output-1',
          existingNodeManifest: undefined,
          existingHandleManifest: undefined,
          addNewNodeAsSource: false,
          previewEdgeId: 'preview-edge-1',
        },
      ],
    });

    const onBeforeNodeAdded = vi.fn((node: Node, edges: Edge[]) => ({
      newNode: {
        ...node,
        id: 'custom-id-456',
        data: { ...node.data, customProp: 'transformed' },
        position: { x: 500, y: 600 },
      },
      newEdges: edges.map((e) => ({
        ...e,
        target: e.target === node.id ? 'custom-id-456' : e.target,
        source: e.source === node.id ? 'custom-id-456' : e.source,
        type: 'custom-edge',
      })),
    }));
    const onNodeAdded = vi.fn();

    render(
      <AddNodeManager
        customPanel={TestPanel}
        onBeforeNodeAdded={onBeforeNodeAdded}
        onNodeAdded={onNodeAdded}
      />
    );

    screen.getByTestId('select-node').click();

    // Verify onBeforeNodeAdded was called with the original node and edges
    expect(onBeforeNodeAdded).toHaveBeenCalledOnce();
    const [originalNode, originalEdges] = onBeforeNodeAdded.mock.calls[0] ?? [];
    expect(originalNode).toMatchObject({
      id: 'test-node-1234567890',
      type: 'test-node',
      position: { x: 100, y: 200 },
    });
    expect(originalEdges?.[0]).toMatchObject({
      source: 'existing-node-1',
      sourceHandle: 'output-1',
      target: 'test-node-1234567890',
      type: 'default',
    });

    // The preview node should be removed and replaced by the transformed node
    expect(mockNodes.find((n) => n.id === PREVIEW_NODE_ID)).toBeUndefined();
    const addedNode = mockNodes.find((n) => n.id === 'custom-id-456');
    expect(addedNode).toMatchObject({
      id: 'custom-id-456',
      data: expect.objectContaining({ customProp: 'transformed' }),
      position: { x: 500, y: 600 },
    });

    // The preview edge should be removed and replaced by the transformed edge
    expect(mockEdges.find((e) => e.id === 'preview-edge-1')).toBeUndefined();
    const addedEdge = mockEdges.find((e) => e.type === 'custom-edge');
    expect(addedEdge).toMatchObject({
      type: 'custom-edge',
      source: 'existing-node-1',
      sourceHandle: 'output-1',
      target: 'custom-id-456',
    });

    // onNodeAdded should receive existing node as source (addNewNodeAsSource: false)
    expect(onNodeAdded).toHaveBeenCalledOnce();
    expect(onNodeAdded).toHaveBeenCalledWith(
      'existing-node-1',
      'output-1',
      expect.objectContaining({
        id: 'custom-id-456',
        data: expect.objectContaining({ customProp: 'transformed' }),
        position: { x: 500, y: 600 },
      })
    );
  });

  it('restores an edge replaced by preview when the add node panel is closed', () => {
    const replacedEdge: Edge = {
      id: 'loop-child-1',
      source: 'loop-1',
      sourceHandle: 'start',
      target: 'child-1',
      targetHandle: 'input',
      type: 'smoothstep',
      data: { preserved: true },
      style: { stroke: 'var(--canvas-foreground)' },
      label: 'Loop child',
      markerEnd: 'url(#loop-arrow)',
    };
    const previewNodeWithOriginalEdge: Node = {
      ...previewNode,
      data: { originalEdge: replacedEdge },
    };
    mockNodes = [existingNode, previewNodeWithOriginalEdge];
    mockEdges = [
      {
        id: PREVIEW_EDGE_ID,
        source: 'loop-1',
        sourceHandle: 'start',
        target: PREVIEW_NODE_ID,
        targetHandle: 'input',
      },
      {
        id: 'loop-child-1',
        source: PREVIEW_NODE_ID,
        sourceHandle: 'output',
        target: 'child-1',
        targetHandle: 'input',
      },
    ];
    mockPreviewNodeReturn.mockReturnValue({
      previewNode: previewNodeWithOriginalEdge,
      previewNodeConnectionInfo: connectionInfo,
    });

    const { rerender } = render(<AddNodeManager customPanel={ClosePanel} />);

    screen.getByTestId('close-panel').click();
    mockPreviewNodeReturn.mockReturnValue({
      previewNode: null,
      previewNodeConnectionInfo: null,
    });
    rerender(<AddNodeManager customPanel={ClosePanel} />);

    expect(mockNodes.find((node) => node.id === PREVIEW_NODE_ID)).toBeUndefined();
    expect(mockEdges).toEqual([replacedEdge]);
  });

  it('does not restore a replaced edge after materializing the preview', () => {
    const replacedEdge: Edge = {
      id: 'edge-to-replace',
      source: 'existing-node-1',
      sourceHandle: 'output-1',
      target: 'target-node',
      targetHandle: 'input-1',
      type: 'smoothstep',
      data: { preserved: true },
      style: { stroke: 'var(--canvas-foreground)' },
      markerEnd: 'url(#edge-arrow)',
    };
    const targetNode: Node = {
      id: 'target-node',
      type: 'target',
      position: { x: 300, y: 0 },
      data: {},
    };
    const previewNodeWithOriginalEdge: Node = {
      ...previewNode,
      data: { originalEdge: replacedEdge },
    };
    const trailingPreviewEdgeId = `${PREVIEW_NODE_ID}-${targetNode.id}`;
    mockNodes = [existingNode, targetNode, previewNodeWithOriginalEdge];
    mockEdges = [
      {
        id: PREVIEW_EDGE_ID,
        source: replacedEdge.source,
        sourceHandle: replacedEdge.sourceHandle,
        target: PREVIEW_NODE_ID,
        targetHandle: 'input',
      },
      {
        id: trailingPreviewEdgeId,
        source: PREVIEW_NODE_ID,
        sourceHandle: 'output',
        target: replacedEdge.target,
        targetHandle: replacedEdge.targetHandle,
      },
    ];
    mockPreviewNodeReturn.mockReturnValue({
      previewNode: previewNodeWithOriginalEdge,
      previewNodeConnectionInfo: [
        {
          existingNodeId: replacedEdge.source,
          existingHandleId: replacedEdge.sourceHandle!,
          existingNodeManifest: undefined,
          existingHandleManifest: undefined,
          addNewNodeAsSource: false,
          previewEdgeId: PREVIEW_EDGE_ID,
        },
        {
          existingNodeId: replacedEdge.target,
          existingHandleId: replacedEdge.targetHandle!,
          existingNodeManifest: undefined,
          existingHandleManifest: undefined,
          addNewNodeAsSource: true,
          previewEdgeId: trailingPreviewEdgeId,
        },
      ],
    });

    render(<AddNodeManager customPanel={TestPanel} />);

    screen.getByTestId('select-node').click();

    expect(mockEdges.find((edge) => edge.id === replacedEdge.id)).toBeUndefined();
    expect(mockEdges.find((edge) => edge.source === 'existing-node-1')).toMatchObject({
      target: 'test-node-1234567890',
    });
    expect(mockEdges.find((edge) => edge.target === 'target-node')).toMatchObject({
      source: 'test-node-1234567890',
    });
  });

  it('resolves root insertions without moving parented container children', () => {
    const rootNode: Node = {
      id: 'root-node',
      type: 'task',
      position: { x: 0, y: 0 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 300, y: 0 },
      style: { width: 400, height: 240 },
      data: {},
    };
    const loopChildNode: Node = {
      id: 'loop-child',
      type: 'task',
      parentId: 'loop-1',
      position: { x: 100, y: 100 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const rootPreviewNode: Node = {
      ...previewNode,
      position: { x: 100, y: 100 },
    };

    mockNodes = [rootNode, containerNode, loopChildNode, existingNode, rootPreviewNode];
    mockPreviewNodeReturn.mockReturnValue({
      previewNode: rootPreviewNode,
      previewNodeConnectionInfo: connectionInfo,
    });

    render(<AddNodeManager customPanel={TestPanel} />);

    screen.getByTestId('select-node').click();

    expect(mockNodes.find((node) => node.id === 'loop-child')).toMatchObject({
      position: { x: 100, y: 100 },
    });
  });

  it('uses container sequence materialization for parented previews', () => {
    mockRegistry = {
      getManifest: vi.fn((nodeType: string) =>
        nodeType === 'loop'
          ? {
              nodeType: 'loop',
              display: { label: 'Loop', shape: 'container' },
              handleConfiguration: [],
            }
          : undefined
      ),
      getDefaultHandle: vi.fn(),
    };
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 500, y: 100 },
      style: { width: 320, height: 220 },
      data: {},
    };
    const outerNode: Node = {
      id: 'outer-node',
      type: 'task',
      position: { x: 100, y: 120 },
      data: {},
    };
    const parentedPreviewNode: Node = {
      ...previewNode,
      position: { x: 112, y: 128 },
      parentId: 'loop-1',
      extent: 'parent',
      data: {
        placement: {
          containerId: 'loop-1',
          sourceNodeId: 'loop-1',
          targetNodeId: 'loop-1',
          mode: 'first-child',
        },
      },
    };
    mockNodes = [containerNode, outerNode, parentedPreviewNode];
    mockPreviewNodeReturn.mockReturnValue({
      previewNode: parentedPreviewNode,
      previewNodeConnectionInfo: connectionInfo,
    });

    render(<AddNodeManager customPanel={TestPanel} />);

    screen.getByTestId('select-node').click();

    expect(mockNodes.find((node) => node.id === 'outer-node')).toMatchObject({
      position: { x: 100, y: 120 },
    });
    expect(mockNodes.find((node) => node.id === 'test-node-1234567890')).toMatchObject({
      parentId: 'loop-1',
      extent: 'parent',
      position: { x: 144, y: 96 },
    });
  });

  it('uses standard container-safe geometry and shifts the deterministic downstream chain', () => {
    mockRegistry = {
      getManifest: vi.fn((nodeType: string) =>
        nodeType === 'loop'
          ? {
              nodeType: 'loop',
              display: { label: 'Loop', shape: 'container' },
              handleConfiguration: [],
            }
          : {
              nodeType,
              display: { label: 'Task', shape: 'square' },
              handleConfiguration: [],
            }
      ),
      getDefaultHandle: vi.fn(),
    };
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 500, y: 100 },
      style: { width: 704, height: 368 },
      data: {},
    };
    const firstChildNode: Node = {
      id: 'first-child',
      type: 'task',
      parentId: 'loop-1',
      position: { x: 160, y: 96 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const secondChildNode: Node = {
      id: 'second-child',
      type: 'task',
      parentId: 'loop-1',
      position: { x: 432, y: 96 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const parentedPreviewNode: Node = {
      ...previewNode,
      position: { x: 64, y: 96 },
      parentId: 'loop-1',
      extent: 'parent',
      data: {
        placement: {
          containerId: 'loop-1',
          sourceNodeId: 'loop-1',
          targetNodeId: 'first-child',
          mode: 'sequence',
        },
      },
    };
    const parentedConnections: PreviewNodeConnectionInfo[] = [
      {
        existingNodeId: 'loop-1',
        existingHandleId: 'start',
        existingNodeManifest: undefined,
        existingHandleManifest: undefined,
        addNewNodeAsSource: false,
        previewEdgeId: PREVIEW_EDGE_ID,
      },
      {
        existingNodeId: 'first-child',
        existingHandleId: 'input',
        existingNodeManifest: undefined,
        existingHandleManifest: undefined,
        addNewNodeAsSource: true,
        previewEdgeId: 'loop-child-1',
      },
    ];

    mockNodes = [containerNode, firstChildNode, secondChildNode, parentedPreviewNode];
    mockEdges = [
      {
        id: PREVIEW_EDGE_ID,
        source: 'loop-1',
        sourceHandle: 'start',
        target: PREVIEW_NODE_ID,
        targetHandle: 'input',
      },
      {
        id: 'loop-child-1',
        source: PREVIEW_NODE_ID,
        sourceHandle: 'output',
        target: 'first-child',
        targetHandle: 'input',
      },
      { id: 'first-second', source: 'first-child', target: 'second-child' },
      { id: 'second-loop', source: 'second-child', target: 'loop-1' },
    ];
    mockPreviewNodeReturn.mockReturnValue({
      previewNode: parentedPreviewNode,
      previewNodeConnectionInfo: parentedConnections,
    });

    render(<AddNodeManager customPanel={TestPanel} />);

    screen.getByTestId('select-node').click();

    expect(mockNodes.find((node) => node.id === 'test-node-1234567890')).toMatchObject({
      parentId: 'loop-1',
      extent: 'parent',
      position: { x: 144, y: 96 },
    });
    expect(mockNodes.find((node) => node.id === 'first-child')).toMatchObject({
      position: { x: 288, y: 96 },
    });
    expect(mockNodes.find((node) => node.id === 'second-child')).toMatchObject({
      position: { x: 560, y: 96 },
    });
  });

  it('keeps the preview center stable when adding a larger container node', () => {
    mockRegistry = {
      getManifest: vi.fn((nodeType: string) =>
        nodeType === 'loop'
          ? {
              nodeType: 'loop',
              display: { label: 'Loop', shape: 'container' },
              handleConfiguration: [],
            }
          : undefined
      ),
      getDefaultHandle: vi.fn(),
    };
    const rootPreviewNode: Node = {
      ...previewNode,
      position: { x: 400, y: 200 },
      width: 96,
      height: 96,
    };
    mockNodes = [existingNode, rootPreviewNode];
    mockPreviewNodeReturn.mockReturnValue({
      previewNode: rootPreviewNode,
      previewNodeConnectionInfo: [
        {
          existingNodeId: 'existing-node-1',
          existingHandleId: 'output',
          existingNodeManifest: undefined,
          existingHandleManifest: undefined,
          addNewNodeAsSource: false,
          previewEdgeId: 'preview-edge-1',
        },
      ],
    });

    render(<AddNodeManager customPanel={LoopNodePanel} />);

    screen.getByTestId('select-loop').click();

    expect(mockNodes.find((node) => node.id === 'loop-1234567890')).toMatchObject({
      type: 'loop',
      position: { x: 168, y: 88 },
    });
  });

  it('aligns a larger node to the selected preview handle side when replacing a handle preview', () => {
    mockRegistry = {
      getManifest: vi.fn((nodeType: string) =>
        nodeType === 'loop'
          ? {
              nodeType: 'loop',
              display: { label: 'Loop', shape: 'container' },
              handleConfiguration: [],
            }
          : undefined
      ),
      getDefaultHandle: vi.fn(),
    };
    const rootPreviewNode: Node = {
      ...previewNode,
      position: { x: 400, y: 200 },
      width: 96,
      height: 96,
      data: {
        inputHandlePosition: Position.Left,
        outputHandlePosition: Position.Right,
      },
    };
    mockNodes = [existingNode, rootPreviewNode];
    mockPreviewNodeReturn.mockReturnValue({
      previewNode: rootPreviewNode,
      previewNodeConnectionInfo: [
        {
          existingNodeId: 'existing-node-1',
          existingHandleId: 'output',
          existingNodeManifest: undefined,
          existingHandleManifest: undefined,
          addNewNodeAsSource: false,
          previewEdgeId: 'preview-edge-1',
        },
      ],
    });

    render(<AddNodeManager customPanel={LoopNodePanel} />);

    screen.getByTestId('select-loop').click();

    expect(mockNodes.find((node) => node.id === 'existing-node-1')).toMatchObject({
      position: { x: 0, y: 0 },
    });
    expect(mockNodes.find((node) => node.id === 'loop-1234567890')).toMatchObject({
      type: 'loop',
      position: { x: 400, y: 88 },
    });
  });

  it('shifts downstream loop children when materializing an edge-toolbar insertion', () => {
    mockRegistry = {
      getManifest: vi.fn((nodeType: string) =>
        nodeType === 'loop'
          ? {
              nodeType: 'loop',
              display: { label: 'Loop', shape: 'container' },
              handleConfiguration: [],
            }
          : {
              nodeType,
              display: { label: 'Task', shape: 'square' },
              handleConfiguration: [],
            }
      ),
      getDefaultHandle: vi.fn(),
    };
    const containerNode: Node = {
      id: 'loop-1',
      type: 'loop',
      position: { x: 500, y: 100 },
      style: { width: 704, height: 368 },
      data: {},
    };
    const firstChildNode: Node = {
      id: 'first-child',
      type: 'task',
      parentId: 'loop-1',
      position: { x: 160, y: 96 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const secondChildNode: Node = {
      id: 'second-child',
      type: 'task',
      parentId: 'loop-1',
      position: { x: 432, y: 96 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const thirdChildNode: Node = {
      id: 'third-child',
      type: 'task',
      parentId: 'loop-1',
      position: { x: 528, y: 96 },
      measured: { width: 96, height: 96 },
      data: {},
    };
    const parentedPreviewNode: Node = {
      ...previewNode,
      position: { x: 296, y: 96 },
      parentId: 'loop-1',
      extent: 'parent',
      data: {
        placement: {
          containerId: 'loop-1',
          sourceNodeId: 'first-child',
          targetNodeId: 'second-child',
          mode: 'sequence',
        },
      },
    };
    const parentedConnections: PreviewNodeConnectionInfo[] = [
      {
        existingNodeId: 'first-child',
        existingHandleId: 'output',
        existingNodeManifest: undefined,
        existingHandleManifest: undefined,
        addNewNodeAsSource: false,
        previewEdgeId: PREVIEW_EDGE_ID,
      },
      {
        existingNodeId: 'second-child',
        existingHandleId: 'input',
        existingNodeManifest: undefined,
        existingHandleManifest: undefined,
        addNewNodeAsSource: true,
        previewEdgeId: 'first-second',
      },
    ];

    mockNodes = [
      containerNode,
      firstChildNode,
      secondChildNode,
      thirdChildNode,
      parentedPreviewNode,
    ];
    mockEdges = [
      {
        id: PREVIEW_EDGE_ID,
        source: 'first-child',
        sourceHandle: 'output',
        target: PREVIEW_NODE_ID,
        targetHandle: 'input',
      },
      {
        id: 'first-second',
        source: PREVIEW_NODE_ID,
        sourceHandle: 'output',
        target: 'second-child',
        targetHandle: 'input',
      },
      { id: 'second-third', source: 'second-child', target: 'third-child' },
      { id: 'third-loop', source: 'third-child', target: 'loop-1' },
    ];
    mockPreviewNodeReturn.mockReturnValue({
      previewNode: parentedPreviewNode,
      previewNodeConnectionInfo: parentedConnections,
    });

    render(<AddNodeManager customPanel={TestPanel} />);

    screen.getByTestId('select-node').click();

    expect(mockNodes.find((node) => node.id === 'test-node-1234567890')).toMatchObject({
      parentId: 'loop-1',
      extent: 'parent',
      position: { x: 304, y: 96 },
    });
    expect(mockNodes.find((node) => node.id === 'second-child')).toMatchObject({
      position: { x: 448, y: 96 },
    });
    expect(mockNodes.find((node) => node.id === 'third-child')).toMatchObject({
      position: { x: 544, y: 96 },
    });
  });
});
