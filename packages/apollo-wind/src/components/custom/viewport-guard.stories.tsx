import type { Meta, StoryObj } from '@storybook/react-vite';
import { useViewportAtOrAbove, ViewportGuard } from './viewport-guard';

const meta = {
  title: 'Components/UiPath/Viewport Guard',
  component: ViewportGuard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ViewportGuard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Helpers
// ============================================================================

function GatedContent({ minWidth }: { minWidth: number }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 bg-surface p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground">Guarded content</h1>
      <p className="max-w-md text-sm text-foreground-muted">
        This content is only visible when the viewport is at least {minWidth}px wide. Resize the
        browser window (or use the Storybook viewport toolbar) below that width to see the overlay
        take over.
      </p>
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  name: 'Default (769px threshold)',
  render: () => (
    <div className="dark">
      <ViewportGuard minWidth={769}>
        <GatedContent minWidth={769} />
      </ViewportGuard>
    </div>
  ),
};

export const CustomMessage: Story = {
  name: 'Custom message',
  render: () => (
    <div className="dark">
      <ViewportGuard
        minWidth={1024}
        message="The Studio workspace needs a wider screen. Please expand your browser window to at least 1024px."
      >
        <GatedContent minWidth={1024} />
      </ViewportGuard>
    </div>
  ),
};

function ViewportHookDemo() {
  const isWide = useViewportAtOrAbove(1024);
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 bg-surface p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground">useViewportAtOrAbove(1024)</h1>
      <p className="text-sm text-foreground-muted">
        Current result: <span className="font-semibold text-foreground">{String(isWide)}</span>.
        Resize the viewport across 1024px to watch it flip.
      </p>
    </div>
  );
}

export const HookUsage: Story = {
  name: 'Hook: useViewportAtOrAbove',
  render: () => (
    <div className="dark">
      <ViewportHookDemo />
    </div>
  ),
};
