import type * as React from 'react';
import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { FileUpload } from '@/components/ui/file-upload';
import { Input } from '@/components/ui/input';
import type { InputGroupLayout, InputGroupProps } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { FieldMetadata, FieldOption, FieldType, SliderFieldMetadata } from './form-schema';
import { StringListControl } from './string-list-field';

/** The react-hook-form `Controller` binding a control reads and writes. */
export interface FieldControlFormField {
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  name: string;
  ref: React.Ref<unknown>;
}

export interface FieldControlProps {
  field: FieldMetadata;
  formField: FieldControlFormField;
  /** The resolved options of a select, multiselect or radio field. */
  options?: FieldOption[];
  disabled?: boolean;
  /** Marks the control invalid and points it at the `${field.name}-error` message. */
  invalid?: boolean;
}

/**
 * How a field's label reaches its control: `control` labels it with `htmlFor` the control's id
 * (`field.name`), and `labelledby` has the control name itself with `aria-labelledby` the label's
 * id (`${field.name}-label`).
 */
export type FieldControlLabelTarget = 'control' | 'labelledby';

/** How a field type's control sits in an `InputGroup`. */
export interface FieldControlGeometry {
  layout: InputGroupLayout;
  variant: NonNullable<InputGroupProps['variant']>;
  labelTarget: FieldControlLabelTarget;
  /** Whether text can be inserted at the caret, as Insert variable does. */
  insertable: boolean;
}

/**
 * Each field type's geometry inside an `InputGroup`. Types not listed have not been fitted to one
 * yet.
 * Booleans are listed as the tri-state radio group they render as there, not as a lone switch or
 * checkbox.
 */
export const FIELD_CONTROL_GEOMETRY: Readonly<Partial<Record<FieldType, FieldControlGeometry>>> = {
  text: {
    layout: 'row',
    variant: 'default',
    labelTarget: 'control',
    insertable: true,
  },
  email: {
    layout: 'row',
    variant: 'default',
    labelTarget: 'control',
    insertable: true,
  },
  number: {
    layout: 'row',
    variant: 'default',
    labelTarget: 'control',
    insertable: false,
  },
  select: {
    layout: 'row',
    variant: 'default',
    labelTarget: 'control',
    insertable: false,
  },
  textarea: {
    layout: 'grow',
    variant: 'default',
    labelTarget: 'control',
    insertable: true,
  },
  file: {
    layout: 'grow',
    variant: 'default',
    labelTarget: 'control',
    insertable: false,
  },
  multiselect: {
    layout: 'grow',
    variant: 'default',
    labelTarget: 'control',
    insertable: false,
  },
  switch: {
    layout: 'row',
    variant: 'none',
    labelTarget: 'labelledby',
    insertable: false,
  },
  checkbox: {
    layout: 'row',
    variant: 'none',
    labelTarget: 'labelledby',
    insertable: false,
  },
};

/**
 * The bare control for a field's type, without its label, description or error. Its id is
 * `field.name`, and it names the label and error by `${field.name}-label` and
 * `${field.name}-error`, so those are the ids to give them. Custom fields render nothing.
 */
