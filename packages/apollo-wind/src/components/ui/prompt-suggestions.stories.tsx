import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartLine, FileText, Mail, Search } from 'lucide-react';
import * as React from 'react';
import {
  ChatComposer,
  ChatComposerInputGroup,
  ChatComposerSubmit,
  ChatComposerTextarea,
  ChatComposerToolbar,
} from './chat-composer';
import { Label } from './label';
import { type PromptSuggestionItem, PromptSuggestions } from './prompt-suggestions';
import { Switch } from './switch';

const SUGGESTIONS: PromptSuggestionItem[] = [
  { label: 'Generate report', prompt: 'Create a quarterly sales report for Q3' },
  { label: 'Data analysis', prompt: 'Analyze customer engagement metrics' },
  { label: 'How can I use this feature?' },
];

const meta: Meta<typeof PromptSuggestions> = {
  title: 'Chat/Components/Prompt Suggestions',
  component: PromptSuggestions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Prompts the user can pick instead of typing. Each suggestion has a label and, when the text to send differs, a prompt, so a chat service suggestion passes straight in. onSelect receives the suggestion. Sending it or putting it in the composer is up to the caller. Chips stack vertically by default. The horizontal orientation keeps one row that scrolls with faded edges when it overflows.',
      },
    },
  },
  args: {
    suggestions: SUGGESTIONS,
  },
  decorators: [
    (Story) => (
      <div className="w-[480px] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The row scrolls once the chips outgrow the width. */
export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
    suggestions: [
      ...SUGGESTIONS,
      { label: 'Summarize my inbox' },
      { label: 'Draft a status update' },
    ],
  },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
};

export const WithIcons: Story = {
  args: {
    suggestions: [
      { label: 'Search the knowledge base', icon: <Search /> },
      { label: 'Summarize this document', icon: <FileText /> },
      { label: 'Chart last month', icon: <ChartLine /> },
      { label: 'Draft a reply', icon: <Mail /> },
    ],
  },
};

export const Compact: Story = {
  args: {
    density: 'compact',
  },
};

/** After a reply, a chat titles the group and slides it in. */
export const AfterAReply: Story = {
  args: {
    showLabel: true,
    animated: true,
  },
};

/** Long labels wrap inside their chip. */
export const LongLabels: Story = {
  args: {
    suggestions: [
      {
        label:
          'Compare the open invoices from Acme Corp against the purchase orders and flag mismatches',
      },
      { label: 'Find the highest CD rates' },
    ],
  },
};

function SendOrPrefillDemo() {
  const [sendOnClick, setSendOnClick] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [sent, setSent] = React.useState<string[]>([]);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const send = (value: string) => {
    setSent((log) => [...log, value]);
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Switch id="send-on-click" checked={sendOnClick} onCheckedChange={setSendOnClick} />
        <Label htmlFor="send-on-click">Send on click</Label>
      </div>
      {sent.length > 0 && (
        <ul className="space-y-1 text-sm text-muted-foreground">
          {sent.map((line, index) => (
            <li key={index}>Sent: {line}</li>
          ))}
        </ul>
      )}
      <PromptSuggestions
        suggestions={SUGGESTIONS}
        onSelect={({ label, prompt }) => {
          const text = prompt ?? label;
          if (sendOnClick) {
            send(text);
          } else {
            setDraft(text);
          }
          textareaRef.current?.focus();
        }}
      />
      <ChatComposer value={draft} onValueChange={setDraft} onSubmit={send}>
        <ChatComposerInputGroup>
          <ChatComposerTextarea ref={textareaRef} />
          <ChatComposerToolbar>
            <ChatComposerSubmit />
          </ChatComposerToolbar>
        </ChatComposerInputGroup>
      </ChatComposer>
    </div>
  );
}

/**
 * The two behaviours a chat offers: send the prompt at once, or put it in the composer to edit.
 * Either way focus moves to the composer.
 */
export const SendOrPrefill: Story = {
  render: () => <SendOrPrefillDemo />,
};
