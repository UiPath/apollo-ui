import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { FileUpload } from '@/components/ui/file-upload';
import {
  FormField,
  FormFieldDescription,
  FormFieldError,
  FormFieldLabel,
} from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
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
import { deepEqual } from '@/lib';
import { DataFetcher } from './data-fetcher';
import type {
  CustomFieldComponentProps,
  FieldMetadata,
  FieldOption,
  FormContext,
  SliderFieldMetadata,
} from './form-schema';
import { hasOptions, isCustomField } from './form-schema';
import { RulesEngine } from './rules-engine';

/**
 * Field Renderer - Connects metadata to actual UI components
 * Integrates with shadcn/ui components from apollo-wind
 */

interface FormFieldRendererProps {
  field: FieldMetadata;
  context: FormContext;
  customComponents: Record<string, React.ComponentType<CustomFieldComponentProps>>;
  disabled?: boolean;
}

export function FormFieldRenderer({
  field,
  context,
  customComponents,
  disabled: formDisabled = false,
}: FormFieldRendererProps) {
  const { control, watch, getValues } = useFormContext();

  // Ref for context to avoid unnecessary effect re-runs
  const contextRef = useRef(context);
  contextRef.current = context;

  // Calculate initial visibility based on rules
  const getInitialVisibility = () => {
    if (!field.rules || field.rules.length === 0) {
      return true; // Default to visible if no rules
    }

    // Check if there are any "show" rules (visible: true effect)
    // If a field has "show" rules, it should be hidden by default until conditions are met
    const hasShowRule = field.rules.some((rule) => rule.effects?.visible === true);
    const hasHideRule = field.rules.some((rule) => rule.effects?.visible === false);

    if (!hasShowRule && !hasHideRule) {
      return true; // No visibility rules, default to visible
    }

    // Apply rules to determine initial visibility
    const allValues = getValues();
    const ruleResult = RulesEngine.applyRules(field.rules, allValues, context);

    if (ruleResult.visible !== undefined) {
      return ruleResult.visible;
    }

    // If no rule matched:
    // - Fields with "show" rules should be hidden by default
    // - Fields with "hide" rules should be visible by default
    return hasShowRule ? false : true;
  };

  // Calculate initial required state based on validation config and rules
  const getInitialRequired = () => {
    // Check static validation.required first
    const staticRequired = field.validation?.required ?? false;

    if (!field.rules || field.rules.length === 0) {
      return staticRequired;
    }

    // Apply rules to determine initial required state (rules can override static)
    const allValues = getValues();
    const ruleResult = RulesEngine.applyRules(field.rules, allValues, context);
    return ruleResult.required ?? staticRequired;
  };

  const [fieldState, setFieldState] = useState({
    visible: getInitialVisibility(),
    disabled: false,
    required: getInitialRequired(),
    options: hasOptions(field) ? field.options || [] : [],
  });

  // Extract fields that this field's rules depend on
  const dependentFields = useMemo(() => {
    if (!field.rules || field.rules.length === 0) return [];
    const fields = new Set<string>();
    field.rules.forEach((rule) => {
      rule.conditions?.forEach((condition) => {
        if ('when' in condition && condition.when) {
          fields.add(condition.when);
        }
      });
    });
    return Array.from(fields);
  }, [field.rules]);

  // Extract fields that this field's dataSource depends on (for cascading dropdowns)
  const dataSourceDependentFields = useMemo(() => {
    if (!field.dataSource) return [];
    const fields = new Set<string>();

    // Check for params with $fieldName references
    if ('params' in field.dataSource && field.dataSource.params) {
      Object.values(field.dataSource.params).forEach((value) => {
        if (typeof value === 'string' && value.startsWith('$')) {
          fields.add(value.slice(1)); // Remove the $ prefix
        }
      });
    }

    // Check for computed dependencies
    if (field.dataSource.type === 'computed' && 'dependency' in field.dataSource) {
      field.dataSource.dependency.forEach((dep) => {
        fields.add(dep);
      });
    }

    return Array.from(fields);
  }, [field.dataSource]);

  // Watch dataSource dependent fields to trigger re-fetch
  const watchedDataSourceValues = watch(dataSourceDependentFields);

  // Watch fields that this field's rules depend on
  // This triggers re-renders AND provides values for the useEffect dependency
  const watchedRuleDependentValues = watch(dependentFields);

  // Apply rules engine with deep equality check to prevent infinite loops
  // biome-ignore lint/correctness/useExhaustiveDependencies: watchedRuleDependentValues triggers re-evaluation when dependent field values change
  useEffect(() => {
    if (!field.rules || field.rules.length === 0) return;

    const allValues = getValues();
    const ruleResult = RulesEngine.applyRules(field.rules, allValues, contextRef.current);

    // Check what types of rules exist
    const hasShowRule = field.rules.some((rule) => rule.effects?.visible === true);
    const hasHideRule = field.rules.some((rule) => rule.effects?.visible === false);
    const hasRequiredRule = field.rules.some((rule) => rule.effects?.required !== undefined);
    const hasDisabledRule = field.rules.some((rule) => rule.effects?.disabled !== undefined);

    // Build new state with proper defaults when rules don't match
    const newState: Partial<typeof fieldState> = {};

    // Handle visibility: if no rule matched, apply default based on rule type
    if (ruleResult.visible !== undefined) {
      newState.visible = ruleResult.visible;
    } else if (hasShowRule || hasHideRule) {
      // Fields with "show" rules should be hidden when no rule matches
      // Fields with "hide" rules should be visible when no rule matches
      newState.visible = hasShowRule ? false : true;
    }

    // Handle required: if there are conditional required rules, fall back to validation.required when not matched
    if (ruleResult.required !== undefined) {
      newState.required = ruleResult.required;
    } else if (hasRequiredRule) {
      // Check if there's an unconditional required rule (conditions.length === 0)
      const hasUnconditionalRequired = field.rules.some(
        (rule) => rule.effects?.required === true && rule.conditions.length === 0
      );
      // Fall back to static validation.required if no unconditional rule
      newState.required = hasUnconditionalRequired || (field.validation?.required ?? false);
    }

    // Handle disabled: if there are conditional disabled rules, default to false when not matched
    if (ruleResult.disabled !== undefined) {
      newState.disabled = ruleResult.disabled;
    } else if (hasDisabledRule) {
      newState.disabled = false;
    }

    setFieldState((prev) => {
      // Only update if state actually changed
      const nextState = { ...prev, ...newState };
      if (deepEqual(prev, nextState)) {
        return prev;
      }
      return nextState;
    });
  }, [field.rules, field.validation?.required, getValues, watchedRuleDependentValues]);

  // Tracked apart from inlineOptions so a field whose options go away clears to [].
  const isOptionsField = hasOptions(field);
  const inlineOptions = isOptionsField ? field.options : undefined;

  // Sync inline options when field.options changes (for fields without dataSource)
  useEffect(() => {
    if (field.dataSource) return; // Skip if using dataSource
    if (!isOptionsField) return;

    const nextOptions = inlineOptions || [];
    setFieldState((prev) => {
      if (deepEqual(prev.options, nextOptions)) {
        return prev;
      }
      return {
        ...prev,
        options: nextOptions,
      };
    });
  }, [field.dataSource, isOptionsField, inlineOptions]);

  // Fetch data source options (re-fetches when dependent fields change)
  // biome-ignore lint/correctness/useExhaustiveDependencies: watchedDataSourceValues triggers re-fetch when dependent field values change (cascading dropdowns)
  useEffect(() => {
    if (!field.dataSource) return;

    const fetchOptions = async () => {
      try {
        const allValues = getValues();
        const data = await DataFetcher.fetch(field.dataSource!, allValues);
        setFieldState((prev) => {
          // Only update if options actually changed
          if (deepEqual(prev.options, data)) {
            return prev;
          }
          return {
            ...prev,
            options: data as FieldOption[],
          };
        });
      } catch (error) {
        console.error(`Failed to fetch options for ${field.name}:`, error);
      }
    };

    fetchOptions();
  }, [field.dataSource, field.name, getValues, watchedDataSourceValues]);

  // Don't render if hidden by rules
  if (!fieldState.visible) {
    return null;
  }

  // Grid styling - use inline styles to avoid Tailwind dynamic class issues
  const gridSpan = field.grid?.span || 1;
  const gridStyle: React.CSSProperties = { gridColumn: `span ${gridSpan}` };

  // Custom component renderer
  if (isCustomField(field) && customComponents[field.component]) {
    const CustomComponent = customComponents[field.component];
    return (
      <div style={gridStyle}>
        <Controller
          name={field.name}
          control={control}
          defaultValue={field.defaultValue}
          render={({ field: formField, fieldState: { error } }) => (
            <CustomComponent
              {...formField}
              {...field.componentProps}
              field={field}
              disabled={formDisabled || fieldState.disabled}
              required={fieldState.required}
              error={error?.message}
            />
          )}
        />
      </div>
    );
  }

  return (
    <div style={gridStyle}>
      <Controller
        name={field.name}
        control={control}
        defaultValue={field.defaultValue}
        render={({ field: formField, fieldState: { error } }) => (
          <FieldByType
            field={field}
            formField={formField}
            error={error?.message}
            disabled={formDisabled || fieldState.disabled}
            required={fieldState.required}
            options={fieldState.options}
          />
        )}
      />
    </div>
  );
}