export function FieldControl({
  field,
  formField,
  options = [],
  disabled = false,
  invalid = false,
}: FieldControlProps) {
  const errorId = invalid ? `${field.name}-error` : undefined;

  switch (field.type) {
    case 'text':
    case 'email':
      return (
        <Input
          id={field.name}
          value={formField.value as string | undefined}
          onChange={(e) => formField.onChange(e.target.value)}
          onBlur={formField.onBlur}
          name={formField.name}
          ref={formField.ref as React.Ref<HTMLInputElement>}
          type={field.type}
          placeholder={field.placeholder}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={errorId}
          aria-errormessage={errorId}
          aria-label={field.ariaLabel}
        />
      );

    case 'number':
      return (
        <Input
          id={field.name}
          value={formField.value as number | undefined}
          onBlur={formField.onBlur}
          name={formField.name}
          ref={formField.ref as React.Ref<HTMLInputElement>}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.placeholder}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={errorId}
          aria-errormessage={errorId}
          onChange={(e) => formField.onChange(parseFloat(e.target.value))}
        />
      );

    case 'textarea':
      return (
        <Textarea
          id={field.name}
          value={formField.value as string | undefined}
          onChange={(e) => formField.onChange(e.target.value)}
          onBlur={formField.onBlur}
          name={formField.name}
          ref={formField.ref as React.Ref<HTMLTextAreaElement>}
          placeholder={field.placeholder}
          disabled={disabled}
          maxLength={field.maxLength}
          aria-invalid={invalid || undefined}
          aria-describedby={errorId}
          aria-errormessage={errorId}
          {...(field.minRows != null ? { minRows: field.minRows } : { rows: field.rows || 4 })}
        />
      );

    case 'select':
      return (
        <Select
          value={formField.value as string | undefined}
          onValueChange={formField.onChange}
          disabled={disabled}
        >
          <SelectTrigger
            id={field.name}
            aria-label={field.label}
            aria-invalid={invalid || undefined}
            aria-describedby={errorId}
            aria-errormessage={errorId}
          >
            <SelectValue placeholder={field.placeholder || 'Select...'} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={String(option.value)}
                value={String(option.value)}
                disabled={'disabled' in option ? Boolean(option.disabled) : false}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'multiselect':
      return (
        <MultiSelect
          id={field.name}
          selected={(formField.value as string[]) || []}
          onChange={formField.onChange}
          options={options.map((opt) => ({
            label: opt.label,
            value: String(opt.value),
          }))}
          disabled={disabled}
          placeholder={field.placeholder || 'Select items...'}
          emptyMessage={field.emptyMessage ?? 'No items found.'}
          searchPlaceholder={field.searchPlaceholder ?? 'Search...'}
          maxSelected={field.maxSelected}
          aria-invalid={invalid || undefined}
          aria-describedby={errorId}
          aria-errormessage={errorId}
        />
      );

    case 'checkbox':
      return (
        <Checkbox
          checked={formField.value === true}
          onCheckedChange={(checked) => formField.onChange(checked === true)}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={errorId}
          aria-errormessage={errorId}
          id={field.name}
        />
      );

    case 'switch':
      return (
        <Switch
          id={field.name}
          checked={formField.value === true}
          onCheckedChange={(checked) => formField.onChange(checked === true)}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={errorId}
          aria-errormessage={errorId}
        />
      );

    case 'radio':
      return (
        <RadioGroup
          aria-labelledby={`${field.name}-label`}
          value={formField.value as string | null | undefined}
          onValueChange={formField.onChange}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={errorId}
          aria-errormessage={errorId}
        >
          {options.map((option) => (
            <div key={String(option.value)} className="flex items-center space-x-2">
              <RadioGroupItem
                value={String(option.value)}
                id={`${field.name}-${option.value}`}
                disabled={'disabled' in option ? Boolean(option.disabled) : false}
              />
              <Label variant="muted" htmlFor={`${field.name}-${option.value}`}>
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );

    case 'slider':
      return (
        <SliderControl
          field={field}
          formField={formField}
          disabled={disabled}
          invalid={invalid}
          errorId={errorId}
        />
      );

    case 'date':
      return (
        <DatePicker
          id={field.name}
          value={formField.value as Date | undefined}
          onValueChange={formField.onChange}
          disabled={disabled}
          placeholder={field.placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={errorId}
          aria-errormessage={errorId}
        />
      );

    case 'datetime':
      return (
        <DateTimePicker
          aria-labelledby={`${field.name}-label`}
          aria-invalid={invalid || undefined}
          aria-describedby={errorId}
          aria-errormessage={errorId}
          value={formField.value as Date | undefined}
          onValueChange={formField.onChange}
          disabled={disabled}
          placeholder={field.placeholder}
          use12Hour={field.use12Hour}
        />
      );

    case 'file':
      return (
        <FileUpload
          id={field.name}
          ariaLabel={field.ariaLabel ?? field.label}
          aria-invalid={invalid || undefined}
          aria-describedby={errorId}
          aria-errormessage={errorId}
          accept={field.accept}
          multiple={field.multiple}
          disabled={disabled}
          maxSize={field.maxSize}
          showPreview={field.showPreview}
          onFilesChange={(files) => {
            formField.onChange(field.multiple ? files : files[0]);
          }}
        />
      );

    case 'string-list':
      return (
        <StringListControl
          field={field}
          inputRef={formField.ref as React.Ref<HTMLTextAreaElement>}
          value={formField.value as string[] | undefined}
          onChange={formField.onChange}
          onBlur={formField.onBlur}
          invalid={invalid}
          disabled={disabled}
        />
      );

    default:
      return null;
  }
}

// ============================================================================
// Slider — subscribes to the field its max is read from, and clamps the value when that max
// drops below it.
// ============================================================================

interface SliderControlProps {
  field: SliderFieldMetadata;
  formField: FieldControlFormField;
  disabled: boolean;
  invalid: boolean;
  errorId: string | undefined;
}

function SliderControl({ field, formField, disabled, invalid, errorId }: SliderControlProps) {
  const resolvedMax = useSliderMax(field);

  // Clamp the form value if the resolved max drops below it (e.g. user
  // switched to a model with a lower token cap).
  const prevMaxRef = useRef(resolvedMax);
  useEffect(() => {
    if (resolvedMax === prevMaxRef.current) return;
    prevMaxRef.current = resolvedMax;
    const v = formField.value;
    if (typeof v === 'number' && v > resolvedMax) {
      formField.onChange(resolvedMax);
    }
  }, [resolvedMax, formField.value, formField.onChange]);

  const displayValue = clampSliderValue(formField.value, resolvedMax);

  return (
    // Radix renders the thumb as the role=slider element, so the name and invalid state
    // have to be put on it explicitly — a neighbouring <label> reaches neither.
    <Slider
      aria-labelledby={`${field.name}-label`}
      aria-invalid={invalid || undefined}
      aria-describedby={errorId}
      aria-errormessage={errorId}
      value={[(displayValue as number) ?? field.min ?? 0]}
      onValueChange={(values) => formField.onChange(values[0])}
      min={field.min || 0}
      max={resolvedMax}
      step={field.step || 1}
      disabled={disabled}
    />
  );
}

/** The slider's effective max, following `field.maxRef` when it has one. */
export function useSliderMax(field: SliderFieldMetadata): number {
  const { watch } = useFormContext();
  const watchedMax = field.maxRef ? watch(field.maxRef.fromField) : undefined;
  return resolveSliderMax(field, watchedMax);
}

/** A numeric slider value capped at `max`; anything else as it is. */
export function clampSliderValue(value: unknown, max: number): unknown {
  return typeof value === 'number' ? Math.min(value, max) : value;
}

/**
 * Resolve the slider's effective max. Priority:
 *   1. `field.maxRef` — use the watched value if it's a finite positive number,
 *      otherwise `maxRef.fallback`.
 *   2. `field.max` — static numeric max.
 *   3. 100 — historical default.
 */
function resolveSliderMax(field: SliderFieldMetadata, watchedValue: unknown): number {
  if (field.maxRef) {
    if (typeof watchedValue === 'number' && Number.isFinite(watchedValue) && watchedValue > 0) {
      return watchedValue;
    }
    if (typeof field.maxRef.fallback === 'number') return field.maxRef.fallback;
  }
  if (typeof field.max === 'number') return field.max;
  return 100;
}
