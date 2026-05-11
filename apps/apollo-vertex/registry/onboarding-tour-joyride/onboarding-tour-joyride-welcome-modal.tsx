"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { type ReactNode, useId } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingTourJoyrideWelcomeModalCardProps {
  /** Modal title */
  title: string;
  /** Primary body content */
  body: ReactNode;
  /** Secondary description paragraph */
  description?: string;
  /** Image URL to display above the content. */
  image?: string;
  /** Custom label for the CTA button */
  nextLabel?: string;
  /** CTA button handler */
  onNext?: () => void;
  /** Close/dismiss handler */
  onClose?: () => void;
  /** Optional className for the outer card */
  className?: string;
}

/**
 * The visual modal card — renderable standalone for previews or inside the
 * Radix Dialog wrapper for runtime use.
 */
function OnboardingTourJoyrideWelcomeModalCard({
  title,
  body,
  description,
  image,
  nextLabel = "Let's go",
  onNext,
  onClose,
  className,
}: OnboardingTourJoyrideWelcomeModalCardProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div
      data-slot="onboarding-tour-joyride-welcome-modal"
      className={cn(
        "relative w-full max-w-[520px] bg-card rounded-xl border border-border shadow-lg overflow-hidden",
        className,
      )}
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
  );
}

interface OnboardingTourJoyrideWelcomeModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Modal title */
  title: string;
  /** Primary body content */
  body: ReactNode;
  /** Secondary description paragraph */
  description?: string;
  /** Image URL to display above the content. */
  image?: string;
  /** Custom label for the CTA button */
  nextLabel?: string;
  /** CTA button handler */
  onNext: () => void;
  /** Close/dismiss handler */
  onClose: () => void;
}

function OnboardingTourJoyrideWelcomeModal({
  open,
  title,
  body,
  description,
  image,
  nextLabel = "Let's go",
  onNext,
  onClose,
}: OnboardingTourJoyrideWelcomeModalProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="onboarding-tour-joyride-welcome-modal-overlay"
          className="fixed inset-0 z-[10000] bg-background/80 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          data-slot="onboarding-tour-joyride-welcome-modal-portal"
          className="fixed top-[50%] left-[50%] z-[10001] translate-x-[-50%] translate-y-[-50%] w-full max-w-[calc(100%-2rem)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="relative w-full max-w-[520px] mx-auto bg-card rounded-xl border border-border shadow-lg overflow-hidden">
            {/* Close button */}
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10"
                aria-label="Close"
              >
                <X />
              </Button>
            </DialogPrimitive.Close>

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
              <DialogPrimitive.Title className="text-xl font-bold text-foreground mb-2">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description asChild>
                <div className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {body}
                </div>
              </DialogPrimitive.Description>
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
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export {
  OnboardingTourJoyrideWelcomeModal,
  OnboardingTourJoyrideWelcomeModalCard,
};
export type {
  OnboardingTourJoyrideWelcomeModalProps,
  OnboardingTourJoyrideWelcomeModalCardProps,
};
