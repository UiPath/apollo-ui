import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatComposer } from './chat-composer';

const meta = {
  title: 'Components/UiPath/Chat Composer',
  component: ChatComposer,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ChatComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="future-dark flex w-[900px] items-center justify-center bg-surface p-8">
      <ChatComposer placeholder="I would like you to automate my" />
    </div>
  ),
};