// ============================================================================
// Field Type Renderers - Integrate with your shadcn components
// ============================================================================

interface FieldByTypeProps {
  field: FieldMetadata;
  formField: {
    value: unknown;
    onChange: (value: unknown) => void;
    onBlur: () => void;
    name: string;
    ref: React.Ref<unknown>;
  };
  error?: string;
  disabled: boolean;
  required: boolean;
  options: FieldOption[];
}

function FieldByType({ field, formField, error, disabled, required, options }: FieldByTypeProps) {
  switch (field.type) {
    case 'text':
    case 'email':
      return (
        <FormField>
          <FormFieldLabel required={required}>{field.label}</FormFieldLabel>
          <Input
            value={formField.value as string | undefined}
            onChange={(e) => formField.onChange(e.target.value)}
            onBlur={formField.onBlur}
            name={formField.name}
            ref={formField.ref as React.Ref<HTMLInputElement>}
            type={field.type}
            placeholder={field.placeholder}
            disabled={disabled}
            aria-label={field.ariaLabel}
          />
          <FormFieldDescription>{field.description}</FormFieldDescription>
          <FormFieldError>{error}</FormFieldError>
        </FormField>
      );

    case 'number':
      return (
        <FormField>
          <FormFieldLabel required={required}>{field.label}</FormFieldLabel>
          <Input
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
            onChange={(e) => formField.onChange(parseFloat(e.target.value))}
          />
          <FormFieldDescription>{field.description}</FormFieldDescription>
          <FormFieldError>{error}</FormFieldError>
        </FormField>
      );

    case 'textarea':
      return (
        <FormField>
          <FormFieldLabel required={required}>{field.label}</FormFieldLabel>
          <Textarea
            value={formField.value as string | undefined}
            onChange={(e) => formField.onChange(e.target.value)}
            onBlur={formField.onBlur}
            name={formField.name}
            ref={formField.ref as React.Ref<HTMLTextAreaElement>}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={field.rows || 4}
          />
          <FormFieldDescription>{field.description}</FormFieldDescription>
          <FormFieldError>{error}</FormFieldError>
        </FormField>
      );

    case 'select':
      return (
        <FormField>
          <FormFieldLabel required={required}>{field.label}</FormFieldLabel>
          <Select
            value={formField.value as string | undefined}
            onValueChange={formField.onChange}
            disabled={disabled}
          >
            <SelectTrigger aria-label={field.label}>
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
          <FormFieldDescription>{field.description}</FormFieldDescription>
          <FormFieldError>{error}</FormFieldError>
        </FormField>
      );

    case 'multiselect':
      return (
        <FormField>
          <FormFieldLabel required={required}>{field.label}</FormFieldLabel>
          <MultiSelect
            selected={(formField.value as string[]) || []}
            onChange={formField.onChange}
            options={options.map((opt) => ({
              label: opt.label,
              value: String(opt.value),
            }))}
            disabled={disabled}
            placeholder={field.placeholder || 'Select items...'}
            emptyMessage="No items found."
            searchPlaceholder="Search..."
            maxSelected={field.maxSelected}
          />
          <FormFieldDescription>{field.description}</FormFieldDescription>
          <FormFieldError>{error}</FormFieldError>
        </FormField>
      );

    case 'checkbox':
      return (
        <FormField>
          <div className="flex items-start space-x-2">
            <Checkbox
              checked={formField.value === true}
              onCheckedChange={(checked) => formField.onChange(checked === true)}
              disabled={disabled}
              id={field.name}
            />
            <div className="space-y-1 leading-none">
              <FormFieldLabel htmlFor={field.name} className="font-normal">
                {field.label}
              </FormFieldLabel>
              <FormFieldDescription>{field.description}</FormFieldDescription>
            </div>
          </div>
          <FormFieldError>{error}</FormFieldError>
        </FormField>
      );

    case 'switch':
      return (
        <FormField>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <FormFieldLabel>{field.label}</FormFieldLabel>
              <FormFieldDescription>{field.description}</FormFieldDescription>
            </div>
            <Switch
              checked={formField.value === true}
              onCheckedChange={(checked) => formField.onChange(checked === true)}
              disabled={disabled}
            />
          </div>
          <FormFieldError>{error}</FormFieldError>
        </FormField>
      );

    case 'radio':
      return (
        <FormField>
          <FormFieldLabel required={required}>{field.label}</FormFieldLabel>
          <RadioGroup
            value={formField.value as string | null | undefined}
            onValueChange={formField.onChange}
            disabled={disabled}
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
          <FormFieldDescription>{field.description}</FormFieldDescription>
          <FormFieldError>{error}</FormFieldError>
        </FormField>
      );

    case 'slider':
      return (
        <SliderField
          field={field}
          formField={formField}
          error={error}
          disabled={disabled}
          required={required}
        />
      );

    case 'date':
      return (
        <FormField>
          <FormFieldLabel required={required}>{field.label}</FormFieldLabel>
          <DatePicker
            value={formField.value as Date | undefined}
            onValueChange={formField.onChange}
            disabled={disabled}
            placeholder={field.placeholder}
          />
          <FormFieldDescription>{field.description}</FormFieldDescription>
          <FormFieldError>{error}</FormFieldError>
        </FormField>
      );

    case 'datetime':
      return (
        <FormField>
          <FormFieldLabel required={required}>{field.label}</FormFieldLabel>
          <DateTimePicker
            value={formField.value as Date | undefined}
            onValueChange={formField.onChange}
            disabled={disabled}
            placeholder={field.placeholder}
            use12Hour={field.use12Hour}
          />
          <FormFieldDescription>{field.description}</FormFieldDescription>
          <FormFieldError>{error}</FormFieldError>
        </FormField>
      );

    case 'file':
      return (
        <FormField>
          <FormFieldLabel required={required}>{field.label}</FormFieldLabel>
          <FileUpload
            accept={field.accept}
            multiple={field.multiple}
            disabled={disabled}
            maxSize={field.maxSize}
            showPreview={field.showPreview}
            onFilesChange={(files) => {
              formField.onChange(field.multiple ? files : files[0]);
            }}
          />
          <FormFieldDescription>{field.description}</FormFieldDescription>
          <FormFieldError>{error}</FormFieldError>
        </FormField>
      );

    default:
      return null;
  }
}

