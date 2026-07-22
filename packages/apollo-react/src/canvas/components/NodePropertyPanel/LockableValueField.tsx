import {
  Button,
  Calendar,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FileUpload,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Label,
  MultiSelect,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import {
  ALargeSmall,
  Asterisk,
  Braces,
  Calendar as CalendarIcon,
  ChevronDown,
  Code2,
  Hash,
  List,
  ListChecks,
  type LucideIcon,
  Paperclip,
  Sparkles,
  ToggleLeft,
  Type,
} from 'lucide-react';
import type { ReactNode, SVGProps } from 'react';
import { useId } from 'react';

/**
 * Prototype-only: raw Material Symbols Outlined glyphs (FILL 0, wght 400,
 * GRAD 0, opsz 24) for a side-by-side comparison against lucide's Lock /
 * LockOpen. Not styled to match lucide's stroke conventions on purpose --
 * this is here to judge the Material look as-is, unmodified.
 */
function MaterialLock({
  size = 24,
  className,
  ...props
}: { size?: number | string; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 -960 960 960"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm296.5-143.5Q560-327 560-360t-23.5-56.5Q513-440 480-440t-56.5 23.5Q400-393 400-360t23.5 56.5Q447-280 480-280t56.5-23.5ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z" />
    </svg>
  );
}

function MaterialLockOpenRight({
  size = 24,
  className,
  ...props
}: { size?: number | string; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 -960 960 960"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M240-160h480v-400H240v400Zm296.5-143.5Q560-327 560-360t-23.5-56.5Q513-440 480-440t-56.5 23.5Q400-393 400-360t23.5 56.5Q447-280 480-280t56.5-23.5ZM240-160v-400 400Zm0 80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h280v-80q0-83 58.5-141.5T720-920q83 0 141.5 58.5T920-720h-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80h120q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Z" />
    </svg>
  );
}

export type LockableValueFieldMode = 'fixed' | 'expression';

export type LockableFieldType =
  | 'string'
  | 'integer'
  | 'date'
  | 'boolean'
  | 'single-select'
  | 'multi-select'
  | 'file';

interface FieldTypeMeta {
  label: string;
  icon: LucideIcon;
  supportsExpression: boolean;
  fixedLabel: string;
  fixedDescription: string;
}

export const FIELD_TYPE_META: Record<LockableFieldType, FieldTypeMeta> = {
  string: {
    label: 'String',
    icon: ALargeSmall,
    supportsExpression: true,
    fixedLabel: 'Fixed value',
    fixedDescription: 'Use a literal string value',
  },
  integer: {
    label: 'Integer',
    icon: Hash,
    supportsExpression: true,
    fixedLabel: 'Fixed value',
    fixedDescription: 'Use a literal number value',
  },
  date: {
    label: 'Date',
    icon: CalendarIcon,
    supportsExpression: true,
    fixedLabel: 'Fixed date',
    fixedDescription: 'Use a literal date value',
  },
  boolean: {
    label: 'Boolean',
    icon: ToggleLeft,
    supportsExpression: true,
    fixedLabel: 'Fixed value',
    fixedDescription: 'Use a literal true or false value',
  },
  'single-select': {
    label: 'Single select',
    icon: List,
    supportsExpression: false,
    fixedLabel: 'Fixed value',
    fixedDescription: 'Choose one option',
  },
  'multi-select': {
    label: 'Multiselect',
    icon: ListChecks,
    supportsExpression: false,
    fixedLabel: 'Fixed value',
    fixedDescription: 'Choose one or more options',
  },
  file: {
    label: 'File',
    icon: Paperclip,
    supportsExpression: false,
    fixedLabel: 'Fixed value',
    fixedDescription: 'Upload a file',
  },
};

export const FIELD_TYPE_ORDER: LockableFieldType[] = [
  'string',
  'integer',
  'date',
  'boolean',
  'single-select',
  'multi-select',
  'file',
];

export const DEMO_SELECT_OPTIONS = [
  { label: 'Option 1', value: 'option-1' },
  { label: 'Option 2', value: 'option-2' },
  { label: 'Option 3', value: 'option-3' },
];

export function parseListValue(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export interface LockableValueFieldProps {
  /** Current field value. Encoding depends on fieldType (e.g. multi-select is a JSON array string). */
  value?: string;
  /** Called when the user edits the value (only fires while unlocked). */
  onValueChange?: (value: string) => void;
  /** Whether the field is read-only. Defaults to true. */
  locked?: boolean;
  /** Called when the user toggles the lock. */
  onLockedChange?: (locked: boolean) => void;
  /** Fixed value vs. JS expression. Defaults to 'fixed'. Ignored for types that don't support expressions. */
  mode?: LockableValueFieldMode;
  /** Called when the user switches modes. */
  onModeChange?: (mode: LockableValueFieldMode) => void;
  /** The field's data type. Defaults to 'string'. Determines which control renders the value. */
  fieldType?: LockableFieldType;
  /** Called when the user switches the field type. */
  onFieldTypeChange?: (fieldType: LockableFieldType) => void;
  /** Shows a required-field asterisk next to the default label. Ignored when `label` is provided. */
  required?: boolean;
  /** Called when the user toggles required/optional. Renders the Required switch when provided. */
  onRequiredChange?: (required: boolean) => void;
  /** Overrides the default mode-based label (e.g. a field name instead of "String value"). */
  label?: ReactNode;
  /** Extra content rendered after the built-in AI assist / Insert variable buttons (e.g. a delete button). */
  headerActions?: ReactNode;
  /** Forces the header row into its narrow-container icon-only layout, regardless of actual width. For demos/comparisons. */
  compact?: boolean;
  /** Whether the field-type, AI-assist, and insert-variable controls are always shown or only on hover. Defaults to 'visible'. */
  controlsVisibility?: 'visible' | 'hover';
  /** Whether the AI-assist and Insert-variable actions render at all. Set to false for read-only reviewer contexts where field configuration isn't editable. Defaults to true. */
  showFieldActions?: boolean;
  id?: string;
  className?: string;
}

const FIELD_LABEL: Record<LockableValueFieldMode, string> = {
  fixed: 'String value',
  expression: 'Write a string expression',
};

const FIELD_PLACEHOLDER: Record<LockableValueFieldMode, string> = {
  fixed: 'String value',
  expression: 'Write a string expression',
};

/**
 * LockableValueField — a field that can be locked to read-only, typed as one
 * of several data types, and (for scalar types) switched between a literal
 * value and a JS expression.
 *
 * Prototype: the expression mode is styled as code (monospace) but does not
 * yet carry real syntax highlighting or evaluation. See ExpressionField for
 * the direction a full code-editing surface would take. Select/multiselect
 * options are demo placeholders; file uploads aren't persisted anywhere.
 */
export function LockableValueField({
  value = '',
  onValueChange,
  locked = true,
  onLockedChange,
  mode = 'fixed',
  onModeChange,
  fieldType = 'string',
  onFieldTypeChange,
  required,
  onRequiredChange,
  label,
  headerActions,
  compact,
  controlsVisibility = 'visible',
  showFieldActions = true,
  id,
  className,
}: LockableValueFieldProps) {
  const promptId = useId();
  const typeMeta = FIELD_TYPE_META[fieldType];
  const effectiveMode = typeMeta.supportsExpression ? mode : 'fixed';
  const collapsedTextClass = cn('@max-[259px]:hidden', compact && '!hidden');
  const collapsedPaddingClass = cn('@max-[259px]:px-1.5', compact && '!px-1.5');

  // Locked fields are read-only, not disabled — the raw control (switch, date
  // picker, select) has nothing left to do once editing is blocked, so it's
  // replaced with plain, selectable text showing the same value.
  const lockedDisplayValue =
    fieldType === 'boolean'
      ? value === 'true'
        ? 'True'
        : 'False'
      : fieldType === 'date'
        ? value
          ? new Date(value).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : ''
        : fieldType === 'single-select'
          ? (DEMO_SELECT_OPTIONS.find((option) => option.value === value)?.label ?? '')
          : fieldType === 'multi-select'
            ? parseListValue(value)
                .map((v) => DEMO_SELECT_OPTIONS.find((option) => option.value === v)?.label ?? v)
                .join(', ')
            : value;

  return (
    <div className={cn('@container group flex flex-col gap-1.5', className)}>
      <div className="flex items-center gap-1">
        {label ?? (
          <Label htmlFor={id} className="text-xs font-medium text-foreground-muted">
            {FIELD_LABEL[mode]}
            {required && <span className="ml-0.5 text-destructive">*</span>}
          </Label>
        )}
        <TooltipProvider delayDuration={300}>
          <div className="ml-auto flex items-center gap-0.5">
            <div
              className={cn(
                'flex items-center gap-0.5',
                controlsVisibility === 'hover' &&
                  'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 has-[[aria-expanded=true]]:opacity-100'
              )}
            >
              {onFieldTypeChange && (
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="Field type"
                          className={cn(
                            'flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground',
                            collapsedPaddingClass
                          )}
                        >
                          <typeMeta.icon size={12} />
                          <span className={collapsedTextClass}>{typeMeta.label}</span>
                          <ChevronDown size={9} className={collapsedTextClass} />
                        </button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Type</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-44">
                    {FIELD_TYPE_ORDER.map((type) => {
                      const meta = FIELD_TYPE_META[type];
                      const isActive = type === fieldType;
                      return (
                        <DropdownMenuItem key={type} onClick={() => onFieldTypeChange(type)}>
                          <meta.icon
                            className={isActive ? 'text-brand' : 'text-foreground-muted'}
                          />
                          <span className={cn(isActive && 'font-medium text-brand')}>
                            {meta.label}
                          </span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {onRequiredChange && (
                <>
                  <div className={cn('@max-[259px]:hidden', compact && '!hidden')}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {/* Wrapped in a span: TooltipTrigger's asChild merge otherwise
                            overwrites the Switch's own data-state (checked/unchecked)
                            with the tooltip's open/closed state, breaking its color classes. */}
                        <span className="inline-flex">
                          <Switch
                            size="sm"
                            checked={!!required}
                            onCheckedChange={onRequiredChange}
                            className="data-[state=checked]:bg-brand data-[state=unchecked]:bg-foreground-subtle"
                            aria-label={required ? 'Required field' : 'Optional field'}
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Required</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className={cn('hidden @max-[259px]:block', compact && '!block')}>
                    <Popover>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              aria-label={required ? 'Required field' : 'Optional field'}
                              className="grid size-7 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
                            >
                              <Asterisk size={12} />
                            </button>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Required</TooltipContent>
                      </Tooltip>
                      <PopoverContent align="end" className="w-48">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-foreground">Required</span>
                          <Switch
                            size="sm"
                            checked={!!required}
                            onCheckedChange={onRequiredChange}
                            className="data-[state=checked]:bg-brand data-[state=unchecked]:bg-foreground-subtle"
                            aria-label={required ? 'Required field' : 'Optional field'}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
              {showFieldActions && (
                <>
                  <Popover>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label="AI assist"
                            className="grid size-7 place-items-center rounded-lg text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground"
                          >
                            <Sparkles size={12} />
                          </button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Generate with AI</TooltipContent>
                    </Tooltip>
                    <PopoverContent align="end" className="space-y-3">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor={promptId}
                          className="text-xs font-medium text-foreground-muted"
                        >
                          Describe what you want
                        </Label>
                        <Textarea
                          id={promptId}
                          rows={3}
                          placeholder="Display a value from the previous step"
                          className="resize-none text-sm"
                        />
                      </div>
                      <span className="block text-[11px] text-foreground-subtle">
                        Output: String expression
                      </span>
                      <Button size="sm" className="w-full">
                        Generate
                      </Button>
                    </PopoverContent>
                  </Popover>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="Insert variable"
                        className={cn(
                          'flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground',
                          collapsedPaddingClass
                        )}
                      >
                        <Braces size={12} />
                        <span className={collapsedTextClass}>Insert</span>
                        <ChevronDown size={9} className={collapsedTextClass} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Insert</TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
            {headerActions}
          </div>
        </TooltipProvider>
      </div>

      {typeMeta.supportsExpression ? (
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InputGroupButton
                    icon
                    size="3xs"
                    onClick={() => onLockedChange?.(!locked)}
                    aria-label={
                      locked
                        ? 'Read-only. Click to make editable.'
                        : 'Editable. Click to make read-only.'
                    }
                  >
                    {locked ? <MaterialLock size={16} /> : <MaterialLockOpenRight size={16} />}
                  </InputGroupButton>
                </TooltipTrigger>
                <TooltipContent>{locked ? 'Read-only' : 'Editable'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </InputGroupAddon>

          {effectiveMode === 'expression' ? (
            <InputGroupInput
              id={id}
              readOnly={locked}
              value={value}
              onChange={(e) => onValueChange?.(e.target.value)}
              placeholder={FIELD_PLACEHOLDER.expression}
              className="font-mono"
            />
          ) : locked ? (
            <InputGroupInput
              id={id}
              readOnly
              value={lockedDisplayValue}
              placeholder={FIELD_PLACEHOLDER.fixed}
            />
          ) : fieldType === 'boolean' ? (
            <div className="flex h-full flex-1 items-center px-3">
              <Switch
                id={id}
                checked={value === 'true'}
                onCheckedChange={(checked) => onValueChange?.(String(checked))}
              />
            </div>
          ) : fieldType === 'date' ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  id={id}
                  data-slot="input-group-control"
                  className="flex h-full flex-1 items-center text-left text-sm text-foreground outline-none"
                >
                  {value ? (
                    new Date(value).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  ) : (
                    <span className="text-muted-foreground">Pick a date</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => onValueChange?.(date ? date.toISOString() : '')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : (
            <InputGroupInput
              id={id}
              type={fieldType === 'integer' ? 'number' : 'text'}
              value={value}
              onChange={(e) => onValueChange?.(e.target.value)}
              placeholder={FIELD_PLACEHOLDER.fixed}
            />
          )}

          <InputGroupAddon align="inline-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InputGroupButton icon size="3xs" aria-label="Choose value type">
                  {effectiveMode === 'expression' ? <Code2 /> : <Type />}
                </InputGroupButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  className="flex-col items-start gap-0.5 py-2"
                  onClick={() => onModeChange?.('fixed')}
                >
                  <div className="flex items-center gap-2">
                    <Type
                      size={13}
                      className={effectiveMode === 'fixed' ? 'text-brand' : 'text-foreground-muted'}
                    />
                    <span
                      className={cn(
                        'text-xs font-medium',
                        effectiveMode === 'fixed' ? 'text-brand' : 'text-foreground'
                      )}
                    >
                      {typeMeta.fixedLabel}
                    </span>
                  </div>
                  <span className="pl-[21px] text-[11px] leading-4 text-foreground-subtle">
                    {typeMeta.fixedDescription}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex-col items-start gap-0.5 py-2"
                  onClick={() => onModeChange?.('expression')}
                >
                  <div className="flex items-center gap-2">
                    <Code2
                      size={13}
                      className={
                        effectiveMode === 'expression' ? 'text-brand' : 'text-foreground-muted'
                      }
                    />
                    <span
                      className={cn(
                        'text-xs font-medium',
                        effectiveMode === 'expression' ? 'text-brand' : 'text-foreground'
                      )}
                    >
                      Expression
                    </span>
                  </div>
                  <span className="pl-[21px] text-[11px] leading-4 text-foreground-subtle">
                    Use a JS expression
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton
                  icon
                  size="3xs"
                  onClick={() => onLockedChange?.(!locked)}
                  aria-label={
                    locked
                      ? 'Read-only. Click to make editable.'
                      : 'Editable. Click to make read-only.'
                  }
                >
                  {locked ? <MaterialLock size={16} /> : <MaterialLockOpenRight size={16} />}
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>{locked ? 'Read-only' : 'Editable'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {locked ? (
            <Input
              id={id}
              readOnly
              value={lockedDisplayValue}
              placeholder={FIELD_PLACEHOLDER.fixed}
              className="flex-1"
            />
          ) : fieldType === 'single-select' ? (
            <Select value={value || undefined} onValueChange={onValueChange}>
              <SelectTrigger id={id} className="flex-1">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {DEMO_SELECT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : fieldType === 'multi-select' ? (
            <MultiSelect
              className="flex-1"
              options={DEMO_SELECT_OPTIONS}
              selected={parseListValue(value)}
              onChange={(selected) => onValueChange?.(JSON.stringify(selected))}
              placeholder="Select options..."
            />
          ) : (
            fieldType === 'file' && (
              <FileUpload
                className="flex-1"
                onFilesChange={(files) => onValueChange?.(files.map((f) => f.name).join(', '))}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
