import type { Meta, StoryObj } from '@storybook/react';
import { Grid, SimpleGrid } from './Grid';

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
      minHeight: '60px',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...props.style,
    }}
  >
    {children}
  </div>
);

const meta: Meta<typeof Grid> = {
  title: 'Core/Layouts/Grid',
  component: Grid,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    templateColumns: {
      control: { type: 'text' },
      description: 'Grid template columns (e.g., "1fr 1fr" or "repeat(3, 1fr)")',
    },
    templateRows: {
      control: { type: 'text' },
      description: 'Grid template rows',
    },
    templateAreas: {
      control: { type: 'text' },
      description: 'Grid template areas',
    },
    autoFlow: {
      control: { type: 'select' },
      options: ['row', 'column', 'dense', 'row dense', 'column dense'],
    },
    gap: {
      control: { type: 'number' },
      description: 'Gap between grid items',
    },
    rowGap: {
      control: { type: 'number' },
      description: 'Gap between rows',
    },
    columnGap: {
      control: { type: 'number' },
      description: 'Gap between columns',
    },
    alignItems: {
      control: { type: 'select' },
      options: ['start', 'end', 'center', 'stretch'],
    },
    justifyItems: {
      control: { type: 'select' },
      options: ['start', 'end', 'center', 'stretch'],
    },
    alignContent: {
      control: { type: 'select' },
      options: ['start', 'end', 'center', 'stretch', 'between', 'around', 'evenly'],
    },
    justifyContent: {
      control: { type: 'select' },
      options: ['start', 'end', 'center', 'stretch', 'between', 'around', 'evenly'],
    },
    w: {
      control: { type: 'text' },
      description: 'Width',
    },
    h: {
      control: { type: 'text' },
      description: 'Height',
    },
    p: {
      control: { type: 'number' },
      description: 'Padding (all sides)',
    },
    m: {
      control: { type: 'number' },
      description: 'Margin (all sides)',
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

type Story = StoryObj<typeof Grid>;

export const Basic: Story = {
  render: () => (
    <Grid templateColumns="repeat(3, 1fr)" gap={16}>
      <Box>Item 1</Box>
      <Box>Item 2</Box>
      <Box>Item 3</Box>
      <Box>Item 4</Box>
      <Box>Item 5</Box>
      <Box>Item 6</Box>
    </Grid>
  ),
};

export const SimpleGridComponent: Story = {
  render: () => (
    <div>
      <h3>2 Columns (default)</h3>
      <SimpleGrid gap={16} mb={32}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
        <Box>Item 4</Box>
      </SimpleGrid>

      <h3>4 Columns</h3>
      <SimpleGrid columns={4} gap={16}>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
        <Box>Item 4</Box>
        <Box>Item 5</Box>
        <Box>Item 6</Box>
        <Box>Item 7</Box>
        <Box>Item 8</Box>
      </SimpleGrid>
    </div>
  ),
};

export const TemplateColumns: Story = {
  render: () => (
    <div>
      <h3>Equal Columns: repeat(3, 1fr)</h3>
      <Grid templateColumns="repeat(3, 1fr)" gap={16} mb={32}>
        <Box>Equal</Box>
        <Box>Equal</Box>
        <Box>Equal</Box>
      </Grid>

      <h3>Mixed Sizes: 200px 1fr 100px</h3>
      <Grid templateColumns="200px 1fr 100px" gap={16} mb={32}>
        <Box>200px</Box>
        <Box>Flexible</Box>
        <Box>100px</Box>
      </Grid>

      <h3>Fractional: 1fr 2fr 1fr</h3>
      <Grid templateColumns="1fr 2fr 1fr" gap={16}>
        <Box>1fr</Box>
        <Box>2fr (double)</Box>
        <Box>1fr</Box>
      </Grid>
    </div>
  ),
};

export const TemplateAreas: Story = {
  render: () => (
    <Grid
      templateAreas={`
                "header header header"
                "sidebar content content"
                "footer footer footer"
            `}
      templateColumns="200px 1fr 1fr"
      templateRows="60px 1fr 60px"
      gap={16}
      h={400}
    >
      <Box style={{ gridArea: 'header' }}>Header</Box>
      <Box style={{ gridArea: 'sidebar' }}>Sidebar</Box>
      <Box style={{ gridArea: 'content' }}>Content</Box>
      <Box style={{ gridArea: 'footer' }}>Footer</Box>
    </Grid>
  ),
};

export const Gap: Story = {
  render: () => (
    <div>
      <h3>Gap: 8px</h3>
      <Grid templateColumns="repeat(3, 1fr)" gap={8} mb={32}>
        <Box>A</Box>
        <Box>B</Box>
        <Box>C</Box>
        <Box>D</Box>
        <Box>E</Box>
        <Box>F</Box>
      </Grid>

      <h3>Gap: 24px</h3>
      <Grid templateColumns="repeat(3, 1fr)" gap={24} mb={32}>
        <Box>A</Box>
        <Box>B</Box>
        <Box>C</Box>
        <Box>D</Box>
        <Box>E</Box>
        <Box>F</Box>
      </Grid>

      <h3>Row Gap: 8px, Column Gap: 32px</h3>
      <Grid templateColumns="repeat(3, 1fr)" rowGap={8} columnGap={32}>
        <Box>A</Box>
        <Box>B</Box>
        <Box>C</Box>
        <Box>D</Box>
        <Box>E</Box>
        <Box>F</Box>
      </Grid>
    </div>
  ),
};

export const Alignment: Story = {
  render: () => (
    <div>
      <h3>Align Items: start</h3>
      <Grid
        templateColumns="repeat(3, 1fr)"
        gap={16}
        alignItems="start"
        h={120}
        mb={32}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box style={{ height: '40px' }}>Short</Box>
        <Box style={{ height: '80px' }}>Tall</Box>
        <Box style={{ height: '60px' }}>Medium</Box>
      </Grid>

      <h3>Align Items: center</h3>
      <Grid
        templateColumns="repeat(3, 1fr)"
        gap={16}
        alignItems="center"
        h={120}
        mb={32}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box style={{ height: '40px' }}>Short</Box>
        <Box style={{ height: '80px' }}>Tall</Box>
        <Box style={{ height: '60px' }}>Medium</Box>
      </Grid>

      <h3>Align Items: stretch</h3>
      <Grid
        templateColumns="repeat(3, 1fr)"
        gap={16}
        alignItems="stretch"
        h={120}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box>Stretched</Box>
        <Box>Stretched</Box>
        <Box>Stretched</Box>
      </Grid>
    </div>
  ),
};

export const Justification: Story = {
  render: () => (
    <div>
      <h3>Justify Items: start</h3>
      <Grid
        templateColumns="repeat(3, 1fr)"
        gap={16}
        justifyItems="start"
        mb={32}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box style={{ width: '60px' }}>A</Box>
        <Box style={{ width: '80px' }}>B</Box>
        <Box style={{ width: '70px' }}>C</Box>
      </Grid>

      <h3>Justify Items: center</h3>
      <Grid
        templateColumns="repeat(3, 1fr)"
        gap={16}
        justifyItems="center"
        mb={32}
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box style={{ width: '60px' }}>A</Box>
        <Box style={{ width: '80px' }}>B</Box>
        <Box style={{ width: '70px' }}>C</Box>
      </Grid>

      <h3>Justify Items: end</h3>
      <Grid
        templateColumns="repeat(3, 1fr)"
        gap={16}
        justifyItems="end"
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <Box style={{ width: '60px' }}>A</Box>
        <Box style={{ width: '80px' }}>B</Box>
        <Box style={{ width: '70px' }}>C</Box>
      </Grid>
    </div>
  ),
};

export const AutoFlow: Story = {
  render: () => (
    <div>
      <h3>Auto Flow: row (default)</h3>
      <Grid templateColumns="repeat(3, 80px)" autoFlow="row" gap={8} mb={32}>
        <Box>1</Box>
        <Box>2</Box>
        <Box>3</Box>
        <Box>4</Box>
        <Box>5</Box>
        <Box>6</Box>
        <Box>7</Box>
      </Grid>

      <h3>Auto Flow: column</h3>
      <Grid templateRows="repeat(3, 80px)" autoFlow="column" gap={8} mb={32}>
        <Box>1</Box>
        <Box>2</Box>
        <Box>3</Box>
        <Box>4</Box>
        <Box>5</Box>
        <Box>6</Box>
        <Box>7</Box>
      </Grid>

      <h3>Auto Flow: dense</h3>
      <Grid templateColumns="repeat(3, 80px)" autoFlow="dense" gap={8}>
        <Box>1</Box>
        <Box style={{ gridColumn: 'span 2' }}>2 (spans 2)</Box>
        <Box>3</Box>
        <Box>4</Box>
        <Box>5</Box>
      </Grid>
    </div>
  ),
};

export const ResponsiveLayout: Story = {
  render: () => (
    <Grid
      templateColumns="repeat(auto-fit, minmax(200px, 1fr))"
      gap={16}
      style={{ resize: 'horizontal', overflow: 'auto', border: '1px dashed var(--color-border)' }}
    >
      <Box>Responsive</Box>
      <Box>Card</Box>
      <Box>Layout</Box>
      <Box>Resize me!</Box>
      <Box>Auto-fit</Box>
      <Box>Minmax</Box>
    </Grid>
  ),
};

export const Spacing: Story = {
  render: () => (
    <div>
      <h3>Padding and Margin</h3>
      <Grid
        templateColumns="repeat(2, 1fr)"
        gap={16}
        p={24}
        m={16}
        style={{ backgroundColor: 'var(--color-border)', border: '2px dashed var(--color-border)' }}
      >
        <Box>Padded</Box>
        <Box>Grid</Box>
      </Grid>

      <h3>Directional Spacing</h3>
      <Grid
        templateColumns="repeat(2, 1fr)"
        gap={8}
        pt={32}
        pb={16}
        px={24}
        mt={16}
        style={{ backgroundColor: 'var(--color-border)' }}
      >
        <Box>Custom</Box>
        <Box>Spacing</Box>
      </Grid>
    </div>
  ),
};

export const Sizing: Story = {
  render: () => (
    <div>
      <h3>Fixed Dimensions</h3>
      <Grid
        templateColumns="repeat(3, 1fr)"
        gap={16}
        w={400}
        h={200}
        mb={32}
        style={{
          backgroundColor: 'var(--color-background-secondary)',
          border: '1px solid var(--color-border)',
        }}
      >
        <Box>Fixed</Box>
        <Box>Width</Box>
        <Box>Height</Box>
      </Grid>

      <h3>Min/Max Constraints</h3>
      <Grid
        templateColumns="repeat(auto-fit, minmax(120px, 1fr))"
        gap={16}
        minW={200}
        maxW={600}
        minH={100}
        style={{
          backgroundColor: 'var(--color-background-secondary)',
          border: '1px solid var(--color-border)',
        }}
      >
        <Box>Min/Max</Box>
        <Box>Constrained</Box>
        <Box>Grid</Box>
      </Grid>
    </div>
  ),
};

export const ComplexLayout: Story = {
  render: () => (
    <Grid templateColumns="repeat(4, 1fr)" templateRows="repeat(4, 80px)" gap={8} p={16}>
      <Box style={{ gridColumn: '1 / 3', gridRow: '1 / 3' }}>Spans 2x2</Box>
      <Box>Regular</Box>
      <Box>Regular</Box>
      <Box>Regular</Box>
      <Box style={{ gridColumn: '2 / 5' }}>Spans 3 columns</Box>
      <Box>Regular</Box>
      <Box>Regular</Box>
      <Box>Regular</Box>
      <Box>Regular</Box>
      <Box style={{ gridRow: '3 / 5' }}>Spans 2 rows</Box>
      <Box>Regular</Box>
      <Box>Regular</Box>
      <Box>Regular</Box>
    </Grid>
  ),
};

export const Interactive: Story = {
  args: {
    templateColumns: 'repeat(3, 1fr)',
    gap: 16,
    alignItems: 'stretch',
    justifyItems: 'stretch',
  },
  render: (args) => (
    <Grid {...args}>
      <Box>Item 1</Box>
      <Box>Item 2</Box>
      <Box>Item 3</Box>
      <Box>Item 4</Box>
      <Box>Item 5</Box>
      <Box>Item 6</Box>
    </Grid>
  ),
};
