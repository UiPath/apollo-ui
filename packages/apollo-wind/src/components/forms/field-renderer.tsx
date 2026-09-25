import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import type { BooleanRadioGroupStrings } from '@/components/ui/boolean-radio-group';
import {
  FormField,
  FormFieldDescription,
  FormFieldError,
  FormFieldLabel,
} from '@/components/ui/form-field';
import { deepEqual } from '@/lib';
import { DataFetcher } from './data-fetcher';
import {
  clampSliderValue,
  FieldControl,
  type FieldControlFormField,
  useSliderMax,
} from './field-control';
import type {
  CustomComponents,
  FieldMetadata,
  FieldOption,
  FormContext,
  SliderFieldMetadata,
} from './form-schema';
import { hasOptions, isCustomField } from './form-schema';
import { ModeAwareField } from './mode-aware-field';
import { RulesEngine } from './rules-engine';
import { StringListField } from './string-list-field';
import { isFieldControlRegistration, literalValues } from './value-modes';

/**
 * Field Renderer - Connects metadata to actual UI components
 * Integrates with shadcn/ui components from apollo-wind
 */

interface FormFieldRendererProps {
  field: FieldMetadata;
  context: FormContext;
  customComponents: CustomComponents;
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

  // What rules and data sources read: fields with value modes by their literal value.
  const readValues = useCallback(
    () =>
      literalValues(getValues(), contextRef.current.schema, contextRef.current.valueModes?.codecs),
    [getValues]
  );

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
    const allValues = readValues();
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
    const allValues = readValues();
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

