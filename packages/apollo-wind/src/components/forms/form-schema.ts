import type { UseFormReturn, FieldValues } from 'react-hook-form';

/**
 * Core Schema Types for Apollo-Wind Metadata Forms
 * Designed for enterprise automation workflows with extensibility
 *
 * Uses discriminated unions for type-safe field metadata
 */

// ============================================================================
// Field-Level Schema - Base Types
// ============================================================================

/**
 * Field option for select, multiselect, and radio fields
 */
export interface FieldOption {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
}

/**
 * Grid layout configuration
 */
export interface GridConfig {
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  order?: number;
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Data source for dynamic options
 */
export type DataSource =
  | { type: 'static'; options: FieldOption[] }
  | {
      type: 'fetch';
      url: string;
      method?: 'GET' | 'POST';
      transform?: string;
      params?: Record<string, unknown>;
    }
  | {
      type: 'remote';
      endpoint: string;
      method?: 'GET' | 'POST';
      params?: Record<string, unknown>;
      transform?: string;
    }
  | { type: 'computed'; dependency: string[]; compute: string };

/**
 * Condition for rules engine
 */
export interface FieldCondition {
  when: string; // Field path (e.g., "user.type")
  is?: unknown;
  isNot?: unknown;
  in?: unknown[];
  notIn?: unknown[];
  matches?: string; // Regex pattern
  custom?: string; // Expression string for jsep evaluation
}

/**
 * Rule for conditional behavior
 */
export interface FieldRule {
  id: string;
  conditions: FieldCondition[];
  operator?: 'AND' | 'OR';
  effects: {
    visible?: boolean;
    disabled?: boolean;
    required?: boolean;
    value?: unknown;
    options?: DataSource;
    validate?: ValidationConfig;
  };
}

/**
 * Validation error messages
 * Used within ValidationConfig for custom error text
 */
export interface ValidationMessages {
  required?: string;
  minLength?: string;
  maxLength?: string;
  pattern?: string;
  min?: string;
  max?: string;
  email?: string;
  url?: string;
  integer?: string;
  positive?: string;
  negative?: string;
  minItems?: string;
  maxItems?: string;
  custom?: string;
}

/**
 * Validation configuration - JSON-serializable
 *
 * Maps 1:1 to JSON for database storage and API transmission.
 * Converted to Zod schema at runtime for actual validation.
 *
 * @example
 * // Simple required email
 * { required: true, email: true, messages: { email: "Invalid email" } }
 *
 * @example
 * // Password with constraints
 * {
 *   required: true,
 *   minLength: 8,
 *   pattern: "^(?=.*[A-Z])(?=.*[0-9]).*$",
 *   messages: {
 *     minLength: "Password must be at least 8 characters",
 *     pattern: "Must contain uppercase letter and number"
 *   }
 * }
 */
export interface ValidationConfig {
  // Presence
  required?: boolean;

  // String constraints
  minLength?: number;
  maxLength?: number;
  pattern?: string; // Regex pattern as string
  email?: boolean; // Apply email validation
  url?: boolean; // Apply URL validation

  // Number constraints
  min?: number;
  max?: number;
  integer?: boolean;
  positive?: boolean;
  negative?: boolean;

  // Array constraints (for multiselect, file)
  minItems?: number;
  maxItems?: number;

  // File constraints
  maxFileSize?: number; // In bytes
  allowedTypes?: string[]; // MIME types or extensions like ".pdf", "image/*"

  // Custom validation (jsep expression evaluated at runtime)
  custom?: string; // Expression like "value.length > otherField"

