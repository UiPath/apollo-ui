"use client";

import { type DriveStep, driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./onboarding-tour-basic.css";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";
import type { TourDefinition, TourStep } from "./onboarding-tour-basic-types";
import { isTourCompleted, markTourCompleted } from "./tour-persistence";

interface OnboardingTourContextValue {
  /** Start a tour by its ID. No-op if the tour is already completed. */
  startTour: (tourId: string) => void;
}

const OnboardingTourContext = createContext<OnboardingTourContextValue | null>(
  null,
);

interface OnboardingTourProviderProps {
  children: ReactNode;
  /** Tour definitions available to this provider */
  tours: TourDefinition[];
}

function toDriveStep(step: TourStep): DriveStep {
  const driveStep: DriveStep = {
    element: step.selector,
    popover: {
      title: step.title,
      description: step.description,
      side: step.placement ?? "bottom",
      align: "center",
      showButtons: ["next", "previous", "close"],
      popoverClass: "onboarding-tour-basic",
    },
  };
  if (step.onEnter) {
    const onEnter = step.onEnter;
    driveStep.onHighlightStarted = () => onEnter();
  }
  return driveStep;
}

function OnboardingTourProvider({
  children,
  tours,
}: OnboardingTourProviderProps) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const activeTourIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
    };
  }, []);

  function startTour(tourId: string) {
    if (isTourCompleted(tourId)) return;
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return;

    driverRef.current?.destroy();
    activeTourIdRef.current = tour.id;

    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");

    const driverInstance = driver({
      steps: tour.steps.map(toDriveStep),
      showProgress: false,
      showButtons: ["next", "previous", "close"],
      allowClose: true,
      // driver.js does not accept CSS variables for overlayColor, so pick a
      // solid black/white based on current theme.
      overlayColor: isDark ? "rgb(0,0,0)" : "rgb(255,255,255)",
      overlayOpacity: 0.7,
      stagePadding: 8,
      stageRadius: 12,
      popoverOffset: 12,
      animate: true,
      onDestroyed: () => {
        if (activeTourIdRef.current) {
          markTourCompleted(activeTourIdRef.current);
          activeTourIdRef.current = null;
        }
      },
    });

    driverRef.current = driverInstance;
    driverInstance.drive();
  }

  const value: OnboardingTourContextValue = { startTour };

  return (
    <OnboardingTourContext.Provider value={value}>
      {children}
    </OnboardingTourContext.Provider>
  );
}

function useOnboardingTour(): OnboardingTourContextValue {
  const context = useContext(OnboardingTourContext);
  if (!context) {
    throw new Error(
      "useOnboardingTour must be used within an OnboardingTourProvider",
    );
  }
  return context;
}

export { OnboardingTourProvider, useOnboardingTour };
export type { OnboardingTourContextValue, OnboardingTourProviderProps };
