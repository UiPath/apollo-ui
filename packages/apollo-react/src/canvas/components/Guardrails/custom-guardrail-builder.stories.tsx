import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  FormField,
  FormFieldError,
  FormFieldLabel,
  TooltipProvider,
} from '@uipath/apollo-wind';
import { type ComponentProps, useState } from 'react';
import type { CustomGuardrailBuilderValue } from './custom-builder-types';
import { CustomGuardrailBuilder } from './custom-guardrail-builder';
import type { GuardrailFieldGroup, GuardrailRuleFields } from './rules-types';
import { createGuardrailRule } from './rules-utils';

const meta = {
  title: 'Components/UiPath/Custom Guardrail Builder',
  component: CustomGuardrailBuilder,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The complete Add/Edit screen for a custom guardrail: help line, name, description, rules,
action (filter and escalation included), evaluations toggle, mixed-scopes banner, and the
Save/Cancel footer. It is GuardrailBuilder's sibling for guardrails built from rules rather than
a validator, composed from the same parts, so the two screens look and behave the same.

Custom guardrails target tools, so there is no scope selector: an edited guardrail keeps its
selector as it is. The fields each rule type may check, and the fields a filter may remove, are
data the host derives from the tool's schema. The builder owns its form state and its validation
(it gates Save), and shows its own errors after the first failed Save. Hosts override any message
via the labels prop or any field via the errors prop.
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="w-[640px] h-[720px] border rounded-md overflow-hidden">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof CustomGuardrailBuilder>;

export default meta;
type Story = StoryObj<typeof meta>;

// A search tool's schema, grouped by rule type the way both hosts derive it.
const STRING_FIELDS: GuardrailFieldGroup = {
  input: [{ path: 'query', source: 'input', title: 'Search query' }],
  output: [{ path: 'results[*].snippet', source: 'output', title: 'Result snippet' }],
};
const NUMBER_FIELDS: GuardrailFieldGroup = {
  input: [{ path: 'maxResults', source: 'input', title: 'Max results' }],
  output: [{ path: 'totalCount', source: 'output', title: 'Total count' }],
};
const BOOLEAN_FIELDS: GuardrailFieldGroup = {
  input: [{ path: 'safeSearch', source: 'input', title: 'Safe search' }],
  output: [],
};

const FIELDS: GuardrailRuleFields = {
  word: STRING_FIELDS,
  number: NUMBER_FIELDS,
  boolean: BOOLEAN_FIELDS,
};

/** Every field regardless of type, which is what a filter action picks from. */
const FILTER_FIELDS: GuardrailFieldGroup = {
  input: [...STRING_FIELDS.input, ...NUMBER_FIELDS.input, ...BOOLEAN_FIELDS.input],
  output: [...STRING_FIELDS.output, ...NUMBER_FIELDS.output],
};

const DOCS = 'https://docs.uipath.com/agents/automation-cloud/latest/user-guide/guardrails';

const existingGuardrail: CustomGuardrailBuilderValue = {
  id: 'c1',
  $guardrailType: 'custom',
  name: 'Block credential searches',
  description: 'Stops the agent from searching the web for passwords.',
  selector: { scopes: ['Tool'], matchNames: ['Search web'] },
  action: { $actionType: 'block', reason: 'Searching for credentials is not allowed.' },
  enabledForEvals: true,
  rules: [
    {
      $ruleType: 'word',
      fieldSelector: {
        $selectorType: 'specific',
        fields: [{ path: 'query', source: 'input', title: 'Search query' }],
      },
      operator: 'contains',
      value: 'password',
    },
    { ...createGuardrailRule('number'), operator: 'greaterThan', value: 50 },
  ],
};

const baseArgs = {
  open: true,
  toolName: 'Search web',
  fields: FIELDS,
  filterFields: FILTER_FIELDS,
  docsHref: DOCS,
  onSave: () => {},
  onCancel: () => {},
} satisfies Partial<ComponentProps<typeof CustomGuardrailBuilder>>;

/**
 * A new custom guardrail in the modal dialog shell: always enforced before and after the tool,
 * a log action, evaluations on. 800px wide by default.
 *
 * Opens on the story canvas but stays closed in docs, where a portalled modal would cover the
 * page (the same viewMode approach as the Guardrail Builder's modal story).
 */
export const New: Story = {
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  render: (args, { viewMode }) => <CustomGuardrailBuilder {...args} open={viewMode === 'story'} />,
  args: { ...baseArgs, defaultName: 'Guardrail 1' },
};

/** Edit mode as an inline panel with the back-button header. */
export const Edit: Story = {
  args: { ...baseArgs, inline: true, guardrail: existingGuardrail },
};

/** Inline under a header the host owns, the way a properties panel embeds it. */
export const InlineWithoutHeader: Story = {
  args: { ...baseArgs, inline: true, hideHeader: true, guardrail: existingGuardrail },
};

/**
 * A tool with no schema: every rule type is offered, each checking all fields, and a filter
 * action says there are no fields to show.
 */
export const WithoutSchema: Story = {
  args: {
    ...baseArgs,
    inline: true,
    hideHeader: true,
    fields: undefined,
    filterFields: undefined,
    guardrail: {
      ...existingGuardrail,
      rules: [{ ...createGuardrailRule('word'), value: 'password' }],
    },
  },
};

/** A tool whose schema has no fields a rule can check: always enforced, and the switch is locked. */
export const ToolWithoutFields: Story = {
  args: {
    ...baseArgs,
    inline: true,
    hideHeader: true,
    defaultName: 'Guardrail 1',
    fields: {},
    filterFields: { input: [], output: [] },
  },
};

/** A filter action removes the fields picked for it from the tool's input or output. */
export const FilterAction: Story = {
  args: {
    ...baseArgs,
    inline: true,
    hideHeader: true,
    guardrail: {
      ...existingGuardrail,
      action: {
        $actionType: 'filter',
        fields: [{ path: 'results[*].snippet', source: 'output', title: 'Result snippet' }],
      },
    },
  },
};

/**
 * The escalation recipient search and app picker are host capabilities. This story injects
 * demo implementations: a static user list and a fake picker button.
 */
export const EscalateWithSlots: Story = {
  args: {
    ...baseArgs,
    inline: true,
    hideHeader: true,
    guardrail: {
      ...existingGuardrail,
      action: {
        $actionType: 'escalate',
        app: { id: '', version: '', name: '' },
        recipient: { type: 1, value: '', displayName: '' },
      },
    },
    renderRecipientSearch: (ctx) => (
      <div className="space-y-1">
        {[
          { value: 'u1', displayName: 'Ada Lovelace' },
          { value: 'u2', displayName: 'Grace Hopper' },
        ].map((user) => (
          <Button
            key={user.value}
            type="button"
            variant={ctx.displayValue === user.displayName ? 'default' : 'outline'}
            size="sm"
            className="w-full justify-start"
            onClick={() => ctx.onSelect(user)}
          >
            {user.displayName}
          </Button>
        ))}
      </div>
    ),
    renderAppPicker: (ctx) => (
      <FormField>
        <FormFieldLabel required>{ctx.label}</FormFieldLabel>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          onClick={() => ctx.onChange({ id: 'app-1', version: '1.0', name: 'Escalation app' })}
        >
          {ctx.app?.name ?? 'Pick an escalation app'}
        </Button>
        <FormFieldError>{ctx.error}</FormFieldError>
      </FormField>
    ),
  },
};

/**
 * Pressing Save with an empty value, an empty field selection and no name surfaces the builder's
 * own validation: a message under each failing field, and one for the rules as a whole.
 */
export const ErrorsAfterSave: Story = {
  args: {
    ...baseArgs,
    inline: true,
    hideHeader: true,
    guardrail: {
      ...existingGuardrail,
      name: '',
      rules: [
        createGuardrailRule('word'),
        {
          ...createGuardrailRule('word'),
          value: 'secret',
          fieldSelector: { $selectorType: 'specific', fields: [] },
        },
      ],
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
  },
};

/** Host errors display immediately, win per field, and reach a single rule through perRule. */
export const HostErrors: Story = {
  args: {
    ...baseArgs,
    inline: true,
    hideHeader: true,
    guardrail: existingGuardrail,
    errors: {
      name: 'A guardrail with this name exists on the server',
      perRule: [{ value: 'This word is on the allow list' }],
    },
  },
};

/** Mixed scopes: the banner lists other applications and the footer gains Save as new. */
export const SaveAsNewWithMixedScopes: Story = {
  args: {
    ...baseArgs,
    inline: true,
    hideHeader: true,
    guardrail: {
      ...existingGuardrail,
      selector: { scopes: ['Agent', 'Tool'], matchNames: ['Search web', 'Send email'] },
    },
    otherAppliedScopes: { scopes: ['Agent'], tools: ['Send email'] },
    onSaveAsNew: () => {},
  },
};

/** Agents-style layout: the evaluations toggle lives in the footer row. */
export const EvalsInFooter: Story = {
  args: { ...baseArgs, inline: true, hideHeader: true, evalsTogglePlacement: 'footer' },
};

/**
 * The host confirms before always-enforce drops edited rules. Flip the switch: the builder asks
 * confirmAlwaysEnforce, which opens the host's own dialog and resolves with the answer.
 */
export const ConfirmAlwaysEnforce: Story = {
  args: { ...baseArgs, inline: true, hideHeader: true, guardrail: existingGuardrail },
  render: (args) => {
    function ConfirmExample() {
      const [answer, setAnswer] = useState<((confirmed: boolean) => void) | null>(null);
      const respond = (confirmed: boolean) => {
        answer?.(confirmed);
        setAnswer(null);
      };
      return (
        <>
          <CustomGuardrailBuilder
            {...args}
            confirmAlwaysEnforce={() => new Promise<boolean>((resolve) => setAnswer(() => resolve))}
          />
          <AlertDialog open={answer !== null} onOpenChange={(open) => !open && respond(false)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Always enforce the guardrail action</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all of the defined rules and will always apply the action during
                  the selected tool execution stage.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => respond(true)}>Always enforce</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    }
    return <ConfirmExample />;
  },
};
