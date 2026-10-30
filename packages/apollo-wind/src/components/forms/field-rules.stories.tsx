import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
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
stored, and a rule with none finished is left out. Fixed values are stored as the field's runtime
type, from its \`valueType\`. A rule written in a form the rows cannot show, such as by an older
editor, opens as an expression and is kept as stored until edited.
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
];

function StoredRulesEditor() {
  const [stored, setStored] = useState(STORED_RULES);
  const editor = useFieldRules(stored, setStored, OPTIONS);
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
 * The stored rules are shown below as they are written. The second rule was written by an older
 * editor in a form RulesEngine cannot run, so it opens as an expression and is kept as stored
 * until edited.
 */
export const StoredRules: Story = {
  render: () => <StoredRulesEditor />,
};
