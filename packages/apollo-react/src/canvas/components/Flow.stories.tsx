import styled from '@emotion/styled';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Edge, Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Handle, Panel, Position, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { Download, Plus, StickyNote } from 'lucide-react';
import { type FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCanvasEvent, useExportCanvas } from '../hooks';
import {
  createNode,
  NodePositions,
  StoryInfoPanel,
  useCanvasStory,
  withCanvasProviders,
} from '../storybook-utils';
import type { CanvasHandleActionEvent } from '../utils';
import { applyPreviewToReactFlow, createPreviewNode } from '../utils/createPreviewNode';
import { AddNodeManager, AddNodePanel } from './AddNodePanel';
import { BaseCanvas } from './BaseCanvas';
import type { BaseNodeData } from './BaseNode/BaseNode.types';
import { FloatingCanvasPanel } from './FloatingCanvasPanel';
import { StickyNoteNode } from './StickyNoteNode';
import type { StickyNoteData } from './StickyNoteNode/StickyNoteNode.types';
import type { ListItem } from './Toolbox';

// ============================================================================
// Meta Configuration
// ============================================================================

interface FlowStoryArgs {
  useSmartHandles: boolean;
}

const meta: Meta<FlowStoryArgs> = {
  title: 'Flow',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withCanvasProviders()],
  argTypes: {
    useSmartHandles: {
      control: 'boolean',
      description:
        'Enable SmartHandle for dynamic handle positioning based on connected node locations',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
  },
  args: {
    useSmartHandles: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Shared Data
// ============================================================================

function createInitialNodes(useSmartHandles: boolean): Node<BaseNodeData>[] {
  return [
    createNode({
      id: 'trigger',
      type: 'uipath.manual-trigger',
      position: NodePositions.row2col1,
      display: { label: 'Manual trigger' },
      useSmartHandles,
    }),
    createNode({
      id: 'action-1',
      type: 'uipath.blank-node',
      position: NodePositions.row2col2,
      display: { label: 'Action', subLabel: 'Process data' },
      useSmartHandles,
    }),
  ];
}

function createInitialEdges(): Edge[] {
  return [
    {
      id: 'e-trigger-action-1',
      source: 'trigger',
      target: 'action-1',
      sourceHandle: 'output',
      targetHandle: 'input',
    },
  ];
}

// ============================================================================
// Styled Components for Bottom Toolbar
// ============================================================================

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  background: var(--uix-canvas-background);
  border: 1px solid var(--uix-canvas-border-de-emp);
  border-radius: 16px;
  padding: 4px;
  gap: 4px;
  height: 50px;
`;

const ToolbarButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 16px;
  transition: background-color 0.15s ease;
  color: var(--uix-canvas-foreground);

  &:hover {
    background: var(--uix-canvas-background-hover);
  }
`;

const ToolbarDivider = styled.div`
  width: 1px;
  height: 24px;
  background: var(--uix-canvas-border-de-emp);
`;

const ExportOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  color: white;
  gap: 12px;
`;

const ExportTitle = styled.div`
  font-size: 18px;
  font-weight: 500;
`;

const ExportMessage = styled.div`
  font-size: 14px;
  opacity: 0.8;
  text-align: center;
  max-width: 300px;
`;

// ============================================================================
// Story Components
// ============================================================================

const DELETE_KEY_CODES = ['Backspace', 'Delete'];

const additionalNodeTypes = {
  stickyNote: StickyNoteNode,
};

function DefaultStory({ useSmartHandles }: FlowStoryArgs) {
  const initialNodes = useMemo(() => createInitialNodes(useSmartHandles), [useSmartHandles]);
  const initialEdges = useMemo(() => createInitialEdges(), []);
  const [stickyNoteCounter, setStickyNoteCounter] = useState(0);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [addButtonRect, setAddButtonRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  // Export canvas hook
  const { isExporting, downloadAsImage } = useExportCanvas();

  const { canvasProps, setNodes } = useCanvasStory({
    initialNodes,
    initialEdges,
    additionalNodeTypes,
  });

  // Update nodes when useSmartHandles changes
  const handleSmartHandlesToggle = useCallback(() => {
    setNodes((nodes) =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          useSmartHandles,
        },
      }))
    );
  }, [setNodes, useSmartHandles]);

  // Keep nodes in sync with useSmartHandles prop
  useEffect(() => {
    handleSmartHandlesToggle();
  }, [handleSmartHandlesToggle]);

  const reactFlowInstance = useReactFlow();

  // Handle closing the add node panel
  const handleCloseAddPanel = useCallback(() => {
    setIsAddPanelOpen(false);
  }, []);

  // Close panel when clicking outside (on canvas pane)
  const handlePaneClick = useCallback(() => {
    if (isAddPanelOpen) {
      handleCloseAddPanel();
    }
  }, [isAddPanelOpen, handleCloseAddPanel]);

  // Handle opening the add node panel - get fresh rect each time
  const handleOpenAddPanel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      setAddButtonRect({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });
    }
    setIsAddPanelOpen(true);
  }, []);

  // Handle node selection from the add panel
  const handleNodeSelect = useCallback(
    (nodeItem: ListItem) => {
      // Calculate center of the current viewport
      const viewportCenter = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const newNodeId = `${nodeItem.data?.type || 'node'}-${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        type: nodeItem.data?.type,
        position: {
          x: viewportCenter.x - 75,
          y: viewportCenter.y - 25,
        },
        data: {
          label: nodeItem.name,
          subLabel: nodeItem.description,
          useSmartHandles,
        },
        selected: true,
      };

      setNodes((nodes) => [...nodes.map((n) => ({ ...n, selected: false })), newNode]);
      setIsAddPanelOpen(false);
    },
    [reactFlowInstance, setNodes, useSmartHandles]
  );

  // Handle adding a sticky note
  const handleAddStickyNote = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!reactFlowInstance) return;

      // Calculate center of the current viewport
      const viewportCenter = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const newStickyNote: Node<StickyNoteData> = {
        id: `sticky-note-${Date.now()}-${stickyNoteCounter}`,
        type: 'stickyNote',
        position: {
          x: viewportCenter.x - 125, // Center the 250px wide sticky note
          y: viewportCenter.y - 75, // Center the 150px tall sticky note
        },
        data: {
          color: 'blue',
          content: '',
          autoFocus: true,
        },
        width: 304,
        height: 288,
        selected: true,
      };

      setNodes((nodes) => [...nodes.map((n) => ({ ...n, selected: false })), newStickyNote]);
      setStickyNoteCounter((c) => c + 1);
    },
    [reactFlowInstance, setNodes, stickyNoteCounter]
  );

  // Handle export to PNG
  const handleExportToPng = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      downloadAsImage('flow-export');
    },
    [downloadAsImage]
  );

  useCanvasEvent('handle:action', (event: CanvasHandleActionEvent) => {
    if (!reactFlowInstance) return;

    const { handleId, nodeId, position, handleType } = event;
    if (handleId && nodeId) {
      const sourceHandleType = handleType === 'input' ? 'target' : 'source';
      // Inherit useSmartHandles from the source node
      const sourceNode = reactFlowInstance.getNode(nodeId);
      const customData = sourceNode?.data?.useSmartHandles ? { useSmartHandles: true } : undefined;

      const preview = createPreviewNode(
        nodeId,
        handleId,
        reactFlowInstance,
        undefined, // No drop position - use auto-placement
        customData,
        sourceHandleType,
        undefined, // Use default preview node size
        position as Position,
        ['stickyNote'] // Ignore sticky notes when calculating overlap
      );

      if (preview) {
        applyPreviewToReactFlow(preview, reactFlowInstance);
      }
    }
  });

  return (
    <BaseCanvas
      {...canvasProps}
      deleteKeyCode={DELETE_KEY_CODES}
      mode="design"
      selectionOnDrag
      onPaneClick={handlePaneClick}
    >
      <AddNodeManager />
      <Panel position="bottom-center">
        <ToolbarContainer className="nodrag nopan nowheel">
          <ToolbarButton
            type="button"
            ref={addButtonRef}
            onClick={handleOpenAddPanel}
            title="Add node"
          >
            <Plus size={16} />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton type="button" onClick={handleAddStickyNote} title="Add note">
            <StickyNote size={16} />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton
            type="button"
            onClick={handleExportToPng}
            disabled={isExporting}
            title="Export to PNG"
          >
            <Download size={16} />
          </ToolbarButton>
        </ToolbarContainer>
      </Panel>
      {addButtonRect && (
        <FloatingCanvasPanel
          open={isAddPanelOpen}
          anchorRect={addButtonRect}
          useFixedPosition
          placement="top"
          offset={10}
        >
          <AddNodePanel onNodeSelect={handleNodeSelect} onClose={handleCloseAddPanel} />
        </FloatingCanvasPanel>
      )}
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const Default: Story = {
  render: (args) => <DefaultStory {...args} />,
};

// ============================================================================
// Performance Story - Dynamic Node Count
// ============================================================================

const NODE_SPACING_X = 250;
const NODE_SPACING_Y = 150;

function calculateGridDimensions(nodeCount: number): { cols: number; rows: number } {
  // Calculate grid dimensions to be roughly square
  const cols = Math.ceil(Math.sqrt(nodeCount));
  const rows = Math.ceil(nodeCount / cols);
  return { cols, rows };
}

function createPerformanceNodes(nodeCount: number, useSmartHandles: boolean): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];
  const { cols } = calculateGridDimensions(nodeCount);

  for (let i = 0; i < nodeCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    nodes.push(
      createNode({
        id: `node-${i}`,
        type: 'uipath.blank-node',
        position: {
          x: col * NODE_SPACING_X,
          y: row * NODE_SPACING_Y,
        },
        display: { label: `Node ${i + 1}`, subLabel: `Row ${row + 1}, Col ${col + 1}` },
        useSmartHandles,
      })
    );
  }

  return nodes;
}

