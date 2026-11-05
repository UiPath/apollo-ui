import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RulesAction } from '@/components/ui/field-actions';
import { Label } from '@/components/ui/label';
import {
  type QuickFieldType,
  QuickFormField,
  QuickFormFieldInsertVariable,
  QuickFormFieldTypePicker,
} from '@/components/ui/quick-form-field';
import { RulesEditor } from '@/components/ui/rules-editor';
import { type FieldRuleOutcome, type FieldRulesOptions, renameFieldInRules } from './field-rules';
import type { FieldCondition, FieldRule } from './form-schema';
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
To translate, \`createRulesEngineVocabulary\` takes translated operators and \`FieldRulesStrings\`,
and \`useFieldRules\` takes the same strings in its options for the reasons a stored rule needs repair.

Each outcome lists the \`effects\` it writes. Unfinished conditions stay in the editor but are not
stored, and a rule with none finished is left out, unless it applied always: then it goes on
applying always until its first condition is finished. Fixed values are stored as the field's runtime
type, from its \`valueType\`. A rule the rows cannot show, such as one an older editor wrote, opens
as one expression of the whole rule, as RulesEngine evaluates it. When no expression says the same,
as with a pattern, a native empty check, or a field key no expression can name, the rule is
preserved instead: its stored conditions show read-only and keep running, and its outcome can still
change. An expression RulesEngine cannot run is flagged on its rule. It is still stored as typed,
and never applies.

A stored rule that RulesEngine cannot evaluate as its rows would show opens as stored, flagged
with the reason: a number or yes/no stored as text, or a placeholder row, shown as \`false\`, in a
rule that needs every condition. It is stored as it was, through an outcome change too, until
**Repair rule** at the foot of the rule writes it from its rows, or its expression is edited. A
host with stored forms of its own, such as an older syntax, passes \`upgradeCondition\` in the
options: a rule its rewrite reads as rows opens flagged with the host's reason, and its repair is
the rewrite. See **Stored rules** for each case.

Field ids should be identifier paths, such as \`amount\` or \`user.role\`, as expressions name
fields by them. On any other key, a comparison only an expression can store, such as Greater than,
is flagged. A field of type \`other\`, such as a file, a list or an object, offers only the empty checks, which store RulesEngine's \`empty\` key on any key: an empty list, or an object with no keys, is empty.

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
// A field key no expression can name, to show how a rule on it opens.
const STORED_FIELDS: FieldRuleField[] = [
  ...FIELDS,
  { value: 'cost center', label: 'Cost center', type: 'number' },
];

/**
 * This host's older editor named fields by their labels in expressions, which RulesEngine reads as
 * no field. Its rewrite names them by id, and the editor offers that as the repair.
 */
function upgradeLabels(condition: FieldCondition) {
  const custom = condition.custom;
  if (custom === undefined) return undefined;
  const rewritten = STORED_FIELDS.filter((field) => /^\w+$/.test(field.label)).reduce(
    (text, field) => text.replace(new RegExp(`\\b${field.label}\\b`, 'g'), field.value),
    custom
  );
  return rewritten === custom
    ? undefined
    : {
        condition: { ...condition, custom: rewritten },
        reason: 'it names fields by their labels, as an older editor wrote them',
      };
}

const STORED_OPTIONS: FieldRulesOptions = {
  ...OPTIONS,
  fields: STORED_FIELDS,
  upgradeCondition: upgradeLabels,
};

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
    id: 'text-number',
    conditions: [{ when: 'amount', is: '500' }],
    operator: 'AND',
    effects: { visible: false, disabled: true },
  },
  {
    id: 'placeholder',
    conditions: [{ when: '' }, { when: 'status', is: 'open' }],
    operator: 'AND',
    effects: { required: true },
  },
  {
    id: 'calls',
    conditions: [{ when: '', custom: 'String(customer).includes("Test")' }],
    operator: 'AND',
    effects: { visible: false },
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
  {
    id: 'pattern-text-number',
    conditions: [
      { when: 'customer', matches: '^VIP' },
      { when: 'amount', is: '1000' },
    ],
    operator: 'AND',
    effects: { required: true },
  },
  {
    id: 'spaced-key',
    conditions: [{ when: 'cost center', is: '12' }],
    operator: 'AND',
    effects: { visible: true },
  },
  {
    id: 'labels',
    conditions: [
      { when: '', custom: 'Amount > 500' },
      { when: '', custom: 'Status === "open"' },
    ],
    operator: 'AND',
    effects: { required: true },
  },
];

function StoredRulesEditor() {
  const [stored, setStored] = useState(STORED_RULES);
  const editor = useFieldRules({ rules: stored }, ({ rules }) => setStored(rules), STORED_OPTIONS);
  return (
    <div className="flex flex-col gap-4">
      <div className="w-96">
        <RulesEditor
          label="Field behavior"
          outcomes={OUTCOMES}
          fields={STORED_FIELDS}
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
 * Each stored rule shows one way a rule opens. The stored rules are shown below as they are written.
 *
 * 1. Rows: an expression rows can show, and a fixed value.
 * 2. A number stored as text: it opens as stored, flagged, and Repair rule stores it as a number.
 * 3. A placeholder beside a condition, which keeps the rule from ever applying: Repair rule drops it.
 * 4. An expression RulesEngine cannot run, as it has no function calls: flagged, and never applies.
 * 5. A pattern beside an expression, which rows cannot show and no expression can say: preserved,
 *    shown read-only and stored as it was.
 * 6. A pattern beside a number stored as text: preserved, flagged, and Repair rule makes it rows.
 * 7. A number stored as text on the key \`cost center\`, which no expression can name: preserved,
 *    flagged, and Repair rule makes it a row.
 * 8. An expression that names fields by label, which this host rewrites through
 *    \`upgradeCondition\`: flagged with the host's reason, and Repair rule makes it rows.
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

const CHANGE_FIELDS: FieldRuleField[] = [
  { value: 'customer', label: 'Customer', type: 'string' },
  { value: 'amount', label: 'Amount', type: 'number' },
  {
    value: 'region',
    label: 'Region',
    type: 'enum',
    options: [
      { label: 'EU', value: 'EU' },
      { label: 'US', value: 'US' },
    ],
  },
];
const CHANGE_RULES: FieldRule[] = [
  {
    id: 'eu',
    conditions: [{ when: 'region', is: 'EU' }],
    operator: 'AND',
    effects: { visible: true },
  },
  {
    id: 'large',
    conditions: [{ when: '', custom: 'amount > 1000 && customer !== "Internal"' }],
    operator: 'AND',
    effects: { required: true },
  },
];

function FieldChangesEditor() {
  const fieldId = useId();
  const [fields, setFields] = useState(CHANGE_FIELDS);
  const [stored, setStored] = useState(CHANGE_RULES);
  const options = useMemo<FieldRulesOptions>(() => ({ outcomes: OUTCOMES, fields }), [fields]);
  const rules = useFieldRules({ rules: stored }, (next) => setStored(next.rules), options);
  const amount = fields.find((field) => field.value === 'amount' || field.value === 'total');
  const renamed = amount?.value === 'total';
  const regionRemoved = !fields.some((field) => field.value === 'region');

  const renameAmount = () => {
    const [from, to] = renamed ? ['total', 'amount'] : ['amount', 'total'];
    setFields((current) =>
      current.map((field) =>
        field.value === from ? { ...field, value: to, label: renamed ? 'Amount' : 'Total' } : field
      )
    );
    setStored((current) => renameFieldInRules(current, from, to));
  };
  const toggleRegion = () =>
    setFields((current) =>
      regionRemoved
        ? [...current, CHANGE_FIELDS[2]]
        : current.filter((field) => field.value !== 'region')
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={renameAmount}>
          {renamed ? 'Rename Total to Amount' : 'Rename Amount to Total'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={toggleRegion}>
          {regionRemoved ? 'Add Region back' : 'Remove Region'}
        </Button>
      </div>
      <div className="w-80">
        <QuickFormField
          id={fieldId}
          label={<Label htmlFor={fieldId}>Discount</Label>}
          value=""
          locked={false}
          fieldType="integer"
          headerActions={
            <RulesAction
              outcomes={OUTCOMES}
              fields={fields}
              operators={rulesEngineVocabulary.operators}
              valueModes={rulesEngineVocabulary.valueModes}
              dialect={rulesEngineDialect}
              value={rules.value}
              onChange={rules.onChange}
            />
          }
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {rules.issues.length === 0
          ? 'No rule needs attention.'
          : `${rules.issues.length} ${rules.issues.length === 1 ? 'issue' : 'issues'}: ${rules.issues.map((issue) => `${issue.ruleId} (${issue.kind})`).join(', ')}`}
      </p>
      <pre className="max-w-2xl overflow-auto rounded-md bg-muted p-3 text-xs">
        {JSON.stringify(stored, null, 2)}
      </pre>
    </div>
  );
}

/**
 * A field's rules as the form around it changes. Renaming Amount renames it in the stored rules,
 * inside the expression too, with `renameFieldInRules`. Removing Region leaves the rule that
 * compares it as it was, and the trigger turns red until the author changes it. `useFieldRules`
 * lists the same issues for the host, shown below the field.
 */
export const FieldChanges: Story = {
  name: 'Field changes',
  render: () => <FieldChangesEditor />,
};
