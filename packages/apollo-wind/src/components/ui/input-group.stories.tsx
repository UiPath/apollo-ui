import { javascript } from '@codemirror/lang-javascript';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AlignLeft,
  Braces,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Eye,
  EyeOff,
  Hash,
  Inbox,
  ListChecks,
  ListFilter,
  Lock,
  type LucideIcon,
  MoreHorizontal,
  Search,
  SearchCheck,
  SquareCheck,
  Tags,
  ToggleLeft,
  Type,
  X,
} from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Badge } from './badge';
import { Checkbox } from './checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import { Combobox } from './combobox';
import { Command, CommandGroup, CommandItem, CommandList } from './command';
import { DatePicker } from './date-picker';
import { DateTimePicker } from './datetime-picker';
import { FormField, FormFieldLabel } from './form-field';
import { Input } from './input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupBody,
  InputGroupButton,
  type InputGroupLayout,
  InputGroupPopoverTrigger,
  type InputGroupProps,
  InputGroupRow,
  InputGroupText,
  InputGroupTrigger,
} from './input-group';
import { MultiSelect } from './multi-select';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Switch } from './switch';
import { Textarea } from './textarea';

const meta = {
  title: 'Components/Core/Input Group',
  component: InputGroup,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The box a field's control sits in. It draws the border, fill, radius, focus ring, hover, invalid
and disabled states for whatever control is inside, so a text input, a select and a code editor all
read as the same field.

## Using a control in an InputGroup

Put the control inside the group. Apollo's controls detect the group and become its control: the
group draws the box, anchors their popovers to it, and renders the message from its own \`error\`.
There is nothing to set on the control.

| Control | What to write inside the group |
| --- | --- |
| Input, Textarea | \`<Input />\`, \`<Textarea />\`. \`InputGroupInput\` and \`InputGroupTextarea\` are the same, kept for shadcn parity. |
| Select | \`<Select><SelectTrigger>…</SelectTrigger>…</Select>\` |
| MultiSelect, Combobox, DatePicker, DateRangePicker, DateTimePicker | The control, as is |
| Your own popover picker | \`InputGroupPopoverTrigger\` inside a \`Popover\` |
| Your own button control, such as a collapsible header | \`InputGroupTrigger\` |
| Your own input or editor | \`data-slot="input-group-control"\` on its focusable element, and \`min-w-0 flex-1\` on its root |
| Switch, Checkbox | The control, as is, in a \`variant="none"\` group. They draw their own focus ring, so they do not take the slot |

\`\`\`tsx
<InputGroup error={error}>
  <InputGroupAddon>
    <CalendarDays />
  </InputGroupAddon>
  <DatePicker id="due" value={due} onValueChange={setDue} />
  <InputGroupAddon align="inline-end">
    <ValueModeMenu mode={mode} onSelect={setMode} />
  </InputGroupAddon>
</InputGroup>
\`\`\`

- Box props (\`variant\`, \`size\`, \`layout\`, \`error\`, \`invalid\`, \`disabled\`) go on the group.
  A control's own \`variant\` and \`size\` do not apply inside it, and its own \`error\` marks it
  invalid without a second message.
- Controls inside an \`InputGroupAddon\` or an \`InputGroupBody\` are standard fields with their own
  box. Give a nested field addons by wrapping it in its own InputGroup.
- A custom control that also renders standalone can read \`useInputGroup()\`.

## Layouts

\`row\` is one line, \`grow\` lets the content grow the box, \`block\` stacks an \`InputGroupRow\`
above an \`InputGroupBody\`, and \`fill\` hands the box to a multi-line editor. Addons stay on the
control's first line in every layout.
`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'ghost', 'outline', 'none'],
    },
    size: {
      control: 'select',
      options: ['default', 'xs'],
    },
    layout: {
      control: 'select',
      options: ['row', 'grow', 'block', 'fill'],
    },
  },
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Controls
// ============================================================================

interface ControlProps {
  id: string;
  invalid: boolean;
  disabled: boolean;
}

const QUEUES = ['Invoices', 'Receipts', 'Purchase orders', 'Contracts'];

