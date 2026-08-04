"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ACTIONS,
  type Controls,
  type EventData,
  EVENTS,
  Joyride,
  STATUS,
  type Step,
} from "react-joyride";
import { OnboardingTourJoyridePopover } from "./onboarding-tour-joyride-popover";
import type { OnboardingTourJoyridePopoverData } from "./onboarding-tour-joyride-popover";
import { OnboardingTourJoyrideWelcomeModal } from "./onboarding-tour-joyride-welcome-modal";
import type { TourDefinition, TourStep } from "./onboarding-tour-joyride-types";
import { isTourCompleted, markTourCompleted } from "./tour-persistence";

interface OnboardingTourContextValue<TCondition extends string = string> {
  /** Start a tour by its ID */
  startTour: (tourId: string) => void;
  /** Set a condition value for gating steps */
  setCondition: (key: TCondition, value: boolean) => void;
}

const OnboardingTourContext = createContext<OnboardingTourContextValue | null>(
  null,
);

interface OnboardingTourProviderProps<TCondition extends string = string> {
  children: ReactNode;
  /** Tour definitions available to this provider */
  tours: TourDefinition<TCondition>[];
  /** Initial conditions */
  initialConditions?: Partial<Record<TCondition, boolean>>;
}

interface JoyrideStepWithData extends Step {
  data: OnboardingTourJoyridePopoverData & { stepId: string };
}

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function OnboardingTourProvider<TCondition extends string = string>({
  children,
  tours,
  initialConditions,
}: OnboardingTourProviderProps<TCondition>) {
  const [activeTour, setActiveTour] =
    useState<TourDefinition<TCondition> | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [pendingAdvance, setPendingAdvance] = useState(false);
  const [conditions, setConditions] = useState<Record<string, boolean>>(() => {
    const result: Record<string, boolean> = {};
    if (!initialConditions) return result;
    for (const [k, v] of Object.entries(initialConditions)) {
      if (typeof v === "boolean") result[k] = v;
    }
    return result;
  });

  const currentStep: TourStep<TCondition> | null = activeTour
    ? (activeTour.steps[stepIndex] ?? null)
    : null;
  const isModalStep = currentStep?.type === "modal";

  // Build Joyride's step list from the active tour. Modal-type steps are
  // placeholders so indexes align with activeTour.steps — Joyride runs are
  // paused while we render the modal ourselves.
  const joyrideSteps: JoyrideStepWithData[] = activeTour
    ? buildJoyrideSteps(activeTour)
    : [];

  // Fire onEnter for the active step
  useEffect(() => {
    if (!isRunning || !currentStep) return;
    currentStep.onEnter?.();
  }, [isRunning, currentStep]);

  // Resume advance when a pending waitFor condition is satisfied
  useEffect(() => {
    if (!pendingAdvance || !activeTour) return;
    const nextStep = activeTour.steps[stepIndex + 1];
    if (!nextStep) return;
    if (nextStep.waitFor && !conditions[nextStep.waitFor as string]) return;
    setPendingAdvance(false);
    setStepIndex(stepIndex + 1);
  }, [pendingAdvance, conditions, activeTour, stepIndex]);

  function stopTour(markCompleted: boolean) {
    if (activeTour && markCompleted) {
      markTourCompleted(activeTour.id);
    }
    setIsRunning(false);
    setActiveTour(null);
    setStepIndex(0);
    setPendingAdvance(false);
  }

  function advance() {
    if (!activeTour) return;
    const isLast = stepIndex >= activeTour.steps.length - 1;
    if (isLast) {
      stopTour(true);
      return;
    }
    const nextStep = activeTour.steps[stepIndex + 1];
    if (nextStep?.waitFor && !conditions[nextStep.waitFor as string]) {
      setPendingAdvance(true);
      return;
    }
    setStepIndex(stepIndex + 1);
  }

  function goBack() {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }

  function handleJoyrideEvent(data: EventData, _controls: Controls) {
    const { action, status, type } = data;

    // Tour ended — respect skip/finish
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      stopTour(true);
      return;
    }

    if (action === ACTIONS.CLOSE || action === ACTIONS.SKIP) {
      stopTour(true);
      return;
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      if (action === ACTIONS.PREV) {
        goBack();
      } else if (action === ACTIONS.NEXT) {
        advance();
      }
    }
  }

  function startTour(tourId: string) {
    if (isTourCompleted(tourId)) return;
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return;
    setActiveTour(tour);
    setStepIndex(0);
    setPendingAdvance(false);
    setIsRunning(true);
  }

  function setCondition(key: string, value: boolean) {
    setConditions((prev) => ({ ...prev, [key]: value }));
  }

  // The context stores the widest (string) variant; consumers narrow via
  // `useOnboardingTour<TCondition>()` which re-types the value.
  const value: OnboardingTourContextValue = {
    startTour,
    setCondition,
  };

  // Resolve a safe step index for Joyride: never a modal step.
  const joyrideStepIndex = isModalStep ? 0 : stepIndex;
  // Joyride should not run while a modal step is active, or when no tour.
  const joyrideRun = isRunning && !isModalStep && activeTour !== null;

  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(isDarkMode());
    const observer = new MutationObserver(() => setDark(isDarkMode()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <OnboardingTourContext.Provider value={value}>
      {children}
      {activeTour && (
        <Joyride
          steps={joyrideSteps}
          run={joyrideRun}
          stepIndex={joyrideStepIndex}
          continuous
          tooltipComponent={OnboardingTourJoyridePopover}
          arrowComponent={() => null}
          onEvent={handleJoyrideEvent}
          options={{
            primaryColor: "var(--color-primary)",
            overlayColor: dark
              ? "rgba(0, 0, 0, 0.8)"
              : "rgba(255, 255, 255, 0.8)",
            spotlightPadding: 8,
            spotlightRadius: 16,
            offset: 12,
            dismissKeyAction: "close",
            overlayClickAction: false,
            disableFocusTrap: false,
            zIndex: 9999,
          }}
        />
      )}
      {currentStep && isModalStep && (
        <OnboardingTourJoyrideWelcomeModal
          open
          title={currentStep.title}
          body={currentStep.body}
          description={currentStep.tip}
          image={currentStep.image}
          nextLabel={currentStep.nextLabel}
          onNext={advance}
          onClose={() => stopTour(true)}
        />
      )}
    </OnboardingTourContext.Provider>
  );
}

