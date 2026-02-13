import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREVIEW_NODE_ID } from '../../constants';
import type { PreviewNodeConnectionInfo } from '../../hooks/usePreviewNode';
import { render, screen } from '../../utils/testing';
import type { ListItem } from '../Toolbox';
import { AddNodeManager } from './AddNodeManager';

// --- Shared mock state ---

let mockNodes: Node[] = [];
let mockEdges: Edge[] = [];

vi.mock('@uipath/apollo-react/canvas/xyflow/react', () => ({
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
  useOptionalNodeTypeRegistry: () => null,
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(1234567890);

    mockNodes = [existingNode, previewNode];
    mockEdges = [previewEdge];

    mockPreviewNodeReturn.mockReturnValue({
      previewNode,
      previewNodeConnectionInfo: connectionInfo,
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
});