function PickerControl({ id, invalid, disabled }: ControlProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | undefined>('Invoices');
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <InputGroupPopoverTrigger
        id={id}
        placeholder="Choose a queue"
        aria-invalid={invalid || undefined}
        disabled={disabled}
      >
        {value && <span className="truncate">{value}</span>}
      </InputGroupPopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-1">
        <Command>
          <CommandList>
            <CommandGroup>
              {QUEUES.map((queue) => (
                <CommandItem
                  key={queue}
                  onSelect={() => {
                    setValue(queue);
                    setOpen(false);
                  }}
                >
                  {queue}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function SelectControl({ id, invalid, disabled }: ControlProps) {
  return (
    <Select defaultValue="high" disabled={disabled}>
      <SelectTrigger id={id} aria-invalid={invalid || undefined}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="low">Low</SelectItem>
        <SelectItem value="high">High</SelectItem>
        <SelectItem value="urgent">Urgent</SelectItem>
      </SelectContent>
    </Select>
  );
}

const DOCUMENT_TYPES = [
  { label: 'Invoices', value: 'invoices' },
  { label: 'Receipts', value: 'receipts' },
  { label: 'Contracts', value: 'contracts' },
  { label: 'Purchase orders', value: 'purchase-orders' },
  { label: 'Delivery notes', value: 'delivery-notes' },
];

function MultiSelectControl({
  id,
  invalid,
  disabled,
  initial = ['invoices', 'receipts'],
}: ControlProps & { initial?: string[] }) {
  const [selected, setSelected] = useState(initial);
  return (
    <MultiSelect
      id={id}
      options={DOCUMENT_TYPES}
      selected={selected}
      onChange={setSelected}
      placeholder="Choose document types"
      aria-invalid={invalid || undefined}
      disabled={disabled}
    />
  );
}

const OWNERS = [
  { value: 'finance', label: 'Finance operations' },
  { value: 'procurement', label: 'Procurement' },
  { value: 'legal', label: 'Legal review' },
];

function ComboboxControl({ id, invalid, disabled }: ControlProps) {
  const [value, setValue] = useState('finance');
  return (
    <Combobox
      id={id}
      items={OWNERS}
      value={value}
      onValueChange={setValue}
      placeholder="Choose an owner"
      aria-invalid={invalid || undefined}
      disabled={disabled}
    />
  );
}

function DateControl({ id, invalid, disabled }: ControlProps) {
  const [value, setValue] = useState<Date | undefined>(new Date(2026, 8, 30));
  return (
    <DatePicker
      id={id}
      value={value}
      onValueChange={setValue}
      aria-invalid={invalid || undefined}
      disabled={disabled}
    />
  );
}

function DateTimeControl({ id, invalid, disabled }: ControlProps) {
  const [value, setValue] = useState<Date | undefined>(new Date(2026, 8, 30, 9, 30));
  return (
    <DateTimePicker
      id={id}
      value={value}
      onValueChange={setValue}
      aria-invalid={invalid || undefined}
      disabled={disabled}
    />
  );
}

/**
 * A control built outside the library: its own input carries the slot. A row of chips is padded to
 * exactly one line of the box's content (26px in core, 24px in future), as MultiSelect's are.
 */
function TagsControl({ id, invalid, disabled }: ControlProps) {
  const [tags, setTags] = useState(['finance', 'q3']);
  const [draft, setDraft] = useState('');
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 py-0.5 future:py-px">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            disabled={disabled}
            onClick={() => setTags((current) => current.filter((t) => t !== tag))}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        id={id}
        data-slot="input-group-control"
        value={draft}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        placeholder="Add a tag"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && draft.trim()) {
            e.preventDefault();
            setTags((current) => [...current, draft.trim()]);
            setDraft('');
          } else if (e.key === 'Backspace' && !draft) {
            setTags((current) => current.slice(0, -1));
          }
        }}
        className="min-w-16 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  );
}

// A `fill` box has no padding of its own, so the editor pads its first line onto the row's midline:
// half the row's inner height less a 20px line (7px in core, inside a 1px border; 10px in future).
const EDITOR_THEME = EditorView.theme({
  '&': { backgroundColor: 'transparent', fontSize: 'inherit' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'inherit', lineHeight: '20px' },
  '.cm-content': { padding: 'var(--editor-py) 12px', caretColor: 'currentColor' },
});

/**
 * CodeMirror as a custom control. The slot goes on its content element, the one that takes focus,
 * so an addon click focuses the editor and its `aria-invalid` reaches the group.
 */
function CodeEditorControl({
  id,
  invalid,
  disabled,
  doc = '$vars.order.total * 1.2',
}: ControlProps & { doc?: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc,
        extensions: [
          javascript(),
          EDITOR_THEME,
          EditorView.editable.of(!disabled),
          EditorView.contentAttributes.of({
            id,
            'data-slot': 'input-group-control',
            'aria-invalid': invalid ? 'true' : 'false',
          }),
        ],
      }),
    });
    return () => view.destroy();
  }, [id, invalid, disabled, doc]);
  return (
    <div
      ref={host}
      className="min-w-0 flex-1 font-mono text-sm [--editor-py:7px] future:[--editor-py:10px]"
    />
  );
}

