import type { Meta, StoryObj } from '@storybook/react-vite';
import { AtSign } from 'lucide-react';
import * as React from 'react';
import {
  ChatComposer,
  ChatComposerAttachButton,
  type ChatComposerAttachmentItem,
  ChatComposerAttachments,
  ChatComposerError,
  ChatComposerFooter,
  ChatComposerInputGroup,
  type ChatComposerProps,
  ChatComposerSubmit,
  ChatComposerTextarea,
  ChatComposerToolbar,
  useChatComposer,
} from './chat-composer';
import { DropzoneOverlay } from './dropzone-overlay';
import { type FileRejection, formatFileSize } from './file-validation';
import { InputGroupButton } from './input-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

const meta: Meta<typeof ChatComposer> = {
  title: 'Chat/Components/ChatComposer',
  component: ChatComposer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The prompt input of a chat. ChatComposer is the form and owns the draft, the status and the attachments; ChatComposerInputGroup, ChatComposerTextarea, ChatComposerToolbar, ChatComposerAttachButton, ChatComposerSubmit, ChatComposerAttachments, ChatComposerError and ChatComposerFooter read them from context. Enter sends and Shift+Enter starts a new line. While streaming, the submit button stops the response instead. The field shows a gradient edge from the agent tokens while the textarea has focus. Wrap a region in DropzoneOverlay to accept dropped or pasted files.',
      },
    },
  },
  decorators: [
    (Story) => (
      <TooltipProvider delayDuration={300}>
        <div className="w-[480px] max-w-full">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

function Fields({ onFiles }: { onFiles?: (accepted: File[]) => void }) {
  const { density } = useChatComposer();
  return (
    <ChatComposerInputGroup>
      <ChatComposerAttachments />
      <ChatComposerTextarea />
      <ChatComposerToolbar>
        <Tooltip>
          <TooltipTrigger asChild>
            <ChatComposerAttachButton onFiles={onFiles} />
          </TooltipTrigger>
          <TooltipContent>Attach files</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <InputGroupButton
              aria-label="Add resource reference"
              icon
              size={density === 'compact' ? '3xs' : '2xs'}
            >
              <AtSign />
            </InputGroupButton>
          </TooltipTrigger>
          <TooltipContent>Add resource</TooltipContent>
        </Tooltip>
        <ChatComposerSubmit />
      </ChatComposerToolbar>
    </ChatComposerInputGroup>
  );
}

function toItems(files: File[], state: ChatComposerAttachmentItem['state'] = 'done') {
  return files.map<ChatComposerAttachmentItem>((file) => ({
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    description: formatFileSize(file.size),
    state,
  }));
}

function SentLog({ sent }: { sent: string[] }) {
  if (sent.length === 0) return null;
  return (
    <ul className="mb-3 space-y-1 text-sm text-muted-foreground">
      {sent.map((line, index) => (
        <li key={index}>Sent: {line}</li>
      ))}
    </ul>
  );
}

function IdleDemo(props: Partial<ChatComposerProps>) {
  const [sent, setSent] = React.useState<string[]>([]);
  const [attachments, setAttachments] = React.useState<ChatComposerAttachmentItem[]>([]);
  return (
    <>
      <SentLog sent={sent} />
      <ChatComposer
        attachments={attachments}
        onRemoveAttachment={(item) =>
          setAttachments((list) => list.filter((entry) => entry.id !== item.id))
        }
        onSubmit={(value, { attachments: files }) => {
          setSent((log) => [
            ...log,
            files.length > 0 ? `${value} (${files.map((file) => file.name).join(', ')})` : value,
          ]);
          setAttachments([]);
        }}
        {...props}
      >
        <Fields onFiles={(accepted) => setAttachments((list) => [...list, ...toItems(accepted)])} />
        <ChatComposerFooter>
          Autopilot can make mistakes. Check important information.
        </ChatComposerFooter>
      </ChatComposer>
    </>
  );
}

/** Type and press Enter to send. Shift+Enter starts a new line. */
export const Idle: Story = {
  render: () => <IdleDemo />,
};

function StreamingDemo() {
  const [streaming, setStreaming] = React.useState(true);
  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">
        {streaming ? 'Autopilot is responding. Press stop to cancel.' : 'Stopped. Send to resume.'}
      </p>
      <ChatComposer
        status={streaming ? 'streaming' : 'idle'}
        onStop={() => setStreaming(false)}
        onSubmit={() => setStreaming(true)}
      >
        <Fields />
      </ChatComposer>
    </>
  );
}

/** While a response streams the submit button stops it, and Enter does not send. */
export const Streaming: Story = {
  render: () => <StreamingDemo />,
};

const INITIAL_ATTACHMENTS: ChatComposerAttachmentItem[] = [
  { id: 'a', name: 'invoices-week-27.pdf', description: '1.2 MB' },
  { id: 'b', name: 'vendor-list.xlsx', description: 'Uploading', state: 'uploading' },
  { id: 'c', name: 'scan-0042.tiff', description: 'Upload failed', state: 'error' },
];

function WithAttachmentsDemo() {
  const [attachments, setAttachments] = React.useState(INITIAL_ATTACHMENTS);
  return (
    <ChatComposer
      attachments={attachments}
      onRemoveAttachment={(item) =>
        setAttachments((list) => list.filter((entry) => entry.id !== item.id))
      }
      onSubmit={() => setAttachments([])}
    >
      <Fields onFiles={(accepted) => setAttachments((list) => [...list, ...toItems(accepted)])} />
    </ChatComposer>
  );
}

/** Chips above the textarea, one uploading and one failed. Each has a remove action. */
export const WithAttachments: Story = {
  render: () => <WithAttachmentsDemo />,
};

function ErrorBarDemo() {
  const [error, setError] = React.useState(true);
  const [warning, setWarning] = React.useState(true);
  return (
    <ChatComposer onSubmit={() => setError(true)}>
      {error && (
        <ChatComposerError onDismiss={() => setError(false)}>
          The message could not be sent. Check your connection and try again.
        </ChatComposerError>
      )}
      {warning && (
        <ChatComposerError variant="warning" onDismiss={() => setWarning(false)}>
          You are close to your daily message limit.
        </ChatComposerError>
      )}
      <Fields />
    </ChatComposer>
  );
}

/** Errors and warnings sit above the field as alerts, each dismissible. */
export const ErrorBar: Story = {
  render: () => <ErrorBarDemo />,
};

/** Tighter spacing and a one-row textarea, for narrow panels. */
export const Compact: Story = {
  render: () => <IdleDemo density="compact" />,
};

const REJECTION_TEXT: Record<FileRejection['reason'], string> = {
  type: 'type not accepted',
  size: 'over 5 MB',
  count: 'more than 3 files',
};

function WithDropzoneDemo() {
  const [attachments, setAttachments] = React.useState<ChatComposerAttachmentItem[]>([]);
  const [log, setLog] = React.useState<string[]>([]);
  return (
    <div className="space-y-3">
      <DropzoneOverlay
        accept="image/*,.pdf,.csv,.txt"
        maxSize={5 * 1024 * 1024}
        maxFiles={3}
        enablePaste
        className="rounded-xl border border-dashed border-border p-4"
        onFiles={(accepted, rejected) => {
          setAttachments((list) => [...list, ...toItems(accepted)]);
          setLog([
            ...accepted.map((file) => `Accepted ${file.name}`),
            ...rejected.map(
              ({ file, reason }) => `Rejected ${file.name}: ${REJECTION_TEXT[reason]}`
            ),
          ]);
        }}
      >
        <p className="mb-3 text-sm text-muted-foreground">
          Drop images, PDF, CSV or text files anywhere in this box, or paste them into the field. Up
          to 3 files of 5 MB each.
        </p>
        <ChatComposer
          attachments={attachments}
          onRemoveAttachment={(item) =>
            setAttachments((list) => list.filter((entry) => entry.id !== item.id))
          }
          onSubmit={() => setAttachments([])}
        >
          <Fields
            onFiles={(accepted) => setAttachments((list) => [...list, ...toItems(accepted)])}
          />
        </ChatComposer>
      </DropzoneOverlay>
      {log.length > 0 && (
        <ul className="space-y-1 text-sm text-muted-foreground">
          {log.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** DropzoneOverlay around the composer: drag files over the box to see the overlay. */
export const WithDropzone: Story = {
  render: () => <WithDropzoneDemo />,
};

/** Every label and placeholder comes from `strings`, so hosts can pass translated copy. */
export const Strings: Story = {
  render: () => (
    <ChatComposer
      strings={{
        label: 'Nachricht',
        placeholder: 'Frag Autopilot etwas',
        send: 'Senden',
        stop: 'Anhalten',
        attach: 'Dateien anhängen',
        removeAttachment: (name) => `${name} entfernen`,
        dismissError: 'Schließen',
      }}
      attachments={[{ id: 'a', name: 'rechnung.pdf', description: '240 KB' }]}
      onRemoveAttachment={() => {}}
    >
      <ChatComposerInputGroup>
        <ChatComposerAttachments />
        <ChatComposerTextarea />
        <ChatComposerToolbar>
          <ChatComposerAttachButton />
          <ChatComposerSubmit />
        </ChatComposerToolbar>
      </ChatComposerInputGroup>
      <ChatComposerFooter>Autopilot kann Fehler machen.</ChatComposerFooter>
    </ChatComposer>
  ),
};
