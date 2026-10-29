import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  type Condition,
  type ConditionField,
  type ConditionOperators,
  type ConditionsEditorStrings,
  createCondition,
  createConditionGroup,
  DEFAULT_CONDITION_OPERATORS,
} from '../conditions-editor';
import type { ValueModeStrings } from '../field-addons';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../resizable';
import type { VariablePickerItem } from '../variable-picker';
import type { RuleExpressionEditorProps } from './context';
import { createRule, type Rule, type RuleOutcome, type RulesDialect } from './model';
import { RulesEditor, type RulesEditorProps } from './rules-editor';
import type { RulesEditorStrings } from './strings';

const FIELDS: ConditionField[] = [
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

const OUTCOMES: RuleOutcome[] = [
  { value: 'show', label: 'Show' },
  { value: 'hide', label: 'Hide' },
  { value: 'require', label: 'Require' },
];

const VARIABLES: VariablePickerItem[] = [
  {
    id: 'vars',
    label: '$vars',
    type: 'object',
    children: [{ id: 'limit', label: 'limit', value: '$vars.limit', type: 'number' }],
  },
];

const meta = {
  title: 'Components/Core/Rules Editor',
  component: RulesEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Edits a list of rules, such as a form field's behavior. Each rule has an outcome from
\`outcomes\`, and says when it applies with conditions (a \`ConditionsEditor\`) or with one
written expression. Controlled: it renders \`value\` and reports every change through
\`onChange\`, so the host owns the rules and turns them into whatever its engine runs.

- **Conditions or an expression.** The mode menu beside each rule's delete shows the rule's mode
  and lists both, as a value's mode menu does. A **dialect**
  carries the rule across: \`toExpression\` writes the conditions out, and \`fromExpression\` reads
  an expression back into rows. When the dialect cannot, or there is none, it asks before
  dropping what the author wrote. Blank conditions or a blank expression switch without asking.
- **renderExpressionEditor** swaps in the host's own expression editor, such as a code editor that
  knows the variables. The built-in one is a plain monospace text area.
- **allowExpressions** hides the menu for new work. A rule that already is an expression keeps
  it, so it can go back to conditions.

The conditions take the same \`fields\`, \`operators\`, \`valueModes\`, \`variables\` and
\`renderValue\` as \`ConditionsEditor\`, and stay flat unless \`maxDepth\` allows groups. Use
\`isRuleComplete\` to tell which rules run as written. Follow the Repeatable Rows guidance page
for layout.
`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RulesEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

function Editor({
  initial,
  className = 'w-96',
  outcomes = OUTCOMES,
  ...props
}: Omit<RulesEditorProps, 'value' | 'onChange' | 'fields' | 'outcomes'> & {
  initial: () => Rule[];
  outcomes?: RuleOutcome[];
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className={className}>
      <RulesEditor
        label="Field behavior"
        fields={FIELDS}
        outcomes={outcomes}
        variables={VARIABLES}
        {...props}
        value={value}
        onChange={setValue}
      />
    </div>
  );
}

const sampleRules = (): Rule[] => [
  createRule({
    outcome: 'show',
    conditions: createConditionGroup('all', [
      createCondition({ field: 'amount', operator: 'greaterThan', value: '10000' }),
      createCondition({ field: 'status', operator: 'equals', value: 'open' }),
    ]),
  }),
  createRule({ outcome: 'require', expression: 'amount > 50000 && customer !== ""' }),
];

/** Two rules: one with conditions, one written as an expression. */
export const Default: Story = {
  render: () => <Editor initial={sampleRules} />,
};

/**
 * The editor follows its container's width. A narrow card wraps the rule's buttons below the
 * outcome, and the conditions stack their controls. Drag the handle to resize it.
 */
export const Responsive: Story = {
  render: () => (
    <ResizablePanelGroup orientation="horizontal" className="h-auto rounded-md border">
      <ResizablePanel defaultSize="60%" minSize="200px" className="p-3">
        <Editor className="w-full" initial={sampleRules} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel />
    </ResizablePanelGroup>
  ),
};

const SYMBOLS: Record<string, string> = {
  equals: '==',
  notEquals: '!=',
  greaterThan: '>',
  lessThan: '<',
};

/**
 * A small example dialect: flat conditions with fixed values and simple operators, joined by one
 * of && or ||. A real dialect follows the host's engine.
 */
const EXAMPLE_DIALECT: RulesDialect = {
  toExpression: (group) => {
    const parts = group.children.map((child) =>
      child.kind === 'condition' && child.field && child.operator && SYMBOLS[child.operator]
        ? `${child.field} ${SYMBOLS[child.operator]} ${JSON.stringify(child.value ?? '')}`
        : undefined
    );
    if (parts.some((part) => part === undefined)) return undefined;
    return parts.join(group.mode === 'all' ? ' && ' : ' || ');
  },
  fromExpression: (expression) => {
    const mode = expression.includes('||') ? 'any' : 'all';
    const conditions: Condition[] = [];
    for (const part of expression.split(mode === 'all' ? '&&' : '||')) {
      const match = /^\s*(\w+)\s*(==|!=|>|<)\s*"([^"]*)"\s*$/.exec(part);
      const operator = Object.keys(SYMBOLS).find((key) => SYMBOLS[key] === match?.[2]);
      if (!match || !operator) return undefined;
      conditions.push(createCondition({ field: match[1], operator, value: match[3] }));
    }
    return createConditionGroup(mode, conditions);
  },
};

/**
 * With a dialect, switching carries the rule across. Switch the first rule to an expression and
 * back. The second rule's expression is not one the example dialect reads, so switching it asks.
 */