interface ControlCase {
  key: string;
  label: string;
  icon: LucideIcon;
  layout?: InputGroupLayout;
  variant?: InputGroupProps['variant'];
  /** A `fill` editor draws its own inset, so a leading addon would sit on the box's edge. */
  leading?: boolean;
  render: (props: ControlProps) => ReactNode;
}

const CONTROLS: ControlCase[] = [
  {
    key: 'text',
    label: 'Text',
    icon: Type,
    render: ({ id, invalid, disabled }) => (
      <Input
        id={id}
        defaultValue="Invoice 1042"
        aria-invalid={invalid || undefined}
        disabled={disabled}
      />
    ),
  },
  {
    key: 'number',
    label: 'Number',
    icon: Hash,
    render: ({ id, invalid, disabled }) => (
      <Input
        id={id}
        type="number"
        defaultValue={3}
        aria-invalid={invalid || undefined}
        disabled={disabled}
      />
    ),
  },
  {
    key: 'textarea',
    label: 'Textarea',
    icon: AlignLeft,
    layout: 'grow',
    render: ({ id, invalid, disabled }) => (
      <Textarea
        id={id}
        rows={2}
        defaultValue={'Loading dock B.\nCall on arrival.'}
        aria-invalid={invalid || undefined}
        disabled={disabled}
      />
    ),
  },
  {
    key: 'select',
    label: 'Select',
    icon: ListFilter,
    render: (props) => <SelectControl {...props} />,
  },
  {
    key: 'multi-select',
    label: 'Multi select',
    icon: ListChecks,
    layout: 'grow',
    render: (props) => <MultiSelectControl {...props} />,
  },
  {
    key: 'picker',
    label: 'Popover picker',
    icon: Inbox,
    render: (props) => <PickerControl {...props} />,
  },
  {
    key: 'combobox',
    label: 'Combobox',
    icon: SearchCheck,
    render: (props) => <ComboboxControl {...props} />,
  },
  {
    key: 'date',
    label: 'Date',
    icon: CalendarDays,
    render: (props) => <DateControl {...props} />,
  },
  {
    key: 'datetime',
    label: 'Date and time',
    icon: CalendarClock,
    render: (props) => <DateTimeControl {...props} />,
  },
  {
    key: 'tags',
    label: 'Custom control',
    icon: Tags,
    layout: 'grow',
    render: (props) => <TagsControl {...props} />,
  },
  {
    key: 'code',
    label: 'Code editor',
    icon: Braces,
    layout: 'fill',
    leading: false,
    render: (props) => <CodeEditorControl {...props} />,
  },
  {
    key: 'switch',
    label: 'Switch',
    icon: ToggleLeft,
    variant: 'none',
    render: ({ id, invalid, disabled }) => (
      <Switch id={id} defaultChecked aria-invalid={invalid || undefined} disabled={disabled} />
    ),
  },
  {
    key: 'checkbox',
    label: 'Checkbox',
    icon: SquareCheck,
    variant: 'none',
    render: ({ id, invalid, disabled }) => (
      <Checkbox id={id} defaultChecked aria-invalid={invalid || undefined} disabled={disabled} />
    ),
  },
];

