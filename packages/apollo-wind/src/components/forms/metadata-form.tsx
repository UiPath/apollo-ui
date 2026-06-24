import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { type FieldValues, FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  TabbedFormSchema,
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
  /**
   * @deprecated Tabs are now declared in the schema. Use a `TabbedFormSchema`
   * (`tabs` + `section.tab`) instead of `steps` + `stepVariant="tabs"`. This prop
   * only affects `MultiStepFormSchema` (`steps`) and will be removed in the next major.
   *
   * `'wizard'` (default) shows Previous/Next navigation with a Submit on the final
   * step. `'tabs'` renders the steps as a tab bar over a single shared form instance.
   */
  stepVariant?: 'wizard' | 'tabs';
  /**
   * Render override for a `TabbedFormSchema`. `'tabbed'` (default) renders the tab
   * bar; `'flat'` ignores the tab grouping and renders every section in one flat
   * list (e.g. a wide dialog that wants the full form at a glance). Ignored for
   * single-page and multi-step schemas.
   */
  layout?: 'tabbed' | 'flat';
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
  stepVariant = 'wizard',
  layout = 'tabbed',
}: MetadataFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [customComponents, setCustomComponents] = useState<
    Record<string, React.ComponentType<CustomFieldComponentProps>>
  >({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Build Zod schema from metadata
  const zodSchema = useMemo(() => buildZodSchema(schema), [schema]);

  // Initialize React Hook Form
  const form = useForm<FieldValues>({
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

  // A tabbed schema (`tabs` + `section.tab`) renders a tab bar unless the caller
  // overrides with layout="flat" (e.g. a wide dialog wanting the full form flat).
  const isTabbed = 'tabs' in schema && Array.isArray(schema.tabs) && layout !== 'flat';

  // Render based on form structure
  const renderContent = () => {
    if (isTabbed) {
      return (
        <TabbedSections
          schema={schema as TabbedFormSchema}
          context={context}
          customComponents={customComponents}
          disabled={disabled}
          onReset={() => reset()}
        />
      );
    }

    if (schema.steps) {
      if (stepVariant === 'tabs') {
        return (
          <TabbedStepForm
            schema={schema}
            context={context}
            customComponents={customComponents}
            disabled={disabled}
            onReset={() => reset()}
          />
        );
      }
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

        {/* Wizard owns its own navigation/Submit; tabbed forms (steps-as-tabs or
            schema tabs) render FormActions inside their tab renderer so it is
            suppressed when no tab is visible. Everything else renders it here. */}
        {!schema.steps && !isTabbed && (
          <FormActions schema={schema} context={context} onReset={() => reset()} />
        )}
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

/** A tab and the sections it renders. Built from `steps` or from `tabs` + `section.tab`. */
interface TabGroup {
  id: string;
  title: string;
  sections: FormSectionType[];
  conditions?: FieldCondition[];
}

interface TabbedFormCoreProps {
  groups: TabGroup[];
  schema: FormSchema;
  context: FormContext;
  customComponents: Record<string, React.ComponentType<CustomFieldComponentProps>>;
  disabled?: boolean;
  onReset: () => void;
  /**
   * When true, sections render with tab-hosted headers (the tab is the
   * container): a lone section in a tab is headerless, sibling sections keep a
   * plain heading. The schema-driven `TabbedFormSchema` path opts in; the
   * deprecated steps-as-tabs path leaves it off to preserve its accordion look.
   */
  tabSectionHeaders?: boolean;
}

/**
 * Shared tab renderer for both the (deprecated) steps-as-tabs path and the
 * schema-driven `TabbedFormSchema` path. Renders one tab per group, hides
 * groups with no visible section, clamps the active tab to a visible one, and
 * owns FormActions so the Submit is suppressed when no tab is visible.
 */
function TabbedFormCore({
  groups,
  schema,
  context,
  customComponents,
  disabled,
  onReset,
  tabSectionHeaders = false,
}: TabbedFormCoreProps) {
  const visibleSection = (section: FormSectionType) =>
    !section.conditions || context.evaluateConditions(section.conditions);

  // A group renders only when its own conditions pass AND it has at least one
  // visible section, so an empty/conditioned tab never shows.
  const visibleGroups = groups.filter(
    (group) =>
      (!group.conditions || context.evaluateConditions(group.conditions)) &&
      group.sections.some(visibleSection)
  );

  // Clamp the active tab to a still-visible group so a group that disappears
  // (condition flips, manifest swap) can't strand the form on a dead tab.
  const [activeTab, setActiveTab] = useState<string>('');
  const currentTab = visibleGroups.some((group) => group.id === activeTab)
    ? activeTab
    : (visibleGroups[0]?.id ?? '');

  // Persist the clamp into state: once a selected group disappears we settle on
  // the fallback, so a later reappearance doesn't snap the user back to it.
  useEffect(() => {
    if (activeTab !== currentTab) setActiveTab(currentTab);
  }, [activeTab, currentTab]);

  if (visibleGroups.length === 0) return null;

  // Render one group's sections with the tab header rule: a lone section is
  // headerless (the tab/heading is implied), siblings each keep a plain heading.
  const renderGroupSections = (group: TabGroup) => {
    const sectionsToRender = group.sections.filter(visibleSection);
    const variant: 'auto' | 'plain' | 'hidden' = !tabSectionHeaders
      ? 'auto'
      : sectionsToRender.length > 1
        ? 'plain'
        : 'hidden';
    return sectionsToRender.map((section) => (
      <FormSection
        key={section.id}
        section={section}
        context={context}
        customComponents={customComponents}
        disabled={disabled}
        headerVariant={variant}
      />
    ));
  };

  // A single visible group is not worth a tab bar: render its sections directly
  // (still de-accordioned via the header rule), so a simple node — e.g. a trigger
  // whose only sections are General + Update variable — looks consistent with
  // tabbed nodes instead of falling back to accordions.
  if (visibleGroups.length === 1) {
    return (
      <>
        <div className="flex flex-col gap-5">{renderGroupSections(visibleGroups[0])}</div>
        <FormActions schema={schema} context={context} onReset={onReset} />
      </>
    );
  }

  return (
    <>
      <Tabs value={currentTab} onValueChange={setActiveTab} className="flex flex-col gap-4">
        {/* Underline tabs (properties-panel style), overriding the primitive's
          default segmented/pill look. Scoped here so the shared Tabs primitive
          stays segmented for other consumers. */}
        {/* Horizontal scroll when the tabs overflow a narrow panel (scrollbar hidden; tabs
          stay on one line instead of clipping). The underline can optionally bleed past the
          form's horizontal padding to the panel edges: a consumer sets `--mf-content-inset`
          to its content inset and the list bleeds by that, re-insetting the labels. Default
          0 keeps the underline at content width, correct for any padding. */}
        <TabsList className="h-auto justify-start gap-4 overflow-x-auto rounded-none border-b border-border bg-transparent py-0 text-muted-foreground [-ms-overflow-style:none] [margin-inline:calc(var(--mf-content-inset,0px)*-1)] [padding-inline:var(--mf-content-inset,0px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleGroups.map((group) => (
            <TabsTrigger
              key={group.id}
              value={group.id}
              className="-mb-px shrink-0 whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-1 pb-2 pt-1 font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {group.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {visibleGroups.map((group) => (
          <TabsContent key={group.id} value={group.id} className="space-y-5">
            {renderGroupSections(group)}
          </TabsContent>
        ))}
      </Tabs>
      <FormActions schema={schema} context={context} onReset={onReset} />
    </>
  );
}

interface TabbedStepFormProps extends SinglePageFormProps {
  onReset: () => void;
}

/**
 * @deprecated Steps-as-tabs. Use a `TabbedFormSchema` instead. Kept so existing
 * `steps` + `stepVariant="tabs"` consumers keep working until the next major.
 */
function TabbedStepForm({
  schema,
  context,
  customComponents,
  disabled,
  onReset,
}: TabbedStepFormProps) {
  const groups: TabGroup[] = (schema.steps || []).map((step) => ({
    id: step.id,
    title: step.title,
    sections: step.sections,
    conditions: step.conditions,
  }));

  return (
    <TabbedFormCore
      groups={groups}
      schema={schema}
      context={context}
      customComponents={customComponents}
      disabled={disabled}
      onReset={onReset}
    />
  );
}

interface TabbedSectionsProps {
  schema: TabbedFormSchema;
  context: FormContext;
  customComponents: Record<string, React.ComponentType<CustomFieldComponentProps>>;
  disabled?: boolean;
  onReset: () => void;
}

/**
 * Schema-driven tabs: groups a flat `sections` list into the tabs declared in
 * `schema.tabs` (array order = render order) via each `section.tab`. Sections
 * with no `tab`, or a `tab` matching no declared tab, fall into the first tab.
 */
function TabbedSections({
  schema,
  context,
  customComponents,
  disabled,
  onReset,
}: TabbedSectionsProps) {
  const tabIds = new Set(schema.tabs.map((tab) => tab.id));
  const firstTabId = schema.tabs[0]?.id;

  const sectionsByTab = new Map<string, FormSectionType[]>();
  for (const section of schema.sections) {
    if (process.env.NODE_ENV !== 'production' && section.tab && !tabIds.has(section.tab)) {
      console.warn(
        `[MetadataForm] section "${section.id}" references unknown tab "${section.tab}"; falling back to the first tab.`
      );
    }
    const targetTab = section.tab && tabIds.has(section.tab) ? section.tab : firstTabId;
    if (!targetTab) continue;
    const bucket = sectionsByTab.get(targetTab);
    if (bucket) bucket.push(section);
    else sectionsByTab.set(targetTab, [section]);
  }

  const groups: TabGroup[] = schema.tabs.map((tab) => ({
    id: tab.id,
    title: tab.title,
    conditions: tab.conditions,
    sections: sectionsByTab.get(tab.id) ?? [],
  }));

  return (
    <TabbedFormCore
      groups={groups}
      schema={schema}
      context={context}
      customComponents={customComponents}
      disabled={disabled}
      onReset={onReset}
      tabSectionHeaders
    />
  );
}

interface FormSectionProps {
  section: FormSectionType;
  context: FormContext;
  customComponents: Record<string, React.ComponentType<CustomFieldComponentProps>>;
  disabled?: boolean;
  /**
   * How the section header renders.
   * - `'auto'` (default): accordion when `collapsible`, else a bordered titled box,
   *   else (no title) a bare field grid. This is the single-page / wizard look.
   * - `'plain'`: a lightweight non-collapsible heading with no border box, for a
   *   section that shares a tab with sibling sections (e.g. Inputs / Outputs).
   * - `'hidden'`: no header at all (a lone section in a tab; the tab label is the
   *   heading), rendered as a bare field grid.
   */
  headerVariant?: 'auto' | 'plain' | 'hidden';
}

function FormSection({
  section,
  context,
  customComponents,
  disabled,
  headerVariant = 'auto',
}: FormSectionProps) {
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

  // Tab-hosted sections: the tab is the container, so we drop the accordion chrome.
  // A lone section in a tab needs no header (the tab label is the heading); a
  // section sharing a tab keeps a plain (borderless, non-collapsible) heading.
  if (headerVariant === 'hidden' || !section.title) {
    return fieldsGrid;
  }
  if (headerVariant === 'plain') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
          {section.description && (
            <p className="text-sm text-muted-foreground">{section.description}</p>
          )}
        </div>
        {fieldsGrid}
      </div>
    );
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
