import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { GuardrailBuilderValue, GuardrailDefinition } from './builder-types';
import { GuardrailBuilder } from './guardrail-builder';

const meta = {
  title: 'Components/UiPath/Guardrail Builder',
  component: GuardrailBuilder,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The complete Add/Edit screen for an OOTB guardrail validator: status banners, usage note,
name, description, validator parameters, scope selector, action (including escalation via
host slots), evaluations toggle, mixed-scopes banner, and the Save/Cancel footer.

The builder owns its form state (initialized at mount: remount with a new key to reset) and
its validation (it gates Save). Hosts override any message via the labels prop or any field
via the errors prop. The escalation recipient search and app picker are host capabilities
injected through render props.
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="w-[560px] h-[640px] border rounded-md overflow-hidden">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof GuardrailBuilder>;

export default meta;
type Story = StoryObj<typeof meta>;

const piiDefinition: GuardrailDefinition = {
  validator: 'pii_detection',
  displayName: 'PII detection',
  allowedScopes: ['Agent', 'Llm', 'Tool'],
  status: 'Available',
  parameters: [
    {
      id: 'entities',
      type: 'enum-list',
      label: 'Entities to detect',
      required: true,
      defaultValue: ['Email'],
      options: ['Person', 'Address', 'Email', 'PhoneNumber'],
      optionLabels: {
        Person: 'Person name',
        Address: 'Street address',
        Email: 'Email address',
        PhoneNumber: 'Phone number',
      },
    },
    {
      id: 'entityThresholds',
      type: 'map-enum',
      label: 'Detection thresholds',
      required: false,
      keySource: 'entities',
      min: 0,
      max: 1,
      step: 0.1,
      defaultValue: { Person: 0.5, Address: 0.5, Email: 0.5, PhoneNumber: 0.5 },
    },
  ],
};

const existingGuardrail: GuardrailBuilderValue = {
  id: 'g1',
  $guardrailType: 'builtInValidator',
  name: 'PII detection 1',
  description: 'Scans agent output for personal data.',
  selector: { scopes: ['Agent', 'Tool'], matchNames: ['Send email'] },
  action: { $actionType: 'log', severityLevel: 'Warning' },
  enabledForEvals: true,
  validatorType: 'pii_detection',
  validatorParameters: [
    { $parameterType: 'enum-list', id: 'entities', value: ['Email', 'PhoneNumber'] },
    { $parameterType: 'map-enum', id: 'entityThresholds', value: { Email: 0.7, PhoneNumber: 0.5 } },
  ],
};

/** The Add screen as the palette embeds it: inline, header owned by the host. */
export const AddInline: Story = {
  args: {
    open: true,
    inline: true,
    hideHeader: true,
    definition: piiDefinition,
    scope: 'Agent',
    defaultName: 'PII detection 1',
    availableToolNames: ['Send email', 'Search web'],
    onSave: () => {},
    onCancel: () => {},
  },
};

/** Edit mode as an inline panel with the back-button header. */
export const EditInline: Story = {
  args: {
    open: true,
    inline: true,
    definition: piiDefinition,
    scope: 'Agent',
    guardrail: existingGuardrail,
    availableToolNames: ['Send email', 'Search web'],
    onSave: () => {},
    onCancel: () => {},
  },
};

/** Edit mode in the modal dialog shell. */
export const EditModal: Story = {
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  args: {
    open: true,
    definition: piiDefinition,
    scope: 'Agent',
    guardrail: existingGuardrail,
    availableToolNames: ['Send email'],
    onSave: () => {},
    onCancel: () => {},
  },
};

/** A definition-level usage note renders as an informational banner. */
export const WithUsageNote: Story = {
  args: {
    ...AddInline.args,
    definition: {
      ...piiDefinition,
      usageNote: 'Each evaluation of this guardrail is billed like an agent LLM call.',
    },
  },
};

export const StatusUnauthorised: Story = {
  args: { ...AddInline.args, definition: { ...piiDefinition, status: 'Unauthorised' } },
};

export const StatusFeatureDisabled: Story = {
  args: { ...AddInline.args, definition: { ...piiDefinition, status: 'FeatureDisabled' } },
};

export const StatusByoDisabled: Story = {
  args: {
    ...AddInline.args,
    definition: {
      ...piiDefinition,
      displayName: 'Vendor PII',
      byoValidatorName: 'vendor-pii',
      status: 'Disabled',
    },
  },
};

/**
 * The escalation recipient search and app picker are host capabilities. This story injects
 * demo implementations: a static user list and a fake picker button.
 */
export const EscalateWithSlots: Story = {
  args: { ...AddInline.args },
  render: (args) => {
    function EscalateExample() {
      const users = useMemo(
        () => [
          { value: 'u1', displayName: 'Ada Lovelace' },
          { value: 'u2', displayName: 'Grace Hopper' },
        ],
        []
      );
      return (
        <GuardrailBuilder
          {...args}
          guardrail={{
            ...existingGuardrail,
            action: {
              $actionType: 'escalate',
              app: { id: '', version: '', name: '' },
              recipient: { type: 1, value: '', displayName: '' },
            },
          }}
          renderRecipientSearch={(ctx) => (
            <div className="space-y-1">
              {users.map((u) => (
                <Button
                  key={u.value}
                  type="button"
                  variant={ctx.displayValue === u.displayName ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => ctx.onSelect(u)}
                >
                  {u.displayName}
                </Button>
              ))}
            </div>
          )}
          renderAppPicker={(ctx) => (
            <div className="space-y-2">
              <Label>{ctx.label}</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  ctx.onChange({ id: 'app-1', version: '1.0', name: 'Escalation app' })
                }
              >
                {ctx.app?.name ?? 'Pick an escalation app'}
              </Button>
              {ctx.error && <p className="text-xs text-destructive">{ctx.error}</p>}
            </div>
          )}
          escalateHelp={
            <p className="text-xs text-muted-foreground">
              Escalation uses apps compatible with the guardrails app template.{' '}
              <a
                href="https://marketplace.uipath.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Import one from Marketplace
              </a>
            </p>
          }
        />
      );
    }
    return <EscalateExample />;
  },
};

