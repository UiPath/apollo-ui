import type { Meta } from '@storybook/react-vite';
import { Column } from './column';

const meta = {
  title: 'Design System/Layout/Column',
  component: Column,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Column>;

export default meta;

const Box = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-md border bg-primary/10 p-4 text-center ${className}`}>{children}</div>
);

export const Default = {
  args: {},
  render: () => (
    <Column gap={4}>
      <Box>Item 1</Box>
      <Box>Item 2</Box>
      <Box>Item 3</Box>
    </Column>
  ),
};

export const WithGap = {
  args: {},
  render: () => (
    <div className="flex gap-8">
      <div>
        <p className="mb-2 text-sm font-medium">gap={2}</p>
        <Column gap={2}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Column>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">gap={4}</p>
        <Column gap={4}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Column>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">gap={8}</p>
        <Column gap={8}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Column>
      </div>
    </div>
  ),
};

export const Alignment = {
  args: {},
  render: () => (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <p className="mb-2 text-sm font-medium">align="start"</p>
        <Column gap={4} align="start" className="w-64 border">
          <Box className="w-20">Small</Box>
          <Box className="w-32">Medium</Box>
          <Box className="w-16">Tiny</Box>
        </Column>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">align="center"</p>
        <Column gap={4} align="center" className="w-64 border">
          <Box className="w-20">Small</Box>
          <Box className="w-32">Medium</Box>
          <Box className="w-16">Tiny</Box>
        </Column>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">align="end"</p>
        <Column gap={4} align="end" className="w-64 border">
          <Box className="w-20">Small</Box>
          <Box className="w-32">Medium</Box>
          <Box className="w-16">Tiny</Box>
        </Column>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">align="stretch"</p>
        <Column gap={4} align="stretch" className="w-64 border">
          <Box>Stretched</Box>
          <Box>Stretched</Box>
          <Box>Stretched</Box>
        </Column>
      </div>
    </div>
  ),
};

export const Justification = {
  args: {},
  render: () => (
    <div className="grid grid-cols-3 gap-8">
      <div>
        <p className="mb-2 text-sm font-medium">justify="start"</p>
        <Column gap={4} justify="start" className="h-96 border">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
        </Column>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">justify="center"</p>
        <Column gap={4} justify="center" className="h-96 border">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
        </Column>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">justify="end"</p>
        <Column gap={4} justify="end" className="h-96 border">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
        </Column>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">justify="between"</p>
        <Column gap={4} justify="between" className="h-96 border">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Column>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">justify="around"</p>
        <Column gap={4} justify="around" className="h-96 border">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Column>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">justify="evenly"</p>
        <Column gap={4} justify="evenly" className="h-96 border">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Column>
      </div>
    </div>
  ),
};

export const WithPadding = {
  args: {},
  render: () => (
    <div className="flex gap-8">
      <div>
        <p className="mb-2 text-sm font-medium">p={4}</p>
        <Column gap={4} p={4} className="border bg-muted/50">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Column>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">
          px={8} py={4}
        </p>
        <Column gap={4} px={8} py={4} className="border bg-muted/50">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Column>
      </div>
    </div>
  ),
};

export const WithHeight = {
  args: {},
  render: () => (
    <div className="flex gap-8">
      <div>
        <p className="mb-2 text-sm font-medium">h={64}</p>
        <Column gap={4} h={64} className="border">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
        </Column>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">h="full" (parent height)</p>
        <div className="h-64">
          <Column gap={4} h="full" className="border">
            <Box className="flex-1">Item 1</Box>
            <Box className="flex-1">Item 2</Box>
            <Box className="flex-1">Item 3</Box>
          </Column>
        </div>
      </div>
    </div>
  ),
};

export const Overflow = {
  args: {},
  render: () => (
    <div className="flex gap-8">
      <div>
        <p className="mb-2 text-sm font-medium">overflow="auto"</p>
        <Column gap={4} overflow="auto" className="h-48 w-64 border">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
          <Box>Item 4</Box>
          <Box>Item 5</Box>
          <Box>Item 6</Box>
          <Box>Item 7</Box>
          <Box>Item 8</Box>
        </Column>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">overflow="hidden"</p>
        <Column gap={4} overflow="hidden" className="h-48 w-64 border">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
          <Box>Item 4</Box>
          <Box>Item 5</Box>
          <Box>Item 6</Box>
          <Box>Item 7</Box>
          <Box>Item 8</Box>
        </Column>
      </div>
    </div>
  ),
};

export const NestedLayout = {
  args: {},
  render: () => (
    <Column gap={4} p={4} className="border">
      <Box>Header</Box>
      <Column gap={2} p={2} className="flex-1 border">
        <Box>Content 1</Box>
        <Box>Content 2</Box>
        <Box>Content 3</Box>
      </Column>
      <Box>Footer</Box>
    </Column>
  ),
};

export const Sidebar = {
  args: {},
  render: () => (
    <div className="flex h-screen">
      <Column gap={4} p={6} className="w-64 border-r bg-muted/30">
        <Box>Logo</Box>
        <Column gap={2} className="flex-1">
          <Box>Nav Item 1</Box>
          <Box>Nav Item 2</Box>
          <Box>Nav Item 3</Box>
          <Box>Nav Item 4</Box>
        </Column>
        <Box>Settings</Box>
      </Column>
    </div>
  ),
};

export const FormLayout = {
  args: {},
  render: () => (
    <Column gap={6} p={6} maxW={96} className="border">
      <div>
        <h2 className="text-xl font-bold">Form Title</h2>
        <p className="text-sm text-muted-foreground">Form description</p>
      </div>
      <Column gap={4}>
        <Box>Field 1</Box>
        <Box>Field 2</Box>
        <Box>Field 3</Box>
      </Column>
      <Column gap={2}>
        <Box>Submit Button</Box>
        <Box>Cancel Button</Box>
      </Column>
    </Column>
  ),
};

export const CombinedPropsExample = {
  args: {},
  render: () => (
    <Column
      gap={4}
      p={6}
      h={96}
      align="stretch"
      justify="between"
      className="rounded-lg border bg-muted/50"
    >
      <Box>Top Content</Box>
      <Box className="flex-1">Main Content (Grows)</Box>
      <Box>Bottom Content</Box>
    </Column>
  ),
};
