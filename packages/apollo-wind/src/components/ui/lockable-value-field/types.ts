import {
  ALargeSmall,
  Braces,
  Calendar as CalendarIcon,
  File as FileIcon,
  Hash,
  List,
  ListChecks,
  type LucideIcon,
  ToggleLeft,
} from 'lucide-react';
import type { AriaAttributes, ReactNode } from 'react';

export type LockableValueFieldMode = 'fixed' | 'expression';

export type LockableFieldType =
  | 'string'
  | 'integer'
  | 'date'
  | 'boolean'
  | 'single-select'
  | 'multi-select'
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
    label: 'Multi select',
    icon: ListChecks,
    supportsExpression: false,
    fixedLabel: 'Fixed value',
    fixedDescription: 'Choose one or more options',
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
  'date',
  'boolean',
  'single-select',
  'multi-select',
  'file',
  'object',
];

export interface LockableValueFieldOption {
  label: string;
  value: string;
}

export interface LockableValueFieldMoreActions {
  /** Removes the field itself from its parent collection. */
  onDelete?: () => void;
  /** Additional field-level actions rendered inside the More menu. */
  children?: ReactNode;
  onClear?: () => void;
  onRefresh?: () => void;
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
  /** Optional classes for the leading addon container. */
  leadingAddonClassName?: string;
  /**
   * Replaces the trailing fixed/expression menu with a consumer-provided action
   * for expression-capable field types. Pass `null` to suppress the built-in
   * menu; omitting the prop preserves it.
   */
  trailingAddon?: ReactNode;
  /** Whether to show the fixed-value/expression action beside the input. */
  showValueTypeAction?: boolean;
  /** Adds a field-level overflow menu beside the value control. */
  more?: LockableValueFieldMoreActions;
  /** Fixed value vs. JS expression. Defaults to 'fixed'. Ignored for types that don't support expressions. */
  mode?: LockableValueFieldMode;
  /** Called when the user switches modes. */
  onModeChange?: (mode: LockableValueFieldMode) => void;
  /**
   * Optional expression editor used in place of the built-in monospace input.
   * Consumers can use this to supply a syntax-aware editor such as Monaco.
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
  /** @deprecated Controls are always visible. Retained as a no-op for backwards compatibility. */
  controlsVisibility?: 'visible' | 'hover';
  /** Whether the AI-assist and Insert-variable actions render at all. Set to false for read-only reviewer contexts where field configuration isn't editable. Defaults to true. */
  showFieldActions?: boolean;
  /** Whether the Generate with AI action renders. Defaults to true. */
  showAiAssist?: boolean;
  /** Options for 'single-select' / 'multi-select' field types. Defaults to a small set of demo options. */
  options?: LockableValueFieldOption[];
  /** Called with the entered prompt when the user clicks Generate in the AI-assist popover. */
  onGenerateWithAi?: (prompt: string) => void;
  /**
   * Variables offered by the "Insert variable" popover; clicking one appends its value to the
   * current value. The button is disabled when this is empty (the default).
   */
  variables?: LockableValueFieldOption[];
  id?: string;
  className?: string;
}
