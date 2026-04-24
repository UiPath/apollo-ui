"use client";

import { driver } from "driver.js";
import type { DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "./onboarding-tour.css";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { OnboardingTourPopover } from "./onboarding-tour-popover";
import { OnboardingTourWelcomeModal } from "./onboarding-tour-welcome-modal";
import type { TourDefinition, TourStep } from "./onboarding-tour-types";
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

function OnboardingTourProvider<TCondition extends string = string>({
  children,
  tours,
  initialConditions,
}: OnboardingTourProviderProps<TCondition>) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const popoverRootRef = useRef<Root | null>(null);
  const activeTourRef = useRef<TourDefinition<TCondition> | null>(null);
  const conditionsRef = useRef<Record<string, boolean | undefined>>(
    initialConditions ?? {},
  );
  const pendingAdvanceRef = useRef(false);

  function cleanupPopoverRoot() {
    if (popoverRootRef.current) {
      popoverRootRef.current.unmount();
      popoverRootRef.current = null;
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && driverRef.current?.isActive()) {
        if (activeTourRef.current) {
          markTourCompleted(activeTourRef.current.id);
        }
        driverRef.current.destroy();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      cleanupPopoverRoot();
      driverRef.current?.destroy();
    };
  }, []);

  function renderPopover(
    wrapper: Element,
    step: TourStep<TCondition>,
    stepIndex: number,
    tour: TourDefinition<TCondition>,
    driverInstance: ReturnType<typeof driver>,
  ) {
    cleanupPopoverRoot();

    // Hide driver.js default content, keep elements in DOM for driver.js internals
    for (const child of Array.from(wrapper.children)) {
      if (child instanceof HTMLElement) {
        child.style.display = "none";
      }
    }

    const container = document.createElement("div");
    wrapper.append(container);

    const root = createRoot(container);
    popoverRootRef.current = root;

    const isLast = stepIndex === tour.steps.length - 1;

    const handleNext = () => {
      if (isLast) {
        markTourCompleted(tour.id);
        driverInstance.destroy();
        return;
      }
      const nextStep = tour.steps[stepIndex + 1];
      if (nextStep?.waitFor && !conditionsRef.current[nextStep.waitFor]) {
        pendingAdvanceRef.current = true;
        return;
      }
      driverInstance.moveNext();
    };

    const handleSkip = () => {
      markTourCompleted(tour.id);
      driverInstance.destroy();
    };

    const handleBack = () => {
      driverInstance.movePrevious();
    };

    // flushSync is safe here: onPopoverRender is called by driver.js (imperative),
    // not during a React render cycle, so there's no re-entrancy risk.
    // It ensures driver.js can measure popover dimensions synchronously.
    flushSync(() => {
      if (step.type === "modal") {
        root.render(
          <OnboardingTourWelcomeModal
            title={step.title}
            body={step.body}
            description={step.tip}
            image={step.image}
            nextLabel={step.nextLabel}
            onNext={handleNext}
            onClose={handleSkip}
          />,
        );
      } else {
        const popoverSteps = tour.steps.filter((s) => s.type !== "modal");
        const popoverIndex = popoverSteps.findIndex((s) => s.id === step.id);
        const showBack =
          stepIndex > 0 && tour.steps[stepIndex - 1]?.type !== "modal";

        root.render(
          <OnboardingTourPopover
            title={step.title}
            body={step.body}
            tip={step.tip}
            currentStep={popoverIndex}
            totalSteps={popoverSteps.length}
            showBack={showBack}
            onBack={handleBack}
            onNext={handleNext}
            onSkip={handleSkip}
            isLastStep={isLast}
            nextLabel={step.nextLabel}
          />,
        );
      }
    });

    // Recalculate positions now that flushSync has updated the DOM with
    // the actual popover content dimensions
    driverInstance.refresh();
  }

  function startTour(tourId: string) {
    if (isTourCompleted(tourId)) return;
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return;

    driverRef.current?.destroy();
    cleanupPopoverRoot();

    // Set refs AFTER destroy() — onDestroyed fires synchronously and nulls activeTourRef
    activeTourRef.current = tour;
    pendingAdvanceRef.current = false;

    const isDark = document.documentElement.classList.contains("dark");

    const steps: DriveStep[] = tour.steps.map((step) => ({
      element: step.selector,
      popover: {
        title: "",
        description: "",
        side: step.placement ?? "bottom",
        align: "center" as const,
        popoverClass:
          step.type === "modal"
            ? "onboarding-tour-modal"
            : "onboarding-tour-step",
      },
    }));

    const driverInstance = driver({
      steps,
      showProgress: false,
      showButtons: [],
      allowClose: false,
      allowKeyboardControl: false,
      overlayColor: isDark ? "rgb(0,0,0)" : "rgb(255,255,255)",
      overlayOpacity: 0.8,
      stagePadding: 8,
      stageRadius: 16,
      popoverOffset: 12,
      animate: false,
      onPopoverRender: (popover, { state }) => {
        const stepIndex = state.activeIndex ?? 0;
        const step = tour.steps[stepIndex];
        if (!step) return;
        renderPopover(popover.wrapper, step, stepIndex, tour, driverInstance);
        step.onEnter?.();
      },
      onDestroyed: () => {
        cleanupPopoverRoot();
        activeTourRef.current = null;
        pendingAdvanceRef.current = false;
      },
    });

    driverRef.current = driverInstance;
    driverInstance.drive();
  }

  function setCondition(key: string, value: boolean) {
    conditionsRef.current = { ...conditionsRef.current, [key]: value };
    if (value && pendingAdvanceRef.current && driverRef.current?.isActive()) {
      const activeIndex = driverRef.current.getActiveIndex();
      if (activeIndex != null && activeTourRef.current) {
        const nextStep = activeTourRef.current.steps[activeIndex + 1];
        if (nextStep?.waitFor === key) {
          pendingAdvanceRef.current = false;
          driverRef.current.moveNext();
        }
      }
    }
  }

  const value: OnboardingTourContextValue = {
    startTour,
    setCondition,
  };

  return (
    <OnboardingTourContext.Provider value={value}>
      {children}
    </OnboardingTourContext.Provider>
  );
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
