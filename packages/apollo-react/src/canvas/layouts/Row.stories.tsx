import type { Meta, StoryFn } from "@storybook/react-vite";
import { Row } from "./Row";

export default {
  title: "Common/Layouts/Row",
  component: Row,
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
      description: "Alignment of items along cross axis",
    },
    justify: {
      control: { type: "select" },
      options: ["around", "between", "center", "end", "evenly", "start"],
      description: "Justification of items along main axis",
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
} as Meta<typeof Row>;

const Box = ({ children, color = "#e3f2fd" }: { children: React.ReactNode; color?: string }) => (
  <div
    style={{
      backgroundColor: color,
      padding: "16px",
      borderRadius: "4px",
      textAlign: "center",
      minWidth: "80px",
    }}
  >
    {children}
  </div>
);

export const Default: StoryFn<typeof Row> = (args) => (
  <Row {...args}>
    <Box>Item 1</Box>
    <Box>Item 2</Box>
    <Box>Item 3</Box>
  </Row>
);
Default.args = {
  gap: 16,
};

export const Alignment: StoryFn = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
    <div>
      <h3>align="start"</h3>
      <Row gap={16} align="start" style={{ height: "100px", backgroundColor: "#f5f5f5" }}>
        <Box>Short</Box>
        <Box>
          Tall
          <br />
          Item
        </Box>
        <Box>Medium</Box>
      </Row>
    </div>
    <div>
      <h3>align="center"</h3>
      <Row gap={16} align="center" style={{ height: "100px", backgroundColor: "#f5f5f5" }}>
        <Box>Short</Box>
        <Box>
          Tall
          <br />
          Item
        </Box>
        <Box>Medium</Box>
      </Row>
    </div>
    <div>
      <h3>align="end"</h3>
      <Row gap={16} align="end" style={{ height: "100px", backgroundColor: "#f5f5f5" }}>
        <Box>Short</Box>
        <Box>
          Tall
          <br />
          Item
        </Box>
        <Box>Medium</Box>
      </Row>
    </div>
  </div>
);

export const Justification: StoryFn = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
    <div>
      <h3>justify="start" (default)</h3>
      <Row gap={16} justify="start" style={{ backgroundColor: "#f5f5f5", padding: "8px" }}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Row>
    </div>
    <div>
      <h3>justify="center"</h3>
      <Row gap={16} justify="center" style={{ backgroundColor: "#f5f5f5", padding: "8px" }}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Row>
    </div>
    <div>
      <h3>justify="end"</h3>
      <Row gap={16} justify="end" style={{ backgroundColor: "#f5f5f5", padding: "8px" }}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Row>
    </div>
    <div>
      <h3>justify="between"</h3>
      <Row justify="between" style={{ backgroundColor: "#f5f5f5", padding: "8px" }}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Row>
    </div>
    <div>
      <h3>justify="around"</h3>
      <Row justify="around" style={{ backgroundColor: "#f5f5f5", padding: "8px" }}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Row>
    </div>
    <div>
      <h3>justify="evenly"</h3>
      <Row justify="evenly" style={{ backgroundColor: "#f5f5f5", padding: "8px" }}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Row>
    </div>
  </div>
);

export const Wrapping: StoryFn = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
    <div>
      <h3>wrap="nowrap" (default) - items shrink</h3>
      <Row gap={16} wrap="nowrap" style={{ backgroundColor: "#f5f5f5", padding: "8px", width: "300px" }}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
        <Box>Item 4</Box>
        <Box>Item 5</Box>
      </Row>
    </div>
    <div>
      <h3>wrap="wrap" - items wrap to next line</h3>
      <Row gap={16} wrap="wrap" style={{ backgroundColor: "#f5f5f5", padding: "8px", width: "300px" }}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
        <Box>Item 4</Box>
        <Box>Item 5</Box>
      </Row>
    </div>
  </div>
);

export const Spacing: StoryFn = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
    <div>
      <h3>With padding</h3>
      <Row gap={16} p={24} style={{ backgroundColor: "#f5f5f5" }}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Row>
    </div>
    <div>
      <h3>With margin</h3>
      <div style={{ backgroundColor: "#ffebee" }}>
        <Row gap={16} m={24} p={16} style={{ backgroundColor: "#f5f5f5" }}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Row>
      </div>
    </div>
    <div>
      <h3>With horizontal/vertical padding</h3>
      <Row gap={16} px={32} py={8} style={{ backgroundColor: "#f5f5f5" }}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </Row>
    </div>
  </div>
);

export const FlexProperties: StoryFn = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
    <div>
      <h3>Using flex property on Row</h3>
      <div style={{ display: "flex", gap: "16px", backgroundColor: "#f5f5f5", padding: "8px" }}>
        <Row flex={1} gap={8} p={16} style={{ backgroundColor: "#e3f2fd" }}>
          <Box color="#bbdefb">Flex 1</Box>
        </Row>
        <Row flex={2} gap={8} p={16} style={{ backgroundColor: "#c5cae9" }}>
          <Box color="#9fa8da">Flex 2</Box>
        </Row>
      </div>
    </div>
  </div>
);

export const ComplexLayout: StoryFn = () => (
  <Row gap={24} p={24} style={{ backgroundColor: "#f5f5f5", minHeight: "200px" }}>
    <Row flex={1} gap={16} align="center">
      <div style={{ width: "40px", height: "40px", backgroundColor: "#1976d2", borderRadius: "50%" }} />
      <div>
        <h3 style={{ margin: 0 }}>User Name</h3>
        <p style={{ margin: 0, color: "#666" }}>user@example.com</p>
      </div>
    </Row>
    <Row gap={8} align="center">
      <button style={{ padding: "8px 16px" }}>Edit</button>
      <button style={{ padding: "8px 16px" }}>Delete</button>
    </Row>
  </Row>
);

export const ResponsiveGaps: StoryFn = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
    <div>
      <h3>Different gap sizes</h3>
      <Row gap={4} p={16} style={{ backgroundColor: "#f5f5f5" }}>
        <Box>Gap 4</Box>
        <Box>Gap 4</Box>
        <Box>Gap 4</Box>
      </Row>
      <br />
      <Row gap={16} p={16} style={{ backgroundColor: "#f5f5f5" }}>
        <Box>Gap 16</Box>
        <Box>Gap 16</Box>
        <Box>Gap 16</Box>
      </Row>
      <br />
      <Row gap={32} p={16} style={{ backgroundColor: "#f5f5f5" }}>
        <Box>Gap 32</Box>
        <Box>Gap 32</Box>
        <Box>Gap 32</Box>
      </Row>
    </div>
  </div>
);