/** Mixed scopes: the banner lists other applications and the footer gains Save as new. */
export const MixedScopesWithSaveAsNew: Story = {
  args: {
    open: true,
    inline: true,
    hideHeader: true,
    definition: piiDefinition,
    scope: 'Tool',
    guardrail: existingGuardrail,
    toolName: 'Send email',
    otherAppliedScopes: { scopes: ['Agent'], tools: ['Search web'] },
    onSave: () => {},
    onSaveAsNew: () => {},
    onCancel: () => {},
  },
};

/** Pressing Save with empty required fields surfaces the builder's internal validation. */
export const ValidationErrors: Story = {
  args: {
    open: true,
    inline: true,
    hideHeader: true,
    definition: {
      ...piiDefinition,
      parameters: [
        { id: 'prompt', type: 'text', label: 'Rule prompt', required: true, defaultValue: null },
        ...piiDefinition.parameters,
      ],
    },
    scope: 'Agent',
    defaultName: '',
    guardrail: undefined,
    onSave: () => {},
    onCancel: () => {},
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
  },
};

/** Agents-style layout: the evaluations toggle lives in the footer row. */
export const FooterEvalsToggle: Story = {
  args: { ...AddInline.args, evalsTogglePlacement: 'footer' },
};

/** Chrome strings loaded from the built-in Japanese catalog. */
export const Localized: Story = {
  args: { ...AddInline.args, locale: 'ja' },
};

/** Host errors merge over internal validation and display immediately. */
export const HostErrorsOverride: Story = {
  args: { ...EditInline.args, hideHeader: true },
  render: (args) => {
    function HostErrorsExample() {
      const [errors, setErrors] = useState<{ name?: string } | undefined>({
        name: 'A guardrail with this name exists on the server',
      });
      return (
        <div className="flex flex-col h-full">
          <div className="p-2 border-b">
            <Input
              placeholder="Toggle host error"
              onChange={(e) =>
                setErrors(
                  e.target.value
                    ? undefined
                    : { name: 'A guardrail with this name exists on the server' }
                )
              }
            />
          </div>
          <div className="flex-1 min-h-0">
            <GuardrailBuilder {...args} errors={errors} />
          </div>
        </div>
      );
    }
    return <HostErrorsExample />;
  },
};