// ============================================================================
// Form Field Wrapper Components
// ============================================================================

// ============================================================================
// Slider field — extracted so it can subscribe to another form field via
// useFormContext().watch() and run an effect to clamp the value when the
// resolved max drops below the current value.
// ============================================================================

interface SliderFieldProps {
  field: SliderFieldMetadata;
  formField: {
    value: unknown;
    onChange: (value: unknown) => void;
    onBlur: () => void;
    name: string;
    ref: React.Ref<unknown>;
  };
  error?: string;
  disabled: boolean;
  required: boolean;
}

function SliderField({ field, formField, error, disabled, required }: SliderFieldProps) {
  const { watch } = useFormContext();
  const watchedMax = field.maxRef ? watch(field.maxRef.fromField) : undefined;
  const resolvedMax = resolveSliderMax(field, watchedMax);

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

  const displayValue = (() => {
    const v = formField.value;
    if (typeof v === 'number') return Math.min(v, resolvedMax);
    return v;
  })();

  return (
    <FormField>
      <div className="flex justify-between">
        <FormFieldLabel required={required}>{field.label}</FormFieldLabel>
        <span className="text-sm text-muted-foreground">{displayValue as React.ReactNode}</span>
      </div>
      <Slider
        value={[(displayValue as number) ?? field.min ?? 0]}
        onValueChange={(values) => formField.onChange(values[0])}
        min={field.min || 0}
        max={resolvedMax}
        step={field.step || 1}
        disabled={disabled}
      />
      <FormFieldDescription>{field.description}</FormFieldDescription>
      <FormFieldError>{error}</FormFieldError>
    </FormField>
  );
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
