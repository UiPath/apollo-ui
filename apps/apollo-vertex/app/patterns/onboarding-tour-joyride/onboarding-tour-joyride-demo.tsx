"use client";

import { Button } from "@/registry/button/button";
import type { TourDefinition } from "@/registry/onboarding-tour-joyride";
import {
  OnboardingTourProvider,
  resetTourState,
  useOnboardingTour,
} from "@/registry/onboarding-tour-joyride";

const DEMO_TOUR: TourDefinition = {
  id: "onboarding-tour-joyride-page-demo",
  steps: [
    {
      id: "welcome",
      type: "modal",
      title: "A tour of the tour component",
      body: "This is the onboarding tour running on this very page. Click through to see how each piece looks in context.",
      image: "/assets/onboarding-tour-welcome.png",
      nextLabel: "Show me around",
    },
    {
      id: "welcome-modal-preview",
      selector: "#tour-welcome-preview",
      title: "Welcome modals",
      body: "Modal-type steps render centered over your app with an image, headline, body, and CTA — ideal for intros and success screens.",
      placement: "top",
    },
    {
      id: "step-popover-preview",
      selector: "#tour-popover-preview",
      title: "Step popovers",
      body: "The default step type is a popover anchored to any element — progress bars, a tip slot, and navigation.",
      tip: "You're looking at one right now.",
      placement: "top",
    },
    {
      id: "features",
      selector: "#tour-features",
      title: "What's included",
      body: "Spotlight overlay, keyboard navigation, conditional steps, persistence, and dark mode support.",
      placement: "top",
    },
    {
      id: "install",
      selector: "#tour-install",
      title: "Drop it in",
      body: "One command to add it to your project.",
      placement: "top",
    },
  ],
};

const DEMO_TOURS = [DEMO_TOUR];

function TourTrigger() {
  const { startTour } = useOnboardingTour();

  return (
    <Button
      onClick={() => {
        resetTourState(DEMO_TOUR.id);
        startTour(DEMO_TOUR.id);
      }}
    >
      {"Start tour demo"}
    </Button>
  );
}

export function OnboardingTourJoyrideDemoTrigger() {
  return (
    <OnboardingTourProvider tours={DEMO_TOURS}>
      <TourTrigger />
    </OnboardingTourProvider>
  );
}
