import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckCircle2, Info, UserPlus } from 'lucide-react';
import { Marker, MarkerContent, MarkerIcon } from './marker';

const meta: Meta<typeof Marker> = {
  title: 'Chat/Components/Marker',
  component: Marker,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A status line inside a conversation: a system note, a labelled separator between days or sessions, or a bordered row. It is not a message, so it has no avatar or bubble.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="flex w-[420px] flex-col gap-4 rounded-xl border border-border-subtle bg-card p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Marker>
      <MarkerIcon>
        <Info />
      </MarkerIcon>
      <MarkerContent>Autopilot can make mistakes. Check important information.</MarkerContent>
    </Marker>
  ),
};

export const Separator: Story = {
  render: () => (
    <>
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>New messages</MarkerContent>
      </Marker>
    </>
  ),
};

export const Border: Story = {
  render: () => (
    <>
      <Marker variant="border">
        <MarkerIcon>
          <UserPlus />
        </MarkerIcon>
        <MarkerContent>Maria joined the conversation.</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerIcon>
          <CheckCircle2 />
        </MarkerIcon>
        <MarkerContent>
          Invoices approved. <a href="#queue">Open the queue</a>
        </MarkerContent>
      </Marker>
    </>
  ),
};
