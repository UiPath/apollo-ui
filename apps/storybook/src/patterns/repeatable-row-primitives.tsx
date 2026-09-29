import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  GripVertical,
  MoreVertical,
  Plus,
  Trash2,
} from 'lucide-react';
import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DatePicker } from '@/components/ui/date-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InsertVariableAction } from '@/components/ui/field-actions';
import { type ValueMode, ValueModeIndicator, ValueModeMenu } from '@/components/ui/field-addons';
import { FormFieldError } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib';

/**
 * Building blocks for the Repeatable Rows guidance page. Every layout on that page is
 * composed from these, so the delete, add, focus, and validation behavior stays identical
 * across condition rows, groups, rules, cards, and key-value pairs.
 */

export type VariableOption = { label: string; value: string };

export const DEFAULT_VARIABLES: VariableOption[] = [
  { label: 'accountId', value: '$vars.accountId' },
  { label: 'approverEmail', value: '$vars.approverEmail' },
  { label: 'invoiceTotal', value: '$vars.invoiceTotal' },
];

// ── Focus ───────────────────────────────────────────────────────────────────

/**
 * Moves focus after a list changes. After an add, focus lands on the new item's
 * `[data-row-first]` control. After a delete, it lands on the delete action of the item
 * now at the same position, or on the add action when the list is empty. Items are the
 * `[data-row]` direct children of `listRef`.
 */
export function useRowFocus() {
  const listRef = React.useRef<HTMLDivElement>(null);
  const addRef = React.useRef<HTMLButtonElement>(null);
  const pending = React.useRef<{ kind: 'add' } | { kind: 'delete'; position: number } | null>(null);

  React.useEffect(() => {
    const next = pending.current;
    const list = listRef.current;
    if (!next || !list) return;
    pending.current = null;
    const rows = Array.from(list.querySelectorAll<HTMLElement>(':scope > [data-row]'));
    if (next.kind === 'add') {
      const row = rows.at(-1);
      (
        row?.querySelector<HTMLElement>('[data-row-first]') ??
        row?.querySelector<HTMLElement>('button, input, textarea')
      )?.focus();
      return;
    }
    const target = rows[Math.min(next.position, rows.length - 1)];
    (target?.querySelector<HTMLElement>('[data-row-delete]') ?? addRef.current)?.focus();
  });

  return {
    listRef,
    addRef,
    afterAdd: () => {
      pending.current = { kind: 'add' };
    },
    afterDelete: (position: number) => {
      pending.current = { kind: 'delete', position };
    },
  };
}

/** Blur that leaves the row, ignoring focus moving into a picker the row opened. */
function leftRow(event: React.FocusEvent<HTMLElement>) {
  const next = event.relatedTarget as HTMLElement | null;
  if (next && event.currentTarget.contains(next)) return false;
  if (next?.closest('[data-radix-popper-content-wrapper], [role="dialog"]')) return false;
  return true;
}

// ── Row actions ─────────────────────────────────────────────────────────────

/**
 * Row delete action. Mirrors the Quick form field delete in NodePropertyPanel: muted at
 * rest, neutral on hover, never red. Red is reserved for destructive menu items and
 * confirmation dialogs. Always visible by default; `revealOnHover` is for dense lists
 * only and needs a `group` ancestor.
 */
export function RowDeleteButton({
  label,
  onClick,
  revealOnHover = false,
  className,
}: {
  /** Accessible name that says which row goes, e.g. "Remove condition 2". */
  label: string;
  onClick?: () => void;
  revealOnHover?: boolean;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      icon
      aria-label={label}
      title={label}
      onClick={onClick}
      data-row-delete=""
      className={cn(
        'shrink-0 text-muted-foreground hover:text-foreground',
        revealOnHover &&
          'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100',
        className
      )}
    >
      <Trash2 />
    </Button>
  );
}

/**
 * Leading reorder handle. Only for lists where order changes the result. Activating it
 * opens Move up / Move down, which is the keyboard and touch alternative to dragging.
 */
