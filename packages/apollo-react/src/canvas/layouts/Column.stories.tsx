import type { Meta, StoryFn } from "@storybook/react-vite";
import { Column } from "./Column";
import { Row } from "./Row";

export default {
  title: "Common/Layouts/Column",
  component: Column,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    gap: {
      control: { type: "number" },
      description: "Gap between items",
    },
    align: {
      control: { type: "select" },
      options: ["baseline", "center", "end", "start", "stretch"],
      description: "Alignment of items along cross axis (horizontal for column)",
    },
    justify: {
      control: { type: "select" },
      options: ["around", "between", "center", "end", "evenly", "start"],
      description: "Justification of items along main axis (vertical for column)",
    },
    wrap: {
      control: { type: "select" },
      options: ["nowrap", "wrap", "wrap-reverse"],
      description: "Flex wrap behavior",
    },
    p: {
      control: { type: "number" },
      description: "Padding (all sides)",
    },
    m: {
      control: { type: "number" },
      description: "Margin (all sides)",
    },
  },
} as Meta<typeof Column>;

const Box = ({
  children,
  color = "#e3f2fd",
  width,
}: {
  children: React.ReactNode;
  color?: string;
  width?: string;
}) => (
  <div
    style={{
      backgroundColor: color,
      padding: "16px",
      borderRadius: "4px",
      textAlign: "center",
      width: width || "auto",
    }}
  >
    {children}
  </div>
);

export const Default: StoryFn<typeof Column> = (args) => (
  <Column {...args}>
    <Box>Item 1</Box>
    <Box>Item 2</Box>
    <Box>Item 3</Box>
  </Column>
);
Default.args = {
  gap: 16,
};

export const Alignment: StoryFn = () => (
  <Row gap={32}>
    <div>
      <h3>align="start"</h3>
      <Column gap={16} align="start" style={{ width: "200px", backgroundColor: "#f5f5f5", padding: "8px" }}>
        <Box width="100px">Short</Box>
        <Box width="150px">Medium Width</Box>
        <Box width="80px">Narrow</Box>
      </Column>
    </div>
    <div>
      <h3>align="center"</h3>
      <Column gap={16} align="center" style={{ width: "200px", backgroundColor: "#f5f5f5", padding: "8px" }}>
        <Box width="100px">Short</Box>
        <Box width="150px">Medium Width</Box>
        <Box width="80px">Narrow</Box>
      </Column>
    </div>
    <div>
      <h3>align="end"</h3>
      <Column gap={16} align="end" style={{ width: "200px", backgroundColor: "#f5f5f5", padding: "8px" }}>
        <Box width="100px">Short</Box>
        <Box width="150px">Medium Width</Box>
        <Box width="80px">Narrow</Box>
      </Column>
    </div>
    <div>
      <h3>align="stretch"</h3>
      <Column gap={16} align="stretch" style={{ width: "200px", backgroundColor: "#f5f5f5", padding: "8px" }}>
        <Box>Stretched</Box>
        <Box>Stretched</Box>
        <Box>Stretched</Box>
      </Column>
    </div>
  </Row>
);

export const Justification: StoryFn = () => (
  <Row gap={32} wrap="wrap">
    <div>
      <h3>justify="start" (default)</h3>
      <Column
        gap={16}
        justify="start"
        style={{ height: "300px", backgroundColor: "#f5f5f5", padding: "8px" }}
      >
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Column>
    </div>
    <div>
      <h3>justify="center"</h3>
      <Column
        gap={16}
        justify="center"
        style={{ height: "300px", backgroundColor: "#f5f5f5", padding: "8px" }}
      >
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Column>
    </div>
    <div>
      <h3>justify="end"</h3>
      <Column gap={16} justify="end" style={{ height: "300px", backgroundColor: "#f5f5f5", padding: "8px" }}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Column>
    </div>
    <div>
      <h3>justify="between"</h3>
      <Column justify="between" style={{ height: "300px", backgroundColor: "#f5f5f5", padding: "8px" }}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Column>
    </div>
    <div>
      <h3>justify="around"</h3>
      <Column justify="around" style={{ height: "300px", backgroundColor: "#f5f5f5", padding: "8px" }}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Column>
    </div>
    <div>
      <h3>justify="evenly"</h3>
      <Column justify="evenly" style={{ height: "300px", backgroundColor: "#f5f5f5", padding: "8px" }}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Column>
    </div>
  </Row>
);

export const Spacing: StoryFn = () => (
  <Row gap={32}>
    <div>
      <h3>With padding</h3>
      <Column gap={16} p={24} style={{ backgroundColor: "#f5f5f5" }}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Column>
    </div>
    <div>
      <h3>With margin</h3>
      <div style={{ backgroundColor: "#ffebee", padding: "4px" }}>
        <Column gap={16} m={24} p={16} style={{ backgroundColor: "#f5f5f5" }}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Column>
      </div>
    </div>
    <div>
      <h3>With asymmetric padding</h3>
      <Column gap={16} pt={8} pb={32} px={24} style={{ backgroundColor: "#f5f5f5" }}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Column>
    </div>
  </Row>
);

export const FlexProperties: StoryFn = () => (
  <div>
    <h3>Using flex property on Column</h3>
    <Row gap={16} style={{ height: "400px", backgroundColor: "#f5f5f5", padding: "8px" }}>
      <Column flex={1} gap={8} p={16} style={{ backgroundColor: "#e3f2fd" }}>
        <Box color="#bbdefb">Flex 1</Box>
        <Box color="#90caf9">Content</Box>
      </Column>
      <Column flex={2} gap={8} p={16} style={{ backgroundColor: "#c5cae9" }}>
        <Box color="#9fa8da">Flex 2</Box>
        <Box color="#7986cb">More Content</Box>
      </Column>
    </Row>
  </div>
);

