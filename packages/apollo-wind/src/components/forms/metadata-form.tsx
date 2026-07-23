import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { type FieldValues, FormProvider, useForm, useFormState } from 'react-hook-form';
import { z } from 'zod/v4';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ScrollableTabsList, Tabs, TabsContent, TabsTrigger } from '@/components/ui/tabs';

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
  /**
   * Presentation for multi-step schemas. `'wizard'` (default) shows Previous/Next
   * navigation with a Submit button on the final step. `'tabs'` renders the steps
   * as a tab bar over a single form instance, so values and validation are shared
   * across every step. Ignored for single-page (`sections`) schemas.
   */
  stepVariant?: 'wizard' | 'tabs';
  /**
   * Visual treatment for each titled section. `'card'` (default) wraps every
   * section in a bordered, rounded, horizontally-padded box. `'plain'` drops the
   * border, rounding, and horizontal padding so sections read as flush headers
   * over their content, separated by a full-width hairline divider between
   * consecutive sections — used by hosts (e.g. the canvas properties panel) that
   * already frame the form and want a borderless list. Applies to both
   * collapsible (accordion) and non-collapsible sections across every layout
   * (single-page, wizard, tabs).
   */
  sectionVariant?: 'card' | 'plain';
  /**
   * Controlled active step id for the `tabs` step variant. When provided the
   * caller owns which tab is selected — persist it across remounts to keep the
   * user on the same tab when switching between nodes. If the id isn't one of
   * the currently visible steps, the form shows the first tab without mutating
   * the caller's value. Omit for uncontrolled (internal) tab state.
   */
  activeStepId?: string;
  /**
   * Fires with the step id whenever the user selects a tab, in both controlled
   * and uncontrolled mode. Pair it with `activeStepId` to persist the selection.
   */
  onActiveStepChange?: (stepId: string) => void;
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
  sectionVariant = 'card',
  activeStepId,
  onActiveStepChange,
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

  // Render based on form structure
  const renderContent = () => {
    if (schema.steps) {
      if (stepVariant === 'tabs') {
        return (
          <TabbedStepForm
            schema={schema}
            context={context}
            customComponents={customComponents}
            disabled={disabled}
            sectionVariant={sectionVariant}
            activeStepId={activeStepId}
            onActiveStepChange={onActiveStepChange}
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
          sectionVariant={sectionVariant}
        />
      );
    }

    return (
      <SinglePageForm
        schema={schema}
        context={context}
        customComponents={customComponents}
        disabled={disabled}
        sectionVariant={sectionVariant}
      />
    );
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleFormSubmit} className={className} autoComplete={autoComplete}>
        {renderContent()}

        {/* Wizard forms own their navigation/Submit, and tabbed forms render
            FormActions inside TabbedStepForm so it's suppressed when no tab is
            visible. Only single-page forms render FormActions here. */}
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
  sectionVariant?: 'card' | 'plain';
}

