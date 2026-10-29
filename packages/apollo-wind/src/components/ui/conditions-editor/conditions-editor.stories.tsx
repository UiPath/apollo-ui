import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../resizable';
import type { VariablePickerItem } from '../variable-picker';
import { ConditionsEditor, type ConditionsEditorProps } from './conditions-editor';
import { type ConditionGroup, createCondition, createConditionGroup } from './model';
import {
  type ConditionField,
  type ConditionOperators,
  DEFAULT_CONDITION_OPERATORS,
} from './vocabulary';

const FIELDS: ConditionField[] = [
  { value: 'customer', label: 'Customer', type: 'string' },
  { value: 'amount', label: 'Amount', type: 'number' },
  { value: 'dueDate', label: 'Due date', type: 'date' },
  {
    value: 'status',
    label: 'Status',
    type: 'enum',
    options: [
      { label: 'Open', value: 'open' },
      { label: 'On hold', value: 'onHold' },
      { label: 'Closed', value: 'closed' },
    ],
  },
];

const VARIABLES: VariablePickerItem[] = [
  {
    id: 'vars',
    label: '$vars',
    type: 'object',
    children: [
      { id: 'limit', label: 'limit', value: '$vars.limit', type: 'number' },
      { id: 'owner', label: 'owner', value: '$vars.owner', type: 'string' },
    ],
  },
];

