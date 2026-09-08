import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoreVertical, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GOLDEN_ENRICHED_DEFINITIONS } from './__fixtures__/golden-enriched';
import {
  BUILT_IN_GUARDRAIL,
  BYO_DISABLED_GUARDRAIL,
  BYO_GUARDRAIL,
  BYO_UNAVAILABLE_GUARDRAIL,
  CUSTOM_GUARDRAIL,
  GUARDRAIL_LIST_ITEMS,
} from './__fixtures__/list-items';
import { GuardrailList } from './guardrail-list';
import type { GuardrailListItem } from './list-types';

const meta = {
  title: 'Components/UiPath/Guardrail List',
  component: GuardrailList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The guardrails applied to an agent or tool: drag or keyboard reorder, status and origin chips,
per-row edit and remove intents, and the mixed-scopes banner.

Rendering only. The host filters the rows and the definitions before passing them, owns the
add and edit flows and the remove confirmation, and fires its own telemetry around the
callbacks. Feature flags never cross this boundary: pass the guardrails that survived them.
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    guardrails: GUARDRAIL_LIST_ITEMS,
    definitions: GOLDEN_ENRICHED_DEFINITIONS,
    onAdd: () => {},
    onEdit: () => {},
    onRemove: () => {},
    onReorder: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GuardrailList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { guardrails: [] },
};

/**
 * Reordering writes back through `onReorder`, which also reports the move so a host rendering
 * a filtered view can splice the change into its full list.
 */
export const Reorderable: Story = {
  render: (args) => {
    const [guardrails, setGuardrails] = useState<GuardrailListItem[]>(args.guardrails);
    return <GuardrailList {...args} guardrails={guardrails} onReorder={setGuardrails} />;
  },
};

/**
 * One row per status the definitions catalog can report, plus a governance-managed row.
 * Chips are opt-in: neither product renders them today, so an adopting host gets a
 * behaviour-identical swap first and turns them on deliberately.
 */
export const StatusAndOriginChips: Story = {
  args: {
    guardrails: [
      BUILT_IN_GUARDRAIL,
      BYO_DISABLED_GUARDRAIL,
      BYO_UNAVAILABLE_GUARDRAIL,
      CUSTOM_GUARDRAIL,
    ],
    statusChips: true,
    previewChip: true,
    getItemOrigin: (guardrail) =>
      guardrail.name === 'Block refunds over 500' ? 'governance' : 'local',
  },
};

/** A bring-your-own guardrail resolves its provider from the matching definition. */
export const ByoProvider: Story = {
  args: { guardrails: [BYO_GUARDRAIL] },
};

/**
 * Read-only, with reordering kept live. Flow's list behaves this way today: `disabled` governs
 * the row actions, and `reorderDisabled` governs the drag handle.
 */
export const ReadOnlyButReorderable: Story = {
  args: { disabled: true, reorderDisabled: false },
};

/**
 * Agents' shape: its own container, no header, the add affordance below the rows, an overflow
 * menu per row, no action badge, and a hover carrying the description, provider and scopes.
 */
export const HostSuppliedChrome: Story = {
  args: {
    unstyled: true,
    hideHeader: true,
    rowActivatesEdit: true,
    previewChip: true,
    emptyState: null,
    formatAction: () => null,
    formatScopes: (guardrail) => `Scopes: ${guardrail.selector?.scopes?.join(', ') ?? ''}`,
    renderRowTooltip: (guardrail) => guardrail.description,
    footer: (
      <Button variant="ghost" size="2xs">
        <Plus />
        Add another guardrail
      </Button>
    ),
    renderItemActions: ({ guardrail, disabled }) => (
      <Button
        variant="ghost"
        size="3xs"
        icon
        disabled={disabled}
        aria-label={`More options for ${guardrail.name}`}
      >
        <MoreVertical />
      </Button>
    ),
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="w-[480px] rounded-md border border-dashed p-2">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
};

export const MixedScopes: Story = {
  args: {
    guardrails: [BUILT_IN_GUARDRAIL],
    mixedScopes: { scopes: ['Agent'], tools: ['send_email', 'issue_refund'] },
  },
};

/** Section-level notice, e.g. the definitions request failed. */
export const WithStatusBanner: Story = {
  args: {
    statusBanner: { tone: 'error', message: 'Guardrail definitions could not be loaded.' },
  },
};

export const ReadOnly: Story = {
  args: { disabled: true },
};

/**
 * Hosts that show an overflow menu instead of inline buttons replace the row actions.
 * The slot receives `edit` and `remove` so the menu still routes through the list's callbacks.
 */
export const CustomRowActions: Story = {
  args: {
    rowActivatesEdit: true,
    renderItemActions: ({ guardrail, disabled, remove }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="3xs"
            icon
            disabled={disabled}
            aria-label={`More options for ${guardrail.name}`}
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={remove}>Remove</DropdownMenuItem>
          <DropdownMenuItem>Help</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
};

/** The add affordance is a slot, so an entitlement lock replaces it without a product branch. */
export const EntitlementLocked: Story = {
  args: {
    guardrails: [],
    addSlot: <span className="text-xs text-foreground-muted">Requires entitlement</span>,
  },
};

/**
 * Scope names and action types are domain strings and print as stored. Hosts that localize
 * them pass `formatScopes` and `formatAction`.
 */
export const HostFormattedSummaries: Story = {
  args: {
    guardrails: [BUILT_IN_GUARDRAIL],
    formatScopes: () => 'Scopes: Agent, LLM calls',
    formatAction: () => 'Log',
  },
};

/** Chrome strings come from the packaged catalog; domain strings stay host-resolved. */
export const Localized: Story = {
  args: { locale: 'de' },
};
