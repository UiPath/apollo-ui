import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  FormField,
  FormFieldError,
  FormFieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TooltipProvider,
} from '@uipath/apollo-wind';
import { useMemo, useState } from 'react';
import { ApI18nProvider } from '../../../i18n';
import { CLASSIFIER_QUESTIONS_WIRE } from './__fixtures__/classifier-questions.fixtures';
import { CLASSIFIER_WIRE } from './__fixtures__/definitions-wire.fixtures';
import type { GuardrailBuilderValue, GuardrailDefinition } from './builder-types';
import { enrichGuardrailDefinitions } from './definitions-enrich';
import type { GuardrailDefinitionWire } from './definitions-wire';
import { GuardrailBuilder } from './guardrail-builder';
import type { GuardrailParameterDefinition, GuardrailParameterRenderContext } from './types';
import { useClassifierGuardrailParameters } from './use-classifier-guardrail-parameters';
import { useClassifierQuestions } from './use-classifier-questions';

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
    // Inline stories get a panel-sized frame; the dialog story brings its own shell.
    (Story, { parameters }) => (
      <TooltipProvider>
        {parameters.dialog ? (
          <Story />
        ) : (
          <div className="w-[560px] h-[640px] border rounded-md overflow-hidden">
            <Story />
          </div>
        )}
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

/**
 * Edit mode in the modal dialog shell. Closing it returns focus to the button that opened it.
 *
 * Opens on the story canvas. In docs it waits for the button instead: `open` is a controlled prop
 * on a portalled Radix dialog, so hardcoding `true` rendered a real modal with a body-level
 * backdrop over the autodocs overview page and blocked it.
 */
export const EditModal: Story = {
  parameters: { dialog: true },
  render: (args, { viewMode }) => {
    function DialogExample() {
      const [open, setOpen] = useState(viewMode === 'story');
      // Remounts per opening, since the builder seeds its form state at mount.
      const [session, setSession] = useState(0);
      const close = () => setOpen(false);
      return (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSession((current) => current + 1);
              setOpen(true);
            }}
          >
            Edit guardrail
          </Button>
          <GuardrailBuilder {...args} key={session} open={open} onSave={close} onCancel={close} />
        </>
      );
    }
    return <DialogExample />;
  },
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
 * A built-in validator the AI Trust Layer policy switched off (`disabledReason: 'Policy'`). Runs
 * skip it, so the banner is a warning, and Save stays disabled like every other non-available
 * status. With `policyName` the banner names the policy; without it, it says "your organization's
 * AI Trust Layer policy".
 */
export const StatusPolicyDisabled: Story = {
  args: {
    ...EditInline.args,
    definition: { ...piiDefinition, status: 'Disabled', disabledReason: 'Policy' },
    policyName: 'Enterprise AI Trust Layer policy',
  },
};

/**
 * A bring-your-own definition with byoDisplay, which names the title by the configuration, and
 * providerField, which shows the connector read-only above the name (Flow's legacy builder).
 */
