import type { Meta, StoryObj } from '@storybook/react-vite';
import { Braces, Code2, MessageSquareText, Trash2, Type } from 'lucide-react';
import { useId, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { InputGroupButton, InputGroupInput } from '../input-group';
import { Label, RequiredIndicator } from '../label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { LockableValueField } from './lockable-value-field';
import {
  FIELD_TYPE_META,
  type LockableFieldType,
  type LockableValueFieldMode,
  type LockableValueFieldStrings,
} from './types';

const meta = {
  title: 'Components/UiPath/Lockable Value Field',
  component: LockableValueField,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A field that can be locked to read-only, typed as one of several data types,
and expressed in one of four modes: a literal, a JS expression, a bound
variable, or a prompt an agent fills in.

- Left lock icon toggles Editable / Read-only. Read-only fields show plain
  text, not a disabled control.
- Right value-mode icon switches between Fixed value and Expression,
  updating the value styling. Only shown for types an expression can
  produce. \`renderModeControl\` supplies the control for any mode, and a
  consumer's \`trailingAddon\` can offer all four. See **Variable and prompt modes**.
- Field type dropdown swaps the control itself: String, Integer, Decimal
  number, Date, Date and time, Boolean, Single select, Multi select, Array,
  and File each render their own matching input. \`fieldTypes\` chooses which
  of them the picker offers.
- Insert variable renders \`variables\` as supplied and splices the choice at
  the caret, or appends when none is placed. \`onInsertVariable\` takes over
  what inserting means.
- Enter commits through \`onValueBlur\`; Escape restores the value as of focus.
- Every user-visible string can be overridden through \`strings\`. See
  **Localized strings**.
- Required switch toggles the shared foreground asterisk on the label. Only shown when
  \`onRequiredChange\` is provided.
- Built-in AI-assist popover to describe and generate a value, rendered only
  when \`onGenerateWithAi\` is provided, and an Insert-variable affordance for
  binding to upstream data. Both hidden via \`showFieldActions={false}\` for
  read-only reviewer contexts.
- \`label\` accepts any ReactNode, so a consumer can compose its own
  inline-editable title in place of the default text.
- When provided, header actions are shown at all times.
- Header row is responsive (container query): the type, required,
  AI-assist, and insert-variable controls collapse to icon-only once the
  field gets too narrow for their labels. See **Responsive** below.
- Inline validation stays immediately below the active control and explains
  both the issue and the action needed to resolve it. See **Inline validation** below.
- Built on \`InputGroup\` for the scalar types that support expressions; see
  Input Group's \`LockedFieldWithPopover\` story for a lighter-weight recipe
  using only \`InputGroup\` primitives.
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LockableValueField>;

export default meta;
type Story = StoryObj<typeof meta>;

function DeleteFieldButton({ onDelete }: { onDelete?: () => void }) {
  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={!onDelete}
      aria-label="Delete field"
      title="Delete field"
      className="grid size-7 shrink-0 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      <Trash2 size={14} />
    </button>
  );
}

function DefaultDemo() {
  const fieldId = useId();
  const [value, setValue] = useState('');
  const [locked, setLocked] = useState(true);
  const [mode, setMode] = useState<LockableValueFieldMode>('literal');
  const [fieldType, setFieldType] = useState<LockableFieldType>('string');
  const [required, setRequired] = useState(true);
  const [deleted, setDeleted] = useState(false);

  const handleFieldTypeChange = (type: LockableFieldType) => {
    setFieldType(type);
    setValue('');
    if (!FIELD_TYPE_META[type].supportsExpression) {
      setMode('literal');
    }
  };

  if (deleted) return null;

  return (
    <div className="w-80">
      <LockableValueField
        id={fieldId}
        label={
          <Label htmlFor={fieldId} className="text-xs font-medium text-foreground-muted">
            Label
            {required && <RequiredIndicator />}
          </Label>
        }
        headerActions={<DeleteFieldButton onDelete={() => setDeleted(true)} />}
        value={value}
        onValueChange={setValue}
        locked={locked}
        onLockedChange={setLocked}
        mode={mode}
        onModeChange={setMode}
        fieldType={fieldType}
        onFieldTypeChange={handleFieldTypeChange}
        required={required}
        onRequiredChange={setRequired}
      />
    </div>
  );
}

export const Default: Story = {
  name: 'Basic Value Field',
  render: () => <DefaultDemo />,
};

function MoreActionsDemo() {
  const fieldId = 'lockable-value-field-more-actions';
  const [value, setValue] = useState('Invoice value');
  const [mode, setMode] = useState<LockableValueFieldMode>('literal');

  return (
    <div className="w-80">
      <LockableValueField
        id={fieldId}
        label={<Label htmlFor={fieldId}>Value</Label>}
        value={value}
        onValueChange={setValue}
        locked={false}
        mode={mode}
        onModeChange={setMode}
        more={{
          onClear: () => setValue(''),
          onRefresh: () => setValue('Refreshed value'),
        }}
      />
    </div>
  );
}

export const MoreActions: Story = {
  name: 'Value field with more actions',
  render: () => <MoreActionsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Adds a field-level overflow menu beside the value type control for actions such as clearing the value or forcing a refresh.',
      },
    },
  },
};

function ExpressionValueFieldDemo() {
  const fieldId = useId();
  const [value, setValue] = useState('');

  return (
    <div className="w-80">
      <LockableValueField
        id={fieldId}
        label={<Label htmlFor={fieldId}>Expression</Label>}
        value={value}
        onValueChange={setValue}
        locked={false}
        mode="expression"
        variables={[
          {
            label: '$input',
            value: '',
            children: [
              { label: 'Customer name', value: '$input.customerName' },
              { label: 'Invoice number', value: '$input.invoiceNumber' },
            ],
          },
          { label: '$user', value: '', children: [{ label: 'User email', value: '$user.email' }] },
        ]}
      />
    </div>
  );
}

export const Expression: Story = {
  name: 'Expression Value Field',
  render: () => <ExpressionValueFieldDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'A focused expression-writing example. Use the Insert variable action above the field to add an available variable to the expression.',
      },
    },
  },
};

function EqualsAddon() {
  return (
    <span className="font-mono text-sm font-semibold text-foreground-accent" aria-hidden="true">
      =
    </span>
  );
}

function RequiredExpressionLabel({
  children,
  htmlFor,
  required = true,
}: {
  children: string;
  htmlFor: string;
  required?: boolean;
}) {
  return (
    <Label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
      {children}
      {required && <RequiredIndicator />}
    </Label>
  );
}

function ReferenceExamplesDemo() {
  const idPrefix = useId();
  const [collection, setCollection] = useState('$vars.flowArray');
  const [attachment, setAttachment] = useState('$vars.flowTest');
  const [context, setContext] = useState('$vars.flowTest');
  const [endExchange, setEndExchange] = useState(true);
  const [file, setFile] = useState('$vars.flowTest');
  const [conversationId, setConversationId] = useState('$vars.flowTest');
  const [exchangeId, setExchangeId] = useState('$vars.flowTest');

  return (
    <div className="flex w-[620px] flex-col gap-8">
      <LockableValueField
        id={`${idPrefix}-collection`}
        label={
          <RequiredExpressionLabel htmlFor={`${idPrefix}-collection`}>
            Collection
          </RequiredExpressionLabel>
        }
        fieldType="object"
        value={collection}
        onValueChange={setCollection}
        locked={false}
        leadingAddon={<EqualsAddon />}
        mode="expression"
        variables={[
          {
            label: '$vars',
            value: '',
            children: [{ label: 'Flow array', value: '$vars.flowArray' }],
          },
        ]}
      />
      <LockableValueField
        id={`${idPrefix}-attachment`}
        label={
          <RequiredExpressionLabel htmlFor={`${idPrefix}-attachment`}>
            Attachment
          </RequiredExpressionLabel>
        }
        fieldType="file"
        value={attachment}
        onValueChange={setAttachment}
        locked={false}
        leadingAddon={<EqualsAddon />}
        mode="expression"
      />
      <LockableValueField
        id={`${idPrefix}-conversation-context`}
        label={
          <RequiredExpressionLabel htmlFor={`${idPrefix}-conversation-context`} required={false}>
            Conversation context
          </RequiredExpressionLabel>
        }
        fieldType="object"
        value={context}
        onValueChange={setContext}
        locked={false}
        leadingAddon={<EqualsAddon />}
        mode="expression"
        belowValue={
          <label className="flex items-start gap-2 pl-1 text-sm text-foreground">
            <input
              type="checkbox"
              checked={endExchange}
              onChange={(event) => setEndExchange(event.target.checked)}
              className="mt-0.5 size-4 accent-brand"
            />
            <span>
              <span className="block font-medium">End exchange</span>
              <span className="block text-xs leading-4 text-foreground-muted">
                When checked, the conversation exchange will be ended and the user will be able to
                send another message. Leave unchecked if later node(s) should continue responding as
                part of the process&apos;s turn.
              </span>
            </span>
          </label>
        }
      />
      <LockableValueField
        id={`${idPrefix}-file`}
        label={<RequiredExpressionLabel htmlFor={`${idPrefix}-file`}>File</RequiredExpressionLabel>}
        fieldType="file"
        value={file}
        onValueChange={setFile}
        locked={false}
        leadingAddon={<EqualsAddon />}
        mode="expression"
        belowValue={<p className="text-xs text-foreground-muted">File to extract data from</p>}
      />
      <LockableValueField
        id={`${idPrefix}-conversation-id`}
        label={
          <RequiredExpressionLabel htmlFor={`${idPrefix}-conversation-id`}>
            Conversation ID
          </RequiredExpressionLabel>
        }
        value={conversationId}
        onValueChange={setConversationId}
        locked={false}
        leadingAddon={<EqualsAddon />}
        mode="expression"
        trailingAddon={<FunctionAddon />}
      />
      <LockableValueField
        id={`${idPrefix}-exchange-id`}
        label={
          <RequiredExpressionLabel htmlFor={`${idPrefix}-exchange-id`}>
            Exchange ID
          </RequiredExpressionLabel>
        }
        value={exchangeId}
        onValueChange={setExchangeId}
        locked={false}
        leadingAddon={<EqualsAddon />}
        mode="expression"
        trailingAddon={<FunctionAddon />}
        belowValue={
          <p className="text-xs text-foreground-muted">
            The message will be added to this existing exchange.
          </p>
        }
      />
    </div>
  );
}

/** Reference layouts for assignment/binding fields used in node properties. */
export const ReferenceExamples: Story = {
  name: 'Assignment & Binding',
  render: () => <ReferenceExamplesDemo />,
};

function FunctionAddon() {
  return (
    <button
      type="button"
      aria-label="Open expression editor"
      className="grid size-7 place-items-center border-l border-border text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="rounded border border-current px-0.5 font-mono text-[10px] leading-3">
        ƒ
      </span>
    </button>
  );
}

export const InlineValidation: Story = {
  render: () => (
    <div className="w-80">
      <LockableValueField
        id="lockable-node-name"
        label={<Label htmlFor="lockable-node-name">Node name</Label>}
        value="Invoice processor"
        error="This node name is already in use. Enter a unique name before saving."
        locked
        showFieldActions={false}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Use the field-level `error` prop for validation that belongs to the active value. The message stays below the lockable control and the built-in input is marked invalid for assistive technology.',
      },
    },
  },
};

const MODE_ITEMS: { mode: LockableValueFieldMode; label: string; icon: typeof Type }[] = [
  { mode: 'literal', label: 'Fixed value', icon: Type },
  { mode: 'expression', label: 'Expression', icon: Code2 },
  { mode: 'variable', label: 'Variable', icon: Braces },
  { mode: 'prompt', label: 'Prompt', icon: MessageSquareText },
];

const WORKFLOW_VARIABLES = [
  { label: 'Customer name', value: 'vars.customerName' },
  { label: 'Invoice number', value: 'vars.invoiceNumber' },
];

function FourModeMenu({
  mode,
  onModeChange,
}: {
  mode: LockableValueFieldMode;
  onModeChange: (mode: LockableValueFieldMode) => void;
}) {
  const active = MODE_ITEMS.find((item) => item.mode === mode) ?? MODE_ITEMS[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <InputGroupButton icon size="3xs" aria-label="Choose value mode">
          <active.icon />
        </InputGroupButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {MODE_ITEMS.map((item) => (
          <DropdownMenuItem key={item.mode} onClick={() => onModeChange(item.mode)}>
            <item.icon />
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ValueModesDemo() {
  const fieldId = useId();
  const [mode, setMode] = useState<LockableValueFieldMode>('variable');
  const [values, setValues] = useState<Record<LockableValueFieldMode, string>>({
    literal: '',
    expression: '',
    variable: 'vars.customerName',
    prompt: '',
  });
  const setValue = (value: string) => setValues((current) => ({ ...current, [mode]: value }));

  return (
    <div className="w-80">
      <LockableValueField
        id={fieldId}
        label={<Label htmlFor={fieldId}>Recipient</Label>}
        value={values[mode]}
        onValueChange={setValue}
        locked={false}
        showLock={false}
        showFieldActions={false}
        mode={mode}
        onModeChange={setMode}
        trailingAddon={<FourModeMenu mode={mode} onModeChange={setMode} />}
        renderModeControl={(activeMode, control) => {
          if (activeMode === 'variable') {
            return (
              <Select value={control.value} onValueChange={control.onValueChange}>
                <SelectTrigger id={control.id} className="min-w-0 flex-1">
                  <SelectValue placeholder="Select a variable" />
                </SelectTrigger>
                <SelectContent>
                  {WORKFLOW_VARIABLES.map((variable) => (
                    <SelectItem key={variable.value} value={variable.value}>
                      {variable.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          if (activeMode === 'prompt') {
            return (
              <InputGroupInput
                id={control.id}
                value={control.value}
                onChange={(event) => control.onValueChange?.(event.target.value)}
                onBlur={control.onBlur}
                readOnly={control.readOnly}
                placeholder="Describe the value for the agent to fill in"
              />
            );
          }
          return null;
        }}
      />
    </div>
  );
}

export const ValueModes: Story = {
  name: 'Variable and prompt modes',
  render: () => <ValueModesDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'A field can be a literal, an expression, a bound variable or an agent prompt. `renderModeControl` supplies the control for any mode and returns nothing to keep the built-in one, so literal and expression still render the defaults here. `trailingAddon` carries the four-mode switch, and it renders for every type, including selects.',
      },
    },
  },
};

function AddedTypesDemo() {
  const [values, setValues] = useState<Record<string, string>>({
    double: '10.5',
    datetime: '',
    array: '[1, 2, 3]',
  });
  const types: LockableFieldType[] = ['double', 'datetime', 'array'];

  return (
    <div className="flex w-80 flex-col gap-4">
      {types.map((fieldType) => (
        <LockableValueField
          key={fieldType}
          fieldType={fieldType}
          value={values[fieldType]}
          onValueChange={(value) => setValues((current) => ({ ...current, [fieldType]: value }))}
          locked={false}
          showFieldActions={false}
          mode={fieldType === 'array' ? 'expression' : 'literal'}
        />
      ))}
    </div>
  );
}

export const AddedTypes: Story = {
  name: 'Decimal, date and time, and array',
  render: () => <AddedTypesDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'A decimal accepts fractions (the number input uses `step="any"`), a date and time keeps the time of day in a DateTimePicker and is stored as an ISO string, and an array is expression-capable like an object.',
      },
    },
  },
};

function OfferedTypesDemo() {
  const fieldId = useId();
  const [fieldType, setFieldType] = useState<LockableFieldType>('string');
  const [value, setValue] = useState('');

  return (
    <div className="w-80">
      <LockableValueField
        id={fieldId}
        label={<Label htmlFor={fieldId}>Amount</Label>}
        value={value}
        onValueChange={setValue}
        locked={false}
        showFieldActions={false}
        fieldType={fieldType}
        fieldTypes={['string', 'integer', 'double', 'boolean']}
        onFieldTypeChange={(type) => {
          setFieldType(type);
          setValue('');
        }}
      />
    </div>
  );
}

export const OfferedTypes: Story = {
  name: 'Offered types',
  render: () => <OfferedTypesDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'The component can render every type in `FIELD_TYPE_ORDER`, but a surface with a narrower vocabulary passes `fieldTypes` to choose which ones the picker offers, in display order.',
      },
    },
  },
};

const GERMAN_STRINGS: Partial<LockableValueFieldStrings> = {
  fieldTypeTooltip: 'Typ',
  fieldTypeAriaLabel: 'Feldtyp',
  typeLabels: {
    string: 'Text',
    integer: 'Ganzzahl',
    double: 'Dezimalzahl',
    boolean: 'Wahrheitswert',
  },
  literalLabels: { string: 'Fester Wert', integer: 'Fester Wert', boolean: 'Fester Wert' },
  literalDescriptions: {
    string: 'Einen Textwert verwenden',
    integer: 'Einen Zahlenwert verwenden',
  },
  valueFieldLabel: (typeLabel) => `Wert (${typeLabel})`,
  expressionFieldLabel: (typeLabel) => `Ausdruck (${typeLabel})`,
  trueLabel: 'Wahr',
  falseLabel: 'Falsch',
  requiredTooltip: 'Pflichtfeld',
  requiredAriaLabel: 'Pflichtfeld',
  optionalAriaLabel: 'Optionales Feld',
  insertLabel: 'Einfügen',
  insertAriaLabel: 'Variable einfügen',
  valueModeAriaLabel: 'Wertmodus wählen',
  expressionLabel: 'Ausdruck',
  expressionDescription: 'JS-Ausdruck verwenden',
  lockedLabel: 'Schreibgeschützt',
  unlockedLabel: 'Bearbeitbar',
  lockedHint: 'Schreibgeschützt. Zum Bearbeiten klicken.',
  unlockedHint: 'Bearbeitbar. Klicken, um den Schreibschutz zu aktivieren.',
};

function LocalizedDemo() {
  const fieldId = useId();
  const [value, setValue] = useState('');
  const [locked, setLocked] = useState(false);
  const [required, setRequired] = useState(true);
  const [fieldType, setFieldType] = useState<LockableFieldType>('string');
  const [mode, setMode] = useState<LockableValueFieldMode>('literal');

  return (
    <div className="w-80">
      <LockableValueField
        id={fieldId}
        value={value}
        onValueChange={setValue}
        locked={locked}
        onLockedChange={setLocked}
        required={required}
        onRequiredChange={setRequired}
        fieldType={fieldType}
        onFieldTypeChange={setFieldType}
        mode={mode}
        onModeChange={setMode}
        variables={[{ label: 'Kundenname', value: 'vars.customerName' }]}
        strings={GERMAN_STRINGS}
      />
    </div>
  );
}

export const Localized: Story = {
  name: 'Localized strings',
  render: () => <LocalizedDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'apollo-wind ships no translation runtime, so every user-visible string comes from the `strings` prop, with English defaults for any key left out. This example overrides the chrome in German.',
      },
    },
  },
};

function ResponsiveDemo() {
  const fullWidthId = useId();
  const narrowId = useId();
  const compactId = useId();
  const [value, setValue] = useState('');
  const [locked, setLocked] = useState(true);
  const [mode, setMode] = useState<LockableValueFieldMode>('literal');
  const [fieldType, setFieldType] = useState<LockableFieldType>('string');
  const [required, setRequired] = useState(true);

  const handleFieldTypeChange = (type: LockableFieldType) => {
    setFieldType(type);
    setValue('');
    if (!FIELD_TYPE_META[type].supportsExpression) {
      setMode('literal');
    }
  };

  const label = (fieldId: string) => (
    <Label htmlFor={fieldId} className="text-xs font-medium text-foreground-muted">
      Label
      {required && <RequiredIndicator />}
    </Label>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
          Full width
        </span>
        <div className="w-80">
          <LockableValueField
            id={fullWidthId}
            label={label(fullWidthId)}
            headerActions={<DeleteFieldButton />}
            value={value}
            onValueChange={setValue}
            locked={locked}
            onLockedChange={setLocked}
            mode={mode}
            onModeChange={setMode}
            fieldType={fieldType}
            onFieldTypeChange={handleFieldTypeChange}
            required={required}
            onRequiredChange={setRequired}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
          Narrow container (controls collapse to icon-only)
        </span>
        <div className="w-[200px]">
          <LockableValueField
            id={narrowId}
            label={label(narrowId)}
            headerActions={<DeleteFieldButton />}
            value={value}
            onValueChange={setValue}
            locked={locked}
            onLockedChange={setLocked}
            mode={mode}
            onModeChange={setMode}
            fieldType={fieldType}
            onFieldTypeChange={handleFieldTypeChange}
            required={required}
            onRequiredChange={setRequired}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
          Forced compact (via the compact prop, regardless of width)
        </span>
        <div className="w-80">
          <LockableValueField
            compact
            id={compactId}
            label={label(compactId)}
            headerActions={<DeleteFieldButton />}
            value={value}
            onValueChange={setValue}
            locked={locked}
            onLockedChange={setLocked}
            mode={mode}
            onModeChange={setMode}
            fieldType={fieldType}
            onFieldTypeChange={handleFieldTypeChange}
            required={required}
            onRequiredChange={setRequired}
          />
        </div>
      </div>
    </div>
  );
}

export const Responsive: Story = {
  render: () => <ResponsiveDemo />,
};
