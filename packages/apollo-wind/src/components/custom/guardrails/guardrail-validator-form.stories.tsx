import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormField, FormFieldLabel } from '@/components/ui/form-field';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GuardrailValidatorForm } from './guardrail-validator-form';
import type {
  GuardrailParameterDefinition,
  GuardrailValidatorFormProps,
  GuardrailValidatorParameter,
} from './types';
import { getRequiredEmptyParameterIds, seedGuardrailParameters } from './utils';

const meta = {
  title: 'Components/UiPath/Guardrail Validator Form',
  component: GuardrailValidatorForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Configuration section of an OOTB guardrail validator: one editor per parameter definition,
covering all seven parameter types (number, text, boolean, enum, enum-list, text-list,
map-enum).

The component is fully controlled and validation-free. The host owns values
(\`parameters\` + \`onChange\`) and validation (\`errors\` + \`onClearError\`): compute
required-field errors with the exported \`getRequiredEmptyParameterIds\` helper. Individual
parameters can be replaced via \`renderParameter\`, for example to mount a product model
picker for a judge-model parameter.

Labels, tooltips and option labels on the definitions arrive pre-resolved (host-localized).
The component's own chrome strings ship with built-in catalogs for 14 locales (\`locale\`
prop), overridable per string via \`labels\`.
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
} satisfies Meta<typeof GuardrailValidatorForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Stateful wrapper so every story is interactive. */
function ControlledForm(
  props: Omit<GuardrailValidatorFormProps, 'parameters' | 'onChange'> & {
    initialParameters?: GuardrailValidatorParameter[];
  }
) {
  const { initialParameters, ...rest } = props;
  const [parameters, setParameters] = useState<GuardrailValidatorParameter[]>(
    initialParameters ?? seedGuardrailParameters(props.parameterDefinitions)
  );
  return <GuardrailValidatorForm {...rest} parameters={parameters} onChange={setParameters} />;
}

const PII_ENTITIES = ['Person', 'Address', 'Email', 'PhoneNumber', 'CreditCardNumber'];
const piiDefinitions: GuardrailParameterDefinition[] = [
  {
    id: 'entities',
    type: 'enum-list',
    label: 'Entities to detect',
    required: true,
    defaultValue: ['Email', 'CreditCardNumber'],
    options: PII_ENTITIES,
    optionLabels: {
      Person: 'Person name',
      Address: 'Street address',
      Email: 'Email address',
      PhoneNumber: 'Phone number',
      CreditCardNumber: 'Credit card number',
    },
    tooltip: 'Which PII entity types the validator scans for.',
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
    defaultValue: Object.fromEntries(PII_ENTITIES.map((e) => [e, 0.5])),
    tooltip: 'Per-entity confidence threshold. Selecting an entity adds its threshold row.',
  },
  {
    id: 'redact',
    type: 'boolean',
    label: 'Redact detected entities',
    required: false,
    defaultValue: true,
  },
];

/** Enum-list plus a dependent map-enum: toggling an entity adds or removes its threshold row. */
export const PiiDetection: Story = {
  args: { parameterDefinitions: piiDefinitions, parameters: [], onChange: () => {} },
  render: (args) => <ControlledForm parameterDefinitions={args.parameterDefinitions} />,
};

const judgeDefinitions: GuardrailParameterDefinition[] = [
  {
    id: 'guardrailText',
    type: 'text',
    label: 'Rule prompt',
    required: true,
    defaultValue: null,
    maxLength: 4000,
    tooltip: 'Natural-language rule the judge model evaluates against each message.',
  },
  {
    id: 'model',
    type: 'enum',
    label: 'Judge model',
    required: true,
    defaultValue: null,
    options: ['model-fast', 'model-accurate'],
    optionLabels: { 'model-fast': 'Fast model', 'model-accurate': 'Accurate model' },
  },
  {
    id: 'threshold',
    type: 'number',
    label: 'Confidence threshold',
    required: true,
    defaultValue: 0.7,
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    id: 'positiveExamples',
    type: 'text-list',
    label: 'Positive examples',
    required: false,
    defaultValue: [],
    maxItems: 5,
    maxLength: 1000,
  },
];

/** The LLM-as-Judge shape: text prompt, enum model, number threshold, text-list examples. */
export const LlmAsJudge: Story = {
  args: { parameterDefinitions: judgeDefinitions, parameters: [], onChange: () => {} },
  render: (args) => <ControlledForm parameterDefinitions={args.parameterDefinitions} />,
};

/**
 * A product can replace one parameter's editor via renderParameter, for example mounting its
 * own model picker for the judge model while every other parameter keeps the default editor.
 */
export const JudgeModelSlot: Story = {
  args: { parameterDefinitions: judgeDefinitions, parameters: [], onChange: () => {} },
  render: (args) => (
    <ControlledForm
      parameterDefinitions={args.parameterDefinitions}
      renderParameter={(ctx) => {
        if (ctx.definition.id !== 'model') return undefined;
        return (
          <FormField>
            <FormFieldLabel required>{ctx.definition.label}</FormFieldLabel>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              onClick={() => ctx.onValueChange('model-from-picker')}
            >
              {typeof ctx.value === 'string' && ctx.value.length > 0
                ? ctx.value
                : 'Open product model picker'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Placeholder for a product-owned picker (for example ModelPicker in Agents).
            </p>
          </FormField>
        );
      }}
    />
  ),
};

const promptInjectionDefinitions: GuardrailParameterDefinition[] = [
  {
    id: 'blockOnDetection',
    type: 'boolean',
    label: 'Block on detection',
    required: false,
    defaultValue: true,
  },
  {
    id: 'sensitivity',
    type: 'number',
    label: 'Sensitivity',
    required: true,
    defaultValue: 0.8,
    min: 0,
    max: 1,
    step: 0.1,
  },
];

/** The simplest shape: a switch and a number. */
export const PromptInjection: Story = {
  args: { parameterDefinitions: promptInjectionDefinitions, parameters: [], onChange: () => {} },
  render: (args) => <ControlledForm parameterDefinitions={args.parameterDefinitions} />,
};

/**
 * Validation stays host-owned: this story computes the error map with
 * getRequiredEmptyParameterIds on save, exactly as a product form would.
 */
export const WithErrors: Story = {
  args: { parameterDefinitions: judgeDefinitions, parameters: [], onChange: () => {} },
  render: (args) => {
    function WithErrorsExample() {
      const [parameters, setParameters] = useState<GuardrailValidatorParameter[]>(
        seedGuardrailParameters(args.parameterDefinitions)
      );
      const [errors, setErrors] = useState<Record<string, string>>({});
      const validate = () =>
        setErrors(
          Object.fromEntries(
            getRequiredEmptyParameterIds(args.parameterDefinitions, parameters).map((id) => [
              id,
              'Value is required',
            ])
          )
        );
      return (
        <div className="space-y-4">
          <GuardrailValidatorForm
            parameterDefinitions={args.parameterDefinitions}
            parameters={parameters}
            onChange={setParameters}
            errors={errors}
            onClearError={(paramId) => setErrors(({ [paramId]: _cleared, ...rest }) => rest)}
          />
          <Button type="button" onClick={validate}>
            Save
          </Button>
        </div>
      );
    }
    return <WithErrorsExample />;
  },
};

const MANY_OPTIONS = [
  'USSocialSecurityNumber',
  'NOIdentityNumber',
  'UKNationalInsuranceNumber',
  'CAHealthNumber',
  'AUTaxFileNumber',
  'DEIdentityCardNumber',
  'FRSocialSecurityNumber',
  'ESNifNumber',
  'ITFiscalCode',
  'NLCitizenServiceNumber',
];

/** More than eight options moves the chips into a popover. */
export const LongEnumList: Story = {
  args: {
    parameterDefinitions: [
      {
        id: 'entities',
        type: 'enum-list',
        label: 'National identifiers',
        required: true,
        defaultValue: ['USSocialSecurityNumber'],
        options: MANY_OPTIONS,
      },
    ],
    parameters: [],
    onChange: () => {},
  },
  render: (args) => <ControlledForm parameterDefinitions={args.parameterDefinitions} />,
};

/** Component chrome strings loaded from the built-in Japanese catalog. */
export const Localized: Story = {
  args: {
    parameterDefinitions: judgeDefinitions,
    parameters: [],
    onChange: () => {},
    locale: 'ja',
  },
  render: (args) => (
    <ControlledForm parameterDefinitions={args.parameterDefinitions} locale={args.locale} />
  ),
};
