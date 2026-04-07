"use client";

import { Button } from "@/registry/button/button";
import type { TourDefinition } from "@/registry/onboarding-tour";
import {
  OnboardingTourProvider,
  useOnboardingTour,
  useTourPersistence,
} from "@/registry/onboarding-tour";
import { ShellTemplate } from "@/templates/shell/ShellTemplateDynamic";

const DEMO_TOUR: TourDefinition = {
  id: "onboarding-tour-demo",
  steps: [
    {
      id: "welcome",
      type: "modal",
      title: "Welcome to Apollo Vertex!",
      body: "Your workspace is ready. Let us show you around the key areas.",
      tip: "This tour will guide you through the main features of the app. You can skip it at any time.",
      nextLabel: "Show me around",
    },
    {
      id: "kpi-cards",
      selector: "[data-tour-demo] .grid.gap-4",
      title: "Key metrics",
      body: "Track your most important KPIs at a glance — totals, pending items, daily throughput, and success rates.",
      tip: "These cards update in real time as invoices are processed.",
      placement: "bottom",
    },
    {
      id: "invoices-table",
      selector: "[data-tour-demo] table",
      title: "Recent invoices",
      body: "View and manage your latest invoices here. Each row shows the vendor, amount, status, and date.",
      placement: "top",
    },
  ],
};

const DEMO_TOURS = [DEMO_TOUR];

function TourTrigger() {
  const { startTour } = useOnboardingTour();
  const { resetTourState } = useTourPersistence();

  return (
    <Button
      onClick={() => {
        resetTourState(DEMO_TOUR.id);
        startTour(DEMO_TOUR.id);
      }}
    >
      {"Start Tour Demo"}
    </Button>
  );
}

export function OnboardingTourDemoTrigger() {
  return (
    <OnboardingTourProvider tours={DEMO_TOURS}>
      <div className="flex items-center gap-3">
        <TourTrigger />
        <span className="text-sm text-muted-foreground">
          {"Click to launch the tour over the shell preview below"}
        </span>
      </div>
    </OnboardingTourProvider>
  );
}

export function ShellWithTourTargets() {
  return (
    <div data-tour-demo>
      <ShellTemplate />
    </div>
  );
}