    const allValues = readValues();
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
  }, [field.rules, field.validation?.required, readValues, watchedRuleDependentValues]);

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
        const allValues = readValues();
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
  }, [field.dataSource, field.name, readValues, watchedDataSourceValues]);

  // Don't render if hidden by rules
  if (!fieldState.visible) {
    return null;
  }

  // Grid styling - use inline styles to avoid Tailwind dynamic class issues
  const gridSpan = field.grid?.span || 1;
  const gridStyle: React.CSSProperties = { gridColumn: `span ${gridSpan}` };

  // A changed field (e.g. an agent edit in a diff view) gets a warning accent, matching the
  // canvas `update` status, plus a screen-reader label. `data-field-name` lets a host find it.
  const isChanged = context.changedFields?.has(field.name) ?? false;
  const wrapperProps = {
    style: gridStyle,
    className: isChanged
      ? '-ml-2 rounded-md border-l-2 border-warning bg-warning-background/30 pl-1.5'
      : undefined,
    'data-field-name': field.name,
    'data-changed': isChanged || undefined,
  };
  const changedNote = isChanged ? (
    <span className="sr-only">{context.changedFieldLabel ?? 'Changed'}</span>
  ) : null;

  // Value modes or field actions: the field anatomy, custom fields included.
  if (field.valueModes || field.headerActions || field.menuActions || field.badge) {
    return (
      <div {...wrapperProps}>
        {changedNote}
        <ModeAwareField
          field={field}
          context={context}
          customComponents={customComponents}
          disabled={formDisabled || fieldState.disabled}
          required={fieldState.required}
          options={fieldState.options}
        />
      </div>
    );
  }

  // Custom component renderer
  const customEntry = isCustomField(field) ? customComponents[field.component] : undefined;
  if (isCustomField(field) && customEntry) {
    const CustomComponent = isFieldControlRegistration(customEntry)
      ? customEntry.component
      : customEntry;
    return (
      <div {...wrapperProps}>
        {changedNote}
        <Controller
          name={field.name}
          control={control}
          defaultValue={field.defaultValue}
          // `ref` is destructured away: custom components are plain function components
          // (CustomFieldComponentProps declares no ref), and spreading the Controller's ref
          // onto one triggers React's function-component ref warning.
          render={({ field: { ref: _ref, ...formField }, fieldState: { error } }) => (
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
    <div {...wrapperProps}>
      {changedNote}
      <Controller
        name={field.name}
        control={control}
        defaultValue={field.defaultValue}
        render={({ field: formField, fieldState: { error } }) => (
          <BuiltInField
            field={field}
            formField={formField}
            error={error?.message}
            disabled={formDisabled || fieldState.disabled}
            required={fieldState.required}
            options={fieldState.options}
            strings={context.strings?.boolean}
          />
        )}
      />
    </div>
  );
}

// ============================================================================
// Built-in field types — each type's FieldControl with its label, description and error.
// ============================================================================

interface BuiltInFieldProps {
  field: FieldMetadata;
  formField: FieldControlFormField;
  error?: string;
  disabled: boolean;
  required: boolean;
  options: FieldOption[];
  strings?: Partial<BooleanRadioGroupStrings>;
}

function BuiltInField({
  field,
  formField,
  error,
  disabled,
  required,
  options,
  strings,
}: BuiltInFieldProps) {
  const control = (
    <FieldControl
      field={field}
      formField={formField}
      options={options}
      disabled={disabled}
      invalid={!!error}
      strings={strings}
    />
  );

  switch (field.type) {
    case 'checkbox':
      return (
        <FormField>
          <div className="flex items-start space-x-2">
            {control}
            <div className="space-y-1 leading-none">
              <FormFieldLabel
                htmlFor={field.name}
                tooltip={field.tooltip}
                tooltipAriaLabel={field.tooltipAriaLabel}
                className="font-normal"
              >
                {field.label}
              </FormFieldLabel>
              <FormFieldDescription>{field.description}</FormFieldDescription>
            </div>
          </div>
          <FormFieldError id={`${field.name}-error`}>{error}</FormFieldError>
        </FormField>
      );

    case 'switch':
      return (
        <FormField>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <FormFieldLabel
                htmlFor={field.name}
                required={required}
                tooltip={field.tooltip}
                tooltipAriaLabel={field.tooltipAriaLabel}
              >
                {field.label}
              </FormFieldLabel>
              <FormFieldDescription>{field.description}</FormFieldDescription>
            </div>
            {control}
          </div>
          <FormFieldError id={`${field.name}-error`}>{error}</FormFieldError>
        </FormField>
      );

    case 'slider':
      return (
        <FormField>
          <div className="flex justify-between">
            <FormFieldLabel
              id={`${field.name}-label`}
              required={required}
              tooltip={field.tooltip}
              tooltipAriaLabel={field.tooltipAriaLabel}
            >
              {field.label}
            </FormFieldLabel>
            <SliderValue field={field} value={formField.value} />
          </div>
          {control}
          <FormFieldDescription>{field.description}</FormFieldDescription>
          <FormFieldError id={`${field.name}-error`}>{error}</FormFieldError>
        </FormField>
      );

    case 'string-list':
      return (
        <StringListField
          field={field}
          inputRef={formField.ref as React.Ref<HTMLTextAreaElement>}
          value={formField.value as string[] | undefined}
          onChange={formField.onChange}
          onBlur={formField.onBlur}
          error={error}
          disabled={disabled}
          required={required}
        />
      );

    case 'custom':
      return null;

    default:
      return (
        <FormField>
          {/* Radio, boolean and datetime controls have no single labelable element, so they
              name themselves from the label's id instead. The option labels name individual radios;
              without this the group itself has no accessible name. */}
          <FormFieldLabel
            {...(field.type === 'radio' || field.type === 'boolean' || field.type === 'datetime'
              ? { id: `${field.name}-label` }
              : { htmlFor: field.name })}
            required={required}
            tooltip={field.tooltip}
            tooltipAriaLabel={field.tooltipAriaLabel}
          >
            {field.label}
          </FormFieldLabel>
          {control}
          <FormFieldDescription>{field.description}</FormFieldDescription>
          <FormFieldError id={`${field.name}-error`}>{error}</FormFieldError>
        </FormField>
      );
  }
}

/** The slider's current value beside its label, capped at the max the control clamps to. */
function SliderValue({ field, value }: { field: SliderFieldMetadata; value: unknown }) {
  const displayValue = clampSliderValue(value, useSliderMax(field));
  return <span className="text-sm text-muted-foreground">{displayValue as React.ReactNode}</span>;
}
