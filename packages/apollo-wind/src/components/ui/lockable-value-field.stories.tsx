import type { Meta, StoryObj } from '@storybook/react-vite';
import { X } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '@/lib';
import { Label } from './label';
import {
  FIELD_TYPE_META,
  type LockableFieldType,
  LockableValueField,
  type LockableValueFieldMode,
} from './lockable-value-field';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';

const meta = {
  title: 'Components/Core/Lockable Value Field',
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
  Boolean, Single select, Multiselect, and File each render their own
  matching input.
- Required switch toggles the red asterisk on the label. Only shown when
  \`onRequiredChange\` is provided.
- Built-in AI-assist popover to describe and generate a value, and an
  Insert-variable affordance for binding to upstream data. Both hidden via
  \`showFieldActions={false}\` for read-only reviewer contexts.
- \`label\` accepts any ReactNode, so a consumer can compose its own
  inline-editable title in place of the default text -- see **Controls**
  below.
- \`controlsVisibility\` decides whether the type/required/AI/insert/header
  actions are always shown or only on hover -- see **Controls** below.
- Header row is responsive (container query): the type, required,
  AI-assist, and insert-variable controls collapse to icon-only once the
  field gets too narrow for their labels. See **Responsive** below.
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

function CloseFieldButton({ controlsVisibility }: { controlsVisibility: 'visible' | 'hover' }) {
  return (
    <button
      type="button"
      aria-label="Close field"
      className={cn(
        'grid size-7 shrink-0 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground',
        controlsVisibility === 'hover' &&
          'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 has-[[aria-expanded=true]]:opacity-100'
      )}
    >
      <X size={14} />
    </button>
  );
}

function DefaultDemo() {
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

  return (
    <div className="w-80">
      <LockableValueField
        label={
          <Label className="text-xs font-medium text-foreground-muted">
            Label
            {required && <span className="ml-0.5 text-destructive">*</span>}
          </Label>
        }
        headerActions={<CloseFieldButton controlsVisibility="visible" />}
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
  render: () => <DefaultDemo />,
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
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </button>
  );
}

function ControlsPlayground() {
  const [title, setTitle] = useState('Label');
  const [value, setValue] = useState('');
  const [locked, setLocked] = useState(true);
  const [mode, setMode] = useState<LockableValueFieldMode>('fixed');
  const [fieldType, setFieldType] = useState<LockableFieldType>('string');
  const [required, setRequired] = useState(true);
  const [controlsVisibility, setControlsVisibility] = useState<'visible' | 'hover'>('visible');

  const handleFieldTypeChange = (type: LockableFieldType) => {
    setFieldType(type);
    setValue('');
    if (!FIELD_TYPE_META[type].supportsExpression) {
      setMode('fixed');
    }
  };

  return (
    <div className="flex w-80 flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
          Controls
        </span>
        <ToggleGroup
          type="single"
          size="xs"
          value={controlsVisibility}
          onValueChange={(v) => v && setControlsVisibility(v as 'visible' | 'hover')}
        >
          <ToggleGroupItem value="visible" className="!px-2.5 !text-xs">
            Show
          </ToggleGroupItem>
          <ToggleGroupItem value="hover" className="!px-2.5 !text-xs">
            Hide
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <LockableValueField
        label={
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <InlineEditableLabel title={title} onTitleChange={setTitle} required={required} />
          </div>
        }
        headerActions={<CloseFieldButton controlsVisibility={controlsVisibility} />}
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
        controlsVisibility={controlsVisibility}
      />
    </div>
  );
}

export const Controls: Story = {
  render: () => <ControlsPlayground />,
};

function ResponsiveDemo() {
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

  const label = (
    <Label className="text-xs font-medium text-foreground-muted">
      Label
      {required && <span className="ml-0.5 text-destructive">*</span>}
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
            label={label}
            headerActions={<CloseFieldButton controlsVisibility="visible" />}
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
            label={label}
            headerActions={<CloseFieldButton controlsVisibility="visible" />}
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
            label={label}
            headerActions={<CloseFieldButton controlsVisibility="visible" />}
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
