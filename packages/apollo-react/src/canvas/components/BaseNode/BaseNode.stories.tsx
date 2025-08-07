import type { Meta, StoryObj } from "@storybook/react";
import { Panel, ReactFlowProvider } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { BaseNodeData } from "./BaseNode.types";
import { BaseCanvas } from "../BaseCanvas";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { ApIcon } from "@uipath/portal-shell-react";

const meta = {
  title: "Canvas/BaseNode",
  component: BaseNode,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story, context) => (
      <div style={{ width: "100vw", height: "100vh" }}>
        <ReactFlowProvider>
          <BaseCanvas
            nodes={[
              {
                id: "1",
                type: "activity",
                position: { x: 200, y: 200 },
                data: context.args as never as BaseNodeData,
              },
            ]}
            edges={[]}
            nodeTypes={{ activity: BaseNode }}
            mode="design"
          >
            <Panel position="bottom-right">
              <CanvasPositionControls />
            </Panel>
          </BaseCanvas>
        </ReactFlowProvider>
      </div>
    ),
  ],
  argTypes: {
    label: {
      control: "text",
      description: "Main label text for the activity",
      defaultValue: "Header",
    },
    subLabel: {
      control: "text",
      description: "Secondary label text providing additional context",
      defaultValue: "Secondary header",
    },
    icon: {
      control: false,
      description: "Icon element to display in the node (ReactNode or string)",
    },
    topLeftAdornment: {
      control: false,
      description: "Custom adornment for top-left corner",
    },
    topRightAdornment: {
      control: false,
      description: "Custom adornment for top-right corner",
    },
    bottomRightAdornment: {
      control: false,
      description: "Custom adornment for bottom-right corner",
    },
    bottomLeftAdornment: {
      control: false,
      description: "Custom adornment for bottom-left corner",
    },
  },
} satisfies Meta<BaseNodeData>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Header",
    subLabel: "Secondary header",
    topLeftAdornment: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="var(--color-background)" />
        <circle cx="12" cy="12" r="10" fill="red" />
      </svg>
    ),
    bottomRightAdornment: <ApIcon color="var(--color-foreground)" variant="outlined" name="shield" />,
    bottomLeftAdornment: <ApIcon color="var(--color-foreground)" name="bolt" />,
    icon: <ApIcon color="var(--color-foreground)" size="42px" variant="outlined" name="circle" />,
  },
};