const meta = {
  title: 'Components/Core/Conditions Editor',
  component: ConditionsEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Edits a tree of field / operator / value conditions under All (AND) / Any (OR) groups. Controlled:
it renders \`value\` and reports every change through \`onChange\`, so the host owns the model and
turns it into whatever its engine runs. The top group's All / Any switch appears once it holds
two or more items, unless \`showMatchMode\` is off. Nested groups always show theirs.

- **fields** says what can be compared, and each field's type picks its operators and its Fixed
  value control: text, number, date, or a select for \`enum\` options.
- **operators** lists each type's operators. An operator can take no value ("Is empty"), several
  options ("Is one of"), or only some value modes.
- **valueModes** are the modes each value's menu offers. The operator decides: picking one that
  cannot compare against the current mode resets the value to a mode it allows, and the menu lists
  the others as disabled.
- **renderValue** swaps in the host's own control, such as an expression editor.

Every edit also writes the operator and value mode the row shows, so the model matches the screen.
Dates are stored as \`yyyy-MM-dd\`. Use \`isConditionComplete\` to skip the rows the editor flags,
as it says they are ignored.

Rows lay themselves out by the editor's width, as the Responsive story shows. Messages show once
focus leaves a row, or for every row with \`forceErrors\`. Follow the Repeatable
Rows guidance page for layout.
`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ConditionsEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

function Editor({
  initial,
  ...props
}: Omit<ConditionsEditorProps, 'value' | 'onChange' | 'fields' | 'label'> & {
  initial: () => ConditionGroup;
  label?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <ConditionsEditor
      label="Conditions"
      fields={FIELDS}
      variables={VARIABLES}
      {...props}
      value={value}
      onChange={setValue}
    />
  );
}

const EVERY_VALUE_TYPE = () =>
  createConditionGroup('all', [
    createCondition({ field: 'customer', operator: 'contains', value: 'Acme' }),
    createCondition({
      field: 'amount',
      operator: 'greaterThan',
      valueMode: 'variable',
      value: '$vars.limit',
    }),
    createCondition({ field: 'dueDate', operator: 'lessThan', value: '2026-12-31' }),
    createCondition({ field: 'status', operator: 'isOneOf', values: ['open', 'onHold'] }),
  ]);

/**
 * Rows lay themselves out by the editor's width. Narrow, each part takes its own line. Wider,
 * field and operator share a line with the value below. Wide, all three share one line, and only
 * each group's first row shows its labels, which head the columns. Drag the handle to resize the
 * last editor.
 */
export const Responsive: Story = {
  render: () => (
    <ResizablePanelGroup orientation="horizontal" className="h-auto rounded-md border">
      <ResizablePanel defaultSize="60%" minSize="200px" className="p-3">
        <Editor showSummary initial={EVERY_VALUE_TYPE} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel />
    </ResizablePanelGroup>
  ),
};

/** Nested groups mix AND and OR. Deleting a group with conditions asks first. */
export const NestedGroups: Story = {
  render: () => (
    <div className="w-[44rem]">
      <Editor
        showSummary
        initial={() =>
          createConditionGroup('any', [
            createCondition({ field: 'status', operator: 'equals', value: 'closed' }),
            createConditionGroup('all', [
              createCondition({ field: 'amount', operator: 'greaterThan', value: '1000' }),
              createCondition({ field: 'customer', operator: 'isEmpty' }),
            ]),
          ])
        }
      />
    </div>
  ),
};

/** Collapsed, the header keeps the count and the reading. Its message is never hidden. */
export const Collapsible: Story = {
  render: () => (
    <div className="w-96">
      <Editor
        container="collapsible"
        label="Filter"
        showSummary
        forceErrors
        strings={{ empty: 'No conditions. Every record is returned.' }}
        initial={() =>
          createConditionGroup('all', [
            createCondition({ field: 'status', operator: 'equals', value: 'open' }),
            createCondition({ field: 'amount' }),
          ])
        }
      />
    </div>
  ),
};

const FIXED_ONLY_CONTAINS: ConditionOperators = {
  ...DEFAULT_CONDITION_OPERATORS,
  string: DEFAULT_CONDITION_OPERATORS.string.map((operator) =>
    operator.value === 'contains' || operator.value === 'startsWith'
      ? { ...operator, valueModes: ['literal'] }
      : operator
  ),
};

/**
 * Contains and Starts with take only a Fixed value here. Pick either while the value is an
 * expression and it resets to Fixed value; their mode menu lists Expression and Variable disabled.
 */
export const OperatorLimitsModes: Story = {
  name: 'Operator limits value modes',
  render: () => (
    <div className="w-96">
      <Editor
        operators={FIXED_ONLY_CONTAINS}
        maxDepth={0}
        initial={() =>
          createConditionGroup('all', [
            createCondition({
              field: 'customer',
              operator: 'equals',
              valueMode: 'expression',
              value: '$vars.owner',
            }),
          ])
        }
      />
    </div>
  ),
};

/** Read-only, as while the form is locked. */
export const Disabled: Story = {
  render: () => (
    <div className="w-96">
      <Editor
        disabled
        maxDepth={0}
        initial={() =>
          createConditionGroup('all', [
            createCondition({ field: 'amount', operator: 'greaterThan', value: '1000' }),
          ])
        }
      />
    </div>
  ),
};

/**
 * The editor's strings, operators, value modes, and options control take translations. The date
 * picker's calendar does not yet.
 */
export const Translated: Story = {
  render: () => (
    <div className="w-96">
      <Editor
        label="Conditions"
        maxDepth={0}
        operators={{
          ...DEFAULT_CONDITION_OPERATORS,
          number: [
            { value: 'equals', label: 'Égal à' },
            { value: 'greaterThan', label: 'Supérieur à' },
            { value: 'isEmpty', label: 'Est vide', hasValue: false },
          ],
        }}
        strings={{
          fieldLabel: 'Champ',
          operatorLabel: 'Opérateur',
          valueLabel: 'Valeur',
          fieldPlaceholder: 'Choisir un champ',
          valuePlaceholder: 'Saisir une valeur',
          addCondition: 'Ajouter une condition',
          matchAll: 'Toutes (ET)',
          matchAny: 'Au moins une (OU)',
          conditionName: (position) => `Condition ${position}`,
          removeCondition: (position) => `Supprimer la condition ${position}`,
        }}
        valueModeStrings={{ literalTitle: 'Valeur fixe', expressionTitle: 'Expression' }}
        initial={() =>
          createConditionGroup('all', [
            createCondition({ field: 'amount', operator: 'greaterThan', value: '1000' }),
            createCondition({ field: 'amount', operator: 'isEmpty' }),
          ])
        }
      />
    </div>
  ),
};
