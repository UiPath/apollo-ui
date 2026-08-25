"use client";

import {
  CircleCheckIcon,
  CircleXIcon,
  MessageCircleCheckIcon,
  MessageCircleIcon,
  MessageCircleXIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type {
  ShareFeedbackPreviousFeedback,
  ShareFeedbackSentiment,
} from "./share-feedback";

interface ShareFeedbackDefaultTriggerProps {
  variant: "icon" | "icon-label" | "link";
  label: string;
  state: ShareFeedbackSentiment | null;
  previousFeedback?: ShareFeedbackPreviousFeedback;
  previousFeedbackHeading?: string;
}

function ShareFeedbackDefaultTrigger({
  variant,
  label,
  state,
  previousFeedback,
  previousFeedbackHeading,
}: ShareFeedbackDefaultTriggerProps) {
  const Icon =
    state === "positive"
      ? MessageCircleCheckIcon
      : state === "negative"
        ? MessageCircleXIcon
        : MessageCircleIcon;

  const iconClassName = cn(
    state === "positive" && "text-primary",
    state === "negative" && "text-warning",
  );

  const button =
    variant === "icon" ? (
      <Button type="button" variant="ghost" size="icon" aria-label={label}>
        <Icon className={iconClassName} />
      </Button>
    ) : variant === "link" ? (
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs"
      >
        {label}
      </Button>
    ) : (
      <Button type="button" variant="outline" size="sm">
        <Icon className={iconClassName} />
        {label}
      </Button>
    );

  const showPreviousFeedback = state != null && previousFeedback != null;
  const PreviousFeedbackIcon =
    state === "positive" ? CircleCheckIcon : CircleXIcon;

  const triggerButton =
    variant === "icon" ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>{button}</PopoverTrigger>
        </TooltipTrigger>
        {showPreviousFeedback ? (
          <TooltipContent className="flex max-w-80 flex-col gap-2 rounded-xl px-4 py-3 text-left">
            <p className="text-sm font-semibold">{previousFeedbackHeading}</p>
            <div className="flex items-start gap-2 text-sm">
              <PreviousFeedbackIcon
                className={cn("mt-0.5 size-4 shrink-0", iconClassName)}
              />
              <p>{previousFeedback.comment}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-background/70">
              <span>{previousFeedback.author}</span>
              <span className="h-3 w-px bg-background/40" aria-hidden="true" />
              <span>{previousFeedback.timestamp}</span>
            </div>
          </TooltipContent>
        ) : (
          <TooltipContent>{label}</TooltipContent>
        )}
      </Tooltip>
    ) : (
      <PopoverTrigger asChild>{button}</PopoverTrigger>
    );

  return (
    <span data-slot="share-feedback-trigger" className="relative inline-flex">
      {triggerButton}
    </span>
  );
}

export { ShareFeedbackDefaultTrigger };
