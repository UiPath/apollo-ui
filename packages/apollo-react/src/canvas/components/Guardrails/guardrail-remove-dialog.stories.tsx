import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@uipath/apollo-wind';
import { useState } from 'react';
import { ApI18nProvider } from '../../../i18n';
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

Every story opens from a button, because \`open\` is controlled and the dialog is modal. That
is also how a host drives it, so each story is a working miniature of the integration.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: { table: { disable: true } },
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

/**
 * The host owns `open` and both callbacks only report intent, so the outcome line below is
 * the host reacting, not the dialog closing itself.
 */
function RemoveDialogExample(args: GuardrailRemoveDialogProps) {
  const [open, setOpen] = useState(false);
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

const render = (args: GuardrailRemoveDialogProps) => <RemoveDialogExample {...args} />;

/** Nothing else uses the guardrail: the question on its own. */
export const Default: Story = {
  args: baseArgs,
  render,
};

/**
 * The guardrail is being deleted outright and it also applies elsewhere. Tool names render
 * verbatim, scopes through `formatScope`.
 */
export const AlsoApplicable: Story = {
  args: {
    ...baseArgs,
    affectedToolNames: ['Send email', 'Fetch invoice'],
    affectedScopes: ['Llm'],
  },
  render,
};

/**
 * Only this tool is being detached, so the dialog names the tool and lists what survives.
 * Both products compute this the same way; only the trigger differs.
 */
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

/**
 * Without `formatScope` the raw wire values show through. Scope vocabulary is product-owned,
 * so an adopting host passes the formatter it already has.
 */
export const RawScopes: Story = {
  args: {
    ...baseArgs,
    formatScope: undefined,
    affectedScopes: ['Llm', 'Agent'],
  },
  render,
};

/** Chrome strings resolved from the canvas lingui catalog (Japanese). */
export const Localized: Story = {
  args: {
    ...baseArgs,
    toolName: 'Send email',
    remainingToolNames: ['Fetch invoice'],
    remainingScopes: ['Agent'],
  },
  render: (args) => (
    <ApI18nProvider component="canvas" locale="ja">
      <RemoveDialogExample {...args} />
    </ApI18nProvider>
  ),
};