export const WithDialect: Story = {
  render: () => (
    <Editor
      dialect={EXAMPLE_DIALECT}
      initial={() => [
        createRule({
          outcome: 'show',
          conditions: createConditionGroup('any', [
            createCondition({ field: 'amount', operator: 'greaterThan', value: '10000' }),
            createCondition({ field: 'status', operator: 'equals', value: 'closed' }),
          ]),
        }),
        createRule({ outcome: 'hide', expression: 'customer.startsWith("Test")' }),
      ]}
    />
  ),
};

function HostExpressionEditor({
  id,
  value,
  onChange,
  onBlur,
  labelledBy,
  invalid,
  errorId,
  disabled,
}: RuleExpressionEditorProps) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-muted p-2">
      <span className="text-2xs font-medium uppercase text-muted-foreground">Host editor</span>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        spellCheck={false}
        aria-labelledby={labelledBy}
        aria-invalid={invalid || undefined}
        aria-describedby={errorId}
        className="bg-transparent font-mono text-xs outline-none"
      />
    </div>
  );
}

const renderHostExpressionEditor = (props: RuleExpressionEditorProps) => (
  <HostExpressionEditor {...props} />
);

/** The host's expression editor replaces the built-in one, wired to the rule's name and message. */
export const HostExpressionEditorStory: Story = {
  name: 'Host expression editor',
  render: () => (
    <Editor
      renderExpressionEditor={renderHostExpressionEditor}
      initial={() => [createRule({ outcome: 'show', expression: 'amount > $vars.limit' })]}
    />
  ),
};

const FIELD_RULES_STRINGS = { empty: 'No rules. The field always shows.' };

/** Without allowExpressions, rules use conditions only. */
export const ConditionsOnly: Story = {
  render: () => (
    <Editor allowExpressions={false} strings={FIELD_RULES_STRINGS} initial={() => []} />
  ),
};

/** Every incomplete condition and blank expression shows its message, as after a submit. */
export const ForcedErrors: Story = {
  render: () => (
    <Editor
      forceErrors
      initial={() => [
        createRule({ outcome: 'show' }),
        createRule({ outcome: 'require', expression: '' }),
      ]}
    />
  ),
};

export const Disabled: Story = {
  render: () => <Editor disabled initial={sampleRules} />,
};

// Module constants, as a host should pass them: new objects each render re-render every rule.
const FRENCH_OUTCOMES: RuleOutcome[] = [
  { value: 'show', label: 'Afficher' },
  { value: 'hide', label: 'Masquer' },
  { value: 'require', label: 'Exiger' },
];

const FRENCH_STRINGS: Partial<RulesEditorStrings> = {
  outcomeLabel: 'Résultat',
  outcomePlaceholder: 'Choisir un résultat',
  errorOutcome: 'Choisissez un résultat.',
  when: 'si',
  ruleName: (n) => `Règle ${n}`,
  removeRule: (n) => `Supprimer la règle ${n}`,
  ruleConditions: (rule) => `${rule}, critères`,
  modeConditions: 'Critères',
  modeExpression: 'Formule',
  ruleMode: (rule, mode) => `${rule}, mode : ${mode}`,
  modeConditionsDescription: 'Choisir des champs, des opérateurs et des valeurs.',
  modeExpressionDescription: 'Écrire une seule formule.',
  expressionLabel: 'Formule',
  errorExpression: 'Saisissez une formule.',
  addRule: 'Ajouter une règle',
  empty: 'Aucune règle.',
  switchToExpressionTitle: 'Passer à une formule ?',
  switchToExpressionDescription:
    'Ces critères ne peuvent pas être écrits sous forme de formule et seront supprimés.',
  switchToConditionsTitle: 'Passer aux critères ?',
  switchToConditionsDescription:
    'Cette formule ne peut pas être affichée sous forme de critères et sera supprimée.',
  switchConfirm: 'Changer',
  cancel: 'Annuler',
};

const FRENCH_OPERATORS: ConditionOperators = {
  ...DEFAULT_CONDITION_OPERATORS,
  number: [
    { value: 'equals', label: 'Égal à' },
    { value: 'greaterThan', label: 'Supérieur à' },
    { value: 'lessThan', label: 'Inférieur à' },
  ],
  enum: [
    { value: 'equals', label: 'Est' },
    { value: 'notEquals', label: 'N’est pas' },
  ],
};

const FRENCH_CONDITIONS_STRINGS: Partial<ConditionsEditorStrings> = {
  fieldLabel: 'Champ',
  operatorLabel: 'Opérateur',
  valueLabel: 'Valeur',
  fieldPlaceholder: 'Choisir un champ',
  valuePlaceholder: 'Saisir une valeur',
  optionPlaceholder: 'Choisir une valeur',
  matchAll: 'Tous (ET)',
  matchAny: 'Au moins un (OU)',
  addCondition: 'Ajouter un critère',
  empty: 'Aucun critère. La règle s’applique toujours.',
  conditionName: (n) => `Critère ${n}`,
  removeCondition: (n) => `Supprimer le critère ${n}`,
  errorFieldAndValue: 'Choisissez un champ et saisissez une valeur.',
  errorValue: 'Saisissez une valeur.',
};

const FRENCH_VALUE_MODE_STRINGS: Partial<ValueModeStrings> = {
  literalTitle: 'Valeur fixe',
  expressionTitle: 'Formule',
  variableTitle: 'Variable',
};

/** Every string, including the conditions', their operators' and value modes', comes from the host. */
export const Translated: Story = {
  render: () => (
    <Editor
      outcomes={FRENCH_OUTCOMES}
      strings={FRENCH_STRINGS}
      operators={FRENCH_OPERATORS}
      conditionsStrings={FRENCH_CONDITIONS_STRINGS}
      valueModeStrings={FRENCH_VALUE_MODE_STRINGS}
      initial={sampleRules}
    />
  ),
};
