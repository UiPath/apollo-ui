import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, Grid, GridItem } from './grid-maestro';

const meta = {
  title: 'Components/UiPath/Grid (Maestro)',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function SampleCard({ label }: { label: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-xl border border-future-border-subtle bg-future-surface p-6 text-sm font-medium text-future-foreground-muted">
      {label}
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <div className="future-dark">
      <Canvas>
        <Grid>
          <GridItem><SampleCard label="Column 1" /></GridItem>
          <GridItem><SampleCard label="Column 2" /></GridItem>
          <GridItem><SampleCard label="Column 3" /></GridItem>
          <GridItem><SampleCard label="Column 4" /></GridItem>
        </Grid>
      </Canvas>
    </div>
  ),
};
