import type { ReactNode } from "react";

export interface WizardStepDef<TValues> {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  condition?: (values: TValues) => boolean;
  optional?: boolean;
}

export function getVisibleSteps<TValues>(
  steps: ReadonlyArray<WizardStepDef<TValues>>,
  values: TValues,
): Array<WizardStepDef<TValues>> {
  return steps.filter((step) => step.condition?.(values) ?? true);
}
