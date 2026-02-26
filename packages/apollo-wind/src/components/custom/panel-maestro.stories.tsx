import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Panel } from './panel-maestro';

const meta = {
  title: 'Components/UiPath/Panel (Maestro)',
  component: Panel,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

function SampleNav() {
  return (
    <nav className="flex flex-col gap-1 px-2 pt-2">
      {['Dashboard', 'Projects', 'Tasks', 'Settings', 'Reports'].map((label, i) => (
        <button
          key={i}
          className="flex h-9 items-center rounded-lg px-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground first:bg-surface-hover first:text-foreground"
        >
          <span className="truncate">{label}</span>
        </button>
      ))}
    </nav>
  );
}

function PanelDemo({ side }: { side: 'left' | 'right' }) {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <div className="future-dark flex h-[500px] bg-surface-raised">
      {side === 'left' && (
        <Panel side="left" isCollapsed={collapsed} onToggle={() => setCollapsed(!collapsed)}>
          <SampleNav />
        </Panel>
      )}
      <div className="flex flex-1 items-center justify-center text-sm text-foreground-muted">
        Content area
      </div>
      {side === 'right' && (
        <Panel side="right" isCollapsed={collapsed} onToggle={() => setCollapsed(!collapsed)}>
          <div className="p-4 text-sm text-foreground-muted">Right panel content</div>
        </Panel>
      )}
    </div>
  );
}

export const LeftPanel: Story = {
  render: () => <PanelDemo side="left" />,
};

export const RightPanel: Story = {
  render: () => <PanelDemo side="right" />,
};
