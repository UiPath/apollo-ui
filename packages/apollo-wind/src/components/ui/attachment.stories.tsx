import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download, FileSpreadsheet, FileText, ImageIcon, X } from 'lucide-react';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from './attachment';

const meta: Meta<typeof Attachment> = {
  title: 'Chat/Components/Attachment',
  component: Attachment,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A file or image card for a composer or a sent message. The state prop drives the chrome: idle is a dashed placeholder, uploading and processing shimmer the title, error tints it, done is the resting card. AttachmentGroup lays a row of cards out with scroll snapping and faded edges.',
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

export const Basic: Story = {
  render: () => (
    <Attachment>
      <AttachmentMedia>
        <FileText />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>invoices-week-27.pdf</AttachmentTitle>
        <AttachmentDescription>PDF, 1.2 MB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove invoices-week-27.pdf">
          <X />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ),
};

const STATES = ['idle', 'uploading', 'processing', 'error', 'done'] as const;

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {STATES.map((state) => (
        <Attachment key={state} state={state}>
          <AttachmentMedia>
            <FileSpreadsheet />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>q3-forecast.xlsx</AttachmentTitle>
            <AttachmentDescription>
              {state === 'error' ? 'Upload failed. Try again.' : state}
            </AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-2">
      {(['default', 'sm', 'xs'] as const).map((size) => (
        <Attachment key={size} size={size}>
          <AttachmentMedia>
            <FileText />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>size {size}</AttachmentTitle>
          </AttachmentContent>
        </Attachment>
      ))}
    </div>
  ),
};

export const Vertical: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The vertical orientation is for image thumbnails. AttachmentTrigger covers the whole card so a click opens the preview; actions stay above it.',
      },
    },
  },
  render: () => (
    <Attachment orientation="vertical">
      <AttachmentTrigger aria-label="Preview screenshot.png" />
      <AttachmentMedia variant="image">
        <ImageIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>screenshot.png</AttachmentTitle>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Download screenshot.png">
          <Download />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ),
};

export const Group: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Several attachments in a composer. The group scrolls horizontally, snaps to each card, hides its scrollbar and fades the edges with the scroll-fade-x utility.',
      },
    },
  },
  render: () => (
    <AttachmentGroup>
      {['brief.docx', 'figures.xlsx', 'contract.pdf', 'notes.md', 'cover.png'].map((name) => (
        <Attachment key={name} size="sm">
          <AttachmentMedia>
            <FileText />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{name}</AttachmentTitle>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label={`Remove ${name}`}>
              <X />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      ))}
    </AttachmentGroup>
  ),
};
