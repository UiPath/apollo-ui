"use client";

import { OnboardingTourPopover } from "@/registry/onboarding-tour/onboarding-tour-popover";
import { OnboardingTourWelcomeModal } from "@/registry/onboarding-tour/onboarding-tour-welcome-modal";

function noop() {
  // no-op for static previews
}

export function WelcomeModalPreview() {
  return (
    <div className="flex items-center justify-center p-8 bg-muted/20 rounded-lg">
      <OnboardingTourWelcomeModal
        title="Welcome to your workspace!"
        body="Your first summary template is ready."
        description="We've created a starting point based on your use case. Review the summary, refine sections as needed, and preview again until it fits your workflow."
        image="/assets/onboarding-tour-welcome.png"
        nextLabel="Let's go"
        onNext={noop}
        onClose={noop}
      />
    </div>
  );
}

export function PopoverStepPreview() {
  return (
    <div className="flex items-center justify-center p-8 bg-muted/20 rounded-lg">
      <OnboardingTourPopover
        title="Preview with a real record"
        body="Use this record to check how your instructions apply to real medical data. You can switch to your own records at any time from the dropdown."
        tip="Try uploading your own documents for a more accurate preview."
        currentStep={2}
        totalSteps={5}
        showBack
        onBack={noop}
        onNext={noop}
        onSkip={noop}
      />
    </div>
  );
}