type ControlState = 'default' | 'invalid' | 'disabled';

function ControlField({
  control,
  state = 'default',
  idPrefix,
  showLabel = true,
}: {
  control: ControlCase;
  state?: ControlState;
  idPrefix: string;
  showLabel?: boolean;
}) {
  const id = `${idPrefix}-${control.key}`;
  const invalid = state === 'invalid';
  const disabled = state === 'disabled';
  const Icon = control.icon;
  return (
    <FormField>
      {showLabel && <FormFieldLabel htmlFor={id}>{control.label}</FormFieldLabel>}
      {/* `disabled` on the group too, for a control that cannot be `:disabled` itself. */}
      <InputGroup layout={control.layout} variant={control.variant} disabled={disabled}>
        {control.leading !== false && (
          <InputGroupAddon>
            <Icon className="text-muted-foreground" />
          </InputGroupAddon>
        )}
        {control.render({ id, invalid, disabled })}
        <InputGroupAddon align="inline-end">
          <InputGroupButton icon size="3xs" aria-label="Field options" disabled={disabled}>
            <MoreHorizontal />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </FormField>
  );
}

/**
 * Every supported control, each with a leading and a trailing addon so their alignment against the
 * control is visible. The switch and checkbox are unboxed (`variant="none"`) and still line up with
 * the boxed fields.
 */
export const Controls: Story = {
  render: () => (
    <div className="grid w-96 gap-5">
      {CONTROLS.map((control) => (
        <ControlField key={control.key} control={control} idPrefix="controls" />
      ))}
    </div>
  ),
};

const STATES: { key: ControlState; label: string }[] = [
  { key: 'default', label: 'Default' },
  { key: 'invalid', label: 'Invalid' },
  { key: 'disabled', label: 'Disabled' },
];

/**
 * Every control in each state. Invalid comes from the control's own `aria-invalid`. An unboxed
 * control has no edge to paint, so it reports invalid through its own styling and the message below
 * it. Switch the theme from the toolbar to check both.
 */
export const States: Story = {
  render: () => (
    <div className="grid w-[56rem] grid-cols-[8rem_repeat(3,minmax(0,1fr))] items-start gap-x-4 gap-y-5">
      <span />
      {STATES.map((state) => (
        <span key={state.key} className="text-xs text-muted-foreground">
          {state.label}
        </span>
      ))}
      {CONTROLS.map((control) => (
        <div key={control.key} className="contents">
          <span className="pt-2 text-xs text-muted-foreground">{control.label}</span>
          {STATES.map((state) => (
            <ControlField
              key={state.key}
              control={control}
              state={state.key}
              idPrefix={`states-${state.key}`}
              showLabel={false}
            />
          ))}
        </div>
      ))}
    </div>
  ),
};

// ============================================================================
// Variants and layouts
// ============================================================================

const VARIANTS: NonNullable<InputGroupProps['variant']>[] = ['default', 'ghost', 'outline', 'none'];

/**
 * Each variant in each state, with the state set on the group. `outline` draws a border with no
 * fill or ring. `none` paints nothing but keeps the row's height and right padding.
 */
export const Variants: Story = {
  render: () => (
    <div className="grid w-[48rem] grid-cols-[6rem_repeat(3,minmax(0,1fr))] items-center gap-x-4 gap-y-4">
      <span />
      {STATES.map((state) => (
        <span key={state.key} className="text-xs text-muted-foreground">
          {state.label}
        </span>
      ))}
      {VARIANTS.map((variant) => (
        <div key={variant} className="contents">
          <span className="text-xs text-muted-foreground">{variant}</span>
          {STATES.map((state) => (
            <InputGroup
              key={state.key}
              variant={variant}
              invalid={state.key === 'invalid'}
              disabled={state.key === 'disabled'}
            >
              <Input
                aria-label={`${variant} ${state.label}`}
                defaultValue="Order 1042"
                disabled={state.key === 'disabled'}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton icon size="3xs" aria-label="Clear value">
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          ))}
        </div>
      ))}
    </div>
  ),
};

