import type { Meta } from "@storybook/react-vite";
import { Grid } from "./grid";

const meta = {
  title: "Design System/Layout/Grid",
  component: Grid,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Grid>;

export default meta;

const Box = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-md border bg-primary/10 p-4 text-center ${className}`}>{children}</div>
);

export const Default = {
  args: {},
  render: () => (
    <Grid cols={3} gap={4}>
      <Box>Item 1</Box>
      <Box>Item 2</Box>
      <Box>Item 3</Box>
      <Box>Item 4</Box>
      <Box>Item 5</Box>
      <Box>Item 6</Box>
    </Grid>
  ),
};

export const DifferentColumns = {
  args: {},
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-sm font-medium">cols={2}</p>
        <Grid cols={2} gap={4}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
          <Box>Item 4</Box>
        </Grid>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">cols={3}</p>
        <Grid cols={3} gap={4}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
          <Box>Item 4</Box>
          <Box>Item 5</Box>
          <Box>Item 6</Box>
        </Grid>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">cols={4}</p>
        <Grid cols={4} gap={4}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
          <Box>Item 4</Box>
          <Box>Item 5</Box>
          <Box>Item 6</Box>
          <Box>Item 7</Box>
          <Box>Item 8</Box>
        </Grid>
      </div>
    </div>
  ),
};

export const WithGap = {
  args: {},
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-sm font-medium">gap={2}</p>
        <Grid cols={3} gap={2}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Grid>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">gap={4}</p>
        <Grid cols={3} gap={4}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Grid>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">gap={8}</p>
        <Grid cols={3} gap={8}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Grid>
      </div>
    </div>
  ),
};

export const CustomGaps = {
  args: {},
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-sm font-medium">
          gapX={8} gapY={2}
        </p>
        <Grid cols={3} gapX={8} gapY={2}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
          <Box>Item 4</Box>
          <Box>Item 5</Box>
          <Box>Item 6</Box>
        </Grid>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">
          gapX={2} gapY={8}
        </p>
        <Grid cols={3} gapX={2} gapY={8}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
          <Box>Item 4</Box>
          <Box>Item 5</Box>
          <Box>Item 6</Box>
        </Grid>
      </div>
    </div>
  ),
};

export const CustomTemplate = {
  args: {},
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-sm font-medium">cols="repeat(auto-fit, minmax(200px, 1fr))"</p>
        <Grid cols="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
          <Box>Item 4</Box>
          <Box>Item 5</Box>
          <Box>Item 6</Box>
        </Grid>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">cols="1fr 2fr 1fr"</p>
        <Grid cols="1fr 2fr 1fr" gap={4}>
          <Box>Narrow</Box>
          <Box>Wide</Box>
          <Box>Narrow</Box>
        </Grid>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">cols="200px 1fr 200px"</p>
        <Grid cols="200px 1fr 200px" gap={4}>
          <Box>200px</Box>
          <Box>Flexible</Box>
          <Box>200px</Box>
        </Grid>
      </div>
    </div>
  ),
};

export const WithRows = {
  args: {},
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-sm font-medium">
          cols={3} rows={2}
        </p>
        <Grid cols={3} rows={2} gap={4}>
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
          <Box>Item 4</Box>
          <Box>Item 5</Box>
          <Box>Item 6</Box>
        </Grid>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">rows="100px 1fr 100px"</p>
        <Grid rows="100px 1fr 100px" gap={4} className="h-96">
          <Box>Header (100px)</Box>
          <Box>Content (Flexible)</Box>
          <Box>Footer (100px)</Box>
        </Grid>
      </div>
    </div>
  ),
};

export const WithPadding = {
  args: {},
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-sm font-medium">p={4}</p>
        <Grid cols={3} gap={4} p={4} className="border bg-muted/50">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Grid>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">
          px={8} py={4}
        </p>
        <Grid cols={3} gap={4} px={8} py={4} className="border bg-muted/50">
          <Box>Item 1</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
        </Grid>
      </div>
    </div>
  ),
};

export const AutoFlow = {
  args: {},
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-sm font-medium">autoFlow="row" (default)</p>
        <Grid cols={3} gap={4} autoFlow="row" className="border">
          <Box className="col-span-2">Spans 2 cols</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
          <Box>Item 4</Box>
        </Grid>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">autoFlow="dense"</p>
        <Grid cols={3} gap={4} autoFlow="dense" className="border">
          <Box className="col-span-2">Spans 2 cols</Box>
          <Box>Item 2</Box>
          <Box>Item 3</Box>
          <Box>Item 4</Box>
        </Grid>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">autoFlow="column"</p>
        <Grid cols={3} rows={2} gap={4} autoFlow="column" className="border">
          <Box>1</Box>
          <Box>2</Box>
          <Box>3</Box>
          <Box>4</Box>
          <Box>5</Box>
          <Box>6</Box>
        </Grid>
      </div>
    </div>
  ),
};

export const DashboardLayout = {
  args: {},
  render: () => (
    <Grid cols={4} rows={3} gap={4} className="h-[600px]">
      <Box className="col-span-4">Header</Box>
      <Box className="row-span-2">Sidebar</Box>
      <Box className="col-span-2 row-span-2">Main Content</Box>
      <Box className="row-span-2">Right Panel</Box>
      <Box className="col-span-4">Footer</Box>
    </Grid>
  ),
};

export const PhotoGrid = {
  args: {},
  render: () => (
    <Grid cols={3} gap={4}>
      <Box className="h-32">Photo 1</Box>
      <Box className="col-span-2 h-32">Photo 2 (Wide)</Box>
      <Box className="row-span-2 h-64">Photo 3 (Tall)</Box>
      <Box className="h-32">Photo 4</Box>
      <Box className="h-32">Photo 5</Box>
      <Box className="col-span-2 h-32">Photo 6 (Wide)</Box>
      <Box className="h-32">Photo 7</Box>
    </Grid>
  ),
};

export const CardGrid = {
  args: {},
  render: () => (
    <Grid cols={3} gap={6} p={6} className="border">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <Box key={i} className="h-40">
          Card {i}
        </Box>
      ))}
    </Grid>
  ),
};

export const ResponsiveGrid = {
  args: {},
  render: () => (
    <Grid cols="repeat(auto-fill, minmax(250px, 1fr))" gap={4} p={4} className="border">
      <Box>Responsive 1</Box>
      <Box>Responsive 2</Box>
      <Box>Responsive 3</Box>
      <Box>Responsive 4</Box>
      <Box>Responsive 5</Box>
      <Box>Responsive 6</Box>
    </Grid>
  ),
};

export const ComplexLayout = {
  args: {},
  render: () => (
    <Grid cols="200px 1fr 200px" rows="auto 1fr auto" gap={4} className="h-screen">
      <Box className="col-span-3">Top Bar</Box>
      <Box className="row-span-1">Left Sidebar</Box>
      <Grid cols={2} gap={4} className="p-4">
        <Box className="h-40">Content 1</Box>
        <Box className="h-40">Content 2</Box>
        <Box className="h-40">Content 3</Box>
        <Box className="h-40">Content 4</Box>
      </Grid>
      <Box className="row-span-1">Right Sidebar</Box>
      <Box className="col-span-3">Bottom Bar</Box>
    </Grid>
  ),
};

export const Overflow = {
  args: {},
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-sm font-medium">overflow="auto"</p>
        <Grid cols={5} gap={4} overflow="auto" className="h-48 w-96 border">
          {Array.from({ length: 20 }, (_, i) => (
            <Box key={i}>Item {i + 1}</Box>
          ))}
        </Grid>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">overflow="hidden"</p>
        <Grid cols={5} gap={4} overflow="hidden" className="h-48 w-96 border">
          {Array.from({ length: 20 }, (_, i) => (
            <Box key={i}>Item {i + 1}</Box>
          ))}
        </Grid>
      </div>
    </div>
  ),
};