export function RowDragHandle({
  label,
  onMoveUp,
  onMoveDown,
}: {
  label: string;
  /** Omitted when the item is already first. */
  onMoveUp?: () => void;
  /** Omitted when the item is already last. */
  onMoveDown?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className="grid size-8 shrink-0 cursor-grab place-items-center rounded text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuItem disabled={!onMoveUp} onSelect={onMoveUp}>
          <ArrowUp /> Move up
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!onMoveDown} onSelect={onMoveDown}>
          <ArrowDown /> Move down
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** "+ Add …" text action. Sits bottom-left, directly under the last row. */
export const AddRowButton = React.forwardRef<
  HTMLButtonElement,
  { children: React.ReactNode; onClick?: () => void; disabled?: boolean }
>(function AddRowButton({ children, onClick, disabled }, ref) {
  return (
    <Button ref={ref} type="button" variant="text" size="2xs" onClick={onClick} disabled={disabled}>
      <Plus />
      {children}
    </Button>
  );
});

/** Group-level "All (AND) / Any (OR)" switch. One per group, above its rows. */
export function MatchModeToggle({
  value,
  onChange,
  label = 'Match mode',
}: {
  value: 'all' | 'any';
  onChange?: (value: 'all' | 'any') => void;
  label?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="xs"
      aria-label={label}
      value={value}
      onValueChange={(next) => {
        if (next === 'all' || next === 'any') onChange?.(next);
      }}
    >
      <ToggleGroupItem value="all" className="h-7 rounded-lg rounded-r-none px-2.5">
        All (AND)
      </ToggleGroupItem>
      <ToggleGroupItem value="any" className="-ml-px h-7 rounded-lg rounded-l-none px-2.5">
        Any (OR)
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

/** Centred empty-state line shown when the last item has been removed. */
export function EmptyRows({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-center text-xs italic text-muted-foreground">{children}</p>;
}

// ── Condition model ─────────────────────────────────────────────────────────

export type FieldType = 'string' | 'number' | 'date' | 'enum';

export interface ConditionField {
  value: string;
  label: string;
  type: FieldType;
  options?: { label: string; value: string }[];
}

export const CONDITION_FIELDS: ConditionField[] = [
  { value: 'accountId', label: 'AccountID', type: 'number' },
  { value: 'createdBy', label: 'CreatedBy', type: 'string' },
  { value: 'createTime', label: 'CreateTime', type: 'date' },
  {
    value: 'status',
    label: 'Status',
    type: 'enum',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'On hold', value: 'onHold' },
      { label: 'Closed', value: 'closed' },
    ],
  },
  { value: 'amount', label: 'case.amount', type: 'number' },
];

/** Operators follow the field's type. */
const OPERATORS: Record<FieldType, { value: string; label: string }[]> = {
  string: [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not equals' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'isEmpty', label: 'Is empty' },
  ],
  date: [
    { value: 'on', label: 'On' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'isEmpty', label: 'Is empty' },
  ],
  enum: [
    { value: 'is', label: 'Is' },
    { value: 'isNot', label: 'Is not' },
    { value: 'isOneOf', label: 'Is one of' },
  ],
};

/** Operators that need no value, so the row hides the value control. */
const NO_VALUE_OPERATORS = new Set(['isEmpty', 'isNotEmpty']);

export interface Condition {
  kind: 'condition';
  id: string;
  field?: string;
  operator?: string;
  /** Text value, an ISO date for date fields, or an option value for enum fields. */
  value?: string;
  /** Selected options for "Is one of". */
  values?: string[];
  mode?: ValueMode;
  /** Set once the row has lost focus. Errors show only after that, or when forced. */
  touched?: boolean;
}

export interface ConditionGroup {
  kind: 'group';
  id: string;
  mode: 'all' | 'any';
  children: ConditionNode[];
}

export type ConditionNode = Condition | ConditionGroup;

let nodeCounter = 0;
export function newId(prefix = 'node') {
  nodeCounter += 1;
  return `${prefix}-${nodeCounter}`;
}

/**
 * The first `${prefix}${n}` not already taken. Counting from the list length repeats a name
 * after a delete, e.g. deleting item 1 of [output1, output2] and adding gives output2 again.
 */
export function uniqueName(prefix: string, taken: string[]) {
  let n = 1;
  while (taken.includes(`${prefix}${n}`)) n += 1;
  return `${prefix}${n}`;
}

export function condition(init: Omit<Condition, 'kind' | 'id'> = {}): Condition {
  return { kind: 'condition', id: newId('condition'), ...init };
}

export function group(
  mode: 'all' | 'any',
  children: ConditionNode[] = [],
  id = newId('group')
): ConditionGroup {
  return { kind: 'group', id, mode, children };
}

function fieldFor(c: Condition) {
  return CONDITION_FIELDS.find((field) => field.value === c.field);
}

function operatorsFor(c: Condition) {
  return OPERATORS[fieldFor(c)?.type ?? 'string'];
}

function needsValue(c: Condition) {
  return !NO_VALUE_OPERATORS.has(c.operator ?? '');
}

/** A fixed value for a number field must parse as a number. Expressions are checked at run time. */
function isInvalidNumber(c: Condition) {
  if (fieldFor(c)?.type !== 'number' || c.mode === 'expression') return false;
  const value = c.value?.trim();
  return Boolean(value) && !Number.isFinite(Number(value));
}

export function isComplete(c: Condition) {
  if (!c.field) return false;
  if (!needsValue(c)) return true;
  if (c.operator === 'isOneOf' && c.mode !== 'expression') return (c.values?.length ?? 0) > 0;
  return Boolean(c.value?.trim()) && !isInvalidNumber(c);
}

function conditionError(c: Condition) {
  if (isComplete(c)) return undefined;
  // "Is empty" and "Is not empty" hide the value, so only the field is missing.
  if (!c.field) return needsValue(c) ? 'Select a field and enter a value.' : 'Select a field.';
  if (isInvalidNumber(c)) return 'Enter a number.';
  // In Expression mode "Is one of" shows a text input, so the multi-select wording would not fit.
  return c.operator === 'isOneOf' && c.mode !== 'expression'
    ? 'Choose at least one value.'
    : 'Enter a value.';
}

function countConditions(node: ConditionGroup): number {
  return node.children.reduce(
    (total, child) => total + (child.kind === 'condition' ? 1 : countConditions(child)),
    0
  );
}

/** Numbers every condition in reading order, so accessible names match what is on screen. */
function numberConditions(node: ConditionGroup, map = new Map<string, number>()) {
  for (const child of node.children) {
    if (child.kind === 'condition') map.set(child.id, map.size + 1);
    else numberConditions(child, map);
  }
  return map;
}

function hasShownErrors(node: ConditionGroup, force: boolean): boolean {
  return node.children.some((child) =>
    child.kind === 'condition'
      ? (force || child.touched) && !isComplete(child)
      : hasShownErrors(child, force)
  );
}

function describeValue(c: Condition) {
  const field = fieldFor(c);
  if (c.operator === 'isOneOf' && c.mode !== 'expression') {
    const labels = (c.values ?? []).map(
      (value) => field?.options?.find((option) => option.value === value)?.label ?? value
    );
    // Parentheses keep the list from blending into the surrounding and / or.
    return `(${labels.join(', ')})`;
  }
  if (field?.type === 'date' && c.mode !== 'expression' && c.value) {
    return new Date(c.value).toLocaleDateString(undefined, { dateStyle: 'medium' });
  }
  if (field?.type === 'enum' && c.mode !== 'expression') {
    return field.options?.find((option) => option.value === c.value)?.label ?? c.value ?? '';
  }
  return c.value ?? '';
}

function describeCondition(c: Condition) {
  const field = fieldFor(c);
  const operator = operatorsFor(c).find((option) => option.value === c.operator);
  const parts = [field?.label ?? c.field, operator?.label.toLowerCase()];
  if (needsValue(c)) parts.push(describeValue(c));
  return parts.join(' ');
}

/** Plain-language reading of a group. Incomplete conditions are left out, as they are ignored. */
export function describeGroup(node: ConditionGroup, nested = false): string {
  const parts = node.children
    .map((child) =>
      child.kind === 'condition'
        ? isComplete(child)
          ? describeCondition(child)
          : ''
        : describeGroup(child, true)
    )
    .filter(Boolean);
  if (parts.length === 0) return '';
  const joined = parts.join(node.mode === 'all' ? ' and ' : ' or ');
  return nested && parts.length > 1 ? `(${joined})` : joined;
}

function updateNode(
  root: ConditionGroup,
  id: string,
  update: (node: ConditionNode) => ConditionNode
): ConditionGroup {
  if (root.id === id) return update(root) as ConditionGroup;
  return {
    ...root,
    children: root.children.map((child) =>
      child.id === id
        ? update(child)
        : child.kind === 'group'
          ? updateNode(child, id, update)
          : child
    ),
  };
}

function removeNode(root: ConditionGroup, id: string): ConditionGroup {
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== id)
      .map((child) => (child.kind === 'group' ? removeNode(child, id) : child)),
  };
}