/**
 * A collapsible section: the row holds a chevron, the section's name and, while closed, a summary
 * of what is hidden. The body pads the fields nested inside it, which bring their own box.
 */
function FiltersSection() {
  const [open, setOpen] = useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <InputGroup layout="block">
        <InputGroupRow>
          <CollapsibleTrigger asChild>
            <InputGroupTrigger aria-label={open ? 'Collapse Filters' : 'Expand Filters'}>
              <ChevronRight
                className={`shrink-0 opacity-60 transition-transform ${open ? 'rotate-90' : ''}`}
              />
              <span className="min-w-0 truncate font-medium">Filters</span>
              {!open && (
                <span className="ml-auto truncate text-xs text-muted-foreground">2 conditions</span>
              )}
            </InputGroupTrigger>
          </CollapsibleTrigger>
          <InputGroupAddon align="inline-end">
            <InputGroupButton icon size="3xs" aria-label="Section options">
              <MoreHorizontal />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroupRow>
        <InputGroupBody>
          <CollapsibleContent>
            {/* Outlined, since a filled field would vanish into the section's own fill. */}
            <div className="grid gap-3 p-4">
              <InputGroup variant="outline">
                <Input aria-label="Condition 1" defaultValue="Status equals Open" />
              </InputGroup>
              <InputGroup variant="outline">
                <SelectControl id="filters-priority" invalid={false} disabled={false} />
              </InputGroup>
            </div>
          </CollapsibleContent>
        </InputGroupBody>
      </InputGroup>
    </Collapsible>
  );
}

function LayoutSection({ layout, children }: { layout: InputGroupLayout; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-semibold text-foreground">layout="{layout}"</h3>
      {children}
    </section>
  );
}

/**
 * Content taller than one line. The trailing addon stays on the first line in every layout, and
 * `block` nests whole fields in its body.
 */
