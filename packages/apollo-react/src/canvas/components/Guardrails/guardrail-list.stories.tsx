import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TooltipProvider,
} from '@uipath/apollo-wind';
import { MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { ApI18nProvider } from '../../../i18n';
import type { GuardrailScope } from './builder-types';
import { GuardrailStatusBanner } from './components/guardrail-status-banner';
import { GuardrailList } from './guardrail-list';
import type { GuardrailListDefinition, GuardrailListItem } from './list-types';

const meta = {
  title: 'Components/UiPath/Guardrail List',
  component: GuardrailList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The guardrails applied to an agent or a tool: an ordered, reorderable list of rows with add,
edit and remove affordances, the two bring-your-own configuration notices, and optional
status chips.

The host filters and this renders. Rows and definitions arrive already filtered by feature
flags, entitlements and scope, and every callback is an intent: confirmation dialogs,
persistence and telemetry stay with the product. Every addition beyond what both products
already show is opt-in, so adopting it behind a flag renders what the host renders today.
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="w-[440px]">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof GuardrailList>;

export default meta;
type Story = StoryObj<typeof meta>;

const AGENT_AND_TOOL: GuardrailScope[] = ['Agent', 'Tool'];

const guardrails: GuardrailListItem[] = [
  {
    id: 'g1',
    name: 'PII detection 1',
    description: 'Scans agent output for personal data.',
    $guardrailType: 'builtInValidator',
    selector: { scopes: AGENT_AND_TOOL, matchNames: ['Send email'] },
    action: { $actionType: 'log' },
    validatorType: 'pii_detection',
  },
  {
    id: 'g2',
    name: 'Noma prompt shield',
    description: 'Blocks prompt injection attempts on LLM calls.',
    $guardrailType: 'builtInValidator',
    selector: { scopes: ['Llm'] },
    action: { $actionType: 'block' },
    validatorType: 'byo',
    byoValidatorName: 'noma_prompt_injection',
  },
  {
    id: 'g3',
    name: 'Blocked words',
    $guardrailType: 'custom',
    selector: { scopes: ['Tool'], matchNames: ['Send email'] },
    action: { $actionType: 'filter' },
  },
];

const definitions: GuardrailListDefinition[] = [
  { validator: 'pii_detection', status: 'Available' },
  {
    validator: 'byo',
    status: 'Available',
    byoValidatorName: 'noma_prompt_injection',
    byoConnectorName: 'Noma Security',
  },
];

const noop = () => {};

/** Flow's shape: the card, its own header with an Add button, and reorderable rows. */
export const Default: Story = {
  args: {
    guardrails,
    definitions,
    previewChip: true,
    onAdd: noop,
    onEdit: noop,
    onRemove: noop,
    onReorder: noop,
  },
};

/** Read-only, but still reorderable: what Flow passes when the canvas is locked. */
export const ReadOnlyButReorderable: Story = {
  args: { ...Default.args, disabled: true, reorderDisabled: false },
};

export const Empty: Story = {
  args: { guardrails: [], definitions, onAdd: noop },
};

/** A bring-your-own row whose configuration was disabled, and one that no longer resolves. */
export const ByoNotices: Story = {
  args: {
    guardrails,
    definitions: [
      { validator: 'pii_detection', status: 'Available' },
      {
        validator: 'byo',
        status: 'Disabled',
        byoValidatorName: 'noma_prompt_injection',
        byoConnectorName: 'Noma Security',
      },
    ],
    onEdit: noop,
    onRemove: noop,
  },
};

/** Status and administration chips, both off by default. */
export const StatusChips: Story = {
  args: {
    guardrails,
    definitions: [
      { validator: 'pii_detection', status: 'Unauthorised' },
      { validator: 'byo', status: 'Available', byoValidatorName: 'noma_prompt_injection' },
    ],
    statusChips: true,
    previewChip: true,
    getItemAdministration: (item) => (item.id === 'g1' ? 'governance' : 'local'),
    onEdit: noop,
  },
};

/** A definitions load failure is a host-owned banner rendered above the rows. */
export const WithStatusBanner: Story = {
  args: {
    ...Default.args,
    statusBanner: (
      <GuardrailStatusBanner
        tone="error"
        message="Guardrail definitions could not be loaded. Existing guardrails still apply."
      />
    ),
  },
};

/**
 * Agents' shape: the section chrome and the add affordance belong to the host, rows open the
 * editor on click, the actions are an overflow menu, and the description, provider and scopes
 * move into a hover tooltip.
 */
export const EmbeddedInHostSection: Story = {
  args: {
    guardrails,
    definitions,
    unstyled: true,
    hideHeader: true,
    rowActivatesEdit: true,
    previewChip: true,
    emptyState: null,
    onEdit: noop,
    onRemove: noop,
    onReorder: noop,
    formatAction: () => null,
    formatScopes: (item) => `Scopes: ${(item.selector?.scopes ?? []).join(', ')}`,
    renderRowTooltip: (item) => (
      <div className="space-y-1">
        {item.description && <p>{item.description}</p>}
        <p>Scopes: {(item.selector?.scopes ?? []).join(', ')}</p>
      </div>
    ),
    renderItemActions: ({ item, onEdit, onRemove }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="3xs"
            icon
            aria-label={`More options for ${item.name}`}
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit?.()}>Edit</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onRemove?.()}>Remove</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    footer: (
      <Button type="button" variant="text" size="2xs" className="mt-2 w-fit p-0">
        Add another guardrail
      </Button>
    ),
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="w-[440px] rounded-md border border-dashed p-3">
          <p className="mb-2 text-sm font-medium">Guardrails (host section)</p>
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
};

/** Reordering reports the visible array plus the move, and the host owns the write. */
export const ControlledReorder: Story = {
  args: { guardrails, definitions, onReorder: noop },
  render: (args) => {
    function ReorderExample() {
      const [rows, setRows] = useState(args.guardrails);
      const [lastMove, setLastMove] = useState<string>('none yet');
      return (
        <div className="space-y-2">
          <GuardrailList
            {...args}
            guardrails={rows}
            onReorder={(reordered, move) => {
              setRows(reordered);
              setLastMove(`${move.id}: ${move.from} to ${move.to}`);
            }}
          />
          <p className="text-xs text-muted-foreground">Last move: {lastMove}</p>
        </div>
      );
    }
    return <ReorderExample />;
  },
};

/** Chrome strings resolved from the canvas lingui catalog (Japanese). */
export const Localized: Story = {
  args: { ...Default.args },
  render: (args) => (
    <ApI18nProvider component="canvas" locale="ja">
      <GuardrailList {...args} />
    </ApI18nProvider>
  ),
};
