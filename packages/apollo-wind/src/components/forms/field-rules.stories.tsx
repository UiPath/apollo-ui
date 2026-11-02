import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { RulesAction } from '@/components/ui/field-actions';
import { Label } from '@/components/ui/label';
import {
  type QuickFieldType,
  QuickFormField,
  QuickFormFieldInsertVariable,
  QuickFormFieldTypePicker,
} from '@/components/ui/quick-form-field';
import { RulesEditor } from '@/components/ui/rules-editor';
import type { FieldRuleOutcome, FieldRulesOptions } from './field-rules';
import type { FieldRule } from './form-schema';
import {
  type FieldRuleField,
  rulesEngineDialect,
  rulesEngineVocabulary,
} from './rules-engine-dialect';
import { useFieldRules } from './use-field-rules';

const meta = {
  title: 'Forms/Field rules',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Edits a field's stored \`FieldRule\`s, as MetadataForm's RulesEngine runs them, in a
\`RulesEditor\`. \`useFieldRules\` connects the editor to the stored rules: the editor keeps its own
rules, so a host that writes on every change keeps blank rows and focus, and the stored rules are
read again only when they change from outside. \`rulesEngineDialect\` converts a rule between
conditions and an expression, and \`rulesEngineVocabulary\` offers only what RulesEngine can run.

Each outcome lists the \`effects\` it writes. Unfinished conditions stay in the editor but are not
stored, and a rule with none finished is left out, unless it applied always: then it goes on
applying always until its first condition is finished. Fixed values are stored as the field's runtime
type, from its \`valueType\`. A rule the rows cannot show, such as one an older editor wrote, opens
as one expression of the whole rule. If that expression would not run, as text matching reads in it
as calls RulesEngine cannot run, the rule is preserved instead: its stored conditions show
read-only and keep running, and its outcome can still change. An expression RulesEngine cannot run
is flagged on its rule. It is still stored as typed, and never applies.

Field ids should be identifier paths, such as \`amount\` or \`user.role\`, as expressions name
fields by them.

In a QuickFormField, a field's rules go in its header: render a \`RulesAction\` in
\`headerActions\` and pass it \`useFieldRules\`'s value and onChange. With \`requiredOutcome\`, a
rule of that outcome with no conditions shows as a Required switch above the others, and Make
conditional gives it one. A host that keeps the field's \`required\` flag apart from its rules
passes the same \`requiredOutcome\` in \`useFieldRules\`'s options, and gets the flag back beside
the rules in one call. See **In a field's header**.
`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const FIELDS: FieldRuleField[] = [
  { value: 'customer', label: 'Customer', type: 'string' },
  { value: 'amount', label: 'Amount', type: 'number' },
  {
    value: 'status',
    label: 'Status',
    type: 'enum',
    options: [
      { label: 'Open', value: 'open' },
      { label: 'Closed', value: 'closed' },
    ],
  },
];

const OUTCOMES: FieldRuleOutcome[] = [
  { value: 'show', label: 'Show', effects: { visible: true } },
  { value: 'hide', label: 'Hide', effects: { visible: false } },
  { value: 'require', label: 'Require', effects: { required: true } },
];
const OPTIONS: FieldRulesOptions = { outcomes: OUTCOMES, fields: FIELDS };
// Stores the Required switch as the field's own flag, as hitl does.
const FLAG_OPTIONS: FieldRulesOptions = { ...OPTIONS, requiredOutcome: 'require' };
const STORED_RULES: FieldRule[] = [
  {
    id: 'large',
    conditions: [
      { when: 'amount', custom: 'amount > 10000' },
      { when: 'status', is: 'open' },
    ],
    operator: 'AND',
    effects: { visible: true },
  },
  {
    id: 'legacy',
    conditions: [{ when: '', custom: 'String(values["customer"]).includes("Test")' }],
    operator: 'AND',
    effects: { visible: false, disabled: true },
  },
  {
    id: 'pattern',
    conditions: [
      { when: 'customer', matches: '^T.st$' },
      { when: '', custom: 'amount > 10 && status === "closed"' },
    ],
    operator: 'OR',
    effects: { visible: false },
  },
];

function StoredRulesEditor() {
  const [stored, setStored] = useState(STORED_RULES);
  const editor = useFieldRules({ rules: stored }, ({ rules }) => setStored(rules), OPTIONS);
  return (
    <div className="flex flex-col gap-4">
      <div className="w-96">
        <RulesEditor
          label="Field behavior"
          outcomes={OUTCOMES}
          fields={FIELDS}
          operators={rulesEngineVocabulary.operators}
          valueModes={rulesEngineVocabulary.valueModes}
          dialect={rulesEngineDialect}
          value={editor.value}
          onChange={editor.onChange}
        />
      </div>
      <pre className="max-w-2xl overflow-auto rounded-md bg-muted p-3 text-xs">
        {JSON.stringify(stored, null, 2)}
      </pre>
    </div>
  );
}

/**
 * The stored rules are shown below as they are written. An older editor wrote the second rule as
 * a call RulesEngine cannot run, which reads as a Contains row and is stored so it runs once
 * edited. The third joins a pattern and an expression in a way rows cannot show, and runs only as
 * stored, so it is preserved: shown read-only, and stored as it was.
 */
export const StoredRules: Story = {
  render: () => <StoredRulesEditor />,
};

function HeaderActionField() {
  const fieldId = useId();
  const [value, setValue] = useState('');
  const [fieldType, setFieldType] = useState<QuickFieldType>('string');
  const [stored, setStored] = useState<{ rules: FieldRule[]; required: boolean }>({
    rules: [],
    required: false,
  });
  const rules = useFieldRules(stored, setStored, FLAG_OPTIONS);
  return (
    <div className="flex flex-col gap-4">
      <div className="w-80">
        <QuickFormField
          id={fieldId}
          label={<Label htmlFor={fieldId}>Approver note</Label>}
          value={value}
          onValueChange={setValue}
          locked={false}
          fieldType={fieldType}
          required={stored.required}
          variables={[{ label: 'Customer', value: 'vars.customer' }]}
          headerActions={
            <>
              <QuickFormFieldTypePicker onValueChange={setFieldType} />
              <QuickFormFieldInsertVariable />
              <RulesAction
                requiredOutcome="require"
                outcomes={OUTCOMES}
                fields={FIELDS}
                operators={rulesEngineVocabulary.operators}
                valueModes={rulesEngineVocabulary.valueModes}
                dialect={rulesEngineDialect}
                value={rules.value}
                onChange={rules.onChange}
              />
            </>
          }
        />
      </div>
      <pre className="max-w-2xl overflow-auto rounded-md bg-muted p-3 text-xs">
        {JSON.stringify(stored, null, 2)}
      </pre>
    </div>
  );
}

/**
 * The documented way to edit a QuickFormField's rules: a `RulesAction` among its header actions.
 * The Required switch is stored as the field's own flag, beside its rules, shown below.
 */
export const InFieldHeader: Story = {
  name: "In a field's header",
  render: () => <HeaderActionField />,
};
