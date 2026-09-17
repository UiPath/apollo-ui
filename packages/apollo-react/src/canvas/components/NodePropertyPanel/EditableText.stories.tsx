import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { EditableText, type EditableTextProps } from './EditableText';

const meta: Meta<typeof EditableText> = {
  title: 'Components/Panels/Editable Text',
  component: EditableText,
  parameters: {
    docs: {
      description: {
        component: `
**EditableText** is the click-to-edit text used by the node identity row. It reads as plain
text, turns into a field on click, submits on Enter or blur, and reverts on Escape. It is a
controlled field: \`onChange\` fires per keystroke and \`value\` has to follow it, which is what
lets the owner validate what is being typed and answer through \`error\`. Omit either callback and
it renders static text with no interactive affordance.

These props shape how the text behaves:

- \`multiline\`: \`false\` (default) keeps a single-line input that truncates when collapsed.
  \`true\` renders a textarea that accepts newlines on Shift+Enter. \`'wrap'\` renders the same
  textarea layout but keeps the value single-line: every Enter commits and pasted newlines
  collapse to spaces.
- \`disabled\`: locks the text as-is. The read trigger stops responding to clicks, and disabling
  during an edit closes the editor without submitting.
- \`error\`: any feedback, rendered below the text with a ring. Since the owner holds the text, it
  can derive this from what is being typed (see *Identity validation* on NodePropertyPanel) or
  from an async check on the persisted value.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Owns the text, as any consumer of a controlled field must. */
function Live({
  initial,
  ...props
}: { initial: string } & Omit<EditableTextProps, 'value' | 'onChange'>) {
  const [value, setValue] = useState(initial);
  return <EditableText onSubmit={() => {}} {...props} value={value} onChange={setValue} />;
}

const Case = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
      {label}
    </div>
    <div className="text-xs text-foreground-subtle">{hint}</div>
    <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3">{children}</div>
  </div>
);

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="flex w-[420px] flex-col gap-6 p-6">{children}</div>
);

const LONG_TEXT =
  'Fetch the customer record, enrich it with the latest invoice totals, then hand it to the approval step';

export const Playground: Story = {
  args: {
    placeholder: 'Untitled node',
    size: 'lg',
    multiline: false,
    maxLines: 3,
    disabled: false,
    'aria-label': 'Node name',
  },
  argTypes: {
    multiline: { control: 'inline-radio', options: [false, true, 'wrap'] },
    size: { control: 'inline-radio', options: ['lg', 'sm'] },
    maxLines: { control: { type: 'number', min: 1, max: 6 } },
  },
  render: (args) => (
    <Frame>
      <Live {...args} initial={LONG_TEXT} />
    </Frame>
  ),
};

export const MultilineModes: Story = {
  name: 'Multiline settings',
  render: () => (
    <Frame>
      <Case
        label="Single line (default)"
        hint="Renders an input. The collapsed text truncates with an ellipsis, and Enter commits."
      >
        <Live initial={LONG_TEXT} aria-label="Single line name" />
      </Case>

      <Case
        label="multiline"
        hint="Renders a textarea. Shift+Enter inserts a newline, a plain Enter commits."
      >
        <Live
          initial={'Validate the payload\nthen branch on the result'}
          multiline
          aria-label="Multiline description"
        />
      </Case>

      <Case
        label='multiline="wrap"'
        hint="Same wrapping layout, single-line value. Every Enter commits, including Shift+Enter, and pasted newlines collapse to spaces."
      >
        <Live initial={LONG_TEXT} multiline="wrap" aria-label="Wrapped name" />
      </Case>

      <Case
        label="maxLines"
        hint="Caps the visible lines in both modes. The collapsed text clamps, the editor scrolls past the cap."
      >
        <Live
          initial={`${LONG_TEXT}. ${LONG_TEXT}`}
          multiline
          maxLines={2}
          size="sm"
          aria-label="Capped description"
        />
      </Case>
    </Frame>
  ),
};

export const DisabledStates: Story = {
  name: 'Disabled settings',
  render: () => (
    <Frame>
      <Case label="Enabled" hint="Click the text to edit it.">
        <Live initial="Enrich customer record" aria-label="Enabled name" />
      </Case>

      <Case
        label="disabled"
        hint="Dimmed, with a not-allowed cursor. Clicks open no editor and the value cannot change."
      >
        <Live initial="Enrich customer record" disabled aria-label="Disabled name" />
      </Case>

      <Case label="disabled, small" hint="The same lock on the secondary description line.">
        <Live
          initial="Runs after the approval step"
          size="sm"
          disabled
          aria-label="Disabled description"
        />
      </Case>

      <Case
        label="disabled with an error"
        hint="A rejected value stays visible and explained while the field is locked."
      >
        <Live
          initial=""
          placeholder="Untitled node"
          disabled
          error="A node name is required."
          aria-label="Disabled invalid name"
        />
      </Case>

      <Case
        label="Static text (no callbacks)"
        hint="Not the same as disabled. There is no trigger at all, so nothing is dimmed."
      >
        <EditableText value="Read-only label" />
      </Case>
    </Frame>
  ),
};
