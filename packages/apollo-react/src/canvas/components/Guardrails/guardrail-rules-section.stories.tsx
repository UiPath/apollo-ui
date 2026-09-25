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
  FormFieldError,
  TooltipProvider,
} from '@uipath/apollo-wind';
import { type ComponentProps, useState } from 'react';
import type { GuardrailAction } from './builder-types';
import { GuardrailActionSection } from './components/guardrail-action-section';
import { GuardrailFilterFieldSelector } from './guardrail-filter-field-selector';
import { GuardrailRulesSection } from './guardrail-rules-section';
import type {
  GuardrailFieldGroup,
  GuardrailFieldReference,
  GuardrailFieldSelector,
  GuardrailRule,
  GuardrailRuleFields,
  GuardrailRulesErrors,
} from './rules-types';
import {
  createGuardrailRule,
  type GuardrailRulesErrorField,
  getGuardrailRuleErrorFields,
  getGuardrailRulesErrorFields,
} from './rules-utils';

const meta = {
  title: 'Components/UiPath/Guardrail Rules Section',
  component: GuardrailRulesSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The rules of a custom guardrail. Either the guardrail is always enforced at a chosen stage, or
it runs its action only when every rule matches: a rule picks a type (string, number, boolean),
the tool fields it checks, an operator, and a value.

Controlled through rules and onRulesChange, with the wire's own rule shape. The selectable fields
are data the host derives from its tool schema, and renderFieldSelector swaps the built-in picker
for a host one. Validation messages are host-owned and typed per rule; the pure helpers that
compute them ship alongside. The confirmation before always-enforce drops edited rules is an
intent: onRequestAlwaysEnforce hands the host the rules it would become, and without it the
switch applies at once.

GuardrailFilterFieldSelector is the same picker for a filter action, made for
GuardrailActionSection's filterContent.
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="w-[640px]">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof GuardrailRulesSection>;

export default meta;
type Story = StoryObj<typeof meta>;

// A search tool's schema, grouped by rule type the way both hosts derive it.
const STRING_FIELDS: GuardrailFieldGroup = {
  input: [
    { path: 'query', source: 'input', title: 'Search query' },
    { path: 'filters[*].value', source: 'input' },
  ],
  output: [
    { path: 'results[*].snippet', source: 'output', title: 'Result snippet' },
    { path: 'nextPageToken', source: 'output' },
  ],
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
const ALL_FIELDS: GuardrailFieldGroup = {
  input: [...STRING_FIELDS.input, ...NUMBER_FIELDS.input, ...BOOLEAN_FIELDS.input],
  output: [...STRING_FIELDS.output, ...NUMBER_FIELDS.output],
};

const ALWAYS: GuardrailRule[] = [createGuardrailRule('always')];

const noop = () => {};

type HostProps = { initial: GuardrailRule[] } & Omit<
  ComponentProps<typeof GuardrailRulesSection>,
  'rules' | 'onRulesChange'
>;

/** Keeps the rules in state so the controls move, and shows what would be saved. */
function RulesHost({ initial, ...props }: HostProps) {
  const [rules, setRules] = useState(initial);
  return (
    <div className="space-y-4">
      <GuardrailRulesSection {...props} rules={rules} onRulesChange={setRules} />
      <pre className="text-xs bg-muted rounded-md p-2 overflow-x-auto">
        {JSON.stringify(rules, null, 2)}
      </pre>
    </div>
  );
}

/** Where both products start a new custom guardrail: always enforced, before and after the tool. */
export const AlwaysEnforced: Story = {
  args: { rules: ALWAYS, onRulesChange: noop },
  render: () => <RulesHost initial={ALWAYS} fields={FIELDS} />,
};

/** A string rule on one input field. Is empty and Is not empty hide the value. */
export const StringRule: Story = {
  args: { rules: [], onRulesChange: noop },
  render: () => (
    <RulesHost
      initial={[
        {
          $ruleType: 'word',
          fieldSelector: {
            $selectorType: 'specific',
            fields: [{ path: 'query', source: 'input', title: 'Search query' }],
          },
          operator: 'matchesRegex',
          value: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
        },
      ]}
      fields={FIELDS}
    />
  ),
};

/** A number rule; the operators narrow to comparisons. */
export const NumberRule: Story = {
  args: { rules: [], onRulesChange: noop },
  render: () => (
    <RulesHost
      initial={[
        {
          $ruleType: 'number',
          fieldSelector: {
            $selectorType: 'specific',
            fields: [{ path: 'maxResults', source: 'input', title: 'Max results' }],
          },
          operator: 'greaterThan',
          value: 50,
        },
      ]}
      fields={FIELDS}
    />
  ),
};

/** A boolean rule, on all of the tool's boolean fields. */
export const BooleanRule: Story = {
  args: { rules: [], onRulesChange: noop },
  render: () => (
    <RulesHost initial={[{ ...createGuardrailRule('boolean'), value: false }]} fields={FIELDS} />
  ),
};

/** Several rules, which must all match for the action to run. */
export const EveryRuleType: Story = {
  args: { rules: [], onRulesChange: noop },
  render: () => (
    <RulesHost
      initial={[
        { ...createGuardrailRule('word'), operator: 'contains', value: 'password' },
        { ...createGuardrailRule('number'), operator: 'lessThanOrEqual', value: 10 },
        { ...createGuardrailRule('boolean'), value: true },
      ]}
      fields={FIELDS}
    />
  ),
};

/** A tool whose schema has no fields a rule can check: always enforced, and the switch is locked. */
export const NoCheckableFields: Story = {
  args: { rules: ALWAYS, onRulesChange: noop },
  render: () => <RulesHost initial={ALWAYS} fields={{}} />,
};

/** No schema at all: every rule type is offered, each checking all fields. */
export const WithoutSchema: Story = {
  args: { rules: [], onRulesChange: noop },
  render: () => <RulesHost initial={[createGuardrailRule('word')]} />,
};

/** The host's own wording for each section-level failure. */
const SECTION_MESSAGES: Record<GuardrailRulesErrorField, string> = {
  required: 'At least one rule is required',
  alwaysCombined: 'You cannot combine an always rule with other rules',
  invalidRules: 'One or more rules are invalid',
};

/** The host validates at save time with the exported helpers and passes messages per rule. */
export const ValidationOnSave: Story = {
  args: { rules: [], onRulesChange: noop },
  render: () => {
    function ValidationExample() {
      const [rules, setRules] = useState<GuardrailRule[]>([
        createGuardrailRule('word'),
        {
          ...createGuardrailRule('word'),
          value: 'secret',
          fieldSelector: { $selectorType: 'specific', fields: [] },
        },
      ]);
      const [attempted, setAttempted] = useState(false);

      const perRule = rules.map((rule) => {
        const fields = getGuardrailRuleErrorFields(rule);
        return {
          fields: fields.includes('fields') ? 'Fields selection is required' : undefined,
          value: fields.includes('value') ? 'Value is required' : undefined,
        };
      });
      const [first] = getGuardrailRulesErrorFields(rules);
      const errors: GuardrailRulesErrors = {
        perRule,
        rules: first === undefined ? undefined : SECTION_MESSAGES[first],
      };

      return (
        <div className="space-y-4">
          <GuardrailRulesSection
            rules={rules}
            onRulesChange={setRules}
            fields={FIELDS}
            errors={attempted ? errors : undefined}
          />
          <Button type="button" onClick={() => setAttempted(true)}>
            Save
          </Button>
        </div>
      );
    }
    return <ValidationExample />;
  },
};

/**
 * The host confirms before always-enforce drops edited rules. Edit a rule, then flip the switch:
 * the section hands over the rules it would become and the host's own dialog applies them.
 */
export const ConfirmBeforeAlwaysEnforce: Story = {
  args: { rules: [], onRulesChange: noop },
  render: () => {
    function ConfirmExample() {
      const [rules, setRules] = useState<GuardrailRule[]>([
        { ...createGuardrailRule('word'), value: 'password' },
      ]);
      const [pending, setPending] = useState<GuardrailRule[] | null>(null);
      return (
        <>
          <GuardrailRulesSection
            rules={rules}
            onRulesChange={setRules}
            onRequestAlwaysEnforce={setPending}
            fields={FIELDS}
          />
          <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
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
                <AlertDialogAction
                  onClick={() => {
                    if (pending) setRules(pending);
                    setPending(null);
                  }}
                >
                  Always enforce
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    }
    return <ConfirmExample />;
  },
};

/** Toggles one field in or out of a selector; a host picker writes the wire shape directly. */
function toggleField(selector: GuardrailFieldSelector, field: GuardrailFieldReference) {
  const current = selector.$selectorType === 'specific' ? selector.fields : [];
  const same = (candidate: GuardrailFieldReference) =>
    candidate.source === field.source && candidate.path === field.path;
  const next = current.some(same)
    ? current.filter((candidate) => !same(candidate))
    : [...current, { path: field.path, source: field.source }];
  return next.length === 0
    ? ({ $selectorType: 'all' } as const)
    : ({ $selectorType: 'specific', fields: next } as const);
}

/**
 * A host's own field picker in place of the built-in one: toggle buttons named by the section's
 * label through ctx.labelId, rendering the error it receives.
 */
export const CustomFieldSelector: Story = {
  args: { rules: [], onRulesChange: noop },
  render: () => (
    <RulesHost
      initial={[{ ...createGuardrailRule('word'), value: 'password' }]}
      fields={FIELDS}
      renderFieldSelector={(ctx) => {
        const picked = ctx.selector.$selectorType === 'specific' ? ctx.selector.fields : [];
        return (
          <>
            <fieldset aria-labelledby={ctx.labelId} className="flex min-w-0 flex-wrap gap-1.5">
              {[...ctx.fields.input, ...ctx.fields.output].map((field) => {
                const pressed = picked.some(
                  (candidate) => candidate.source === field.source && candidate.path === field.path
                );
                return (
                  <Button
                    key={`${field.source}:${field.path}`}
                    type="button"
                    size="sm"
                    variant={pressed ? 'default' : 'outline'}
                    aria-pressed={pressed}
                    onClick={() => ctx.onChange(toggleField(ctx.selector, field))}
                  >
                    {field.source}.{field.path}
                  </Button>
                );
              })}
            </fieldset>
            <FormFieldError>{ctx.error}</FormFieldError>
          </>
        );
      }}
    />
  ),
};

/** The filter action's field picker, composed into the action section with showFilter. */
export const FilterFieldsInActionSection: Story = {
  args: { rules: [], onRulesChange: noop },
  render: () => {
    function FilterExample() {
      const [action, setAction] = useState<GuardrailAction>({ $actionType: 'filter', fields: [] });
      // `filter.fields` is opaque on `GuardrailAction`; a host holding field references narrows it.
      const fields =
        action.$actionType === 'filter' ? (action.fields as GuardrailFieldReference[]) : [];
      return (
        <div className="space-y-4">
          <GuardrailActionSection
            action={action}
            onActionChange={setAction}
            showFilter
            filterContent={
              <GuardrailFilterFieldSelector
                fields={ALL_FIELDS}
                value={fields}
                onChange={(next) => setAction({ $actionType: 'filter', fields: next })}
                error={fields.length === 0 ? 'Fields selection is required' : undefined}
              />
            }
          />
          <pre className="text-xs bg-muted rounded-md p-2 overflow-x-auto">
            {JSON.stringify(action, null, 2)}
          </pre>
        </div>
      );
    }
    return <FilterExample />;
  },
};

/** Per-string overrides win over the catalog. */
export const LabelOverrides: Story = {
  args: { rules: [], onRulesChange: noop },
  render: () => (
    <RulesHost
      initial={[createGuardrailRule('word')]}
      fields={FIELDS}
      labels={{ addRule: 'Add condition', ruleTitle: 'Condition {{position}}' }}
    />
  ),
};
