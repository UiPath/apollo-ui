import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@uipath/apollo-wind';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CanvasTakeoverModal } from './CanvasTakeoverModal';

const meta: Meta<typeof CanvasTakeoverModal> = {
  title: 'Components/Controls/CanvasTakeoverModal',
  component: CanvasTakeoverModal,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    children: { control: false },
    sidebar: { control: false },
    headerActions: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof CanvasTakeoverModal>;

function StoryCanvas({ withSidebar }: { withSidebar: boolean }) {
  const [open, setOpen] = useState(true);

  const sidebar = withSidebar ? (
    <div className="p-2">
      <div className="flex h-11 items-center justify-between px-2">
        <span className="text-sm font-semibold">Title</span>
        <button
          type="button"
          className="grid size-7 place-items-center rounded-md text-foreground-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          aria-label="Add"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  ) : undefined;

  return (
    <div className="relative h-screen min-h-[560px] overflow-hidden bg-surface">
      <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_center,var(--color-surface-overlay)_1px,transparent_1px)] bg-[length:20px_20px]">
        {!open && <Button onClick={() => setOpen(true)}>Open takeover modal</Button>}
      </div>
      <CanvasTakeoverModal open={open} onOpenChange={setOpen} title="Modal title" sidebar={sidebar}>
        <div className="flex h-full min-h-[360px] flex-col">
          <div className="flex min-h-14 items-center justify-between border-b border-border-subtle px-5">
            <div>
              <p className="text-sm font-semibold">Title</p>
              <p className="text-xs text-foreground-subtle">Subtext</p>
            </div>
            <Button variant="secondary" size="sm">
              Action
            </Button>
          </div>
          <div className="min-h-0 flex-1" />
        </div>
      </CanvasTakeoverModal>
    </div>
  );
}

export const WithSidebar: Story = {
  render: () => <StoryCanvas withSidebar />,
};

export const WithoutSidebar: Story = {
  render: () => <StoryCanvas withSidebar={false} />,
};
