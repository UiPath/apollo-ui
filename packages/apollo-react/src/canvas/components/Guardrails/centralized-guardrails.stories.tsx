import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  TooltipProvider,
} from '@uipath/apollo-wind';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { ApI18nProvider } from '../../../i18n';
import { CentralizedGuardrailDetails } from './centralized-guardrail-details';
import { CentralizedGuardrailsSection } from './centralized-guardrails-section';
import type { CentralizedGuardrail, CentralizedGuardrailDefinition } from './centralized-types';

const meta = {
  title: 'Components/UiPath/Centralized Guardrails',
  component: CentralizedGuardrailsSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The read-only list of guardrails an organization's AI Trust Layer governance policy enforces
on an agent, plus the details content behind a row.

Nobody edits these in the product, so the section shows what is enforced and reports which row
the user picked. Opening the details is host orchestration: one product uses a dialog, the
other a panel overlay, each with its own header and dismissal, so this package ships the
content and the stories below show both shells.

A centralized guardrail is its own record rather than a variant of a locally configured one:
no id, scopes at the top level, and a bare action discriminator. Pass the policy in as props.
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="w-[420px]">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof CentralizedGuardrailsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const DOCS_HREF = 'https://docs.example.com/centralized-guardrails';

const piiGuardrail: CentralizedGuardrail = {
  validator: 'pii_detection',
  executionStage: 'Pre',
  appliesToAutonomousAgents: true,
  appliesToConversationalAgents: true,
  scopes: ['Agent', 'Llm'],
  action: 'block',
  entities: ['Email', 'USSocialSecurityNumber', 'CreditCardNumber'],
  entityThresholds: { Email: 0.8, USSocialSecurityNumber: 0.95 },
};

const harmfulContentGuardrail: CentralizedGuardrail = {
  validator: 'harmful_content',
  executionStage: 'Both',
  appliesToAutonomousAgents: true,
  appliesToConversationalAgents: true,
  scopes: ['Llm'],
  action: 'escalate',
  entityThresholds: { Hate: 2, Violence: 4 },
};

const byoGuardrail: CentralizedGuardrail = {
  validator: 'pii_detection',
  name: 'Acme strict PII',
  isByo: true,
  executionStage: 'Post',
  appliesToAutonomousAgents: true,
  appliesToConversationalAgents: false,
  scopes: ['Tool'],
  action: 'log',
  parameters: [
    { id: 'mode', parameterType: 'enum', value: 'thorough' },
    { id: 'redact', parameterType: 'boolean', value: true },
    { id: 'entityScores', parameterType: 'map-enum', value: { Email: 0.6, IBAN: 0.9 } },
  ],
};

const byoDefinition: CentralizedGuardrailDefinition = {
  validator: 'pii_detection',
  byoValidatorName: 'Acme strict PII',
  byoConnectorName: 'Acme Security',
  description: 'Acme runs detection against its own corpus before anything leaves the tenant.',
  parameters: [
    {
      id: 'mode',
      type: 'enum',
      label: 'Detection mode',
      optionLabels: { thorough: 'Thorough', fast: 'Fast' },
    },
    { id: 'redact', type: 'boolean', label: 'Redact matches' },
    { id: 'entityScores', type: 'map-enum', label: 'Confidence scores' },
  ],
};

const definitions: CentralizedGuardrailDefinition[] = [
  {
    validator: 'pii_detection',
    parameters: [
      {
        id: 'entities',
        type: 'enum-list',
        label: 'Entities to detect',
        optionLabels: {
          Email: 'Email',
          USSocialSecurityNumber: 'US Social Security Number (SSN)',
          CreditCardNumber: 'Credit Card Number',
        },
      },
      {
        id: 'entityThresholds',
        type: 'map-enum',
        label: 'Detection thresholds',
        keySource: 'entities',
      },
    ],
  },
  {
    validator: 'harmful_content',
    parameters: [
      {
        id: 'harmfulContentEntities',
        type: 'enum-list',
        label: 'Content categories',
        optionLabels: { Hate: 'Hate', Violence: 'Violence' },
      },
      {
        id: 'harmfulContentEntityThresholds',
        type: 'map-enum',
        label: 'Severity thresholds',
        keySource: 'harmfulContentEntities',
      },
    ],
  },
  byoDefinition,
];

export const Default: Story = {
  args: {
    guardrails: [piiGuardrail, harmfulContentGuardrail, byoGuardrail],
    definitions,
    policyName: 'Acme production policy',
    docsHref: DOCS_HREF,
  },
};

export const WithoutDetails: Story = {
  name: 'Nothing to open',
  args: { ...Default.args, onSelect: undefined },
  parameters: {
    docs: {
      description: {
        story:
          'Without `onSelect` a row is plain text rather than a disabled button, so it keeps its place in the reading order and out of the tab order.',
      },
    },
  },
};

export const ConfigurationProblems: Story = {
  name: 'Broken configurations',
  args: {
    guardrails: [byoGuardrail, { ...byoGuardrail, name: 'Acme legacy PII' }],
    // The second guardrail names a configuration this tenant no longer has at all.
    definitions: [{ ...byoDefinition, status: 'Disabled' }],
    policyName: 'Acme production policy',
    docsHref: DOCS_HREF,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A chip makes a broken row findable in a long policy; the sentence under it says what to do. Both are shown, since an admin scanning for trouble and an admin fixing it need different things.',
      },
    },
  },
};

