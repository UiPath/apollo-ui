import type { Meta, StoryObj } from '@storybook/react';
import { Row } from './Stack';

// Common box component for demonstrations
const Box = ({
  children,
  ...props
}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
  <div
    {...props}
    style={{
      color: 'var(--color-foreground)',
      backgroundColor: 'var(--color-background-secondary)',
      padding: '16px',
      borderRadius: '4px',
      border: '1px solid var(--color-border)',
      minWidth: '60px',
      textAlign: 'center',
      ...props.style,
    }}
  >
    {children}
  </div>
);

const meta: Meta<typeof Row> = {
  title: 'Core/Layouts/Row',
  component: Row,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    direction: {
      control: { type: 'select' },
      options: ['row', 'column', 'row-reverse', 'column-reverse'],
    },
    align: {
      control: { type: 'select' },
      options: ['start', 'end', 'center', 'stretch', 'baseline'],
    },
    justify: {
      control: { type: 'select' },
      options: ['start', 'end', 'center', 'between', 'around', 'evenly'],
    },
    wrap: {
      control: { type: 'select' },
      options: ['nowrap', 'wrap', 'wrap-reverse'],
    },
    gap: {
      control: { type: 'number' },
    },
    p: {
      control: { type: 'number' },
    },
    m: {
      control: { type: 'number' },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: '16px',
          color: 'var(--color-foreground)',
          backgroundColor: 'var(--color-background)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Row>;

export const Basic: Story = {
  render: () => (
    <Row gap={8}>
      <Box>Item 1</Box>
      <Box>Item 2</Box>
      <Box>Item 3</Box>
    </Row>
  ),
};

export const WithGap: Story = {
  render: () => (
    <div>
      <h3>Gap: 4px</h3>
      <Row gap={4} mb={16}>
        <Box>A</Box>
        <Box>B</Box>
        <Box>C</Box>
      </Row>
      <h3>Gap: 16px</h3>
      <Row gap={16} mb={16}>
        <Box>A</Box>
        <Box>B</Box>
        <Box>C</Box>
      </Row>
      <h3>Gap: 32px</h3>
      <Row gap={32}>
        <Box>A</Box>
        <Box>B</Box>
        <Box>C</Box>
      </Row>
    </div>
  ),
};

export const Alignment: Story = {
  render: () => (
    <div>
      <h3>Align: start</h3>
      <Row
        align="start"
        gap={8}
        h={120}
        mb={16}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box style={{ height: '30px' }}>Short</Box>
        <Box style={{ height: '50px' }}>Medium</Box>
        <Box style={{ height: '80px' }}>Tall</Box>
      </Row>
      <h3>Align: center</h3>
      <Row
        align="center"
        gap={8}
        h={120}
        mb={16}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box style={{ height: '30px' }}>Short</Box>
        <Box style={{ height: '50px' }}>Medium</Box>
        <Box style={{ height: '80px' }}>Tall</Box>
      </Row>
      <h3>Align: end</h3>
      <Row
        align="end"
        gap={8}
        h={120}
        mb={16}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box style={{ height: '30px' }}>Short</Box>
        <Box style={{ height: '50px' }}>Medium</Box>
        <Box style={{ height: '80px' }}>Tall</Box>
      </Row>
      <h3>Align: stretch</h3>
      <Row
        align="stretch"
        gap={8}
        h={120}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box>Stretched</Box>
        <Box>Stretched</Box>
        <Box>Stretched</Box>
      </Row>
    </div>
  ),
};

export const Justification: Story = {
  render: () => (
    <div>
      <h3>Justify: start</h3>
      <Row
        justify="start"
        gap={8}
        w={400}
        mb={16}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box>A</Box>
        <Box>B</Box>
        <Box>C</Box>
      </Row>
      <h3>Justify: center</h3>
      <Row
        justify="center"
        gap={8}
        w={400}
        mb={16}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box>A</Box>
        <Box>B</Box>
        <Box>C</Box>
      </Row>
      <h3>Justify: end</h3>
      <Row
        justify="end"
        gap={8}
        w={400}
        mb={16}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box>A</Box>
        <Box>B</Box>
        <Box>C</Box>
      </Row>
      <h3>Justify: between</h3>
      <Row
        justify="between"
        w={400}
        mb={16}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box>A</Box>
        <Box>B</Box>
        <Box>C</Box>
      </Row>
      <h3>Justify: around</h3>
      <Row
        justify="around"
        w={400}
        mb={16}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box>A</Box>
        <Box>B</Box>
        <Box>C</Box>
      </Row>
      <h3>Justify: evenly</h3>
      <Row
        justify="evenly"
        w={400}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box>A</Box>
        <Box>B</Box>
        <Box>C</Box>
      </Row>
    </div>
  ),
};

export const Wrapping: Story = {
  render: () => (
    <div>
      <h3>Wrap: nowrap (default)</h3>
      <Row
        wrap="nowrap"
        gap={8}
        w={200}
        mb={16}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
        <Box>Item 4</Box>
        <Box>Item 5</Box>
      </Row>
      <h3>Wrap: wrap</h3>
      <Row
        wrap="wrap"
        gap={8}
        w={200}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
        <Box>Item 4</Box>
        <Box>Item 5</Box>
      </Row>
    </div>
  ),
};

export const Spacing: Story = {
  render: () => (
    <div>
      <h3>Padding and Margin</h3>
      <Row
        gap={8}
        p={16}
        m={16}
        style={{
          backgroundColor: 'var(--color-background)',
          border: '2px dashed var(--color-border)',
        }}
      >
        <Box>Padded</Box>
        <Box>Content</Box>
        <Box>Here</Box>
      </Row>
      <h3>Directional Spacing</h3>
      <Row gap={8} pt={24} pb={8} px={16} style={{ backgroundColor: 'var(--color-background)' }}>
        <Box>Custom</Box>
        <Box>Spacing</Box>
      </Row>
    </div>
  ),
};

export const Sizing: Story = {
  render: () => (
    <div>
      <h3>Fixed Width and Height</h3>
      <Row
        gap={8}
        w={300}
        h={100}
        justify="center"
        align="center"
        style={{
          backgroundColor: 'var(--color-background-secondary)',
          border: '1px solid var(--color-border)',
        }}
      >
        <Box>300px</Box>
        <Box>wide</Box>
      </Row>
      <h3>Min/Max Constraints</h3>
      <Row
        gap={8}
        minW={200}
        maxW={400}
        p={16}
        style={{
          backgroundColor: 'var(--color-background)',
          border: '1px solid var(--color-border)',
          resize: 'horizontal',
          overflow: 'auto',
        }}
      >
        <Box>Resizable</Box>
        <Box>Container</Box>
      </Row>
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    direction: 'row',
    gap: 8,
    align: 'start',
    justify: 'start',
    wrap: 'nowrap',
    p: 0,
    m: 0,
  },
  render: (args) => (
    <Row
      {...args}
      style={{ backgroundColor: 'var(--color-background-secondary)', minHeight: '100px' }}
    >
      <Box>Item 1</Box>
      <Box>Item 2</Box>
      <Box>Item 3</Box>
    </Row>
  ),
};
