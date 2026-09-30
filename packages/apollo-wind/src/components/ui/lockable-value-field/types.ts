import {
  ALargeSmall,
  Braces,
  Brackets,
  CalendarClock,
  Calendar as CalendarIcon,
  File as FileIcon,
  Hash,
  List,
  ListChecks,
  type LucideIcon,
  Sigma,
  ToggleLeft,
} from 'lucide-react';
import type { AriaAttributes, ReactNode } from 'react';

// Besides a literal or a JS expression, a field can bind to a workflow variable
// or to a natural-language prompt an agent fills in. Neither is expressible as
// the other two, so each is a mode of its own.
export type LockableValueFieldMode = 'fixed' | 'expression' | 'variable' | 'prompt';

// `double` and `datetime` keep the fraction and the time of day that `integer`
// and `date` would drop.
export type LockableFieldType =
  | 'string'
  | 'integer'
  | 'double'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'single-select'
  | 'multi-select'
  | 'array'
  | 'file'
  | 'object';

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
  double: {
    label: 'Decimal number',
    icon: Sigma,
    supportsExpression: true,
    fixedLabel: 'Fixed value',
    fixedDescription: 'Use a literal decimal value',
  },
  date: {
    label: 'Date',
    icon: CalendarIcon,
    supportsExpression: true,
    fixedLabel: 'Fixed date',
    fixedDescription: 'Use a literal date value',
  },
  datetime: {
    label: 'Date and time',
    icon: CalendarClock,
    supportsExpression: true,
    fixedLabel: 'Fixed date and time',
    fixedDescription: 'Use a literal date and time value',
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
    label: 'Multi select',
    icon: ListChecks,
    supportsExpression: false,
    fixedLabel: 'Fixed value',
    fixedDescription: 'Choose one or more options',
  },
  array: {
    label: 'Array',
    icon: Brackets,
    supportsExpression: true,
    fixedLabel: 'Fixed value',
    fixedDescription: 'Use a literal JSON array',
  },
  file: {
    label: 'File',
    icon: FileIcon,
    supportsExpression: true,
    fixedLabel: 'Fixed value',
    fixedDescription: 'Upload a file',
  },
  object: {
    label: 'Object',
    icon: Braces,
    supportsExpression: true,
    fixedLabel: 'Fixed value',
    fixedDescription: 'Use a literal object value',
  },
};

export const FIELD_TYPE_ORDER: LockableFieldType[] = [
  'string',
  'integer',
  'double',
  'date',
  'datetime',
  'boolean',
  'single-select',
  'multi-select',
  'array',
  'file',
  'object',
];

/**
 * Every piece of user-visible text the component renders. The component owns no
 * translation catalog, so a localized consumer supplies its own words; the
 * defaults are English.
 *
 * Type labels live here rather than in FIELD_TYPE_META: the meta table defines
 * the vocabulary, these are display strings.
 */
export interface LockableValueFieldStrings {
  fieldTypeTooltip: string;
  fieldTypeAriaLabel: string;
  typeLabels: Partial<Record<LockableFieldType, string>>;
  requiredTooltip: string;
  requiredAriaLabel: string;
  optionalAriaLabel: string;
  insertLabel: string;
  insertAriaLabel: string;
  valueTypeAriaLabel: string;
  expressionLabel: string;
  expressionDescription: string;
  pickDate: string;
  selectOption: string;
  selectOptions: string;
  moreActionsAriaLabel: string;
  clearValue: string;
  forceRefresh: string;
  aiAssistAriaLabel: string;
  aiAssistTooltip: string;
  aiPromptLabel: string;
  aiPromptPlaceholder: string;
  aiGenerate: string;
  aiOutputHint: (output: string) => string;
  lockedLabel: string;
  unlockedLabel: string;
  lockedHint: string;
  unlockedHint: string;
}

