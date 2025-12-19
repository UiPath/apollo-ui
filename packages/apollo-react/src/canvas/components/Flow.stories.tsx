import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Panel, useReactFlow } from "@uipath/uix/xyflow/react";
import type { Edge, Node, Position } from "@uipath/uix/xyflow/react";
import styled from "@emotion/styled";
import { BaseCanvas } from "./BaseCanvas";
import type { BaseNodeData } from "./BaseNode/BaseNode.types";
import { withCanvasProviders, useCanvasStory, createNode, NodePositions } from "../storybook-utils";
import { AddNodeManager, AddNodePanel } from "./AddNodePanel";
import { FloatingCanvasPanel } from "./FloatingCanvasPanel";
import type { ListItem } from "./Toolbox";
import { useCanvasEvent } from "../hooks";
import type { CanvasHandleActionEvent } from "../utils";
import { createPreviewNode, applyPreviewToReactFlow } from "../utils/createPreviewNode";
import { StickyNoteNode } from "./StickyNoteNode";
import type { StickyNoteData } from "./StickyNoteNode/StickyNoteNode.types";
import { Plus, StickyNote } from "lucide-react";

// ============================================================================
// Meta Configuration
// ============================================================================

interface FlowStoryArgs {
  useSmartHandles: boolean;
}

const meta: Meta<FlowStoryArgs> = {
  title: "Flow",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [withCanvasProviders()],
  argTypes: {
    useSmartHandles: {
      control: "boolean",
      description: "Enable SmartHandle for dynamic handle positioning based on connected node locations",
      table: {
        defaultValue: { summary: "false" },
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
      id: "trigger",
      type: "uipath.manual-trigger",
      position: NodePositions.row2col1,
      display: { label: "Manual trigger" },
      useSmartHandles,
    }),
    createNode({
      id: "action-1",
      type: "uipath.blank-node",
      position: NodePositions.row2col2,
      display: { label: "Action", subLabel: "Process data" },
      useSmartHandles,
    }),
  ];
}

function createInitialEdges(): Edge[] {
  return [{ id: "e-trigger-action-1", source: "trigger", target: "action-1", sourceHandle: "output", targetHandle: "input" }];
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

// ============================================================================
// Story Components
// ============================================================================

const DELETE_KEY_CODES = ["Backspace", "Delete"];

const additionalNodeTypes = {
  stickyNote: StickyNoteNode,
};

function DefaultStory({ useSmartHandles }: FlowStoryArgs) {
  const initialNodes = useMemo(() => createInitialNodes(useSmartHandles), [useSmartHandles]);
  const initialEdges = useMemo(() => createInitialEdges(), []);
  const [stickyNoteCounter, setStickyNoteCounter] = useState(0);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [addButtonRect, setAddButtonRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

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

      const newNodeId = `${nodeItem.data?.type || "node"}-${Date.now()}`;
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
        type: "stickyNote",
        position: {
          x: viewportCenter.x - 125, // Center the 250px wide sticky note
          y: viewportCenter.y - 75, // Center the 150px tall sticky note
        },
        data: {
          color: "blue",
          content: "",
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

  useCanvasEvent("handle:action", (event: CanvasHandleActionEvent) => {
    if (!reactFlowInstance) return;

    const { handleId, nodeId, position, handleType } = event;
    if (handleId && nodeId) {
      const sourceHandleType = handleType === "input" ? "target" : "source";
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
        ["stickyNote"] // Ignore sticky notes when calculating overlap
      );

      if (preview) {
        applyPreviewToReactFlow(preview, reactFlowInstance);
      }
    }
  });

  return (
    <BaseCanvas {...canvasProps} deleteKeyCode={DELETE_KEY_CODES} mode="design" selectionOnDrag onPaneClick={handlePaneClick}>
      <AddNodeManager />
      <Panel position="bottom-center">
        <ToolbarContainer className="nodrag nopan nowheel">
          <ToolbarButton type="button" ref={addButtonRef} onClick={handleOpenAddPanel} title="Add node">
            <Plus size={16} />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton type="button" onClick={handleAddStickyNote} title="Add note">
            <StickyNote size={16} />
          </ToolbarButton>
        </ToolbarContainer>
      </Panel>
      {addButtonRect && (
        <FloatingCanvasPanel open={isAddPanelOpen} anchorRect={addButtonRect} useFixedPosition placement="top" offset={10}>
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
// Performance Story - 500 Nodes
// ============================================================================

const GRID_COLS = 25;
const GRID_ROWS = 20;
const NODE_SPACING_X = 250;
const NODE_SPACING_Y = 150;

function createPerformanceNodes(useSmartHandles: boolean): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const index = row * GRID_COLS + col;
      nodes.push(
        createNode({
          id: `node-${index}`,
          type: "uipath.blank-node",
          position: {
            x: col * NODE_SPACING_X,
            y: row * NODE_SPACING_Y,
          },
          display: { label: `Node ${index + 1}`, subLabel: `Row ${row + 1}, Col ${col + 1}` },
          useSmartHandles,
        })
      );
    }
  }

  return nodes;
}

function createPerformanceEdges(): Edge[] {
  const edges: Edge[] = [];

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const index = row * GRID_COLS + col;

      // Connect to the node on the right (if exists)
      if (col < GRID_COLS - 1) {
        edges.push({
          id: `e-${index}-right`,
          source: `node-${index}`,
          target: `node-${index + 1}`,
          sourceHandle: "output",
          targetHandle: "input",
        });
      }

      // Connect to the node below (if exists)
      if (row < GRID_ROWS - 1) {
        edges.push({
          id: `e-${index}-down`,
          source: `node-${index}`,
          target: `node-${index + GRID_COLS}`,
          sourceHandle: "output",
          targetHandle: "input",
        });
      }
    }
  }

  return edges;
}

function PerformanceStory({ useSmartHandles }: FlowStoryArgs) {
  const initialNodes = useMemo(() => createPerformanceNodes(useSmartHandles), [useSmartHandles]);
  const initialEdges = useMemo(() => createPerformanceEdges(), []);

  const { canvasProps, setNodes } = useCanvasStory({
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

  return <BaseCanvas {...canvasProps} deleteKeyCode={DELETE_KEY_CODES} mode="design" selectionOnDrag />;
}

export const Performance: Story = {
  render: (args) => <PerformanceStory {...args} />,
  parameters: {
    docs: {
      description: {
        story: "Performance test with 500 nodes (25x20 grid) connected horizontally and vertically.",
      },
    },
  },
};
