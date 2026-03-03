import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { StudioPanel, StudioPanelSelection } from './panel-studio';

const meta = {
  title: 'Components/UiPath/Panel (Studio)',
  component: StudioPanel,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof StudioPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Sample panel views
// ============================================================================

function PanelView({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-foreground-muted">{description}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs text-foreground-muted">{title} content placeholder.</p>
      </div>
    </div>
  );
}

const views = [
  <PanelView key="nav" title="Navigation" description="Browse and organize your project." />,
  <PanelView key="layers" title="Layers" description="View and manage component layers." />,
  <PanelView key="assets" title="Assets" description="Reusable assets and resources." />,
];

// ============================================================================
// Interactive demo
// ============================================================================

function PanelDemo({ side }: { side: 'left' | 'right' }) {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(0);

  function handleIconClick(index: number) {
    setActiveIndex((prev) => (prev === index ? undefined : index));
  }

  const showPanel = activeIndex !== undefined;
  const content = activeIndex !== undefined ? (views[activeIndex] ?? views[0]) : null;

  const rail = (
    <StudioPanelSelection
      side={side}
      onIconClick={handleIconClick}
      activeIndex={activeIndex}
      className={side === 'left' ? 'border-r border-border-subtle' : 'border-l border-border-subtle'}
    />
  );

  const panel = showPanel && (
    <StudioPanel side={side}>{content}</StudioPanel>
  );

  return (
    <div className="future-dark flex h-[560px] bg-surface-raised">
      {side === 'left' && rail}
      {side === 'left' && panel}

      <div className="flex flex-1 items-center justify-center text-sm text-foreground-muted">
        Canvas area
      </div>

      {side === 'right' && panel}
      {side === 'right' && rail}
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

export const LeftPanel: Story = {
  name: 'Left panel',
  render: () => <PanelDemo side="left" />,
};

export const RightPanel: Story = {
  name: 'Right panel',
  render: () => <PanelDemo side="right" />,
};
