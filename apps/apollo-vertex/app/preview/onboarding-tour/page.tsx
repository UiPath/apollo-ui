"use client";

import { OnboardingTourJoyridePopoverCard } from "@/registry/onboarding-tour-joyride/onboarding-tour-joyride-popover";

const STEP_BODY_INTRO = (
  <p>
    This is a 3-step walkthrough of the new Analytics dashboard. It will take
    about 2 minutes to complete.
  </p>
);

const STEP_BODY_FILTER = (
  <p>
    Use the filters in the top bar to narrow results by date range, region, or
    product line. Your selections persist between sessions.
  </p>
);

const STEP_BODY_EXPORT = (
  <p>
    When you are ready, click <strong>Export</strong> to download a CSV or PDF
    report for your selected date range.
  </p>
);

export default function OnboardingTourPreview() {
  return (
    <div className="min-h-screen bg-background p-10">
      <h1 className="mb-2 text-2xl font-semibold text-foreground">
        Onboarding Tour Popover — Preview
      </h1>
      <p className="mb-10 text-sm text-muted-foreground">
        Static render of all card states. No Joyride runtime needed.
      </p>

      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {/* Step 1 of 3 — no back, tip present */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Step 1 / 3 — First step · tip
          </span>
          <OnboardingTourJoyridePopoverCard
            title="Welcome to Analytics"
            body={STEP_BODY_INTRO}
            tip="You can relaunch this tour any time from the Help menu."
            currentStep={0}
            totalSteps={3}
            showBack={false}
          />
        </div>

        {/* Step 2 of 3 — back visible, no tip */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Step 2 / 3 — Mid-tour · back visible
          </span>
          <OnboardingTourJoyridePopoverCard
            title="Filter your data"
            body={STEP_BODY_FILTER}
            currentStep={1}
            totalSteps={3}
            showBack
          />
        </div>

        {/* Step 3 of 3 — last step, Done label */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Step 3 / 3 — Last step · Done
          </span>
          <OnboardingTourJoyridePopoverCard
            title="Export your report"
            body={STEP_BODY_EXPORT}
            currentStep={2}
            totalSteps={3}
            showBack
            isLastStep
          />
        </div>

        {/* Single-step tour */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Single-step tour
          </span>
          <OnboardingTourJoyridePopoverCard
            title="New: Bulk actions"
            body={
              <p>
                Select multiple rows and apply an action to all of them at once.
              </p>
            }
            currentStep={0}
            totalSteps={1}
            isLastStep
          />
        </div>

        {/* Custom next label */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Custom next label
          </span>
          <OnboardingTourJoyridePopoverCard
            title="Let's get started"
            body={
              <p>We&apos;ll walk you through the key features one by one.</p>
            }
            currentStep={0}
            totalSteps={4}
            nextLabel="Show me"
          />
        </div>
      </div>
    </div>
  );
}