export const SizeConstraints: StoryFn = () => (
  <Row gap={32}>
    <div>
      <h3>Fixed dimensions</h3>
      <Column
        w={200}
        h={200}
        gap={16}
        p={16}
        align="center"
        justify="center"
        style={{ backgroundColor: "#f5f5f5" }}
      >
        <Box>200x200</Box>
      </Column>
    </div>
    <div>
      <h3>Min/Max dimensions</h3>
      <Column minW={150} maxW={300} minH={100} gap={16} p={16} style={{ backgroundColor: "#f5f5f5" }}>
        <Box>Min width: 150px</Box>
        <Box>Max width: 300px</Box>
        <Box>Min height: 100px</Box>
      </Column>
    </div>
  </Row>
);

export const Overflow: StoryFn = () => (
  <Row gap={32}>
    <div>
      <h3>overflow="hidden"</h3>
      <Column
        h={150}
        overflow="hidden"
        gap={16}
        p={16}
        style={{ backgroundColor: "#f5f5f5", border: "1px solid #ddd" }}
      >
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
        <Box>Item 4 (hidden)</Box>
        <Box>Item 5 (hidden)</Box>
      </Column>
    </div>
    <div>
      <h3>overflow="auto"</h3>
      <Column
        h={150}
        overflow="auto"
        gap={16}
        p={16}
        style={{ backgroundColor: "#f5f5f5", border: "1px solid #ddd" }}
      >
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
        <Box>Item 4</Box>
        <Box>Item 5</Box>
      </Column>
    </div>
    <div>
      <h3>overflowY="scroll"</h3>
      <Column
        h={150}
        overflowY="scroll"
        gap={16}
        p={16}
        style={{ backgroundColor: "#f5f5f5", border: "1px solid #ddd" }}
      >
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Column>
    </div>
  </Row>
);

export const ComplexLayout: StoryFn = () => (
  <Column gap={24} p={24} style={{ backgroundColor: "#f5f5f5", maxWidth: "400px" }}>
    <Column gap={8}>
      <h2 style={{ margin: 0 }}>User Profile</h2>
      <p style={{ margin: 0, color: "#666" }}>Manage your account settings</p>
    </Column>

    <Column gap={16} p={16} style={{ backgroundColor: "#fff", borderRadius: "8px" }}>
      <Row gap={16} align="center">
        <div style={{ width: "64px", height: "64px", backgroundColor: "#1976d2", borderRadius: "50%" }} />
        <Column gap={4}>
          <h3 style={{ margin: 0 }}>John Doe</h3>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>john.doe@example.com</p>
        </Column>
      </Row>

      <Column gap={8}>
        <button
          style={{
            padding: "12px",
            textAlign: "left",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: "#fff",
          }}
        >
          Edit Profile
        </button>
        <button
          style={{
            padding: "12px",
            textAlign: "left",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: "#fff",
          }}
        >
          Change Password
        </button>
        <button
          style={{
            padding: "12px",
            textAlign: "left",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: "#fff",
          }}
        >
          Notification Settings
        </button>
      </Column>
    </Column>

    <Row justify="end" gap={8}>
      <button style={{ padding: "8px 16px" }}>Cancel</button>
      <button
        style={{
          padding: "8px 16px",
          backgroundColor: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: "4px",
        }}
      >
        Save Changes
      </button>
    </Row>
  </Column>
);

export const ResponsiveGaps: StoryFn = () => (
  <Column gap={32}>
    <div>
      <h3>Different gap sizes</h3>
      <Column gap={4} p={16} style={{ backgroundColor: "#f5f5f5" }}>
        <Box>Gap 4</Box>
        <Box>Gap 4</Box>
        <Box>Gap 4</Box>
      </Column>
    </div>
    <div>
      <Column gap={16} p={16} style={{ backgroundColor: "#f5f5f5" }}>
        <Box>Gap 16</Box>
        <Box>Gap 16</Box>
        <Box>Gap 16</Box>
      </Column>
    </div>
    <div>
      <Column gap={32} p={16} style={{ backgroundColor: "#f5f5f5" }}>
        <Box>Gap 32</Box>
        <Box>Gap 32</Box>
        <Box>Gap 32</Box>
      </Column>
    </div>
  </Column>
);

export const NestedLayouts: StoryFn = () => (
  <Column gap={24} p={24} style={{ backgroundColor: "#f0f0f0", minHeight: "400px" }}>
    <Row gap={16} style={{ flex: 1 }}>
      <Column flex={1} gap={16} p={16} style={{ backgroundColor: "#fff", borderRadius: "8px" }}>
        <h3 style={{ margin: 0 }}>Sidebar</h3>
        <Column gap={8}>
          <Box color="#e8eaf6">Menu Item 1</Box>
          <Box color="#e8eaf6">Menu Item 2</Box>
          <Box color="#e8eaf6">Menu Item 3</Box>
        </Column>
      </Column>
      <Column flex={3} gap={16} p={16} style={{ backgroundColor: "#fff", borderRadius: "8px" }}>
        <h3 style={{ margin: 0 }}>Main Content</h3>
        <Row gap={16} wrap="wrap">
          <Box color="#e0f2f1">Card 1</Box>
          <Box color="#e0f2f1">Card 2</Box>
          <Box color="#e0f2f1">Card 3</Box>
          <Box color="#e0f2f1">Card 4</Box>
        </Row>
      </Column>
    </Row>
    <Row p={16} justify="between" style={{ backgroundColor: "#333", color: "#fff", borderRadius: "8px" }}>
      <span>Footer Left</span>
      <span>Footer Right</span>
    </Row>
  </Column>
);
