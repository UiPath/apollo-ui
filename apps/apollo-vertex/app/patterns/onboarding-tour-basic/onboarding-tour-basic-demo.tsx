"use client";

import { Button } from "@/registry/button/button";
import type { TourDefinition } from "@/registry/onboarding-tour-basic";
import {
  OnboardingTourProvider,
  resetTourState,
  useOnboardingTour,
} from "@/registry/onboarding-tour-basic";

const DEMO_TOUR: TourDefinition = {
  id: "onboarding-tour-basic-page-demo",
  steps: [
    {
      id: "welcome",
      title: "A tour of the basic tour component",
      description:
        "This is the driver.js native popover with Apollo Vertex theme overrides. Click through to see how each piece looks in context.",
    },
    {
      id: "step-popover-preview",
      selector: "#tour-popover-preview",
      title: "Step popovers",
      description:
        "driver.js renders the popover — we only style it. Title, description, and native next / previous / close buttons.",
      placement: "top",
    },
    {
      id: "features",
      selector: "#tour-features",
      title: "What's included",
      description:
        "Spotlight overlay, keyboard navigation, persistence, and dark mode support — everything driver.js gives you, themed to Vertex.",
      placement: "top",
    },
    {
      id: "install",
      selector: "#tour-install",
      title: "Drop it in",
      description: "One command to add it to your project.",
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

export function OnboardingTourBasicDemoTrigger() {
  return (
    <OnboardingTourProvider tours={DEMO_TOURS}>
      <TourTrigger />
    </OnboardingTourProvider>
  );
}
