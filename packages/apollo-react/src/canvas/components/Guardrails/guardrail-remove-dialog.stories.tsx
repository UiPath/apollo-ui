import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@uipath/apollo-wind';
import { useState } from 'react';
import { GuardrailRemoveDialog, type GuardrailRemoveDialogProps } from './guardrail-remove-dialog';

const meta = {
  title: 'Components/UiPath/Guardrail Remove Dialog',
  component: GuardrailRemoveDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The confirmation step before a guardrail is removed, with the impact of the removal spelled
out: what a full removal also takes the guardrail off, or what survives when only one tool is
being detached.

The impact arrives as structured props rather than a content slot, because the two products
describe the same two situations and only differ in how they compute them. Both callbacks are
intents: the write, the scoped-removal unwind, the telemetry event and closing the dialog stay
with the host.

Each story ships its own open/close button, since \`open\` is controlled and the outcome line
below it is the host reacting to an intent. On the story canvas the dialog starts open; in docs
it starts closed, because a portalled modal draws its backdrop over the overview page.

The corner close button and backdrop dismissal are both opt-in, through \`showCloseButton\` and
\`closeOnBackdropClick\`: adopting the dialog should not add a control a product did not have, and a
confirmation is a decision that a stray click should not discard. Toggle either from the controls.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: { table: { disable: true } },
    showCloseButton: { control: 'boolean' },
    closeOnBackdropClick: { control: 'boolean' },
    onConfirm: { table: { disable: true } },
    onCancel: { table: { disable: true } },
  },
} satisfies Meta<typeof GuardrailRemoveDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const SCOPE_LABELS: Record<string, string> = {
  Agent: 'Agent',
  Llm: 'LLM calls',
  Tool: 'Tools',
};
const formatScope = (scope: string) => SCOPE_LABELS[scope] ?? scope;

const noop = () => {};

const baseArgs = {
  open: false,
  guardrailName: 'PII detection 1',
  formatScope,
  onConfirm: noop,
  onCancel: noop,
};

/** The outcome line is the host reacting to an intent, not the dialog closing itself. */
function RemoveDialogExample({
  startOpen,
  ...args
}: GuardrailRemoveDialogProps & { startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [outcome, setOutcome] = useState('nothing yet');

  return (
    <div className="flex w-[240px] flex-col items-start gap-2">
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Remove guardrail
      </Button>
      <p className="text-xs text-muted-foreground">Last outcome: {outcome}</p>
      <GuardrailRemoveDialog
        {...args}
        open={open}
        onConfirm={() => {
          setOutcome('removed');
          setOpen(false);
        }}
        onCancel={() => {
          setOutcome('kept');
          setOpen(false);
        }}
      />
    </div>
  );
}

// Open on the story canvas, closed in docs, the `viewMode` approach apollo-wind's dialog stories
// and the builder's `EditModal` use: a portalled modal that hardcodes `open` draws its backdrop
// over the autodocs overview page. Opening on the canvas is also what gives the visual-diff job
// something to snapshot.
const render = (args: GuardrailRemoveDialogProps, { viewMode }: { viewMode: string }) => (
  <RemoveDialogExample {...args} startOpen={viewMode === 'story'} />
);

/** Nothing else uses the guardrail: the question on its own. */
export const Default: Story = {
  args: baseArgs,
  render,
};

/** Deleted outright while it also applies elsewhere. Tool names render verbatim. */
export const AlsoApplicable: Story = {
  args: {
    ...baseArgs,
    affectedToolNames: ['Send email', 'Fetch invoice'],
    affectedScopes: ['Llm'],
  },
  render,
};

/** Only this tool is detached, so the dialog names it and lists what survives. */
export const ScopedRemoval: Story = {
  args: {
    ...baseArgs,
    toolName: 'Send email',
    remainingToolNames: ['Fetch invoice', 'Create ticket'],
    remainingScopes: ['Agent'],
  },
  render,
};

/** Both blocks, in the order Agents renders them today. */
export const BothImpacts: Story = {
  args: {
    ...baseArgs,
    toolName: 'Send email',
    affectedScopes: ['Llm'],
    remainingToolNames: ['Fetch invoice'],
    remainingScopes: ['Agent'],
  },
  render,
};

/** Without `formatScope` the raw wire values show through. */
export const RawScopes: Story = {
  args: {
    ...baseArgs,
    formatScope: undefined,
    affectedScopes: ['Llm', 'Agent'],
  },
  render,
};
