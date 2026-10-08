import type { Meta, StoryObj } from '@storybook/react-vite';
import { Flag, Pencil, RefreshCw, Share2, Trash2, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from './avatar';
import { Bubble, BubbleContent } from './bubble';
import { Message, MessageAvatar, MessageContent } from './message';
import {
  MessageActionCopy,
  MessageActionFeedback,
  type MessageActionItem,
  MessageActions,
  type MessageFeedbackValue,
} from './message-actions';

const meta: Meta<typeof MessageActions> = {
  title: 'Chat/Components/Message Actions',
  component: MessageActions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The toolbar under a message. Place it inside MessageContent after the body so it follows the message alignment. Children render as given: use MessageActionCopy, MessageActionFeedback or any MessageAction. Host actions passed as data through the actions prop render after them, and any beyond maxVisible move into a More menu. With visibility="hover" the bar appears when the message is hovered or focused, and stays visible on touch devices.',
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

const ANSWER =
  'Invoice #4023 ($5,600) exceeds the auto-approval threshold and needs manual review.';

function AssistantTurn({ children }: { children: React.ReactNode }) {
  return (
    <Message align="start">
      <MessageAvatar>
        <Avatar>
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      </MessageAvatar>
      <MessageContent>
        <Bubble variant="muted">
          <BubbleContent>{ANSWER}</BubbleContent>
        </Bubble>
        {children}
      </MessageContent>
    </Message>
  );
}

const log = (name: string) => () => console.info(`[message-actions] ${name}`);

const HOST_ACTIONS: MessageActionItem[] = [
  { id: 'regenerate', label: 'Regenerate', icon: <RefreshCw />, onSelect: log('regenerate') },
  { id: 'read-aloud', label: 'Read aloud', icon: <Volume2 />, onSelect: log('read-aloud') },
  { id: 'share', label: 'Share', icon: <Share2 />, onSelect: log('share') },
  { id: 'report', label: 'Report', icon: <Flag />, onSelect: log('report') },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 />,
    onSelect: log('delete'),
    destructive: true,
  },
];

export const AlwaysVisible: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The default. Use it for the latest assistant answer so the actions are discoverable without hovering.',
      },
    },
  },
  render: () => (
    <AssistantTurn>
      <MessageActions>
        <MessageActionCopy text={ANSWER} />
      </MessageActions>
    </AssistantTurn>
  ),
};

export const OnHover: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Hover the message or tab into it to reveal the bar. It stays visible while one of its menus is open, and on devices without hover it is always shown.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-6">
      {[1, 2].map((turn) => (
        <AssistantTurn key={turn}>
          <MessageActions visibility="hover">
            <MessageActionCopy text={ANSWER} />
            <MessageActionFeedback />
          </MessageActions>
        </AssistantTurn>
      ))}
    </div>
  ),
};

export const WithFeedback: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Thumbs up and down are toggles with aria-pressed. Pressing the active one again clears the rating. Pass value and onChange to control it.',
      },
    },
  },
  render: function WithFeedbackStory() {
    const [value, setValue] = useState<MessageFeedbackValue>(null);
    return (
      <div className="flex flex-col gap-3">
        <AssistantTurn>
          <MessageActions>
            <MessageActionCopy text={ANSWER} />
            <MessageActionFeedback value={value} onChange={setValue} />
          </MessageActions>
        </AssistantTurn>
        <p className="text-xs text-muted-foreground">Rating: {value ?? 'none'}</p>
      </div>
    );
  },
};

export const WithOverflow: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Host actions go in as data. With maxVisible={1}, the first shows as a button and the rest move into the More menu. Destructive items are tinted.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-6">
      <AssistantTurn>
        <MessageActions actions={HOST_ACTIONS} maxVisible={1}>
          <MessageActionCopy text={ANSWER} />
          <MessageActionFeedback />
        </MessageActions>
      </AssistantTurn>
      <Message align="end">
        <MessageContent>
          <Bubble align="end">
            <BubbleContent>Show me the invoices over the threshold.</BubbleContent>
          </Bubble>
          <MessageActions
            actions={[{ id: 'edit', label: 'Edit', icon: <Pencil />, onSelect: log('edit') }]}
          >
            <MessageActionCopy text="Show me the invoices over the threshold." />
          </MessageActions>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const Strings: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Every label comes from a strings prop, so a host can localise the toolbar name, the More menu, the copy button and the feedback toggles.',
      },
    },
  },
  render: () => (
    <AssistantTurn>
      <MessageActions
        actions={HOST_ACTIONS.slice(0, 3)}
        maxVisible={0}
        strings={{ label: 'Nachrichtenaktionen', more: 'Weitere Aktionen' }}
      >
        <MessageActionCopy text={ANSWER} strings={{ copy: 'Kopieren', copied: 'Kopiert' }} />
        <MessageActionFeedback
          strings={{
            label: 'Antwort bewerten',
            helpful: 'Hilfreich',
            notHelpful: 'Nicht hilfreich',
          }}
        />
      </MessageActions>
    </AssistantTurn>
  ),
};
