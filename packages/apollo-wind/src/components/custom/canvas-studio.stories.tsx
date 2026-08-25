import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioCanvas, StudioGrid, StudioGridItem } from './canvas-studio';

const meta = {
  title: 'Components/UiPath/Canvas (Studio)',
  component: StudioCanvas,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof StudioCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Helpers
// ============================================================================

function CardContent({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <span className="text-sm text-foreground-muted">{body}</span>
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  name: 'Default',
  render: () => (
    <div className="dark flex h-screen bg-surface">
      <StudioCanvas>
        <StudioGrid>
          <StudioGridItem>
            <CardContent
              title="Project overview"
              body="Full-width card spanning all 12 columns. Content is centered in a 760px column."
            />
          </StudioGridItem>
          <StudioGridItem cols={6}>
            <CardContent title="Runs" body="Half-width card, 6 of 12 columns." />
          </StudioGridItem>
          <StudioGridItem cols={6}>
            <CardContent title="Errors" body="Half-width card, 6 of 12 columns." />
          </StudioGridItem>
          <StudioGridItem cols={4}>
            <CardContent title="Queued" body="One third." />
          </StudioGridItem>
          <StudioGridItem cols={4}>
            <CardContent title="Running" body="One third." />
          </StudioGridItem>
          <StudioGridItem cols={4}>
            <CardContent title="Done" body="One third." />
          </StudioGridItem>
        </StudioGrid>
      </StudioCanvas>
    </div>
  ),
};

export const FullWidth: Story = {
  name: 'Full width',
  render: () => (
    <div className="dark flex h-screen bg-surface">
      <StudioCanvas fullWidth background="surface" padding="lg">
        <StudioGrid cols={3} gap="lg">
          <StudioGridItem cols={1} background="raised">
            <CardContent
              title="Full-width canvas"
              body="Content fills the available width instead of the centered 760px column. Use for data-dense layouts like tables."
            />
          </StudioGridItem>
          <StudioGridItem cols={1} background="raised">
            <CardContent title="Raised card" body="Elevated surface background." />
          </StudioGridItem>
          <StudioGridItem cols={1} background="transparent" border={false}>
            <CardContent title="Borderless" body="Transparent background, no border." />
          </StudioGridItem>
        </StudioGrid>
      </StudioCanvas>
    </div>
  ),
};

export const CanvasResponsive: Story = {
  name: 'Canvas responsive items',
  render: () => (
    <div className="dark flex h-screen bg-surface">
      <StudioCanvas fullWidth>
        <StudioGrid>
          {['Alpha', 'Beta', 'Gamma', 'Delta'].map((name) => (
            <StudioGridItem key={name} canvasResponsive>
              <CardContent
                title={name}
                body="Span follows the canvas width: full below 768px, half below 1024px, quarter above."
              />
            </StudioGridItem>
          ))}
        </StudioGrid>
      </StudioCanvas>
    </div>
  ),
};
