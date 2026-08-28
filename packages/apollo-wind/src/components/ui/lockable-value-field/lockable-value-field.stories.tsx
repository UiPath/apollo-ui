import type { Meta, StoryObj } from '@storybook/react-vite';
import { Trash2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Label, RequiredIndicator } from '../label';
import { LockableValueField } from './lockable-value-field';
import { FIELD_TYPE_META, type LockableFieldType, type LockableValueFieldMode } from './types';

const meta = {
  title: 'Components/UiPath/Lockable Value Field',
  component: LockableValueField,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A field that can be locked to read-only, typed as one of several data types,
and (for scalar types) switched between a literal value and a JS expression.

- Left lock icon toggles Editable / Read-only. Read-only fields show plain
  text, not a disabled control.
- Right value-mode icon switches between Fixed value and Expression,
  updating the value styling. Only shown for types an expression can
  produce.
- Field type dropdown swaps the control itself: String, Integer, Date,
  Boolean, Single select, Multi select, and File each render their own
  matching input.
- Required switch toggles the red asterisk on the label. Only shown when
  \`onRequiredChange\` is provided.
- Built-in AI-assist popover to describe and generate a value, and an
  Insert-variable affordance for binding to upstream data. Both hidden via
  \`showFieldActions={false}\` for read-only reviewer contexts.
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
  const [mode, setMode] = useState<LockableValueFieldMode>('fixed');
  const [fieldType, setFieldType] = useState<LockableFieldType>('string');
  const [required, setRequired] = useState(true);
  const [deleted, setDeleted] = useState(false);

  const handleFieldTypeChange = (type: LockableFieldType) => {
    setFieldType(type);
    setValue('');
    if (!FIELD_TYPE_META[type].supportsExpression) {
      setMode('fixed');
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
          { label: 'Customer name', value: '$input.customerName' },
          { label: 'Invoice number', value: '$input.invoiceNumber' },
          { label: 'User email', value: '$user.email' },
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
      {required && <span className="ml-0.5 text-destructive">*</span>}
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
        variables={[{ label: 'Flow array', value: '$vars.flowArray' }]}
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

/**
 * Matches the inline-editable title pattern the Form HITL quick-form
 * builder passes into `label`: click the text to edit it, blur or press
 * Enter/Escape to commit.
 */
function InlineEditableLabel({
  title,
  onTitleChange,
  required,
}: {
  title: string;
  onTitleChange: (title: string) => void;
  required: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return editing ? (
    <input
      ref={inputRef}
      value={title}
      onChange={(e) => onTitleChange(e.target.value)}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'Escape') setEditing(false);
      }}
      className="min-w-0 flex-1 rounded bg-surface-overlay px-1 py-0.5 text-xs font-medium text-foreground outline-none ring-1 ring-brand"
      // biome-ignore lint/a11y/noAutofocus: only mounts in response to the user's own click on the label, not on page load
      autoFocus
    />
  ) : (
    <button
      type="button"
      onClick={() => {
        setEditing(true);
        setTimeout(() => inputRef.current?.select(), 0);
      }}
      className="truncate rounded px-1 py-0.5 text-left text-xs font-medium text-foreground-muted transition hover:bg-surface-overlay hover:text-foreground"
    >
      {title}
      {required && <RequiredIndicator />}
    </button>
  );
}

function ResponsiveDemo() {
  const fullWidthId = useId();
  const narrowId = useId();
  const compactId = useId();
  const [value, setValue] = useState('');
  const [locked, setLocked] = useState(true);
  const [mode, setMode] = useState<LockableValueFieldMode>('fixed');
  const [fieldType, setFieldType] = useState<LockableFieldType>('string');
  const [required, setRequired] = useState(true);

  const handleFieldTypeChange = (type: LockableFieldType) => {
    setFieldType(type);
    setValue('');
    if (!FIELD_TYPE_META[type].supportsExpression) {
      setMode('fixed');
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