// ── Condition row ───────────────────────────────────────────────────────────

/** Value field with the Fixed value / Expression switch and Insert variable inside it. */
function ConditionValue({
  c,
  label,
  invalid,
  errorId,
  variables,
  onChange,
}: {
  c: Condition;
  label: string;
  invalid: boolean;
  errorId?: string;
  variables: VariableOption[];
  onChange: (patch: Partial<Condition>) => void;
}) {
  const labelId = React.useId();
  const field = fieldFor(c);
  const mode = c.mode ?? 'literal';
  const aria = {
    'aria-invalid': invalid || undefined,
    'aria-describedby': errorId,
    'aria-errormessage': invalid ? errorId : undefined,
  } as const;
  const modeMenu = (
    <ValueModeMenu
      mode={mode}
      expectedType={field?.type === 'number' ? 'number' : undefined}
      // Reselecting the current mode keeps the value; only a real switch clears it.
      onSelect={(next) => {
        if (next !== mode) onChange({ mode: next, value: '', values: [] });
      }}
    />
  );
  const insert = (
    <InsertVariableAction
      compact
      variables={variables}
      // Inserting a variable makes the value an expression.
      onInsert={(inserted) =>
        onChange({
          mode: 'expression',
          value: mode === 'expression' ? `${c.value ?? ''}${inserted}` : inserted,
        })
      }
    />
  );

  if (mode === 'literal' && field?.type === 'date') {
    return (
      <>
        <span id={labelId} className="sr-only">
          {label}
        </span>
        <InputGroup>
          <DatePicker
            aria-labelledby={labelId}
            {...aria}
            placeholder="Pick a date"
            value={c.value ? new Date(c.value) : undefined}
            onValueChange={(date) => onChange({ value: date?.toISOString() ?? '' })}
          />
          <InputGroupAddon align="inline-end" className="gap-0.5">
            {insert}
            {modeMenu}
          </InputGroupAddon>
        </InputGroup>
      </>
    );
  }

  if (mode === 'literal' && field?.type === 'enum' && c.operator === 'isOneOf') {
    return (
      // MultiSelect cannot sit in an InputGroup, so the mode switch sits beside it.
      <div className="flex items-center gap-1">
        <label htmlFor={labelId} className="sr-only">
          {label}
        </label>
        <MultiSelect
          id={labelId}
          {...aria}
          className="min-w-0 flex-1"
          options={field.options ?? []}
          selected={c.values ?? []}
          placeholder="Choose values"
          onChange={(values) => onChange({ values })}
        />
        {insert}
        {modeMenu}
      </div>
    );
  }

  if (mode === 'literal' && field?.type === 'enum') {
    return (
      <InputGroup>
        <Select value={c.value} onValueChange={(value) => onChange({ value })}>
          <SelectTrigger aria-label={label} {...aria}>
            <SelectValue placeholder="Choose a value" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <InputGroupAddon align="inline-end" className="gap-0.5">
          {insert}
          {modeMenu}
        </InputGroupAddon>
      </InputGroup>
    );
  }

  return (
    <InputGroup>
      {mode === 'expression' && (
        <InputGroupAddon align="inline-start">
          <ValueModeIndicator mode="expression" className="px-0" />
        </InputGroupAddon>
      )}
      <InputGroupInput
        aria-label={label}
        {...aria}
        inputMode={mode === 'literal' && field?.type === 'number' ? 'decimal' : undefined}
        className={cn(mode === 'expression' && 'font-mono text-xs')}
        placeholder={mode === 'expression' ? 'Expression' : 'Enter a value'}
        value={c.value ?? ''}
        onChange={(event) => onChange({ value: event.target.value })}
      />
      <InputGroupAddon align="inline-end" className="gap-0.5">
        {insert}
        {modeMenu}
      </InputGroupAddon>
    </InputGroup>
  );
}

