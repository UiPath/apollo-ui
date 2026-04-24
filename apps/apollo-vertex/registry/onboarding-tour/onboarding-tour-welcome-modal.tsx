"use client";

import { FocusScope } from "@radix-ui/react-focus-scope";
import { X } from "lucide-react";
import { type ReactNode, useId } from "react";
import { Button } from "@/components/ui/button";

interface OnboardingTourWelcomeModalProps {
  /** Modal title */
  title: string;
  /** Primary body content */
  body: ReactNode;
  /** Secondary description paragraph */
  description?: string;
  /** Image URL to display above the content. Defaults to a built-in success illustration. */
  image?: string;
  /** Custom label for the CTA button */
  nextLabel?: string;
  /** CTA button handler */
  onNext: () => void;
  /** Close/dismiss handler */
  onClose: () => void;
}

function OnboardingTourWelcomeModal({
  title,
  body,
  description,
  image,
  nextLabel = "Let's go",
  onNext,
  onClose,
}: OnboardingTourWelcomeModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  return (
    <FocusScope asChild trapped loop>
      <div
        data-slot="onboarding-tour-welcome-modal"
        className="relative w-full max-w-[520px] bg-card rounded-xl border border-border shadow-lg overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-10"
          aria-label="Close"
        >
          <X />
        </Button>

        {/* Image */}
        {image && (
          <div className="w-full">
            {/* biome-ignore lint/performance/noImgElement: registry component must work without Next.js */}
            <img
              src={image}
              alt=""
              className="w-full h-auto object-cover"
              aria-hidden="true"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <h2 id={titleId} className="text-xl font-bold text-foreground mb-2">
            {title}
          </h2>
          <div
            id={descriptionId}
            className="text-sm text-muted-foreground mb-3 leading-relaxed"
          >
            {body}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {description}
            </p>
          )}
          <Button onClick={onNext} size="lg" className="w-full" autoFocus>
            {nextLabel}
          </Button>
        </div>
      </div>
    </FocusScope>
  );
}

export { OnboardingTourWelcomeModal };
export type { OnboardingTourWelcomeModalProps };
