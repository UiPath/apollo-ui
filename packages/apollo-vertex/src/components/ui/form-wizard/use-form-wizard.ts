"use client";

import { useLocalStorage } from "@mantine/hooks";
import { type FormValidateFn, revalidateLogic } from "@tanstack/react-form";
import { useSelector } from "@tanstack/react-store";
import { useEffect, useMemo, useState } from "react";
import type { z } from "zod";
import { useAppForm } from "@/components/ui/form";
import { getVisibleSteps, type WizardStepDef } from "./wizard-schema";

interface WizardPersistConfig {
  key: string;
}

interface PersistedState<TValues> {
  values: TValues;
  stepId: string;
}

interface UseFormWizardOptions<TValues extends Record<string, unknown>> {
  formOptions: { defaultValues: TValues };
  schema: z.ZodType<TValues>;
  steps: ReadonlyArray<WizardStepDef<TValues>>;
  persist?: WizardPersistConfig;
  onSubmit: (values: TValues) => void | Promise<void>;
}

function useFormWizard<TValues extends Record<string, unknown>>({
  formOptions,
  schema,
  steps,
  persist,
  onSubmit,
}: UseFormWizardOptions<TValues>) {
  const persistKey = persist?.key ?? "";
  const [persisted, setPersisted, removePersisted] = useLocalStorage<
    PersistedState<TValues> | undefined
  >({ key: persistKey, getInitialValueInEffect: false });

  // Ignore stored state when persistence is off.
  const [initial] = useState(persistKey ? persisted : null);
  const [currentStepId, setCurrentStepId] = useState(
    () => initial?.stepId ?? steps[0]?.id ?? "",
  );

  const form = useAppForm({
    ...formOptions,
    defaultValues: initial?.values ?? formOptions.defaultValues,
    validationLogic: revalidateLogic(),
    // Full-form backstop; only runs on the final submit.
    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- TanStack accepts a Standard Schema (Zod) here at runtime; the generic slot is typed as the function form only
    validators: { onDynamic: schema as unknown as FormValidateFn<TValues> },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
      if (persistKey) removePersisted();
    },
  });

  const values = useSelector(form.store, (state) => state.values);
  const visibleSteps = useMemo(
    () => getVisibleSteps(steps, values),
    [steps, values],
  );

  // Fall back to the first visible step when the current id is hidden or stale.
  const foundIndex = visibleSteps.findIndex((s) => s.id === currentStepId);
  const stepIndex = foundIndex === -1 ? 0 : foundIndex;
  const currentStep = visibleSteps[stepIndex];
  const activeStepId = currentStep?.id ?? currentStepId;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === visibleSteps.length - 1;
  const progress =
    visibleSteps.length > 0 ? ((stepIndex + 1) / visibleSteps.length) * 100 : 0;

  const next = () => {
    const nextStep = visibleSteps[stepIndex + 1];
    if (nextStep) setCurrentStepId(nextStep.id);
    else void form.handleSubmit();
  };

  const back = () => {
    const previous = visibleSteps[stepIndex - 1];
    if (previous) setCurrentStepId(previous.id);
  };

  const goToStep = (id: string) => setCurrentStepId(id);

  const reset = () => {
    form.reset();
    if (persistKey) removePersisted();
    setCurrentStepId(steps[0]?.id ?? "");
  };

  useEffect(() => {
    if (persistKey) setPersisted({ values, stepId: activeStepId });
  }, [persistKey, setPersisted, values, activeStepId]);

  return {
    form,
    steps: visibleSteps,
    currentStep,
    currentStepId: activeStepId,
    stepIndex,
    stepCount: visibleSteps.length,
    isFirst,
    isLast,
    progress,
    next,
    back,
    goToStep,
    reset,
  };
}

export { useFormWizard };
export type { UseFormWizardOptions, WizardPersistConfig };