export const ByoProviderField: Story = {
  // The modal story's render, so docs wait for the button instead of opening a dialog.
  ...EditModal,
  args: {
    ...EditModal.args,
    definition: {
      ...piiDefinition,
      displayName: 'Vendor PII',
      byoValidatorName: 'Customer data screen',
      byoConnectorName: 'Acme Guard',
    },
    guardrail: {
      ...existingGuardrail,
      name: 'Customer data screen',
      validatorType: 'byo',
      byoValidatorName: 'Customer data screen',
    },
    byoDisplay: true,
    providerField: true,
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
            <FormField>
              <FormFieldLabel required>{ctx.label}</FormFieldLabel>
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
              <FormFieldError>{ctx.error}</FormFieldError>
            </FormField>
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

/** Chrome strings resolved from the canvas lingui catalog (Japanese). */
export const Localized: Story = {
  args: { ...AddInline.args },
  decorators: [
    (Story) => (
      <ApI18nProvider component="canvas" locale="ja">
        <Story />
      </ApI18nProvider>
    ),
  ],
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

const detectionScopeParameter = (defaultValue: string): GuardrailParameterDefinition => ({
  id: 'detectionScope',
  type: 'enum',
  label: 'Detection scope',
  required: false,
  defaultValue,
  options: ['Text', 'Files', 'Both'],
  optionLabels: { Text: 'Text only', Files: 'Files only', Both: 'Text and files' },
});

const piiWithFiles: GuardrailDefinition = {
  ...piiDefinition,
  parameters: [...piiDefinition.parameters, detectionScopeParameter('Text')],
  fileSupport: {
    supported: true,
    formats: ['Text'],
    uninspectedFormats: ['Pdf', 'Image', 'Office', 'Html'],
  },
};

/**
 * File support sits under Detection scope while it selects Files or Both. Pick Text only and both
 * lines go.
 */
export const FileSupportFilesSelected: Story = {
  args: {
    ...EditInline.args,
    hideHeader: true,
    definition: piiWithFiles,
    guardrail: {
      ...existingGuardrail,
      validatorParameters: [
        ...existingGuardrail.validatorParameters,
        { $parameterType: 'enum', id: 'detectionScope', value: 'Files' },
      ],
    },
  },
};

/** A GA validator starts on Text, so nothing about files shows until Files or Both is picked. */
export const FileSupportTextSelected: Story = {
  args: { ...AddInline.args, definition: piiWithFiles },
};

/** The judge defaults to Both: the kinds it reads, and the warning for the rest. */
export const FileSupportJudgeBoth: Story = {
  args: {
    ...AddInline.args,
    defaultName: 'LLM as judge 1',
    definition: {
      validator: 'llm_as_judge',
      displayName: 'LLM as judge',
      allowedScopes: ['Agent', 'Llm', 'Tool'],
      status: 'Available',
      parameters: [
        {
          id: 'model',
          type: 'enum',
          label: 'Judge model',
          required: true,
          defaultValue: 'gpt-4o',
          options: ['gpt-4o'],
        },
        detectionScopeParameter('Both'),
      ],
      fileSupport: {
        supported: true,
        formats: ['Text', 'Pdf', 'Image'],
        uninspectedFormats: ['Office', 'Html'],
        visionModelFormats: ['Pdf', 'Image'],
      },
    },
  },
};

/** Without file support there is no Detection scope field; the line stays above the parameters. */
export const FileSupportUnavailable: Story = {
  args: {
    ...AddInline.args,
    definition: {
      ...piiDefinition,
      fileSupport: { supported: false, formats: [], unavailableReason: 'NotEnabled' },
    },
  },
};

/** Sentiment as the backend sends it: options and defaults, but no copy at all. */
const sentimentWire: GuardrailDefinitionWire = {
  validator: 'sentiment',
  allowedScopes: ['Llm'],
  status: 'Available',
  parameters: [
    {
      id: 'sentiments',
      type: 'enum-list',
      required: true,
      defaultValue: ['Negative'],
      options: ['Positive', 'Neutral', 'Negative', 'Mixed'],
    },
    {
      id: 'sentimentThresholds',
      type: 'map-enum',
      required: true,
      defaultValue: { Positive: 0.5, Neutral: 0.5, Negative: 0.5, Mixed: 0.5 },
      keySource: 'sentiments',
    },
    {
      id: 'language',
      type: 'enum-list',
      required: false,
      defaultValue: ['en'],
      options: [
        'en',
        'es',
        'fr',
        'de',
        'it',
        'pt-BR',
        'pt-PT',
        'nl',
        'sv',
        'da',
        'no',
        'fi',
        'pl',
        'cs',
        'ru',
        'uk',
        'tr',
        'el',
        'he',
        'ar',
        'hi',
        'ja',
        'ko',
        'zh-hans',
        'zh-hant',
        'id',
        'vi',
        'th',
      ],
    },
  ],
};

function enrichOne(wire: GuardrailDefinitionWire): GuardrailDefinition {
  const [definition] = enrichGuardrailDefinitions([wire]);
  if (!definition) throw new Error(`${wire.validator} did not enrich`);
  return definition;
}

/**
 * A definition straight from the definitions layer. The wire carries no copy, so the name,
 * description, labels, tooltips and the sentiment and language names all come from the shared
 * canvas catalog.
 */
export const Sentiment: Story = {
  args: {
    ...AddInline.args,
    definition: enrichOne(sentimentWire),
    scope: 'Llm',
    defaultName: 'Sentiment 1',
  },
};

const classifierDefinition = enrichOne(CLASSIFIER_WIRE);

/** Stands in for a host's model discovery: writes the model and its vendor together. */
function StandInModelPicker({ ctx }: { ctx: GuardrailParameterRenderContext }) {
  const vendors: Record<string, string> = { 'jev-1.13.0': 'typesafe', 'gpt-6-luna': 'openai' };
  return (
    <FormField>
      <FormFieldLabel required>{ctx.definition.label}</FormFieldLabel>
      <Select
        value={typeof ctx.value === 'string' ? ctx.value : ''}
        onValueChange={(model) =>
          ctx.onParametersChange([
            ...ctx.parameters.filter((p) => p.id !== 'model' && p.id !== 'modelVendor'),
            { $parameterType: 'enum', id: 'model', value: model },
            { $parameterType: 'text', id: 'modelVendor', value: vendors[model] ?? '' },
          ])
        }
      >
        <SelectTrigger aria-label={ctx.definition.label}>
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(vendors).map((model) => (
            <SelectItem key={model} value={model}>
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormFieldError>{ctx.error}</FormFieldError>
    </FormField>
  );
}

function ClassifierHost() {
  // A host with its own cache passes the catalog in; one without passes a request context.
  const { categories } = useClassifierQuestions(null, { questions: CLASSIFIER_QUESTIONS_WIRE });
  const classifier = useClassifierGuardrailParameters({
    definition: classifierDefinition,
    categories,
  });
  const [saved, setSaved] = useState<GuardrailBuilderValue>();
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <GuardrailBuilder
          open
          inline
          hideHeader
          definition={classifierDefinition}
          scope="Llm"
          defaultName="Classifier 1"
          renderParameter={(ctx) =>
            classifier.renderParameter(ctx) ??
            (ctx.definition.id === 'model' ? <StandInModelPicker ctx={ctx} /> : undefined)
          }
          overrideParameterIds={[...classifier.overrideParameterIds, 'model']}
          onSave={(value) => {
            if (classifier.validateParameters(value.validatorParameters)) setSaved(value);
          }}
          onCancel={() => setSaved(undefined)}
        />
      </div>
      {saved && (
        <pre className="max-h-40 overflow-auto border-t bg-muted p-2 text-xs">
          {JSON.stringify(saved.validatorParameters, null, 2)}
        </pre>
      )}
    </div>
  );
}

/**
 * The classifier composed the way both hosts do: useClassifierQuestions for the catalog,
 * useClassifierGuardrailParameters for the predefined questions, the custom questions and the
 * model vendor message, and the host's own model picker after it. Save with no question shows
 * the picker's error; a successful save prints the parameters below.
 */
export const Classifier: Story = {
  args: {
    ...AddInline.args,
    definition: classifierDefinition,
    scope: 'Llm',
  },
  render: () => <ClassifierHost />,
};
