"use client";

import {
  createContext,
  type ComponentProps,
  type ReactNode,
  useContext,
} from "react";
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import { cn } from "@/lib/utils";
import { useFormWizard } from "./use-form-wizard";
import type { WizardStepDef } from "./wizard-schema";

type FormWizardApi = ReturnType<typeof useFormWizard>;

const FormWizardContext = createContext<FormWizardApi | null>(null);

function useFormWizardContext(): FormWizardApi {
  const context = useContext(FormWizardContext);
  if (!context) {
    throw new Error("FormWizard parts must be used within a <FormWizard>.");
  }
  return context;
}

interface FormWizardProps<TValues extends Record<string, unknown>>
  extends ComponentProps<"div"> {
  wizard: ReturnType<typeof useFormWizard<TValues>>;
}

function FormWizard<TValues extends Record<string, unknown>>({
  wizard,
  className,
  children,
  ...props
}: FormWizardProps<TValues>) {
  return (
    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- context is field-type agnostic; parts read only step metadata and generic helpers
    <FormWizardContext.Provider value={wizard as unknown as FormWizardApi}>
      <div
        data-slot="form-wizard"
        className={cn("flex flex-col gap-8", className)}
        {...props}
      >
        {children}
      </div>
    </FormWizardContext.Provider>
  );
}

interface WizardStepRenderProps {
  step: WizardStepDef<Record<string, unknown>>;
  index: number;
  state: "active" | "completed" | "inactive";
  isCurrent: boolean;
  goTo: () => void;
}

interface FormWizardStepsProps
  extends Omit<ComponentProps<typeof Stepper>, "activeStep" | "children"> {
  clickable?: boolean;
  children?: (props: WizardStepRenderProps) => ReactNode;
}

function FormWizardSteps({
  clickable,
  className,
  children,
  ...props
}: FormWizardStepsProps) {
  const { steps, stepIndex, goToStep } = useFormWizardContext();

  return (
    <Stepper activeStep={stepIndex} className={className} {...props}>
      {steps.map((step, index) => {
        const state =
          index < stepIndex
            ? "completed"
            : index === stepIndex
              ? "active"
              : "inactive";
        const goTo = () => goToStep(step.id);
        const canNavigate = clickable && index < stepIndex;
        const navProps = canNavigate ? { onClick: goTo } : {};
        return (
          <StepperItem key={step.id} step={index}>
            {children ? (
              children({
                step,
                index,
                state,
                isCurrent: state === "active",
                goTo,
              })
            ) : (
              <>
                <StepperTrigger {...navProps}>
                  <StepperIndicator />
                  <StepperContent>
                    <StepperTitle>{step.title}</StepperTitle>
                    {step.description ? (
                      <StepperDescription>
                        {step.description}
                      </StepperDescription>
                    ) : null}
                  </StepperContent>
                </StepperTrigger>
                {index < steps.length - 1 ? <StepperSeparator /> : null}
              </>
            )}
          </StepperItem>
        );
      })}
    </Stepper>
  );
}

interface FormWizardStepProps extends ComponentProps<"div"> {
  stepId: string;
}

function FormWizardStep({
  stepId,
  className,
  children,
  ...props
}: FormWizardStepProps) {
  const { currentStepId } = useFormWizardContext();
  if (stepId !== currentStepId) return null;

  return (
    <div
      data-slot="form-wizard-step"
      className={cn("flex flex-col", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { FormWizard, FormWizardStep, FormWizardSteps, useFormWizardContext };
export type {
  FormWizardProps,
  FormWizardStepProps,
  FormWizardStepsProps,
  WizardStepRenderProps,
};