function createPerformanceEdges(nodeCount: number): Edge[] {
  const edges: Edge[] = [];
  const { cols, rows } = calculateGridDimensions(nodeCount);

  for (let i = 0; i < nodeCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    // Connect to the node on the right (if exists and within nodeCount)
    const rightIndex = i + 1;
    if (col < cols - 1 && rightIndex < nodeCount) {
      edges.push({
        id: `e-${i}-right`,
        source: `node-${i}`,
        target: `node-${rightIndex}`,
        sourceHandle: 'output',
        targetHandle: 'input',
      });
    }

    // Connect to the node below (if exists and within nodeCount)
    const downIndex = i + cols;
    if (row < rows - 1 && downIndex < nodeCount) {
      edges.push({
        id: `e-${i}-down`,
        source: `node-${i}`,
        target: `node-${downIndex}`,
        sourceHandle: 'output',
        targetHandle: 'input',
      });
    }
  }

  return edges;
}

const DEFAULT_NODE_COUNT = 500;
const MIN_NODE_COUNT = 1;
const MAX_NODE_COUNT = 1000;

function PerformanceStory({ useSmartHandles }: FlowStoryArgs) {
  const [nodeCount, setNodeCount] = useState(DEFAULT_NODE_COUNT);
  const initialNodes = useMemo(
    () => createPerformanceNodes(DEFAULT_NODE_COUNT, useSmartHandles),
    [useSmartHandles]
  );
  const initialEdges = useMemo(() => createPerformanceEdges(DEFAULT_NODE_COUNT), []);

  // Export canvas hook
  const { isExporting, downloadAsImage } = useExportCanvas();

  const { canvasProps, setNodes, setEdges } = useCanvasStory({
    initialNodes,
    initialEdges,
  });

  // Update nodes when useSmartHandles changes
  const handleSmartHandlesToggle = useCallback(() => {
    setNodes((nodes) =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          useSmartHandles,
        },
      }))
    );
  }, [setNodes, useSmartHandles]);

  // Keep nodes in sync with useSmartHandles prop
  useEffect(() => {
    handleSmartHandlesToggle();
  }, [handleSmartHandlesToggle]);

  // Handle node count change
  const handleNodeCountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newCount = parseInt(e.target.value, 10);
      setNodeCount(newCount);
      setNodes(createPerformanceNodes(newCount, useSmartHandles));
      setEdges(createPerformanceEdges(newCount));
    },
    [setNodes, setEdges, useSmartHandles]
  );

  // Handle export to PNG
  const handleExportToPng = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      downloadAsImage('performance-flow-export');
    },
    [downloadAsImage]
  );

  return (
    <>
      {isExporting && (
        <ExportOverlay role="status" aria-live="polite">
          <ExportTitle>Exporting Canvas</ExportTitle>
          <ExportMessage>
            Processing {nodeCount} nodes. The screen may freeze briefly - this is normal.
          </ExportMessage>
        </ExportOverlay>
      )}
      <BaseCanvas {...canvasProps} deleteKeyCode={DELETE_KEY_CODES} mode="design" selectionOnDrag>
        <StoryInfoPanel
          title="Performance Test"
          description="Adjust the number of nodes to test canvas performance"
        >
          <div className="nodrag nopan nowheel" style={{ marginTop: 12 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12 }}>Node Count</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{nodeCount}</span>
            </div>
            <input
              type="range"
              min={MIN_NODE_COUNT}
              max={MAX_NODE_COUNT}
              value={nodeCount}
              onChange={handleNodeCountChange}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        </StoryInfoPanel>
        <Panel position="bottom-center">
          <ToolbarContainer className="nodrag nopan nowheel">
            <ToolbarButton
              type="button"
              onClick={handleExportToPng}
              disabled={isExporting}
              title="Export to PNG"
            >
              <Download size={16} />
            </ToolbarButton>
          </ToolbarContainer>
        </Panel>
      </BaseCanvas>
    </>
  );
}

