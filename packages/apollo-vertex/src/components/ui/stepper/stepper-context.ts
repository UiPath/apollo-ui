"use client";

import { createContext, useContext } from "react";

type StepperOrientation = "horizontal" | "vertical";
type StepperItemState = "active" | "completed" | "inactive";

interface StepperContextValue {
  activeStep: number;
  orientation: StepperOrientation;
}

const StepperContext = createContext<StepperContextValue | null>(null);

function useStepperContext() {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error("Stepper components must be used within a <Stepper>.");
  }
  return context;
}

interface StepperItemContextValue {
  step: number;
  state: StepperItemState;
}

const StepperItemContext = createContext<StepperItemContextValue | null>(null);

function useStepperItemContext() {
  const context = useContext(StepperItemContext);
  if (!context) {
    throw new Error("Stepper item parts must be used within a <StepperItem>.");
  }
  return context;
}

export {
  StepperContext,
  StepperItemContext,
  useStepperContext,
  useStepperItemContext,
};
export type {
  StepperContextValue,
  StepperItemContextValue,
  StepperItemState,
  StepperOrientation,
};
