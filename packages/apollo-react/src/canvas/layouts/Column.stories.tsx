import type { Meta, StoryObj } from "@storybook/react";
import { Column, Row } from "./Stack";

// Common box component for demonstrations
const Box = ({ children, ...props }: any) => (
  <div
    {...props}
    style={{
      color: "var(--color-foreground)",
      backgroundColor: "var(--color-background-secondary)",
      padding: "16px",
      borderRadius: "4px",
      border: "1px solid var(--color-border)",
      minWidth: "60px",
      textAlign: "center",
      ...props.style,
    }}
  >
    {children}
  </div>
);

const meta: Meta<typeof Column> = {
  title: "Core/Layouts/Column",
  component: Column,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    direction: {
      control: { type: "select" },
      options: ["row", "column", "row-reverse", "column-reverse"],
    },
    align: {
      control: { type: "select" },
      options: ["start", "end", "center", "stretch", "baseline"],
    },
    justify: {
      control: { type: "select" },
      options: ["start", "end", "center", "between", "around", "evenly"],
    },
    wrap: {
      control: { type: "select" },
      options: ["nowrap", "wrap", "wrap-reverse"],
    },
    gap: {
      control: { type: "number" },
    },
    p: {
      control: { type: "number" },
    },
    m: {
      control: { type: "number" },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "16px", color: "var(--color-foreground)", backgroundColor: "var(--color-background)" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Column>;

export const Basic: Story = {
  render: () => (
    <Column gap={8}>
      <Box>Item 1</Box>
      <Box>Item 2</Box>
      <Box>Item 3</Box>
    </Column>
  ),
};

export const WithGap: Story = {
  render: () => (
    <Row gap={32}>
      <div>
        <h4>Gap: 4px</h4>
        <Column gap={4}>
          <Box>A</Box>
          <Box>B</Box>
          <Box>C</Box>
        </Column>
      </div>
      <div>
        <h4>Gap: 16px</h4>
        <Column gap={16}>
          <Box>A</Box>
          <Box>B</Box>
          <Box>C</Box>
        </Column>
      </div>
      <div>
        <h4>Gap: 32px</h4>
        <Column gap={32}>
          <Box>A</Box>
          <Box>B</Box>
          <Box>C</Box>
        </Column>
      </div>
    </Row>
  ),
};

export const Alignment: Story = {
  render: () => (
    <Row gap={32}>
      <div>
        <h4>Align: start</h4>
        <Column align="start" gap={8} w={120} style={{ backgroundColor: "var(--color-background-secondary)" }}>
          <Box style={{ width: "60px" }}>Short</Box>
          <Box style={{ width: "90px" }}>Medium</Box>
          <Box style={{ width: "110px" }}>Long</Box>
        </Column>
      </div>
      <div>
        <h4>Align: center</h4>
        <Column align="center" gap={8} w={120} style={{ backgroundColor: "var(--color-background-secondary)" }}>
          <Box style={{ width: "60px" }}>Short</Box>
          <Box style={{ width: "90px" }}>Medium</Box>
          <Box style={{ width: "110px" }}>Long</Box>
        </Column>
      </div>
      <div>
        <h4>Align: end</h4>
        <Column align="end" gap={8} w={120} style={{ backgroundColor: "var(--color-background-secondary)" }}>
          <Box style={{ width: "60px" }}>Short</Box>
          <Box style={{ width: "90px" }}>Medium</Box>
          <Box style={{ width: "110px" }}>Long</Box>
        </Column>
      </div>
      <div>
        <h4>Align: stretch</h4>
        <Column align="stretch" gap={8} w={120} style={{ backgroundColor: "var(--color-background-secondary)" }}>
          <Box>Stretched</Box>
          <Box>Stretched</Box>
          <Box>Stretched</Box>
        </Column>
      </div>
    </Row>
  ),
};

export const Justification: Story = {
  render: () => (
    <Row gap={32}>
      <div>
        <h4>Justify: start</h4>
        <Column justify="start" gap={8} h={200} w={100} style={{ backgroundColor: "var(--color-background-secondary)" }}>
          <Box>A</Box>
          <Box>B</Box>
        </Column>
      </div>
      <div>
        <h4>Justify: center</h4>
        <Column justify="center" gap={8} h={200} w={100} style={{ backgroundColor: "var(--color-background-secondary)" }}>
          <Box>A</Box>
          <Box>B</Box>
        </Column>
      </div>
      <div>
        <h4>Justify: end</h4>
        <Column justify="end" gap={8} h={200} w={100} style={{ backgroundColor: "var(--color-background-secondary)" }}>
          <Box>A</Box>
          <Box>B</Box>
        </Column>
      </div>
      <div>
        <h4>Justify: between</h4>
        <Column justify="between" h={200} w={100} style={{ backgroundColor: "var(--color-background-secondary)" }}>
          <Box>A</Box>
          <Box>B</Box>
          <Box>C</Box>
        </Column>
      </div>
    </Row>
  ),
};

export const Spacing: Story = {
  render: () => (
    <Row gap={32}>
      <div>
        <h4>Padding & Margin</h4>
        <Column
          gap={8}
          p={16}
          m={16}
          style={{ backgroundColor: "var(--color-background-secondary)", border: "2px dashed var(--color-border)" }}
        >
          <Box>Padded</Box>
          <Box>Content</Box>
        </Column>
      </div>
      <div>
        <h4>Directional</h4>
        <Column gap={8} pt={24} pb={8} px={16} style={{ backgroundColor: "var(--color-background-secondary)" }}>
          <Box>Custom</Box>
          <Box>Spacing</Box>
        </Column>
      </div>
    </Row>
  ),
};

export const Sizing: Story = {
  render: () => (
    <Row gap={32}>
      <div>
        <h4>Fixed Size</h4>
        <Column
          gap={8}
          w={120}
          h={200}
          justify="center"
          align="center"
          style={{ backgroundColor: "var(--color-background-secondary)", border: "1px solid var(--color-border)" }}
        >
          <Box>120px</Box>
          <Box>wide</Box>
        </Column>
      </div>
      <div>
        <h4>Min/Max Height</h4>
        <Column
          gap={8}
          w={120}
          minH={100}
          maxH={300}
          p={16}
          style={{
            backgroundColor: "var(--color-background-secondary)",
            border: "1px solid var(--color-border)",
            resize: "vertical",
            overflow: "auto",
          }}
        >
          <Box>Resizable</Box>
          <Box>Height</Box>
        </Column>
      </div>
    </Row>
  ),
};

export const ComplexLayout: Story = {
  render: () => (
    <Column gap={16} p={16} style={{ backgroundColor: "var(--color-background-secondary)" }}>
      <h3>Complex Layout Example</h3>
      <Row gap={16} justify="between" align="stretch">
        <Column
          gap={8}
          flex={1}
          p={16}
          style={{ backgroundColor: "var(--color-background)", borderRadius: "8px", border: "1px solid var(--color-border)" }}
        >
          <h4 style={{ margin: 0 }}>Sidebar</h4>
          <Box>Nav Item 1</Box>
          <Box>Nav Item 2</Box>
          <Box>Nav Item 3</Box>
        </Column>
        <Column
          gap={12}
          flex={3}
          p={16}
          style={{ backgroundColor: "var(--color-background)", borderRadius: "8px", border: "1px solid var(--color-border)" }}
        >
          <h4 style={{ margin: 0 }}>Main Content</h4>
          <Row gap={12}>
            <Box>Card 1</Box>
            <Box>Card 2</Box>
            <Box>Card 3</Box>
          </Row>
          <Box style={{ height: "80px" }}>Content Area</Box>
        </Column>
      </Row>
    </Column>
  ),
};

export const Interactive: Story = {
  args: {
    direction: "column",
    gap: 8,
    align: "start",
    justify: "start",
    wrap: "nowrap",
    p: 0,
    m: 0,
  },
  render: (args) => (
    <Column {...args} style={{ backgroundColor: "var(--color-background-secondary)", minHeight: "100px" }}>
      <Box>Item 1</Box>
      <Box>Item 2</Box>
      <Box>Item 3</Box>
    </Column>
  ),
};