export const StillLoading: Story = {
  name: 'Catalog still loading',
  args: {
    guardrails: [byoGuardrail],
    definitions: undefined,
    policyName: 'Acme production policy',
  },
  parameters: {
    docs: {
      description: {
        story:
          'With `definitions` left undefined the section says nothing about a missing configuration. Passing an empty array means the catalog loaded and the configuration really is gone.',
      },
    },
  },
};

export const InsideHostChrome: Story = {
  name: 'Inside a host section',
  args: {
    ...Default.args,
    unstyled: true,
    hideHeader: true,
  },
  decorators: [
    (Story) => (
      <div className="rounded-md border">
        <div className="border-b px-3 py-2 text-sm font-medium">Guardrails (host accordion)</div>
        <div className="p-1">
          <Story />
        </div>
      </div>
    ),
  ],
};

export const Localized: Story = {
  args: { ...Default.args },
  decorators: [
    (Story) => (
      <ApI18nProvider component="canvas" locale="ja">
        <Story />
      </ApI18nProvider>
    ),
  ],
};

/** The details content in the dialog one product opens. */
export const DetailsInADialog: Story = {
  name: 'Details in a dialog',
  args: Default.args,
  render: (args) => {
    const [selected, setSelected] = useState<CentralizedGuardrail | null>(null);
    return (
      <>
        <CentralizedGuardrailsSection {...args} onSelect={setSelected} />
        <Dialog open={selected !== null} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Guardrail details</DialogTitle>
            </DialogHeader>
            {selected && (
              <CentralizedGuardrailDetails
                guardrail={selected}
                definitions={args.definitions}
                policyName={args.policyName}
              />
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'The dialog, its title and its dismissal are the host’s. Fifteen lines of shell is the reason this package ships no wrapper.',
      },
    },
  },
};

/** The same content in the panel overlay the other product pushes. */
export const DetailsInAPanel: Story = {
  name: 'Details in a panel overlay',
  args: Default.args,
  render: (args) => {
    const [selected, setSelected] = useState<CentralizedGuardrail | null>(null);
    return (
      <div className="h-[540px] overflow-hidden rounded-md border">
        {selected === null ? (
          <div className="p-2">
            <CentralizedGuardrailsSection {...args} onSelect={setSelected} />
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
              <Button
                variant="secondary"
                size="2xs"
                icon
                aria-label="Back to guardrails"
                onClick={() => setSelected(null)}
              >
                <ArrowLeft />
              </Button>
              <span className="text-sm text-muted-foreground">Guardrail details</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <CentralizedGuardrailDetails
                guardrail={selected}
                definitions={args.definitions}
                policyName={args.policyName}
              />
            </div>
          </div>
        )}
      </div>
    );
  },
};
