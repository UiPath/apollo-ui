import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, AvatarFallback } from './avatar';
import { Bubble, BubbleContent } from './bubble';
import { Message, MessageAvatar, MessageContent, MessageHeader } from './message';
import { ThinkingIndicator } from './thinking-indicator';

const meta: Meta<typeof ThinkingIndicator> = {
  title: 'Chat/Components/Thinking Indicator',
  component: ThinkingIndicator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Shows that the assistant is working before the first token arrives: a pulsing sparkle and a shimmering label. Pass messages to cycle through progress labels. Screen readers hear one stable name from label (or strings.label), not every rotation. Use LiveRegion to announce real progress.',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    interval: { control: { type: 'number', min: 500, step: 250 } },
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

export const Rotating: Story = {
  args: {
    messages: [
      'Reading your request',
      'Searching invoices',
      'Comparing totals',
      'Drafting a reply',
    ],
    interval: 2500,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Each label stays for interval ms (2500 by default) and crossfades into the next. The row keeps the width of the longest label so nothing around it shifts.',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <>
      <ThinkingIndicator size="sm" label="Small" />
      <ThinkingIndicator size="md" label="Medium" />
    </>
  ),
};

export const ReducedMotion: Story = {
  args: {
    messages: ['Reading your request', 'Searching invoices'],
  },
  parameters: {
    docs: {
      description: {
        story:
          'With prefers-reduced-motion set, the sparkle stops pulsing, the shimmer becomes plain text and the label stays on the first message. Turn on reduced motion in your OS, or emulate it in browser dev tools, to check.',
      },
    },
  },
};

export const InMessage: Story = {
  name: 'In a message',
  parameters: {
    docs: {
      description: {
        story:
          'Placed in an assistant turn while the reply is pending, then replaced by the Bubble once text streams in.',
      },
    },
  },
  render: () => (
    <>
      <Message align="end">
        <MessageContent>
          <Bubble align="end">
            <BubbleContent>Which invoices from last week are still unpaid?</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message align="start">
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Autopilot</MessageHeader>
          <ThinkingIndicator
            className="px-3"
            messages={['Searching invoices', 'Checking status']}
          />
        </MessageContent>
      </Message>
    </>
  ),
};

export const Strings: Story = {
  args: {
    strings: { label: 'Réflexion' },
  },
  parameters: {
    docs: {
      description: {
        story:
          'strings.label replaces the default "Thinking". It is both the visible label and the accessible name when no label or messages are passed.',
      },
    },
  },
};