  // Error messages (optional overrides for each constraint)
  messages?: ValidationMessages;
}

/**
 * Base metadata common to all field types
 */
interface BaseFieldMetadata {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  defaultValue?: unknown;
  validation?: ValidationConfig;
  dataSource?: DataSource;
  rules?: FieldRule[];
  grid?: GridConfig;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

// ============================================================================
// Field-Specific Metadata (Discriminated Union)
// ============================================================================

export interface TextFieldMetadata extends BaseFieldMetadata {
  type: 'text';
}

export interface EmailFieldMetadata extends BaseFieldMetadata {
  type: 'email';
}

export interface TextareaFieldMetadata extends BaseFieldMetadata {
  type: 'textarea';
  rows?: number;
}

export interface NumberFieldMetadata extends BaseFieldMetadata {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
}

export interface SelectFieldMetadata extends BaseFieldMetadata {
  type: 'select';
  options?: FieldOption[];
}

export interface MultiSelectFieldMetadata extends BaseFieldMetadata {
  type: 'multiselect';
  options?: FieldOption[];
  maxSelected?: number;
}

export interface RadioFieldMetadata extends BaseFieldMetadata {
  type: 'radio';
  options?: FieldOption[];
}

export interface CheckboxFieldMetadata extends BaseFieldMetadata {
  type: 'checkbox';
}

export interface SwitchFieldMetadata extends BaseFieldMetadata {
  type: 'switch';
}

export interface SliderFieldMetadata extends BaseFieldMetadata {
  type: 'slider';
  min?: number;
  max?: number;
  step?: number;
}

export interface DateFieldMetadata extends BaseFieldMetadata {
  type: 'date';
}

export interface DateTimeFieldMetadata extends BaseFieldMetadata {
  type: 'datetime';
  use12Hour?: boolean;
}

export interface FileFieldMetadata extends BaseFieldMetadata {
  type: 'file';
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  showPreview?: boolean;
}

export interface CustomFieldMetadata extends BaseFieldMetadata {
  type: 'custom';
  component: string;
  componentProps?: Record<string, unknown>;
}

/**
 * Discriminated union of all field types
 * TypeScript will enforce that only valid properties exist for each type
 */
export type FieldMetadata =
  | TextFieldMetadata
  | EmailFieldMetadata
  | TextareaFieldMetadata
  | NumberFieldMetadata
  | SelectFieldMetadata
  | MultiSelectFieldMetadata
  | RadioFieldMetadata
  | CheckboxFieldMetadata
  | SwitchFieldMetadata
  | SliderFieldMetadata
  | DateFieldMetadata
  | DateTimeFieldMetadata
  | FileFieldMetadata
  | CustomFieldMetadata;

/**
 * Extract the field type from FieldMetadata
 */
export type FieldType = FieldMetadata['type'];

// ============================================================================
// Type Guards
// ============================================================================

export function hasOptions(
  field: FieldMetadata,
): field is SelectFieldMetadata | MultiSelectFieldMetadata | RadioFieldMetadata {
  return field.type === 'select' || field.type === 'multiselect' || field.type === 'radio';
}

export function hasMinMaxStep(
  field: FieldMetadata,
): field is NumberFieldMetadata | SliderFieldMetadata {
  return field.type === 'number' || field.type === 'slider';
}

export function isFileField(field: FieldMetadata): field is FileFieldMetadata {
  return field.type === 'file';
}

export function isCustomField(field: FieldMetadata): field is CustomFieldMetadata {
  return field.type === 'custom';
}

// ============================================================================
// Form-Level Schema
// ============================================================================

export interface FormSection {
  id: string;
  title?: string;
  description?: string;
  fields: FieldMetadata[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  conditions?: FieldCondition[]; // Show/hide entire section
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  sections: FormSection[];
  validation?: 'onChange' | 'onBlur' | 'onSubmit';
  canSkip?: boolean;
  conditions?: FieldCondition[]; // Show/hide entire step
}

export interface FormAction {
  id: string;
  type: 'submit' | 'save-draft' | 'reset' | 'custom';
  label: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  conditions?: FieldCondition[];
}

/**
 * Base form schema with common properties
 */
interface BaseFormSchema {
  id: string;
  title: string;
  description?: string;
  version?: string;

  // Initial data
  initialData?: Record<string, unknown>;

  // Behavior
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';

  // Actions
  actions?: FormAction[];

  // Layout
  layout?: {
    columns?: number;
    gap?: number;
    variant?: 'default' | 'compact' | 'spacious';
  };

  // Metadata
  metadata?: Record<string, unknown>;
}

/**
 * Single-page form schema
 */
export interface SinglePageFormSchema extends BaseFormSchema {
  sections: FormSection[];
  steps?: never;
}

/**
 * Multi-step form schema
 */
export interface MultiStepFormSchema extends BaseFormSchema {
  steps: FormStep[];
  sections?: never;
}

/**
 * Form schema - either single-page or multi-step (discriminated union)
 */
export type FormSchema = SinglePageFormSchema | MultiStepFormSchema;

// ============================================================================
// Runtime Context Types
// ============================================================================

// Props interface for custom field components
export interface CustomFieldComponentProps {
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  name: string;
  field?: FieldMetadata;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  [key: string]: unknown; // Allow additional props from componentProps
}

export interface FormContext<T extends FieldValues = FieldValues> {
  schema: FormSchema;
  form: UseFormReturn<T>;
  values: T;
  errors: Record<string, unknown>;
  isSubmitting: boolean;
  isDirty: boolean;
  currentStep?: number;

  // Methods
  evaluateConditions: (conditions: FieldCondition[]) => boolean;
  fetchData: (source: DataSource) => Promise<FieldOption[]>;
  registerCustomComponent: (
    name: string,
    component: React.ComponentType<CustomFieldComponentProps>,
  ) => void;
}

// ============================================================================
// Extension/Plugin System
// ============================================================================

export interface FormPlugin<T extends FieldValues = FieldValues> {
  name: string;
  version?: string;

  // Lifecycle hooks
  onFormInit?: (context: FormContext<T>) => void | Promise<void>;
  onFieldRegister?: (field: FieldMetadata, context: FormContext<T>) => void;
  onValueChange?: (fieldName: string, value: unknown, context: FormContext<T>) => void;
  onSubmit?: (data: T, context: FormContext<T>) => T | Promise<T>;

  // Custom validators (JSON-serializable validation configs)
  validators?: Record<string, ValidationConfig>;

  // Custom components
  components?: Record<string, React.ComponentType<CustomFieldComponentProps>>;

  // Rules engine extensions
  customConditions?: Record<string, (value: unknown, condition: unknown) => boolean>;
  customEffects?: Record<string, (field: FieldMetadata, context: FormContext<T>) => void>;
}