export const Performance: Story = {
  render: (args) => <PerformanceStory {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          'Performance test with adjustable node count (1-1000). Nodes are arranged in a grid and connected horizontally and vertically.',
      },
    },
  },
};

// ============================================================================
// Performance Baseline Story - Simplified Node
// ============================================================================

interface SimpleNodeData extends Record<string, unknown> {
  label: string;
  subLabel?: string;
}

/**
 * Minimal node component for performance baseline comparison.
 * No hooks, no context, no complex styling - just basic rendering.
 */
const SimpleNodeComponent: FC<NodeProps<Node<SimpleNodeData>>> = ({ data, selected }) => {
  return (
    <div
      style={{
        width: 96,
        height: 96,
        background: selected ? '#e3f2fd' : '#fff',
        border: `2px solid ${selected ? '#2196f3' : '#ddd'}`,
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontFamily: 'sans-serif',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ fontWeight: 600, textAlign: 'center', padding: '0 4px' }}>{data.label}</div>
      {data.subLabel && (
        <div style={{ color: '#666', fontSize: 9, textAlign: 'center' }}>{data.subLabel}</div>
      )}
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  );
};

const SimpleNode = memo(SimpleNodeComponent);

const simpleNodeTypes = {
  simpleNode: SimpleNode,
};

