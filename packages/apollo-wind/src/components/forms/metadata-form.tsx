import React, { useEffect, useMemo, useRef, useState } from 'react';

import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod/v4';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';

import { DataFetcher } from './data-fetcher';
import { FormFieldRenderer } from './field-renderer';
import type {
  CustomFieldComponentProps,
  DataSource,
  FieldCondition,
  FieldOption,
  FormContext,
  FormPlugin,
  FormSchema,
  FormSection as FormSectionType,
} from './form-schema';
import { RulesEngine } from './rules-engine';
import { validationConfigToZod } from './validation-converter';

/**
 * Core MetadataForm Component
 * Renders forms from JSON/object schema with full RHF integration
 */

interface MetadataFormProps {
  schema: FormSchema;
  plugins?: FormPlugin[];
  onSubmit?: (data: unknown) => void | Promise<void>;
  className?: string;
  disabled?: boolean;
  /** Disable browser autocomplete suggestions. Defaults to undefined (browser default). */
  autoComplete?: 'off' | 'on';
}

// Stable default to prevent re-renders
const DEFAULT_PLUGINS: FormPlugin[] = [];

export function MetadataForm({
  schema,
  plugins = DEFAULT_PLUGINS,
  onSubmit,
  className,
  disabled = false,
  autoComplete,
}: MetadataFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [customComponents, setCustomComponents] = useState<
    Record<string, React.ComponentType<CustomFieldComponentProps>>
  >({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Build Zod schema from metadata
  const zodSchema = useMemo(() => buildZodSchema(schema), [schema]);

  // Initialize React Hook Form
  const form = useForm({
    resolver: standardSchemaResolver(zodSchema),
    mode: schema.mode || 'onSubmit',
    reValidateMode: schema.reValidateMode || 'onChange',
  });

  const { watch, handleSubmit, reset } = form;

  // Use ref to store values - prevents context recreation on every render
  const valuesRef = useRef<Record<string, unknown>>({});
  // This watch() triggers re-renders but we store in ref for stable context access
  const watchedValues = watch();
  valuesRef.current = watchedValues;

  // Build form context - STABLE reference (values accessed via ref/getters)
  const context: FormContext = useMemo(
    () => ({
      schema,
      form,
      // Use getter to always return latest values without recreating context
      get values() {
        return valuesRef.current;
      },
      get errors() {
        return form.formState.errors;
      },
      get isSubmitting() {
        return form.formState.isSubmitting;
      },
      get isDirty() {
        return form.formState.isDirty;
      },
      currentStep: schema.steps ? currentStep : undefined,

      evaluateConditions: (conditions: FieldCondition[]) =>
        RulesEngine.evaluateConditions(conditions, valuesRef.current, 'AND'),

      fetchData: async (source: DataSource) => {
        const result = await DataFetcher.fetch(source, valuesRef.current);
        return result as FieldOption[];
      },

      registerCustomComponent: (
        name: string,
        component: React.ComponentType<CustomFieldComponentProps>
      ) => {
        setCustomComponents((prev) => ({ ...prev, [name]: component }));
      },
    }),
    [schema, form, currentStep]
  );

  // Ref for context to use in useEffects without causing dependency loops
  const contextRef = useRef(context);
  contextRef.current = context;

  // Initialize form - runs once on mount only
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs once on mount - use key prop to reinitialize with new schema
  useEffect(() => {
    // Guard: only initialize once (use key prop to reinitialize with new schema)
    if (isInitialized) return;

    const initializeForm = async () => {
      // Load initial data
      if (schema.initialData) {
        const data = await loadInitialData(schema.initialData, contextRef.current);
        reset(data);
      }

      // Plugin initialization
      for (const plugin of plugins) {
        await plugin.onFormInit?.(contextRef.current);
      }

      setIsInitialized(true);
    };

    initializeForm();
  }, [isInitialized]);

  // Watch for field changes and execute plugin hooks
  useEffect(() => {
    if (!isInitialized) return;

    const subscription = watch((value, { name }) => {
      if (name) {
        // Update valuesRef with the latest values BEFORE calling plugins
        // This ensures context.values returns current data, not stale data
        valuesRef.current = value as Record<string, unknown>;

        // Plugin field change hooks
        plugins.forEach((plugin) => {
          plugin.onValueChange?.(name, value[name], contextRef.current);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, isInitialized, plugins]);

  // Handle form submission
  const handleFormSubmit = handleSubmit(async (data) => {
    // Plugin submit hooks
    let finalData = data;
    for (const plugin of plugins) {
      if (plugin.onSubmit) {
        finalData = (await plugin.onSubmit(finalData, context)) || finalData;
      }
    }

    // Execute submit
    if (onSubmit) {
      await onSubmit(finalData);
    }
  });

  // Render based on form structure
  const renderContent = () => {
    if (schema.steps) {
      return (
        <MultiStepForm
          schema={schema}
          context={context}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          customComponents={customComponents}
          disabled={disabled}
        />
      );
    }

    return (
      <SinglePageForm
        schema={schema}
        context={context}
        customComponents={customComponents}
        disabled={disabled}
      />
    );
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleFormSubmit} className={className} autoComplete={autoComplete}>
        {renderContent()}

        {/* Only render FormActions for single-page forms - multi-step forms have their own navigation */}
        {!schema.steps && <FormActions schema={schema} context={context} onReset={() => reset()} />}
      </form>
    </FormProvider>
  );
}

// ============================================================================
// Supporting Components
// ============================================================================

interface SinglePageFormProps {
  schema: FormSchema;
  context: FormContext;
  customComponents: Record<string, React.ComponentType<CustomFieldComponentProps>>;
  disabled?: boolean;
}

function SinglePageForm({ schema, context, customComponents, disabled }: SinglePageFormProps) {
  const sections = schema.sections || [];

  // Filter visible sections
  const visibleSections = sections.filter(
    (section) => !section.conditions || context.evaluateConditions(section.conditions)
  );

  return (
    <div className="space-y-2">
      {visibleSections.map((section) => (
        <FormSection
          key={section.id}
          section={section}
          context={context}
          customComponents={customComponents}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

interface MultiStepFormProps extends SinglePageFormProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

function MultiStepForm({
  schema,
  context,
  currentStep,
  setCurrentStep,
  customComponents,
  disabled,
}: MultiStepFormProps) {
  const steps = schema.steps || [];
  const step = steps[currentStep];

  if (!step) return null;

  // Evaluate step conditions
  if (step.conditions && !context.evaluateConditions(step.conditions)) {
    // Auto-skip hidden steps
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{step.title}</h2>
          {step.description && <p className="text-muted-foreground mt-1">{step.description}</p>}
        </div>
        <div className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>

      {/* Step content */}
      <div className="space-y-2">
        {step.sections.map((section) => (
          <FormSection
            key={section.id}
            section={section}
            context={context}
            customComponents={customComponents}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Step navigation */}
      <div className="flex justify-between pt-6">
        <Button
          type="button"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          variant="secondary"
        >
          Previous
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button type="button" onClick={() => setCurrentStep(currentStep + 1)} variant="default">
            Next
          </Button>
        ) : (
          <Button type="submit" variant="default">
            Submit
          </Button>
        )}
      </div>
    </div>
  );
}

interface FormSectionProps {
  section: FormSectionType;
  context: FormContext;
  customComponents: Record<string, React.ComponentType<CustomFieldComponentProps>>;
  disabled?: boolean;
}

function FormSection({ section, context, customComponents, disabled }: FormSectionProps) {
  const gridColumns = context.schema.layout?.columns || 1;
  const gap = context.schema.layout?.gap || 4;

  const fieldsGrid = (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
        gap: `${gap * 0.25}rem`,
      }}
    >
      {section.fields.map((field) => (
        <FormFieldRenderer
          key={field.name}
          field={field}
          context={context}
          customComponents={customComponents}
          disabled={disabled}
        />
      ))}
    </div>
  );

  // If no title, render fields directly without wrapper
  if (!section.title) {
    return fieldsGrid;
  }

  // Shared inner content (without padding - wrapper handles that)
  const innerContent = (
    <div className="flex flex-col gap-4">
      {section.description && (
        <p className="text-sm text-muted-foreground">{section.description}</p>
      )}
      {fieldsGrid}
    </div>
  );

  // If collapsible, wrap in Accordion
  if (section.collapsible) {
    const defaultValue = section.defaultExpanded !== false ? [section.id] : [];

    return (
      <Accordion type="multiple" defaultValue={defaultValue}>
        <AccordionItem value={section.id} className="border rounded-lg px-3">
          <AccordionTrigger className="text-sm font-medium">{section.title}</AccordionTrigger>
          {/* AccordionContent adds pb-4 pt-0 wrapper internally */}
          <AccordionContent>{innerContent}</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  // Non-collapsible section - match AccordionItem/Trigger/Content structure exactly
  return (
    <div className="border rounded-lg px-3">
      {/* Match AccordionPrimitive.Header + Trigger structure */}
      <div className="flex">
        <div className="flex flex-1 items-center justify-between py-4 text-sm font-medium">
          {section.title}
        </div>
      </div>
      {/* Match AccordionContent: outer has text-sm, inner has pb-4 pt-0 */}
      <div className="text-sm">
        <div className="pb-4 pt-0">{innerContent}</div>
      </div>
    </div>
  );
}

interface FormActionsProps {
  schema: FormSchema;
  context: FormContext;
  onReset: () => void;
}

function FormActions({ schema, context, onReset }: FormActionsProps) {
  const actions = schema.actions || [
    {
      id: 'submit',
      type: 'submit' as const,
      label: 'Submit',
      variant: 'default' as const,
    },
  ];

  // Don't render anything if no actions
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 pt-6">
      {actions.map((action) => {
        // Evaluate action conditions
        if (action.conditions && !context.evaluateConditions(action.conditions)) {
          return null;
        }

        if (action.type === 'reset') {
          return (
            <Button
              key={action.id}
              type="button"
              onClick={onReset}
              variant={action.variant || 'secondary'}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          );
        }

        return (
          <Button
            key={action.id}
            type={action.type === 'submit' ? 'submit' : 'button'}
            variant={action.variant || 'default'}
            disabled={action.disabled || (action.type === 'submit' && context.isSubmitting)}
          >
            {action.loading && context.isSubmitting ? 'Loading...' : action.label}
          </Button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Build a Zod schema from form metadata
 *
 * Converts ValidationConfig to Zod schemas for each field.
 * Falls back to type-based inference for fields without explicit validation.
 * Adds dynamic validation for conditional required fields using superRefine.
 */
function buildZodSchema(schema: FormSchema): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  const fields = schema.steps
    ? schema.steps.flatMap((step) => step.sections.flatMap((s) => s.fields))
    : schema.sections?.flatMap((s) => s.fields) || [];

  // Track fields that need dynamic validation:
  // 1. Fields with conditional required rules
  // 2. Fields with static required + conditional visibility (shouldn't validate when hidden)
  const dynamicValidationFields: Array<{
    name: string;
    rules: NonNullable<(typeof fields)[0]['rules']>;
    staticRequired: boolean;
    customRequiredMessage?: string;
  }> = [];

  fields.forEach((field) => {
    // Check if field has unconditional required rule
    const hasUnconditionalRequired = field.rules?.some(
      (rule) => rule.effects.required === true && rule.conditions.length === 0
    );

    // Check if field has conditional required rule (with conditions)
    const hasConditionalRequired = field.rules?.some(
      (rule) => rule.effects.required === true && rule.conditions.length > 0
    );

    // Check if field has visibility rules (show/hide)
    const hasVisibilityRules = field.rules?.some((rule) => rule.effects.visible !== undefined);

    // Check if field has static required via validation config
    const hasStaticRequired = field.validation?.required === true;

    // Any form of "required" (static, unconditional rule, or conditional rule)
    const hasAnyRequired = hasStaticRequired || hasUnconditionalRequired || hasConditionalRequired;

    // Track for dynamic validation if field has BOTH:
    // - Any form of required, AND
    // - Visibility rules (need to skip validation when hidden)
    // OR if field has conditional required rules (required state depends on other fields)
    if (field.rules && (hasConditionalRequired || (hasAnyRequired && hasVisibilityRules))) {
      dynamicValidationFields.push({
        name: field.name,
        rules: field.rules,
        staticRequired: hasStaticRequired || hasUnconditionalRequired || false,
        customRequiredMessage: field.validation?.messages?.required,
      });
    }

    // Build validation config, merging with required from rules
    // Only include required in base schema if field is ALWAYS visible AND has unconditional required
    // Fields with visibility rules must have required handled by superRefine
    const shouldIncludeRequiredInBase =
      (hasUnconditionalRequired || hasStaticRequired) && !hasVisibilityRules;

    const validationConfig = field.validation
      ? { ...field.validation, required: shouldIncludeRequiredInBase }
      : shouldIncludeRequiredInBase
        ? { required: true }
        : undefined;

    // Convert to Zod schema using the converter
    shape[field.name] = validationConfigToZod(validationConfig, field.type);
  });

  const baseSchema = z.object(shape);

  // If no fields need dynamic validation, return base schema
  if (dynamicValidationFields.length === 0) {
    return baseSchema;
  }

  // Add dynamic validation for conditional required fields
  // Cast to maintain type compatibility with zodResolver
  return baseSchema.superRefine((data, ctx) => {
    const values = data as Record<string, unknown>;

    for (const { name, rules, staticRequired, customRequiredMessage } of dynamicValidationFields) {
      // Check if field is currently visible
      const isVisible = RulesEngine.isFieldVisible(rules, values);

      // If field is hidden, skip all required validation
      if (!isVisible) {
        continue;
      }

      // Evaluate rules to check required state
      const ruleResult = RulesEngine.applyRules(rules, values, {} as FormContext);

      // Field is required if:
      // 1. Rule sets required: true, OR
      // 2. Field has static validation.required and is visible
      const isRequired = ruleResult.required === true || staticRequired;

      if (isRequired) {
        const value = values[name];
        const isEmpty =
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0);

        if (isEmpty) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: customRequiredMessage || 'This field is required',
            path: [name],
          });
        }
      }
    }
  }) as unknown as z.ZodObject<Record<string, z.ZodTypeAny>>;
}

async function loadInitialData(
  initialData: FormSchema['initialData'],
  _context: FormContext
): Promise<Record<string, unknown>> {
  if (!initialData) return {};
  // If initialData is a simple object, return it directly
  return initialData;
}