function SinglePageForm({
  schema,
  context,
  customComponents,
  disabled,
  sectionVariant,
}: SinglePageFormProps) {
  const sections = schema.sections || [];

  // Filter visible sections
  const visibleSections = sections.filter(
    (section) => !section.conditions || context.evaluateConditions(section.conditions)
  );

  return (
    // Plain sections carry their own vertical rhythm (py-4 + divider), so the
    // list adds no extra gap; card sections are spaced apart as separate boxes.
    <div className={sectionVariant === 'plain' ? undefined : 'space-y-2'}>
      {visibleSections.map((section) => (
        <FormSection
          key={section.id}
          section={section}
          context={context}
          customComponents={customComponents}
          disabled={disabled}
          sectionVariant={sectionVariant}
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
  sectionVariant,
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

      {/* Step content (plain sections carry their own rhythm, see SinglePageForm) */}
      <div className={sectionVariant === 'plain' ? undefined : 'space-y-2'}>
        {step.sections.map((section) => (
          <FormSection
            key={section.id}
            section={section}
            context={context}
            customComponents={customComponents}
            disabled={disabled}
            sectionVariant={sectionVariant}
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

interface TabbedStepFormProps extends SinglePageFormProps {
  onReset: () => void;
  activeStepId?: string;
  onActiveStepChange?: (stepId: string) => void;
}

function TabbedStepForm({
  schema,
  context,
  customComponents,
  disabled,
  sectionVariant,
  onReset,
  activeStepId,
  onActiveStepChange,
}: TabbedStepFormProps) {
  const steps = schema.steps || [];

  // Hide steps whose conditions evaluate to false, or that would render nothing:
  // a step needs at least one *currently visible* section (sections hidden by
  // their own `section.conditions` don't count, matching the render path and the
  // error-count walk below) or an `emptyState` message. A step with an
  // `emptyState` stays in the tab bar even while empty (e.g. an always-shown
  // "Parameters" tab) and renders that message in place of its sections.
  const visibleSteps = steps.filter((step) => {
    if (step.conditions && !context.evaluateConditions(step.conditions)) return false;
    const hasVisibleSection = step.sections.some(
      (section) => !section.conditions || context.evaluateConditions(section.conditions)
    );
    return hasVisibleSection || step.emptyState !== undefined;
  });

  // Subscribe to validation state so a tab's error badge updates live as errors
  // are set/cleared. This subscription is what re-renders the component (and
  // feeds `getFieldState` below) when only the error state changes.
  const formState = useFormState({ control: context.form.control });

  // Per-step error count = number of validation issues on that step. A plain
  // field contributes 1; a composite field whose error is an array of issues
  // (e.g. a connector editor holding many sub-fields) contributes one per issue,
  // so the badge reflects what the user sees inside it rather than always "1".
  // Fields on inactive tabs are counted too (their errors persist in form state
  // even while unmounted), so a badge surfaces a problem the user can't currently
  // see. Conditionally-hidden sections AND individually-hidden fields are skipped
  // (mirroring FormFieldRenderer) so a badge never points at something the form
  // isn't showing and the user can't reach to fix.
  //
  // Recomputed every render on purpose: `formState` (the reactive dependency) and
  // `visibleSteps` (a fresh array from `steps.filter`) both change per render, so
  // memoizing would never hit; the walk over sections/fields is cheap.
  const errorCountByStepId: Record<string, number> = {};
  for (const step of visibleSteps) {
    let count = 0;
    for (const section of step.sections) {
      if (section.conditions && !context.evaluateConditions(section.conditions)) {
        continue;
      }
      for (const field of section.fields) {
        if (field.rules && !RulesEngine.isFieldVisible(field.rules, context.values)) {
          continue;
        }
        const fieldError: unknown = context.form.getFieldState(field.name, formState).error;
        if (!fieldError) continue;
        count += Array.isArray(fieldError) ? fieldError.filter(Boolean).length : 1;
      }
    }
    errorCountByStepId[step.id] = count;
  }

  // Active tab: controlled by the caller when `activeStepId` is provided (so it
  // can persist across remounts — e.g. keep the user on the same tab when
  // switching nodes), otherwise internal state. Either way it's clamped to a
  // still-visible step, so a step that disappears (condition flips, manifest
  // swap, or a node-specific tab absent on the next node) falls back to the
  // first tab instead of stranding the form on a dead tab.
  const [internalTab, setInternalTab] = useState<string>('');
  const controlled = activeStepId !== undefined;
  const requestedTab = controlled ? activeStepId : internalTab;
  const currentTab = visibleSteps.some((step) => step.id === requestedTab)
    ? requestedTab
    : (visibleSteps[0]?.id ?? '');
  const selectTab = (stepId: string) => {
    if (!controlled) setInternalTab(stepId);
    onActiveStepChange?.(stepId);
  };

  // Uncontrolled only: settle internal state on the clamped value so a step that
  // disappeared and later reappears doesn't snap the user back to it. In
  // controlled mode the caller owns the value and we never overwrite it, so a
  // node-specific tab stays remembered for nodes that do have it.
  useEffect(() => {
    if (!controlled && internalTab !== currentTab) setInternalTab(currentTab);
  }, [controlled, internalTab, currentTab]);

  if (visibleSteps.length === 0) return null;

  return (
    <>
      <Tabs
        value={currentTab}
        onValueChange={selectTab}
        className="flex min-h-0 flex-1 flex-col gap-1"
      >
        {/* Pinned tab bar: shrink-0 keeps it under the panel header while the
            active tab's content scrolls below. The wrapper supplies the
            horizontal inset (matching the content) so the tab strip lines up
            with the fields; px-0 on the list keeps the first pill flush to it.
            Segmented pill tabs (properties-panel style): in a narrow panel
            ScrollableTabsList reveals prev/next chevrons and auto-scrolls the
            active tab into view; in a wide panel it reads as a plain strip. */}
        <div className="shrink-0 pt-3 [padding-inline:var(--mf-content-inset,0px)]">
          <ScrollableTabsList
            className="h-auto justify-start gap-0.5 rounded-lg bg-transparent px-0 py-0.5 text-muted-foreground"
            scrollButtonClassName="size-6 hover:bg-surface-overlay"
          >
            {visibleSteps.map((step) => {
              const errorCount = errorCountByStepId[step.id] ?? 0;
              return (
                <TabsTrigger
                  key={step.id}
                  value={step.id}
                  className="inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-surface-overlay data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  {step.title}
                  {errorCount > 0 && (
                    <span
                      role="img"
                      aria-label={`${errorCount} ${errorCount === 1 ? 'issue' : 'issues'}`}
                      title={`${errorCount} ${errorCount === 1 ? 'issue' : 'issues'}`}
                      className="grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-semibold leading-none text-foreground-on-accent"
                    >
                      {errorCount}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </ScrollableTabsList>
        </div>

        {visibleSteps.map((step) => {
          const stepSections = step.sections.filter(
            (section) => !section.conditions || context.evaluateConditions(section.conditions)
          );
          return (
            // The active tab is the scroll container so the tab bar above stays
            // pinned and the scrollbar sits at the panel edge; the inner wrapper
            // carries the content inset + bottom padding. Plain drops space-y-2
            // (sections self-space) and gets its leading whitespace from the first
            // section's own py-4/pt-4; card boxes have none, so the wrapper adds a
            // matching pt-4 to keep the first card off the tab strip by the same
            // amount. A step with no visible sections renders its `emptyState`.
            <TabsContent
              key={step.id}
              value={step.id}
              className="mt-0 min-h-0 flex-1 overflow-auto"
            >
              {stepSections.length === 0 && step.emptyState !== undefined ? (
                <div className="pt-4 text-sm text-muted-foreground [padding-inline:var(--mf-content-inset,0px)]">
                  {step.emptyState}
                </div>
              ) : (
                <div
                  className={
                    sectionVariant === 'plain'
                      ? 'pb-6 [padding-inline:var(--mf-content-inset,0px)]'
                      : 'space-y-2 pb-6 pt-4 [padding-inline:var(--mf-content-inset,0px)]'
                  }
                >
                  {stepSections.map((section) => (
                    <FormSection
                      key={section.id}
                      section={section}
                      context={context}
                      customComponents={customComponents}
                      disabled={disabled}
                      sectionVariant={sectionVariant}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
      <FormActions schema={schema} context={context} onReset={onReset} />
    </>
  );
}

interface FormSectionProps {
  section: FormSectionType;
  context: FormContext;
  customComponents: Record<string, React.ComponentType<CustomFieldComponentProps>>;
  disabled?: boolean;
  sectionVariant?: 'card' | 'plain';
}

function FormSection({
  section,
  context,
  customComponents,
  disabled,
  sectionVariant = 'card',
}: FormSectionProps) {
  const gridColumns = context.schema.layout?.columns || 1;
  const gap = context.schema.layout?.gap || 4;

  // `'card'` frames each section in a bordered, rounded, horizontally-padded box;
  // `'plain'` drops all of that — plus the accordion's default bottom border — and
  // instead separates stacked sections with a full-width hairline divider above
  // every section except the first, so groups stay distinguishable without boxes
  // (the host provides the frame + horizontal inset). Sections carry symmetric
  // vertical padding (py-4 header / pb-4 content) so the inter-section rhythm
  // (16px + divider + 16px) reads clearly against the tighter field gap; the
  // parent list renders plain sections with no extra gap of its own.
  const isPlain = sectionVariant === 'plain';
  // Lives on each section's OUTERMOST element (the Accordion root for
  // collapsible sections, not the AccordionItem — an item is always its
  // Accordion's first child) so `first:` resolves against the sibling list.
  const dividerClassName = 'border-t first:border-t-0';
  const wrapperClassName = isPlain ? 'border-b-0' : 'border rounded-lg px-3';
  // Plain: the chevron sits immediately right of the title (packed left with a
  // small gap) rather than pushed to the far edge, and the header no longer
  // underlines on hover — it reads as a section label, not a link. Semibold
  // (vs the field labels' medium) keeps the header distinguishable from its own
  // fields even when the collapse chevron is absent.
  const triggerClassName = isPlain
    ? 'justify-start gap-2 py-4 text-sm font-semibold hover:no-underline'
    : 'text-sm font-medium';

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

  // Titleless section: render fields directly, with no header (the sole-section
  // case where the host drops the title/collapse chrome). Card keeps its
  // long-standing behavior — bare fields, no extra padding — so existing
  // single-page/wizard layouts (e.g. contactFormSchema) are unchanged. Plain
  // adds the header-aligned pt-4/pb-4 and the between-sections divider so a
  // titleless section lines up with where a section header would sit. Any
  // tab-specific top inset for the card variant is supplied by the
  // TabbedStepForm content wrapper's pt-4, not here, so it can't leak into
  // non-tabbed layouts.
  if (!section.title) {
    return isPlain ? (
      <div className={`${dividerClassName} pb-4 pt-4`}>{fieldsGrid}</div>
    ) : (
      fieldsGrid
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
      <Accordion
        type="multiple"
        defaultValue={defaultValue}
        className={isPlain ? dividerClassName : undefined}
      >
        <AccordionItem value={section.id} className={wrapperClassName}>
          <AccordionTrigger className={triggerClassName}>{section.title}</AccordionTrigger>
          {/* AccordionContent adds pb-4 pt-0 internally, which both variants keep. */}
          <AccordionContent>{innerContent}</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  // Non-collapsible section - match Accordion structure exactly, including the
  // plain variant's divider and left-packed semibold header.
  return (
    <div className={isPlain ? dividerClassName : wrapperClassName}>
      {/* Match AccordionPrimitive.Header + Trigger structure */}
      <div className="flex">
        <div
          className={
            isPlain
              ? 'flex flex-1 items-center justify-start gap-2 py-4 text-sm font-semibold'
              : 'flex flex-1 items-center justify-between py-4 text-sm font-medium'
          }
        >
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