function createSimpleNodes(nodeCount: number): Node<SimpleNodeData>[] {
  const nodes: Node<SimpleNodeData>[] = [];
  const { cols } = calculateGridDimensions(nodeCount);

  for (let i = 0; i < nodeCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    nodes.push({
      id: `node-${i}`,
      type: 'simpleNode',
      position: {
        x: col * NODE_SPACING_X,
        y: row * NODE_SPACING_Y,
      },
      data: {
        label: `Node ${i + 1}`,
        subLabel: `R${row + 1}, C${col + 1}`,
      },
    });
  }

  return nodes;
}

function createSimpleEdges(nodeCount: number): Edge[] {
  const edges: Edge[] = [];
  const { cols, rows } = calculateGridDimensions(nodeCount);

  for (let i = 0; i < nodeCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    // Connect to the node on the right
    const rightIndex = i + 1;
    if (col < cols - 1 && rightIndex < nodeCount) {
      edges.push({
        id: `e-${i}-right`,
        source: `node-${i}`,
        target: `node-${rightIndex}`,
      });
    }

    // Connect to the node below
    const downIndex = i + cols;
    if (row < rows - 1 && downIndex < nodeCount) {
      edges.push({
        id: `e-${i}-down`,
        source: `node-${i}`,
        target: `node-${downIndex}`,
      });
    }
  }

  return edges;
}

function PerformanceBaselineStory() {
  const [nodeCount, setNodeCount] = useState(DEFAULT_NODE_COUNT);
  const initialNodes = useMemo(() => createSimpleNodes(DEFAULT_NODE_COUNT), []);
  const initialEdges = useMemo(() => createSimpleEdges(DEFAULT_NODE_COUNT), []);

  const { canvasProps, setNodes, setEdges } = useCanvasStory({
    initialNodes,
    initialEdges,
    additionalNodeTypes: simpleNodeTypes,
  });

  const handleNodeCountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newCount = parseInt(e.target.value, 10);
      setNodeCount(newCount);
      setNodes(createSimpleNodes(newCount));
      setEdges(createSimpleEdges(newCount));
    },
    [setNodes, setEdges]
  );

  return (
    <BaseCanvas {...canvasProps} deleteKeyCode={DELETE_KEY_CODES} mode="design" selectionOnDrag>
      <StoryInfoPanel
        title="Performance Baseline"
        description="Simplified nodes for performance comparison. No hooks, no context, minimal rendering."
      >
        <div className="nodrag nopan nowheel" style={{ marginTop: 12 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 12 }}>Node Count</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{nodeCount}</span>
          </div>
          <input
            type="range"
            min={MIN_NODE_COUNT}
            max={MAX_NODE_COUNT}
            value={nodeCount}
            onChange={handleNodeCountChange}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>
      </StoryInfoPanel>
    </BaseCanvas>
  );
}

export const PerformanceBaseline: Story = {
  render: () => <PerformanceBaselineStory />,
  parameters: {
    docs: {
      description: {
        story:
          'Performance baseline with simplified nodes. Compare panning performance with the regular Performance story to measure BaseNode overhead.',
      },
    },
  },
};