export const Layouts: Story = {
  render: () => (
    <div className="grid w-96 gap-8">
      <LayoutSection layout="row">
        <ControlField control={CONTROLS[0]} idPrefix="layout-row" showLabel={false} />
      </LayoutSection>
      <LayoutSection layout="grow">
        <InputGroup layout="grow">
          <Textarea
            aria-label="Notes"
            rows={4}
            defaultValue={'Deliver to the loading dock.\nCall ahead on arrival.\nGate code 4417.'}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton icon size="3xs" aria-label="Field options">
              <MoreHorizontal />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup layout="grow">
          <MultiSelectControl
            id="layout-grow-multi"
            invalid={false}
            disabled={false}
            initial={DOCUMENT_TYPES.map((type) => type.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton icon size="3xs" aria-label="Field options">
              <MoreHorizontal />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </LayoutSection>
      <LayoutSection layout="block">
        <FiltersSection />
      </LayoutSection>
      <LayoutSection layout="fill">
        <InputGroup layout="fill">
          <CodeEditorControl
            id="layout-fill-code"
            invalid={false}
            disabled={false}
            doc={'const total = $vars.order.total;\nconst tax = total * 0.2;\nreturn total + tax;'}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton icon size="3xs" aria-label="Field options">
              <MoreHorizontal />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </LayoutSection>
    </div>
  ),
};

// ============================================================================
// Addons
// ============================================================================

const LOCK_OPTIONS = ['Input', 'Output', 'Process variable'];

function LockedField() {
  const [open, setOpen] = useState(false);
  const [bound, setBound] = useState<string | null>(null);
  return (
    <InputGroup>
      <InputGroupAddon>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <InputGroupButton icon size="3xs" aria-label="Lock field to a value">
              <Lock />
            </InputGroupButton>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-1">
            <Command>
              <CommandList>
                <CommandGroup heading="Bind to">
                  {LOCK_OPTIONS.map((option) => (
                    <CommandItem
                      key={option}
                      onSelect={() => {
                        setBound(option);
                        setOpen(false);
                      }}
                    >
                      {option}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
      <Input
        aria-label="Bound value"
        readOnly
        value={bound ?? ''}
        placeholder="Click the lock to bind a value"
      />
    </InputGroup>
  );
}

function ClearableField() {
  const [value, setValue] = useState('Pre-filled value');
  return (
    <InputGroup>
      <Input aria-label="Clearable" value={value} onChange={(e) => setValue(e.target.value)} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton icon size="3xs" aria-label="Clear value" onClick={() => setValue('')}>
          <X />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

function PasswordField() {
  const [shown, setShown] = useState(false);
  return (
    <InputGroup>
      <Input
        aria-label="Password"
        type={shown ? 'text' : 'password'}
        defaultValue="correct horse"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          icon
          size="3xs"
          aria-label={shown ? 'Hide password' : 'Show password'}
          onClick={() => setShown((s) => !s)}
        >
          {shown ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

function CountedField() {
  const [value, setValue] = useState('Quarterly invoice run');
  return (
    <InputGroup>
      <Input
        aria-label="Run name"
        maxLength={80}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>{value.length}/80</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
}

function Nothing() {
  return null;
}

function AddonExample({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

/** What an addon can hold. A click on an addon's own surface focuses the control. */
export const Addons: Story = {
  render: () => (
    <div className="grid w-80 gap-5">
      <AddonExample label="Icon">
        <InputGroup>
          <InputGroupAddon>
            <Search className="text-muted-foreground" />
          </InputGroupAddon>
          <Input aria-label="Search" placeholder="Search fields..." />
        </InputGroup>
      </AddonExample>
      <AddonExample label="Text">
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <Input aria-label="Subdomain" defaultValue="acme" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>.uipath.com</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </AddonExample>
      <AddonExample label="Button">
        <ClearableField />
      </AddonExample>
      <AddonExample label="Toggle button">
        <PasswordField />
      </AddonExample>
      <AddonExample label="Popover button">
        <LockedField />
      </AddonExample>
      <AddonExample label="Live text">
        <CountedField />
      </AddonExample>
      <AddonExample label="Keyboard shortcut">
        <InputGroup>
          <InputGroupAddon>
            <Search className="text-muted-foreground" />
          </InputGroupAddon>
          <Input aria-label="Command" placeholder="Jump to..." />
          <InputGroupAddon align="inline-end">
            <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </InputGroupAddon>
        </InputGroup>
      </AddonExample>
      <AddonExample label="Addon that renders nothing">
        <InputGroup>
          <InputGroupAddon>
            <Nothing />
          </InputGroupAddon>
          <Input aria-label="No gap" defaultValue="No gap opens ahead of the value" />
        </InputGroup>
      </AddonExample>
    </div>
  ),
};

// ============================================================================
// Anchoring, validation, sizes
// ============================================================================

/**
 * Open each picker: its panel anchors to the box, not to the inset trigger, so it opens flush
 * under the border at the field's full width.
 */
export const PopoverAnchoring: Story = {
  render: () => (
    <div className="grid w-80 gap-5">
      {CONTROLS.filter((c) =>
        ['select', 'multi-select', 'picker', 'combobox', 'date', 'datetime'].includes(c.key)
      ).map((control) => (
        <ControlField key={control.key} control={control} idPrefix="anchoring" />
      ))}
    </div>
  ),
};

export const WithInlineValidation: Story = {
  render: () => (
    <FormField className="w-72">
      <FormFieldLabel htmlFor="group-node-name">Node name</FormFieldLabel>
      <InputGroup error="This node name is already in use. Enter a unique name before saving.">
        <InputGroupAddon>
          <Lock className="text-muted-foreground" />
        </InputGroupAddon>
        <Input id="group-node-name" value="Invoice processor" readOnly />
      </InputGroup>
    </FormField>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Input group controls use the same inline validation behavior as Input. The message remains below the grouped control while the group border communicates the invalid state.',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="grid w-72 gap-4">
      {(['default', 'xs'] as const).map((size) => (
        <InputGroup key={size} size={size}>
          <InputGroupAddon>
            <Search className="text-muted-foreground" />
          </InputGroupAddon>
          <Input aria-label={`Search, ${size}`} placeholder={`size="${size}"`} />
        </InputGroup>
      ))}
    </div>
  ),
};
