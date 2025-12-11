import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Node, Edge, EdgeTypes, OnEdgesChange, OnConnect, Connection } from "@uipath/uix/xyflow/react";
import { Panel, Position } from "@uipath/uix/xyflow/react";
import { ApTypography, ApIcon } from "@uipath/portal-shell-react";
import { FontVariantToken } from "@uipath/apollo-core";
import { useMemo, useCallback } from "react";
import { Column } from "@uipath/uix/core";
import { BaseCanvas } from "../BaseCanvas/BaseCanvas";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { SequenceEdge } from "../Edges/SequenceEdge";
import { withCanvasProviders, useCanvasStory, StoryInfoPanel } from "../../storybook-utils";
import { SmartHandle, SmartSourceHandle, SmartTargetHandle, SmartHandleProvider } from "./SmartHandle";
import { DefaultCanvasTranslations } from "../../types";

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof SmartHandle> = {
  title: "Canvas/SmartHandle",
  component: SmartHandle,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Custom Node Components
// ============================================================================

function SmartNode({ data, selected }: { id: string; data: { label: string }; selected: boolean }) {
  return (
    <div
      style={{
        width: 160,
        height: 60,
        borderRadius: 8,
        backgroundColor: "var(--uix-canvas-background)",
        border: selected ? "2px solid var(--uix-canvas-selection-indicator)" : "1px solid var(--uix-canvas-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <ApTypography variant={FontVariantToken.fontSizeSBold} color="var(--uix-canvas-foreground)">
        {data.label}
      </ApTypography>
      <SmartTargetHandle id="input" />
      <SmartSourceHandle id="output" />
    </div>
  );
}

const HUB_NODE_SIZE = 100;

function HubNode({ data, selected }: { id: string; data: { label: string }; selected: boolean }) {
  return (
    <SmartHandleProvider nodeWidth={HUB_NODE_SIZE} nodeHeight={HUB_NODE_SIZE}>
      <div
        style={{
          width: HUB_NODE_SIZE,
          height: HUB_NODE_SIZE,
          borderRadius: "50%",
          backgroundColor: "var(--uix-canvas-background)",
          border: selected ? "2px solid var(--uix-canvas-selection-indicator)" : "2px solid var(--uix-canvas-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Column align="center" gap={4}>
          <ApIcon name="hub" size="24px" color="var(--uix-canvas-foreground-de-emp)" />
          <ApTypography variant={FontVariantToken.fontSizeXsBold} color="var(--uix-canvas-foreground)">
            {data.label}
          </ApTypography>
        </Column>
        {/* Multiple smart handles for hub connections - with node dimensions for grid alignment */}
        <SmartHandle
          type="target"
          id="in-1"
          defaultPosition={Position.Left}
          handleType="input"
          nodeWidth={HUB_NODE_SIZE}
          nodeHeight={HUB_NODE_SIZE}
        />
        <SmartHandle
          type="target"
          id="in-2"
          defaultPosition={Position.Left}
          handleType="input"
          nodeWidth={HUB_NODE_SIZE}
          nodeHeight={HUB_NODE_SIZE}
        />
        <SmartHandle
          type="target"
          id="in-3"
          defaultPosition={Position.Left}
          handleType="input"
          nodeWidth={HUB_NODE_SIZE}
          nodeHeight={HUB_NODE_SIZE}
        />
        <SmartHandle
          type="source"
          id="out-1"
          defaultPosition={Position.Right}
          handleType="output"
          nodeWidth={HUB_NODE_SIZE}
          nodeHeight={HUB_NODE_SIZE}
        />
        <SmartHandle
          type="source"
          id="out-2"
          defaultPosition={Position.Right}
          handleType="output"
          nodeWidth={HUB_NODE_SIZE}
          nodeHeight={HUB_NODE_SIZE}
        />
      </div>
    </SmartHandleProvider>
  );
}

// ============================================================================
// Story Component
// ============================================================================

const edgeTypes: EdgeTypes = {
  sequence: SequenceEdge,
};

function DefaultStory() {
  const nodeTypes = useMemo(() => ({ smartNode: SmartNode, hubNode: HubNode }), []);

  const initialNodes: Node[] = [
    // Simple two-node test
    { id: "node-a", type: "smartNode", position: { x: 100, y: 200 }, data: { label: "Node A" } },
    { id: "node-b", type: "smartNode", position: { x: 400, y: 200 }, data: { label: "Node B" } },
    // Vertical test
    { id: "node-c", type: "smartNode", position: { x: 250, y: 50 }, data: { label: "Node C" } },
    { id: "node-d", type: "smartNode", position: { x: 250, y: 350 }, data: { label: "Node D" } },
  ];

  const initialEdges: Edge[] = [
    // Horizontal: A → B (A's source should be RIGHT, B's target should be LEFT)
    { id: "e1", type: "sequence", source: "node-a", sourceHandle: "output", target: "node-b", targetHandle: "input" },
    // Vertical: C → D (C's source should be BOTTOM, D's target should be TOP)
    { id: "e2", type: "sequence", source: "node-c", sourceHandle: "output", target: "node-d", targetHandle: "input" },
  ];

  const { canvasProps, setEdges } = useCanvasStory({ initialNodes, initialEdges });

  // Handle edge deletion
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      canvasProps.onEdgesChange?.(changes);
    },
    [canvasProps]
  );

  // Handle new connections
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        id: `e-${Date.now()}`,
        type: "sequence",
        source: connection.source!,
        sourceHandle: connection.sourceHandle,
        target: connection.target!,
        targetHandle: connection.targetHandle,
      };
      setEdges((edges) => [...edges, newEdge]);
    },
    [setEdges]
  );

  return (
    <BaseCanvas
      {...canvasProps}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      deleteKeyCode="Backspace"
      mode="design"
    >
      <StoryInfoPanel title="SmartHandle" collapsible defaultCollapsed={false}>
        <Column gap={8} style={{ marginTop: 8 }}>
          <ApTypography variant={FontVariantToken.fontSizeS} color="var(--uix-canvas-foreground-de-emp)">
            • <strong>Drag nodes</strong> to see handles reposition
          </ApTypography>
          <ApTypography variant={FontVariantToken.fontSizeS} color="var(--uix-canvas-foreground-de-emp)">
            • <strong>Select edge + Backspace</strong> to delete
          </ApTypography>
          <ApTypography variant={FontVariantToken.fontSizeS} color="var(--uix-canvas-foreground-de-emp)">
            • <strong>Drag from handle</strong> to create new connection
          </ApTypography>
          <ApTypography variant={FontVariantToken.fontSizeS} color="var(--uix-canvas-foreground-de-emp)">
            • Handles return to default position when disconnected
          </ApTypography>
        </Column>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} showOrganize={false} />
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Multi-Handle Story Component
// ============================================================================

const MULTI_NODE_WIDTH = 200;
const MULTI_NODE_HEIGHT = 80;

function MultiHandleNode({ data, selected }: { id: string; data: { label: string }; selected: boolean }) {
  return (
    <SmartHandleProvider>
      <div
        style={{
          width: MULTI_NODE_WIDTH,
          height: MULTI_NODE_HEIGHT,
          borderRadius: 8,
          backgroundColor: "var(--uix-canvas-background)",
          border: selected ? "2px solid var(--uix-canvas-selection-indicator)" : "1px solid var(--uix-canvas-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <ApTypography variant={FontVariantToken.fontSizeSBold} color="var(--uix-canvas-foreground)">
          {data.label}
        </ApTypography>
        {/* Multiple handles that will auto-space when on same side */}
        <SmartHandle
          type="target"
          id="in-1"
          defaultPosition={Position.Left}
          handleType="input"
          nodeWidth={MULTI_NODE_WIDTH}
          nodeHeight={MULTI_NODE_HEIGHT}
        />
        <SmartHandle
          type="target"
          id="in-2"
          defaultPosition={Position.Left}
          handleType="input"
          nodeWidth={MULTI_NODE_WIDTH}
          nodeHeight={MULTI_NODE_HEIGHT}
        />
        <SmartHandle
          type="target"
          id="in-3"
          defaultPosition={Position.Left}
          handleType="input"
          nodeWidth={MULTI_NODE_WIDTH}
          nodeHeight={MULTI_NODE_HEIGHT}
        />
        <SmartHandle
          type="source"
          id="out-1"
          defaultPosition={Position.Right}
          handleType="output"
          nodeWidth={MULTI_NODE_WIDTH}
          nodeHeight={MULTI_NODE_HEIGHT}
        />
        <SmartHandle
          type="source"
          id="out-2"
          defaultPosition={Position.Right}
          handleType="output"
          nodeWidth={MULTI_NODE_WIDTH}
          nodeHeight={MULTI_NODE_HEIGHT}
        />
      </div>
    </SmartHandleProvider>
  );
}

function MultiHandleStory() {
  const nodeTypes = useMemo(() => ({ multiHandleNode: MultiHandleNode }), []);

  const initialNodes: Node[] = [
    // Center node with multiple inputs/outputs
    { id: "center", type: "multiHandleNode", position: { x: 300, y: 200 }, data: { label: "Center Node" } },
    // Input nodes (left side)
    { id: "input-1", type: "multiHandleNode", position: { x: 50, y: 50 }, data: { label: "Input 1" } },
    { id: "input-2", type: "multiHandleNode", position: { x: 50, y: 200 }, data: { label: "Input 2" } },
    { id: "input-3", type: "multiHandleNode", position: { x: 50, y: 350 }, data: { label: "Input 3" } },
    // Output nodes (right side)
    { id: "output-1", type: "multiHandleNode", position: { x: 550, y: 100 }, data: { label: "Output 1" } },
    { id: "output-2", type: "multiHandleNode", position: { x: 550, y: 300 }, data: { label: "Output 2" } },
  ];

  const initialEdges: Edge[] = [
    // Connect inputs to center node's target handles
    { id: "e1", type: "sequence", source: "input-1", sourceHandle: "out-1", target: "center", targetHandle: "in-1" },
    { id: "e2", type: "sequence", source: "input-2", sourceHandle: "out-1", target: "center", targetHandle: "in-2" },
    { id: "e3", type: "sequence", source: "input-3", sourceHandle: "out-1", target: "center", targetHandle: "in-3" },
    // Connect center node's source handles to outputs
    { id: "e4", type: "sequence", source: "center", sourceHandle: "out-1", target: "output-1", targetHandle: "in-1" },
    { id: "e5", type: "sequence", source: "center", sourceHandle: "out-2", target: "output-2", targetHandle: "in-1" },
  ];

  const { canvasProps, setEdges } = useCanvasStory({ initialNodes, initialEdges });

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      canvasProps.onEdgesChange?.(changes);
    },
    [canvasProps]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        id: `e-${Date.now()}`,
        type: "sequence",
        source: connection.source!,
        sourceHandle: connection.sourceHandle,
        target: connection.target!,
        targetHandle: connection.targetHandle,
      };
      setEdges((edges) => [...edges, newEdge]);
    },
    [setEdges]
  );

  return (
    <BaseCanvas
      {...canvasProps}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      deleteKeyCode="Backspace"
      mode="design"
    >
      <StoryInfoPanel title="Multi-Handle SmartHandle" collapsible defaultCollapsed={false}>
        <Column gap={8} style={{ marginTop: 8 }}>
          <ApTypography variant={FontVariantToken.fontSizeS} color="var(--uix-canvas-foreground-de-emp)">
            • Multiple handles on same side <strong>auto-space</strong> with grid alignment
          </ApTypography>
          <ApTypography variant={FontVariantToken.fontSizeS} color="var(--uix-canvas-foreground-de-emp)">
            • <strong>Drag nodes</strong> to see handles reposition dynamically
          </ApTypography>
          <ApTypography variant={FontVariantToken.fontSizeS} color="var(--uix-canvas-foreground-de-emp)">
            • Center node has 3 inputs + 2 outputs
          </ApTypography>
        </Column>
      </StoryInfoPanel>
      <Panel position="bottom-right">
        <CanvasPositionControls translations={DefaultCanvasTranslations} showOrganize={false} />
      </Panel>
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const Default: Story = {
  name: "Default",
  render: () => <DefaultStory />,
};

export const MultiHandle: Story = {
  name: "Multi-Handle Grid Spacing",
  render: () => <MultiHandleStory />,
};
