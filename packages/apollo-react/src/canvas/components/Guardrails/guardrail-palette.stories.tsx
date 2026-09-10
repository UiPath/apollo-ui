import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  TooltipProvider,
} from '@uipath/apollo-wind';
import { ArrowLeft, Plus } from 'lucide-react';
import { useState } from 'react';
import { ApI18nProvider } from '../../../i18n';
import { GuardrailPalette } from './guardrail-palette';
import type { GuardrailPaletteDefinition } from './palette-types';

const meta = {
  title: 'Components/UiPath/Guardrail Palette',
  component: GuardrailPalette,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The add-guardrail picker: the guardrail definitions a user may add, grouped by
bring-your-own folder with the UiPath validators trailing, plus an optional create-custom
entry.

The host filters and this renders. Definitions arrive already filtered by feature flags,
entitlements and scope, and both callbacks are intents: the builder that opens next, the
default name it starts with and the telemetry all stay with the product. Only the picker
ships. The shell around it is host orchestration, because the two products disagree and
both are right for their surface: a dialog, a properties-panel overlay, or a whole sidebar.
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
} satisfies Meta<typeof GuardrailPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

const uipathDefinitions: GuardrailPaletteDefinition[] = [
  {
    validator: 'pii_detection',
    displayName: 'PII detection',
    description: 'Detects personally identifiable information in agent traffic.',
    status: 'Available',
  },
  {
    validator: 'user_prompt_attacks',
    displayName: 'Prompt attacks',
    description: 'Detects attempts to override the agent instructions.',
    status: 'Available',
  },
  {
    validator: 'llm_as_judge',
    displayName: 'LLM as a judge',
    description: 'Evaluates agent traffic against a policy you describe in natural language.',
    status: 'Available',
  },
];

const byoDefinitions: GuardrailPaletteDefinition[] = [
  {
    validator: 'byo',
    displayName: 'Noma prompt shield',
    description: 'Vendor-managed prompt injection detection.',
    status: 'Available',
    byoValidatorName: 'noma_prompt_injection',
    byoConnectorName: 'Noma Security',
    byoGuardrailConnectionId: 'connection-1',
    folderPath: 'Shared/Security',
  },
  {
    validator: 'byo',
    displayName: 'Acme policy check',
    status: 'Available',
    byoValidatorName: 'acme_policy',
    byoConnectorName: 'Acme Guard',
    byoGuardrailConnectionId: 'connection-2',
  },
];

const noop = () => {};

/** UiPath validators only: one unheaded group, in the order the catalog returned them. */
export const Default: Story = {
  args: {
    ootbDefinitions: uipathDefinitions,
    previewChip: true,
    onSelectOotb: noop,
  },
};

/** With a create-custom intent wired, the entry leads the picker. Flow passes it for tools only. */
export const WithCreateCustom: Story = {
  args: { ...Default.args, onCreateCustom: noop },
};

/**
 * Bring-your-own definitions group by folder, falling back to the connector name, and the
 * UiPath validators trail them.
 */
export const ByoGroups: Story = {
  args: {
    ootbDefinitions: [...byoDefinitions, ...uipathDefinitions],
    previewChip: true,
    onSelectOotb: noop,
    onCreateCustom: noop,
  },
};

/**
 * A validator the tenant is not entitled to stays visible so it can be discovered, chipped
 * and not choosable. It keeps its place in the tab order, so a keyboard user reaches the chip
 * that says why.
 */
export const Unauthorized: Story = {
  args: {
    ootbDefinitions: [
      ...uipathDefinitions.slice(0, 1),
      {
        validator: 'harmful_content',
        displayName: 'Harmful content',
        description: 'Detects harmful content categories in agent traffic.',
        status: 'Unauthorised',
      },
    ],
    previewChip: true,
    onSelectOotb: noop,
  },
};

export const Loading: Story = {
  args: { ootbDefinitions: [], isLoading: true, onSelectOotb: noop },
};

/** A load failure is a banner, and any catalog that did arrive stays pickable under it. */
export const LoadFailed: Story = {
  args: {
    ootbDefinitions: [],
    error: new Error('Request failed with status 503'),
    onSelectOotb: noop,
  },
};

/** Nothing to pick and no create-custom intent: the only case that renders the empty line. */
export const Empty: Story = {
  args: { ootbDefinitions: [], onSelectOotb: noop },
};

/** Flow's shape: the picker inside a dialog the host owns, which closes on selection. */
export const InADialog: Story = {
  args: { ootbDefinitions: [...byoDefinitions, ...uipathDefinitions], onSelectOotb: noop },
  render: (args) => {
    function DialogExample() {
      const [open, setOpen] = useState(true);
      const [chosen, setChosen] = useState('nothing yet');
      return (
        <div className="space-y-2">
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            Add guardrail
          </Button>
          <p className="text-xs text-muted-foreground">Last choice: {chosen}</p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent style={{ maxWidth: '500px' }}>
              <DialogHeader>
                <DialogTitle>Add guardrail</DialogTitle>
              </DialogHeader>
              <GuardrailPalette
                {...args}
                previewChip
                onCreateCustom={() => {
                  setChosen('a custom guardrail');
                  setOpen(false);
                }}
                onSelectOotb={(definition) => {
                  setChosen(definition.displayName);
                  setOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      );
    }
    return <DialogExample />;
  },
};

/**
 * Agents' shape: a whole sidebar view, with the header, its back button and its own create
 * affordance owned by the host. `onCreateCustom` stays unwired so the picker renders no
 * duplicate entry.
 */
export const InAHostSidebar: Story = {
  args: {
    ootbDefinitions: [...byoDefinitions, ...uipathDefinitions],
    previewChip: true,
    onSelectOotb: noop,
  },
  render: (args) => (
    <div className="flex h-[420px] w-[360px] flex-col rounded-md border">
      <div className="flex items-center gap-2 border-b px-2 py-1.5">
        <Button type="button" variant="ghost" size="sm" icon aria-label="Back">
          <ArrowLeft />
        </Button>
        <span className="flex-1 truncate text-sm font-semibold">Choose guardrail</span>
        <Button type="button" variant="text" size="2xs" className="w-fit p-0">
          <Plus />
          Create custom
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-1.5">
        <GuardrailPalette {...args} />
      </div>
    </div>
  ),
};

/** Chrome strings resolved from the canvas lingui catalog (Japanese). */
export const Localized: Story = {
  args: { ...Default.args, onCreateCustom: noop },
  render: (args) => (
    <ApI18nProvider component="canvas" locale="ja">
      <GuardrailPalette {...args} />
    </ApI18nProvider>
  ),
};
