import type { Meta, StoryObj } from "@storybook/react";
import { HierarchicalCanvas } from "./HierarchicalCanvas";
import { HierarchicalCanvasWithControls } from "./HierarchicalCanvasWithControls";

const meta: Meta<typeof HierarchicalCanvas> = {
  title: "Canvas/HierarchicalCanvas",
  component: HierarchicalCanvas,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
## Hierarchical Canvas

A canvas component that supports hierarchical navigation through nested workflows.

### Features
- **Hierarchical Navigation**: Drill into sub-processes to view nested workflows
- **Breadcrumb Navigation**: Navigate back through hierarchy levels
- **Node Management**: Add, connect, and organize workflow nodes
- **Three Modes**: Design, View, and Readonly modes
- **Optimized Performance**: Debounced viewport updates prevent infinite loops

### Usage
The component integrates with the Zustand canvas store for state management.
Use the Interactive story to test adding nodes and drilling into sub-processes.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <HierarchicalCanvasWithControls />,
  parameters: {
    docs: {
      description: {
        story:
          "Interactive canvas with controls for testing. NodeRegistryProvider and ReactFlowProvider are included in the wrapper component.",
      },
    },
  },
};
