import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bubble, BubbleContent } from './bubble';
import { LoadingDots } from './loading-dots';
import { Message, MessageContent } from './message';

const meta: Meta<typeof LoadingDots> = {
  title: 'Chat/Components/Loading Dots',
  component: LoadingDots,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Three dots with a staggered bounce for short waits in a conversation, such as loading older messages. The dots use the current text colour and hold still under reduced motion. The status is named by strings.label (default "Loading").',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
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

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <LoadingDots size="sm" />
      <LoadingDots size="md" />
      <LoadingDots size="lg" />
    </div>
  ),
};

const history = [
  { id: 'a', align: 'end', text: 'Can you check the March batch too?' },
  { id: 'b', align: 'start', text: 'Sure. March has 12 invoices, 2 of them overdue.' },
  { id: 'c', align: 'end', text: 'Send reminders for the overdue ones.' },
] as const;

export const InContext: Story = {
  name: 'In context',
  parameters: {
    docs: {
      description: {
        story:
          'Centred above the transcript while older messages load after the reader scrolls to the top.',
      },
    },
  },
  render: () => (
    <>
      <div className="flex justify-center py-1">
        <LoadingDots strings={{ label: 'Loading older messages' }} />
      </div>
      {history.map((item) => (
        <Message key={item.id} align={item.align}>
          <MessageContent>
            <Bubble align={item.align} variant={item.align === 'end' ? 'default' : 'muted'}>
              <BubbleContent>{item.text}</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      ))}
    </>
  ),
};
