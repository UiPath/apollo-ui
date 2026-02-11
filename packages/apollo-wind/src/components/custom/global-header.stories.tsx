import type { Meta, StoryObj } from '@storybook/react-vite';
import { cn } from '@/lib';
import { MaestroHeader } from './global-header';
import { SquareMenu, ChevronDown } from 'lucide-react';
import * as React from 'react';

const meta = {
  title: 'Components/UiPath/Global Header',
  component: MaestroHeader,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof MaestroHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

function SampleMenuNav() {
  const [moreOpen, setMoreOpen] = React.useState(false);
  return (
    <nav className="flex flex-1 flex-col overflow-y-auto px-2 pt-2">
      <div className="flex flex-col gap-1">
        {['Home', 'Projects', 'Tasks', 'Settings', 'Reports'].map((label, i) => (
          <button
            key={i}
            className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-future-foreground-muted transition-colors hover:bg-future-surface-hover hover:text-future-foreground first:bg-future-surface-hover first:text-future-foreground"
          >
            <SquareMenu className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
      <div className="my-2 border-t border-future-border-subtle" />
      <div className="flex flex-col gap-1">
        <button
          className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-future-foreground-muted transition-colors hover:bg-future-surface-hover hover:text-future-foreground"
          onClick={() => setMoreOpen((prev) => !prev)}
        >
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
          <span className="truncate">More</span>
        </button>
        {moreOpen && (
          <div className="flex flex-col gap-1 pl-2">
            {['Analytics', 'Integrations', 'API Keys', 'Audit Log', 'Help'].map((label, i) => (
              <button
                key={i}
                className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-future-foreground-muted transition-colors hover:bg-future-surface-hover hover:text-future-foreground"
              >
                <SquareMenu className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

export const Dark: Story = {
  render: () => (
    <div className="future-dark bg-future-surface">
      <MaestroHeader
        theme="dark"
        title="Autopilot"
        tenantName="Acme Corp"
        menuContent={<SampleMenuNav />}
      />
    </div>
  ),
};

export const Light: Story = {
  render: () => (
    <div className="future-light bg-future-surface">
      <MaestroHeader
        theme="light"
        title="Autopilot"
        tenantName="Acme Corp"
        menuContent={<SampleMenuNav />}
      />
    </div>
  ),
};
