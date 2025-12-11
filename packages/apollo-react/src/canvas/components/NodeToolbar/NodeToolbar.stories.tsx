import type { Meta, StoryObj } from "@storybook/react";
import { useMemo } from "react";
import type { Node } from "@uipath/uix/xyflow/react";
import { Panel, ReactFlowProvider } from "@uipath/uix/xyflow/react";
import { ApIcon } from "@uipath/portal-shell-react";
import { BaseCanvas } from "../BaseCanvas";
import { CanvasPositionControls } from "../CanvasPositionControls";
import type { NodeRegistration, BaseNodeData, NodeShape } from "../BaseNode/BaseNode.types";
import { ExecutionStatusContext } from "../BaseNode/ExecutionStatusContext";
import { NodeRegistryProvider } from "../BaseNode/NodeRegistryProvider";
import { ExecutionStatusIcon } from "../ExecutionStatusIcon";
import { useCanvasStory, StoryInfoPanel } from "../../storybook-utils";
import { DefaultCanvasTranslations } from "../../types";

// ============================================================================
// Node Registration
// ============================================================================

const toolbarNodeRegistration: NodeRegistration = {
  nodeType: "toolbarDemo",
  category: "demo",
  displayName: "Toolbar Demo Node",
  description: "Node demonstrating toolbar functionality",
  icon: "settings",
  definition: {
    getIcon: () => <ApIcon name="home" variant="outlined" size="40px" />,
    getDisplay: (data) => ({
      label: data.display?.label || "Toolbar Demo",
      subLabel: data.display?.subLabel || "Hover to see toolbar",
      shape: data.display?.shape || "rectangle",
    }),
    getAdornments: (_data, context) => {
      const state = context.executionState;
      const status = typeof state === "string" ? state : state?.status;
      return { topRight: <ExecutionStatusIcon status={status} /> };
    },
    getToolbar: (data) => ({
      actions: [
        { id: "add", icon: "add", label: "Add", onAction: (nodeId) => console.log(`Add: ${nodeId}`) },
        { id: "edit", icon: "mode_edit", label: "Edit", onAction: (nodeId) => console.log(`Edit: ${nodeId}`) },
        { id: "delete", icon: "delete", label: "Delete", onAction: (nodeId) => console.log(`Delete: ${nodeId}`) },
      ],
      overflowActions: [
        { id: "duplicate", icon: "content_copy", label: "Duplicate", onAction: (nodeId) => console.log(`Duplicate: ${nodeId}`) },
        { id: "settings", icon: "settings", label: "Settings", onAction: (nodeId) => console.log(`Settings: ${nodeId}`) },
      ],
      overflowLabel: "More options",
      position: (data?.parameters?.toolbarPosition as "top" | "bottom" | "left" | "right") || "top",
      align: (data?.parameters?.toolbarAlign as "start" | "center" | "end") || "end",
    }),
  },
};

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta = {
  title: "Canvas/NodeToolbar",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => {
      const registrations = useMemo(() => [toolbarNodeRegistration], []);
      const executions = useMemo(() => ({ getExecutionState: () => undefined }), []);

      return (
        <NodeRegistryProvider registrations={registrations}>
          <ExecutionStatusContext.Provider value={executions}>
            <ReactFlowProvider>
              <div style={{ height: "100vh", width: "100vw" }}>
                <Story />
              </div>
            </ReactFlowProvider>
          </ExecutionStatusContext.Provider>
        </NodeRegistryProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Helper Functions
// ============================================================================

const SHAPES: NodeShape[] = ["rectangle", "square", "circle"];
const ALIGNS = ["start", "center", "end"] as const;

function createToolbarNodes(): Node<BaseNodeData>[] {
  const nodes: Node<BaseNodeData>[] = [];

  SHAPES.forEach((shape, rowIndex) => {
    ALIGNS.forEach((align, colIndex) => {
      nodes.push({
        id: `${shape}-${align}`,
        type: "toolbarDemo",
        position: { x: 96 + colIndex * 300, y: 192 + rowIndex * 200 },
        data: {
          parameters: { toolbarAlign: align, toolbarPosition: "top" },
          display: {
            label: shape.charAt(0).toUpperCase() + shape.slice(1),
            subLabel: `align: ${align}`,
            shape,
          },
        },
      });
    });
  });

  return nodes;
}

// ============================================================================
// Story Components
// ============================================================================

function DefaultStory() {
  const initialNodes = useMemo(() => createToolbarNodes(), []);
  const { canvasProps } = useCanvasStory({ initialNodes });

  return (
    <BaseCanvas {...canvasProps} mode="design">
      <StoryInfoPanel title="Node Toolbar" description="Hover over nodes to see toolbar actions" />
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