function buildJoyrideSteps<TCondition extends string>(
  tour: TourDefinition<TCondition>,
): JoyrideStepWithData[] {
  const popoverSteps = tour.steps.filter((s) => s.type !== "modal");

  return tour.steps.map((step) => {
    if (step.type === "modal") {
      // Placeholder — Joyride won't render this because `run` is false
      // while we show the modal ourselves. Target body so Joyride doesn't
      // complain about a missing selector.
      return {
        target: "body",
        content: "",
        placement: "center" as const,
        data: {
          stepId: step.id,
          title: step.title,
          body: step.body,
          tip: step.tip,
          currentStep: 0,
          totalSteps: popoverSteps.length || 1,
          showBack: false,
          nextLabel: step.nextLabel,
        },
      };
    }

    const popoverIndex = popoverSteps.findIndex((s) => s.id === step.id);
    const totalSteps = popoverSteps.length || 1;
    // Find the previous step's type to decide whether to show "Back"
    const absoluteIndex = tour.steps.findIndex((s) => s.id === step.id);
    const prevStep = tour.steps[absoluteIndex - 1];
    const showBack = absoluteIndex > 0 && prevStep?.type !== "modal";

    return {
      target: step.selector ?? "body",
      content: "",
      title: "",
      placement: step.placement ?? "bottom",
      skipBeacon: true,
      data: {
        stepId: step.id,
        title: step.title,
        body: step.body,
        tip: step.tip,
        currentStep: popoverIndex,
        totalSteps,
        showBack,
        nextLabel: step.nextLabel,
      },
    };
  });
}

function useOnboardingTour<
  TCondition extends string = string,
>(): OnboardingTourContextValue<TCondition> {
  const context = useContext(OnboardingTourContext);
  if (!context) {
    throw new Error(
      "useOnboardingTour must be used within an OnboardingTourProvider",
    );
  }
  // Generic context pattern — base context stores string, consumer narrows via generic
  return context as OnboardingTourContextValue<TCondition>;
}

export { OnboardingTourProvider, useOnboardingTour };
export type { OnboardingTourContextValue, OnboardingTourProviderProps };