export const DEFAULT_STRINGS: LockableValueFieldStrings = {
  fieldTypeTooltip: 'Type',
  fieldTypeAriaLabel: 'Field type',
  typeLabels: {},
  requiredTooltip: 'Required',
  requiredAriaLabel: 'Required field',
  optionalAriaLabel: 'Optional field',
  insertLabel: 'Insert',
  insertAriaLabel: 'Insert variable',
  valueTypeAriaLabel: 'Choose value type',
  expressionLabel: 'Expression',
  expressionDescription: 'Use a JS expression',
  pickDate: 'Pick a date',
  selectOption: 'Select an option',
  selectOptions: 'Select options...',
  moreActionsAriaLabel: 'More value actions',
  clearValue: 'Clear value',
  forceRefresh: 'Force refresh',
  aiAssistAriaLabel: 'AI assist',
  aiAssistTooltip: 'Generate with AI',
  aiPromptLabel: 'Describe what you want',
  aiPromptPlaceholder: 'Display a value from the previous step',
  aiGenerate: 'Generate',
  aiOutputHint: (output) => `Output: ${output}`,
  lockedLabel: 'Read-only',
  unlockedLabel: 'Editable',
  lockedHint: 'Read-only. Click to make editable.',
  unlockedHint: 'Editable. Click to make read-only.',
};

export interface LockableValueFieldOption {
  label: string;
  value: string;
  /**
   * Nested entries for the Insert-variable tree, rendered as supplied. Only the
   * consumer knows whether the path a grouping implies is real, so the tree
   * invents neither a root nor a type.
   */
  children?: LockableValueFieldOption[];
  /** Type badge shown against the entry. */
  type?: string;
}

export interface LockableValueFieldMoreActions {
  onClear?: () => void;
  onRefresh?: () => void;
}

/**
 * Where the caret was when a variable was chosen, so the consumer can splice
 * rather than append. The component tracks it because it owns the input;
 * `caret` is null when the author has not placed one, which means "append".
 */
export interface VariableInsertContext {
  value: string;
  caret: { start: number; end: number } | null;
}

