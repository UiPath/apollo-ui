import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, AvatarFallback } from './avatar';
import { Bubble, BubbleContent } from './bubble';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from './message';
import { MessageActionCopy, MessageActionFeedback, MessageActions } from './message-actions';

const meta: Meta<typeof Message> = {
  title: 'Chat/Components/Message',
  component: Message,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'One conversation turn: an optional avatar, then a column with a header, the body (usually a Bubble) and a footer. Set align="end" for the current user. Pair with MessageScroller for the list and Bubble for the surface.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[420px] rounded-xl border border-border-subtle bg-card p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Assistant: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A MessageActions bar goes inside MessageContent after the body, so it follows the message alignment. The avatar stays level with the bubble.',
      },
    },
  },
  render: () => (
    <Message align="start">
      <MessageAvatar>
        <Avatar>
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      </MessageAvatar>
      <MessageContent>
        <MessageHeader>Autopilot</MessageHeader>
        <Bubble variant="muted">
          <BubbleContent>
            I found 3 invoices in that batch. Want me to summarize them?
          </BubbleContent>
        </Bubble>
        <MessageFooter>Just now</MessageFooter>
        <MessageActions>
          <MessageActionCopy text="I found 3 invoices in that batch. Want me to summarize them?" />
          <MessageActionFeedback />
        </MessageActions>
      </MessageContent>
    </Message>
  ),
};

export const User: Story = {
  render: () => (
    <Message align="end">
      <MessageContent>
        <Bubble align="end">
          <BubbleContent>Yes, go ahead.</BubbleContent>
        </Bubble>
        <MessageFooter>Sent 9:41</MessageFooter>
      </MessageContent>
    </Message>
  ),
};

export const Grouped: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'MessageGroup stacks consecutive turns from the same sender with a tighter gap. The avatar and header appear once, on the first turn.',
      },
    },
  },
  render: () => (
    <MessageGroup>
      <Message align="start">
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Autopilot</MessageHeader>
          <Bubble variant="muted">
            <BubbleContent>Invoice #4021 ($1,240) is within policy.</BubbleContent>
          </Bubble>
          <Bubble variant="muted">
            <BubbleContent>Invoice #4022 ($860) is within policy.</BubbleContent>
          </Bubble>
          <Bubble variant="muted">
            <BubbleContent>
              Invoice #4023 ($5,600) exceeds the auto-approval threshold and needs manual review.
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageGroup>
  ),
};
