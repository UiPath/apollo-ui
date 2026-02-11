import type { Meta } from '@storybook/react-vite';
import { Row } from './row';

const meta = {
  title: 'Components/Layout/Row',
  component: Row,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Row>;

export default meta;

const Box = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-md border bg-primary/10 p-4 text-center ${className}`}>{children}</div>
);

export const Default = {
  args: {},
  render: () => (
    <Row gap={4}>
      <Box>Item 1</Box>
      <Box>Item 2</Box>
      <Box>Item 3</Box>
    </Row>
  ),
};

export const WithGap = {
  args: {},
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">gap={2}</p>
        <Row gap={2}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Row>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">gap={4}</p>
        <Row gap={4}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Row>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">gap={8}</p>
        <Row gap={8}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Row>
      </div>
    </div>
  ),
};

export const Alignment = {
  args: {},
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">align="start"</p>
        <Row gap={4} align="start" className="h-32 border">
          <Box>Small</Box>
          <Box className="h-20">Medium</Box>
          <Box>Small</Box>
        </Row>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">align="center"</p>
        <Row gap={4} align="center" className="h-32 border">
          <Box>Small</Box>
          <Box className="h-20">Medium</Box>
          <Box>Small</Box>
        </Row>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">align="end"</p>
        <Row gap={4} align="end" className="h-32 border">
          <Box>Small</Box>
          <Box className="h-20">Medium</Box>
          <Box>Small</Box>
        </Row>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">align="stretch"</p>
        <Row gap={4} align="stretch" className="h-32 border">
          <Box className="flex-1">Stretched</Box>
          <Box className="flex-1">Stretched</Box>
          <Box className="flex-1">Stretched</Box>
        </Row>
      </div>
    </div>
  ),
};

export const Justification = {
  args: {},
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">justify="start"</p>
        <Row gap={4} justify="start" className="border">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
        </Row>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">justify="center"</p>
        <Row gap={4} justify="center" className="border">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
        </Row>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">justify="end"</p>
        <Row gap={4} justify="end" className="border">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
        </Row>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">justify="between"</p>
        <Row gap={4} justify="between" className="border">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Row>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">justify="around"</p>
        <Row gap={4} justify="around" className="border">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Row>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">justify="evenly"</p>
        <Row gap={4} justify="evenly" className="border">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Row>
      </div>
    </div>
  ),
};

export const Wrapping = {
  args: {},
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">wrap="nowrap" (default)</p>
        <Row gap={4} wrap="nowrap" className="w-96 border">
          <Box className="w-32">Item 1</Box>
          <Box className="w-32">Item 2</Box>
          <Box className="w-32">Item 3</Box>
          <Box className="w-32">Item 4</Box>
        </Row>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">wrap="wrap"</p>
        <Row gap={4} wrap="wrap" className="w-96 border">
          <Box className="w-32">Item 1</Box>
          <Box className="w-32">Item 2</Box>
          <Box className="w-32">Item 3</Box>
          <Box className="w-32">Item 4</Box>
        </Row>
      </div>
    </div>
  ),
};

export const WithPadding = {
  args: {},
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">p={4}</p>
        <Row gap={4} p={4} className="border bg-muted/50">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Row>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">
          px={8} py={4}
        </p>
        <Row gap={4} px={8} py={4} className="border bg-muted/50">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Row>
      </div>
    </div>
  ),
};

export const WithMargin = {
  args: {},
  render: () => (
    <div className="border bg-muted/20">
      <Row gap={4} m={4} className="bg-background">
        <Box>With margin</Box>
        <Box>All around</Box>
      </Row>
    </div>
  ),
};

export const Overflow = {
  args: {},
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">overflow="auto" (scrollable)</p>
        <Row gap={4} overflow="auto" className="h-32 w-96 border">
          <Box className="w-64 shrink-0">Wide Item 1</Box>
          <Box className="w-64 shrink-0">Wide Item 2</Box>
          <Box className="w-64 shrink-0">Wide Item 3</Box>
        </Row>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">overflow="hidden" (clipped)</p>
        <Row gap={4} overflow="hidden" className="h-32 w-96 border">
          <Box className="w-64 shrink-0">Wide Item 1</Box>
          <Box className="w-64 shrink-0">Wide Item 2</Box>
          <Box className="w-64 shrink-0">Wide Item 3</Box>
        </Row>
      </div>
    </div>
  ),
};

export const ResponsiveExample = {
  args: {},
  render: () => (
    <Row gap={4} p={4} className="border">
      <Box className="flex-1">Flex Item 1</Box>
      <Box className="flex-1">Flex Item 2</Box>
      <Box className="flex-1">Flex Item 3</Box>
    </Row>
  ),
};

export const NestedLayout = {
  args: {},
  render: () => (
    <Row gap={4} p={4} className="border">
      <Row gap={2} p={2} className="flex-1 border">
        <Box>A1</Box>
        <Box>A2</Box>
      </Row>
      <Row gap={2} p={2} className="flex-1 border">
        <Box>B1</Box>
        <Box>B2</Box>
        <Box>B3</Box>
      </Row>
    </Row>
  ),
};

export const CombinedPropsExample = {
  args: {},
  render: () => (
    <Row gap={4} p={6} align="center" justify="between" className="rounded-lg border bg-muted/50">
      <Box>Left Content</Box>
      <Box>Center Content</Box>
      <Box>Right Content</Box>
    </Row>
  ),
};