export interface LockableValueFieldProps {
  /** Current field value. Encoding depends on fieldType (e.g. multi-select is a JSON array string). */
  value?: string;
  /** Called when the user edits the value (only fires while unlocked). */
  onValueChange?: (value: string) => void;
  /** Called when the active value control loses focus. */
  onValueBlur?: () => void;
  /** Whether the field is read-only. Defaults to true. */
  locked?: boolean;
  /** Called when the user toggles the lock. */
  onLockedChange?: (locked: boolean) => void;
  /** Whether the built-in lock control renders. Defaults to true. */
  showLock?: boolean;
  /**
   * Replaces the leading lock toggle with a semantic prefix such as `=`.
   * Pass `null` to suppress the built-in toggle; omitting the prop preserves it.
   */
  leadingAddon?: ReactNode;
  /**
   * Replaces the trailing fixed/expression menu with a consumer-provided action
   * for expression-capable field types. Pass `null` to suppress the built-in
   * menu; omitting the prop preserves it.
   */
  trailingAddon?: ReactNode;
  /** Adds a field-level overflow menu beside the value control. */
  more?: LockableValueFieldMoreActions;
  /** Fixed value vs. JS expression. Defaults to 'fixed'. Ignored for types that don't support expressions. */
  mode?: LockableValueFieldMode;
  /** Called when the user switches modes. */
  onModeChange?: (mode: LockableValueFieldMode) => void;
  /**
   * Optional expression editor used in place of the built-in monospace input.
   * Consumers can use this to supply a syntax-aware editor such as Monaco.
   *
   * Superseded by `renderModeControl`, which covers every mode. Kept for
   * existing callers; `renderModeControl` wins when both are supplied and it
   * returns something for `expression`.
   */
  renderExpressionEditor?: (props: {
    id: string;
    value: string;
    onValueChange?: (value: string) => void;
    onBlur?: () => void;
    readOnly: boolean;
    placeholder: string;
    fieldType: LockableFieldType;
    'aria-invalid'?: AriaAttributes['aria-invalid'];
    'aria-describedby'?: string;
    'aria-errormessage'?: string;
    'data-slot'?: string;
  }) => ReactNode;
  /**
   * Renders the value control for a given mode, replacing the built-in one.
   * `variable` and `prompt` have no built-in editor, and a surface that authors
   * its own choices can replace the `fixed` control too.
   *
   * Returning nothing (or omitting this) falls back to the built-in control
   * for the field's type, so an unhandled mode degrades to the literal editor
   * rather than rendering an empty row.
   */
  renderModeControl?: (
    mode: LockableValueFieldMode,
    props: {
      id: string;
      value: string;
      onValueChange?: (value: string) => void;
      onBlur?: () => void;
      readOnly: boolean;
      placeholder: string;
      fieldType: LockableFieldType;
    }
  ) => ReactNode;
  /**
   * Takes over what choosing a variable does to the value. The component owns
   * the picker and hands back the chosen entry exactly as supplied in
   * `variables`, with the caret.
   *
   * A value that is one reference must be replaced rather than appended, and a
   * variable may carry its type onto the field, so the consumer decides. Omit
   * to splice at the caret, or append when no caret has been placed.
   */
  onInsertVariable?: (
    variable: LockableValueFieldOption,
    /**
     * Where the caret was, so the consumer can splice rather than append.
     * The component tracks this because it owns the input; `caret` is null
     * when the author has not placed one, which means "append".
     */
    context: VariableInsertContext
  ) => void;
  /** The field's data type. Defaults to 'string'. Determines which control renders the value. */
  fieldType?: LockableFieldType;
  /**
   * Which types the picker offers, in display order. Defaults to
   * `FIELD_TYPE_ORDER`, every type the component can render; a surface with a
   * narrower vocabulary of its own offers fewer.
   */
  fieldTypes?: readonly LockableFieldType[];
  /** Called when the user switches the field type. */
  onFieldTypeChange?: (fieldType: LockableFieldType) => void;
  /** Shows a required-field asterisk next to the default label. Ignored when `label` is provided. */
  required?: boolean;
  /** Called when the user toggles required/optional. Renders the Required switch when provided. */
  onRequiredChange?: (required: boolean) => void;
  /** Overrides the default mode-based label (e.g. a field name instead of "String value"). */
  label?: ReactNode;
  /**
   * Overrides the placeholder on the value control. The computed default names
   * only the type; the accessible label still falls back to it.
   */
  placeholder?: string;
  /** Overrides for any subset of the user-visible text; see LockableValueFieldStrings. */
  strings?: Partial<LockableValueFieldStrings>;
  /** Field-specific validation feedback rendered immediately below the active control. */
  error?: ReactNode;
  /** Optional id for the inline validation message. */
  errorId?: string;
  /** Content rendered below the value control, such as a related checkbox or help text. */
  belowValue?: ReactNode;
  /** Accessible name for the file-upload dropzone. Defaults to a string `label`, then the computed field label. */
  fileUploadAriaLabel?: string;
  /** Extra content rendered after the built-in AI assist / Insert variable buttons (e.g. a delete button). */
  headerActions?: ReactNode;
  /** Forces the header row into its narrow-container icon-only layout, regardless of actual width. For demos/comparisons. */
  compact?: boolean;
  /** Whether the AI-assist and Insert-variable actions render at all. Set to false for read-only reviewer contexts where field configuration isn't editable. Defaults to true. */
  showFieldActions?: boolean;
  /** Options for 'single-select' / 'multi-select' field types. Defaults to a small set of demo options. */
  options?: LockableValueFieldOption[];
  /**
   * Called with the entered prompt when the user clicks Generate.
   *
   * Its presence also decides whether the AI-assist button renders: without a
   * handler the button would have nothing to do.
   */
  onGenerateWithAi?: (prompt: string) => void;
  /**
   * Variables offered by the "Insert variable" popover; clicking one appends its value to the
   * current value. The button is disabled when this is empty (the default).
   */
  variables?: LockableValueFieldOption[];
  id?: string;
  className?: string;
}