export interface ConditionRowProps {
  /** 1-based position, used in accessible names. */
  index: number;
  condition: Condition;
  onChange: (patch: Partial<Condition>) => void;
  onDelete?: () => void;
  /**
   * `inline` puts field, operator, value, and delete on one line. `stacked` is for
   * narrow panels: value drops to its own line, delete stays on the first line.
   */
  layout?: 'inline' | 'stacked';
  /** Show the message even if the row has not been visited, e.g. after submit. */
  forceError?: boolean;
  variables?: VariableOption[];
}

/**
 * Field / operator / value / delete. The operator list and the value control follow the
 * field's type, and operators like "Is empty" hide the value. The message sits outside
 * the controls grid so delete always centres on the controls, never on the message.
 */
export function ConditionRow({
  index,
  condition: c,
  onChange,
  onDelete,
  layout = 'inline',
  forceError = false,
  variables = DEFAULT_VARIABLES,
}: ConditionRowProps) {
  const errorId = `${React.useId()}-error`;
  const error = forceError || c.touched ? conditionError(c) : undefined;
  const invalid = Boolean(error);
  const operators = operatorsFor(c);
  const operator = c.operator ?? operators[0]?.value;
  const showValue = needsValue({ ...c, operator });

  const fieldControl = (
    <Select
      value={c.field}
      onValueChange={(field) => {
        const type = CONDITION_FIELDS.find((option) => option.value === field)?.type;
        const sameType = type === fieldFor(c)?.type;
        onChange(
          sameType
            ? { field }
            : { field, operator: OPERATORS[type ?? 'string'][0]?.value, value: '', values: [] }
        );
      }}
    >
      <SelectTrigger
        data-row-first=""
        aria-label={`Condition ${index} field`}
        aria-invalid={(invalid && !c.field) || undefined}
        aria-describedby={invalid ? errorId : undefined}
        aria-errormessage={invalid && !c.field ? errorId : undefined}
      >
        <SelectValue placeholder="Select a field" />
      </SelectTrigger>
      <SelectContent>
        {CONDITION_FIELDS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const operatorControl = (
    <Select
      value={operator}
      onValueChange={(next) =>
        onChange({
          operator: next,
          ...(next === 'isOneOf' || c.operator === 'isOneOf' ? { value: '', values: [] } : {}),
        })
      }
    >
      <SelectTrigger aria-label={`Condition ${index} operator`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {operators.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const valueControl = showValue ? (
    <ConditionValue
      c={{ ...c, operator }}
      label={`Condition ${index} value`}
      invalid={invalid && Boolean(c.field)}
      errorId={invalid ? errorId : undefined}
      variables={variables}
      onChange={onChange}
    />
  ) : null;

  const deleteControl = <RowDeleteButton label={`Remove condition ${index}`} onClick={onDelete} />;

  return (
    <fieldset
      data-row=""
      aria-label={`Condition ${index}`}
      className="m-0 flex min-w-0 flex-col border-0 p-0"
      onBlur={(event) => {
        if (!c.touched && leftRow(event)) onChange({ touched: true });
      }}
    >
      {layout === 'inline' ? (
        <div className="flex items-center gap-2">
          <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2">
            {fieldControl}
            {operatorControl}
            {valueControl ?? <span />}
          </div>
          {deleteControl}
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-2">
            {fieldControl}
            {operatorControl}
            {valueControl && <div className="col-span-2">{valueControl}</div>}
          </div>
          {/* Same height as a control so the icon centres on the first line. */}
          <div className="flex h-9 items-center future:h-10">{deleteControl}</div>
        </div>
      )}
      {error && <FormFieldError id={errorId}>{error}</FormFieldError>}
    </fieldset>
  );
}

// ── Condition editor ────────────────────────────────────────────────────────

export interface ConditionEditorProps {
  value: ConditionGroup;
  onChange: (next: ConditionGroup) => void;
  layout?: 'inline' | 'stacked';
  /** How many levels of groups may nest inside the top group. 0 turns off "Add group". */
  maxDepth?: number;
  /** Show the All / Any switch on the top group. Nested groups always show it. */
  matchMode?: boolean;
  /**
   * `card` draws the bordered box, `collapsible` adds a header that collapses the rows,
   * `plain` draws nothing, for use inside another container such as a rule.
   */
  container?: 'card' | 'collapsible' | 'plain';
  /** Show the plain-language reading below the rows. */
  showSummary?: boolean;
  /** Show every incomplete row's message, as after a submit. */
  forceErrors?: boolean;
  emptyText?: string;
  variables?: VariableOption[];
  /** Names the top group for assistive technology, e.g. "Filter". */
  label: string;
}

/**
 * The one condition engine behind every condition layout on the page: flat lists,
 * nested groups, collapsible filters, and rule conditions.
 */
export function ConditionEditor({
  value,
  onChange,
  layout = 'stacked',
  maxDepth = 1,
  matchMode = true,
  container = 'card',
  showSummary = false,
  forceErrors = false,
  emptyText = 'No conditions.',
  variables = DEFAULT_VARIABLES,
  label,
}: ConditionEditorProps) {
  const count = countConditions(value);
  const summary = describeGroup(value);
  const showGroupError = hasShownErrors(value, forceErrors);
  const groupError = showGroupError
    ? 'Some conditions are incomplete and will be ignored.'
    : undefined;

  const body = (
    <GroupBody
      node={value}
      root={value}
      onRootChange={onChange}
      depth={0}
      maxDepth={maxDepth}
      matchMode={matchMode}
      layout={layout}
      forceErrors={forceErrors}
      emptyText={emptyText}
      variables={variables}
      label={label}
      numbers={numberConditions(value)}
      footerExtra={
        showSummary && summary ? (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-xs leading-5 text-muted-foreground">
            <span className="font-medium text-foreground">Reads as: </span>
            {summary}
          </p>
        ) : null
      }
    />
  );

  if (container === 'collapsible') {
    return (
      <CollapsibleRowGroup
        summary={count === 1 ? '1 condition' : `${count} conditions`}
        detail={summary}
        error={groupError}
      >
        {body}
      </CollapsibleRowGroup>
    );
  }

  return (
    <div className="flex min-w-0 flex-col">
      <div
        className={cn(
          container === 'card' && 'rounded-lg border border-border bg-card p-3',
          container === 'card' && groupError && 'border-error'
        )}
      >
        {body}
      </div>
      {groupError && <FormFieldError>{groupError}</FormFieldError>}
    </div>
  );
}

function GroupBody({
  node,
  root,
  onRootChange,
  depth,
  maxDepth,
  matchMode,
  layout,
  forceErrors,
  emptyText,
  variables,
  label,
  numbers,
  onDeleteGroup,
  groupIndex,
  footerExtra,
}: {
  node: ConditionGroup;
  root: ConditionGroup;
  onRootChange: (next: ConditionGroup) => void;
  depth: number;
  maxDepth: number;
  matchMode: boolean;
  layout: 'inline' | 'stacked';
  forceErrors: boolean;
  emptyText: string;
  variables: VariableOption[];
  label: string;
  /** Each condition's 1-based position across the whole tree, in reading order. */
  numbers: Map<string, number>;
  onDeleteGroup?: () => void;
  groupIndex?: number;
  footerExtra?: React.ReactNode;
}) {
  const focus = useRowFocus();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const nested = depth > 0;
  const groupLabel = nested ? `Group ${groupIndex}` : label;

  const addNode = (child: ConditionNode) => {
    focus.afterAdd();
    onRootChange(
      updateNode(root, node.id, (current) => ({
        ...(current as ConditionGroup),
        children: [...(current as ConditionGroup).children, child],
      }))
    );
  };

  const deleteChild = (id: string, position: number) => {
    focus.afterDelete(position);
    onRootChange(removeNode(root, id));
  };

  let nestedGroups = 0;

  return (
    // A named group, so repeated controls such as "Condition 1 field" keep their context
    // ("Rule 1 conditions", "Group 1") for assistive technology.
    <fieldset
      aria-label={groupLabel}
      data-row={nested ? '' : undefined}
      className={cn(
        'm-0 flex min-w-0 flex-col gap-3 border-0 p-0',
        nested && 'border-l-2 border-solid border-border pl-3'
      )}
    >
      {(nested || matchMode) && (
        <div className="flex items-center gap-2">
          <MatchModeToggle
            value={node.mode}
            label={`${groupLabel} match mode`}
            onChange={(mode) =>
              onRootChange(
                updateNode(root, node.id, (current) => ({ ...(current as ConditionGroup), mode }))
              )
            }
          />
          {nested && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  icon
                  data-row-delete=""
                  aria-label={`${groupLabel} actions`}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  className="text-error focus:text-error"
                  onSelect={() => {
                    if (node.children.length > 0) setConfirmOpen(true);
                    else onDeleteGroup?.();
                  }}
                >
                  <Trash2 /> Delete group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <div ref={focus.listRef} className="flex flex-col gap-3">
        {node.children.length === 0 ? (
          <EmptyRows>{nested ? 'No conditions in this group.' : emptyText}</EmptyRows>
        ) : (
          node.children.map((child, position) => {
            if (child.kind === 'group') {
              nestedGroups += 1;
              return (
                <GroupBody
                  key={child.id}
                  node={child}
                  root={root}
                  onRootChange={onRootChange}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  matchMode={matchMode}
                  layout={layout}
                  forceErrors={forceErrors}
                  emptyText={emptyText}
                  variables={variables}
                  label={label}
                  numbers={numbers}
                  groupIndex={nestedGroups}
                  onDeleteGroup={() => deleteChild(child.id, position)}
                />
              );
            }
            return (
              <ConditionRow
                key={child.id}
                index={numbers.get(child.id) ?? position + 1}
                condition={child}
                layout={layout}
                forceError={forceErrors}
                variables={variables}
                onChange={(patch) =>
                  onRootChange(
                    updateNode(root, child.id, (current) => ({ ...current, ...patch }) as Condition)
                  )
                }
                onDelete={() => deleteChild(child.id, position)}
              />
            );
          })
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <AddRowButton ref={focus.addRef} onClick={() => addNode(condition())}>
          Add condition
        </AddRowButton>
        {depth < maxDepth && (
          <AddRowButton onClick={() => addNode(group('all', [condition()]))}>
            Add group
          </AddRowButton>
        )}
      </div>
      {footerExtra}

      {nested && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this group?</AlertDialogTitle>
              <AlertDialogDescription>
                {countConditions(node) === 1
                  ? 'The group and its condition will be removed.'
                  : `The group and its ${countConditions(node)} conditions will be removed.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-error text-white hover:bg-error/90"
                onClick={() => onDeleteGroup?.()}
              >
                Delete group
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </fieldset>
  );
}

// ── Containers ──────────────────────────────────────────────────────────────

/** Bordered container for a group of items: a header slot, the items, and a footer slot. */
export function RowGroup({
  header,
  footer,
  nested = false,
  error,
  children,
  rowProps,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  nested?: boolean;
  /** Group-level summary, rendered below the container. */
  error?: string;
  children: React.ReactNode;
  /** Marks the container as an item of a parent list, e.g. one rule in a list of rules. */
  rowProps?: boolean;
}) {
  return (
    <div data-row={rowProps ? '' : undefined} className="flex flex-col">
      <div
        className={cn(
          'flex flex-col gap-3',
          // Nested groups indent with a rule instead of a second box, so rows keep their width.
          nested ? 'border-l-2 border-border pl-3' : 'rounded-lg border border-border bg-card p-3',
          error && 'border-error'
        )}
      >
        {header}
        {children}
        {footer && <div className="flex flex-wrap items-center gap-4">{footer}</div>}
      </div>
      {error && <FormFieldError>{error}</FormFieldError>}
    </div>
  );
}

/** Repeatable card: a title (text or an editable name) with delete in the header. */
export function RepeatableCard({
  title,
  deleteLabel,
  onDelete,
  leading,
  children,
}: {
  title: React.ReactNode;
  deleteLabel: string;
  onDelete?: () => void;
  leading?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div data-row="" className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        {leading}
        <div className="min-w-0 flex-1">{title}</div>
        <RowDeleteButton label={deleteLabel} onClick={onDelete} />
      </div>
      {children}
    </div>
  );
}

/**
 * Group whose header collapses the rows and counts them ("3 conditions"). Collapsed, the
 * header also shows the plain-language reading, so the logic stays checkable. The error
 * sits outside the collapsing part, so it is never hidden.
 */
export function CollapsibleRowGroup({
  summary,
  detail,
  error,
  defaultOpen = true,
  children,
}: {
  summary: string;
  detail?: string;
  error?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    // min-w-0 so a long collapsed reading truncates instead of widening a grid parent.
    <div className="flex min-w-0 flex-col">
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className={cn('rounded-lg border border-border bg-card', error && 'border-error')}
      >
        <CollapsibleTrigger className="group/trigger flex w-full min-w-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-foreground hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=closed]/trigger:-rotate-90"
          />
          <span className="shrink-0">{summary}</span>
          {!open && detail && (
            <span className="min-w-0 truncate font-normal text-muted-foreground">{detail}</span>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border p-3">{children}</CollapsibleContent>
      </Collapsible>
      {error && <FormFieldError>{error}</FormFieldError>}
    </div>
  );
}

// ── Key-value pairs ─────────────────────────────────────────────────────────

/** Key-value rows with a visible limit. Use for headers, query parameters, metadata. */
export function KeyValueList({
  title,
  itemName,
  limit,
  initialPairs,
  reorderable = false,
}: {
  title: string;
  /** Singular, lower case: "header" gives "Add header" and "Remove header 2". */
  itemName: string;
  limit: number;
  initialPairs: { key: string; value: string }[];
  /** Only when order changes the result. Headers and query parameters are unordered. */
  reorderable?: boolean;
}) {
  const [pairs, setPairs] = React.useState(() =>
    initialPairs.map((pair) => ({ ...pair, id: newId(itemName) }))
  );
  const focus = useRowFocus();
  const label = itemName.charAt(0).toUpperCase() + itemName.slice(1);
  const move = (from: number, to: number) =>
    setPairs((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">
          {pairs.length} / {limit}
        </span>
      </div>
      <div ref={focus.listRef} className="flex flex-col gap-2">
        {pairs.map((pair, position) => (
          <div key={pair.id} data-row="" className="flex items-center gap-2">
            {reorderable && (
              <RowDragHandle
                label={`Reorder ${itemName} ${position + 1}`}
                onMoveUp={position > 0 ? () => move(position, position - 1) : undefined}
                onMoveDown={
                  position < pairs.length - 1 ? () => move(position, position + 1) : undefined
                }
              />
            )}
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
              <Input
                data-row-first=""
                aria-label={`${label} ${position + 1} name`}
                defaultValue={pair.key}
                placeholder="Name"
              />
              <Input
                aria-label={`${label} ${position + 1} value`}
                defaultValue={pair.value}
                placeholder="Value"
              />
            </div>
            <RowDeleteButton
              label={`Remove ${itemName} ${position + 1}`}
              onClick={() => {
                focus.afterDelete(position);
                setPairs((current) => current.filter((row) => row.id !== pair.id));
              }}
            />
          </div>
        ))}
        {pairs.length === 0 && <EmptyRows>No {itemName}s.</EmptyRows>}
      </div>
      <div>
        <AddRowButton
          ref={focus.addRef}
          disabled={pairs.length >= limit}
          onClick={() => {
            focus.afterAdd();
            setPairs((current) => [...current, { id: newId(itemName), key: '', value: '' }]);
          }}
        >
          Add {itemName}
        </AddRowButton>
      </div>
    </div>
  );
}
