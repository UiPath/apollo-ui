"use client";

import { Slot } from "@radix-ui/react-slot";
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
  asChild?: boolean;
}

function FormWizard<TValues extends Record<string, unknown>>({
  wizard,
  className,
  children,
  asChild = false,
  ...props
}: FormWizardProps<TValues>) {
  const Comp = asChild ? Slot : "div";
  return (
    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- context is field-type agnostic; parts read only step metadata and generic helpers
    <FormWizardContext.Provider value={wizard as unknown as FormWizardApi}>
      <Comp
        data-slot="form-wizard"
        className={cn("flex flex-col gap-8", className)}
        {...props}
      >
        {children}
      </Comp>
    </FormWizardContext.Provider>
  );
}

interface FormWizardStepsRenderApi {
  steps: FormWizardApi["steps"];
  stepIndex: number;
  goToStep: (id: string) => void;
}

interface FormWizardStepsProps
  extends Omit<ComponentProps<typeof Stepper>, "activeStep" | "children"> {
  clickable?: boolean;
  children?: (api: FormWizardStepsRenderApi) => ReactNode;
}

function FormWizardSteps({
  clickable,
  className,
  children,
  ...props
}: FormWizardStepsProps) {
  const { steps, stepIndex, goToStep } = useFormWizardContext();

  if (typeof children === "function") {
    return <>{children({ steps, stepIndex, goToStep })}</>;
  }

  return (
    <Stepper activeStep={stepIndex} className={className} {...props}>
      {steps.map((step, index) => {
        const canNavigate = clickable && index < stepIndex;
        const navProps = canNavigate
          ? { onClick: () => goToStep(step.id) }
          : {};
        return (
          <StepperItem key={step.id} step={index}>
            <StepperTrigger {...navProps}>
              <StepperIndicator />
              <StepperContent>
                <StepperTitle>{step.title}</StepperTitle>
                {step.description ? (
                  <StepperDescription>{step.description}</StepperDescription>
                ) : null}
              </StepperContent>
            </StepperTrigger>
            {index < steps.length - 1 ? <StepperSeparator /> : null}
          </StepperItem>
        );
      })}
    </Stepper>
  );
}

interface FormWizardStepProps extends ComponentProps<"div"> {
  stepId: string;
  asChild?: boolean;
}

function FormWizardStep({
  stepId,
  className,
  children,
  asChild = false,
  ...props
}: FormWizardStepProps) {
  const { currentStepId } = useFormWizardContext();
  if (stepId !== currentStepId) return null;

  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      data-slot="form-wizard-step"
      className={cn("flex flex-col", className)}
      {...props}
    >
      {children}
    </Comp>
  );
}

export { FormWizard, FormWizardStep, FormWizardSteps, useFormWizardContext };
export type {
  FormWizardProps,
  FormWizardStepProps,
  FormWizardStepsProps,
  FormWizardStepsRenderApi,
};
