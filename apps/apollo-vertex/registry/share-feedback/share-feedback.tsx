"use client";

import { CheckIcon, PencilIcon, XIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import { ShareFeedbackDefaultTrigger } from "./share-feedback-trigger";

type ShareFeedbackSentiment = "positive" | "negative";

type ShareFeedbackStep = "question" | ShareFeedbackSentiment;

type ShareFeedbackReason = {
  value: string;
  label: string;
};

type ShareFeedbackResult = {
  sentiment: ShareFeedbackSentiment;
  reasonValues: string[];
  comment: string;
  shareWithUiPath: boolean;
};

type ShareFeedbackPreviousFeedback = {
  comment: string;
  author: string;
  timestamp: string;
};

interface ShareFeedbackBaseProps {
  /** Controlled popover open state. Falls back to internal state when omitted. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Persisted feedback already left on this output, drives the icon shown on the built-in trigger. */
  state?: ShareFeedbackSentiment | null;
  /**
   * The most recent feedback note for this output. When set alongside `state`, hovering the
   * built-in icon trigger shows it in a tooltip instead of just the trigger's accessible label.
   */
  previousFeedback?: ShareFeedbackPreviousFeedback;
  /** Heading shown above the note in the previous-feedback tooltip, e.g. "Previous feedback". */
  previousFeedbackHeading?: string;
  /** Which step the flow opens on. Use "positive"/"negative" to skip the question step (e.g. from a nudge). */
  initialStep?: ShareFeedbackStep;
  defaultReasonValues?: string[];
  defaultComment?: string;
  questionLabel: string;
  positiveOptionLabel: string;
  negativeOptionLabel: string;
  positivePromptLabel: string;
  negativePromptLabel: string;
  reasons: ShareFeedbackReason[];
  positiveCommentPlaceholder: string;
  negativeCommentPlaceholder: string;
  disclaimerLabel: string;
  consentLabel: string;
  cancelLabel: string;
  /** Accessible label for the close button shown on the positive prompt step. */
  closeLabel: string;
  submitLabel: string;
  onSubmit: (result: ShareFeedbackResult) => void;
  onCancel?: () => void;
  align?: React.ComponentProps<typeof PopoverContent>["align"];
}

interface ShareFeedbackBuiltinTriggerProps extends ShareFeedbackBaseProps {
  trigger?: undefined;
  /** Built-in trigger style. */
  triggerVariant?: "icon" | "icon-label";
  /** Accessible label for the icon trigger, and its visible text for the icon-label trigger. */
  triggerLabel: string;
}

interface ShareFeedbackCustomTriggerProps extends ShareFeedbackBaseProps {
  /**
   * Custom trigger element (e.g. a `DropdownMenuItem`). The built-in icon/icon-label
   * trigger and its indicator dot are not rendered — you own the trigger's appearance
   * and any indicator.
   */
  trigger: React.ReactNode;
  triggerVariant?: undefined;
  triggerLabel?: undefined;
}

type ShareFeedbackProps =
  | ShareFeedbackBuiltinTriggerProps
  | ShareFeedbackCustomTriggerProps;

function ShareFeedback({
  open: controlledOpen,
  onOpenChange,
  trigger,
  triggerVariant = "icon",
  // Guaranteed to be a string whenever `trigger` is not provided (see the
  // ShareFeedbackProps union) — the built-in trigger branch below only reads
  // it in that case.
  triggerLabel,
  state = null,
  previousFeedback,
  previousFeedbackHeading,
  initialStep = "question",
  defaultReasonValues,
  defaultComment,
  questionLabel,
  positiveOptionLabel,
  negativeOptionLabel,
  positivePromptLabel,
  negativePromptLabel,
  reasons,
  positiveCommentPlaceholder,
  negativeCommentPlaceholder,
  disclaimerLabel,
  consentLabel,
  cancelLabel,
  closeLabel,
  submitLabel,
  onSubmit,
  onCancel,
  align = "start",
}: ShareFeedbackProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const [step, setStep] = React.useState<ShareFeedbackStep>(initialStep);
  const [reasonValues, setReasonValues] = React.useState<string[]>(
    defaultReasonValues ?? [],
  );
  const [comment, setComment] = React.useState(defaultComment ?? "");
  const [shareWithUiPath, setShareWithUiPath] = React.useState(true);

  function resetDraft() {
    setStep(initialStep);
    setReasonValues(defaultReasonValues ?? []);
    setComment(defaultComment ?? "");
    setShareWithUiPath(true);
  }

  function setOpen(next: boolean) {
    (controlledOpen == null ? setUncontrolledOpen : onOpenChange)?.(next);
    if (next) {
      resetDraft();
    }
  }

  function handleCancel() {
    onCancel?.();
    setOpen(false);
  }

  function handleSubmit(sentiment: ShareFeedbackSentiment) {
    onSubmit({ sentiment, reasonValues, comment, shareWithUiPath });
    setOpen(false);
  }

  const consentId = React.useId();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {trigger ? (
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      ) : (
        <ShareFeedbackDefaultTrigger
          variant={triggerVariant}
          label={triggerLabel as string}
          state={state}
          previousFeedback={previousFeedback}
          previousFeedbackHeading={previousFeedbackHeading}
        />
      )}
      <PopoverContent
        data-slot="share-feedback-content"
        align={align}
        className="relative w-96 bg-muted"
      >
        {step === "positive" && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-2 right-2"
            aria-label={closeLabel}
            onClick={handleCancel}
          >
            <XIcon />
          </Button>
        )}

        {step === "question" && (
          <div className="flex w-full flex-col items-start gap-4">
            <p className="w-full text-sm font-medium">{questionLabel}</p>
            <div className="flex w-full flex-wrap items-start gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep("positive")}
              >
                <CheckIcon />
                {positiveOptionLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep("negative")}
              >
                <PencilIcon />
                {negativeOptionLabel}
              </Button>
            </div>
          </div>
        )}

        {step !== "question" && (
          <div className="flex w-full flex-col items-start gap-4">
            <p
              className={cn(
                "w-full text-sm font-medium",
                step === "positive" && "pr-8",
              )}
            >
              {step === "positive" ? positivePromptLabel : negativePromptLabel}
            </p>

            {step === "negative" && (
              <ToggleGroup
                type="multiple"
                variant="outline"
                size="sm"
                spacing={2}
                value={reasonValues}
                onValueChange={setReasonValues}
                className="w-full flex-wrap justify-start"
              >
                {reasons.map((reason) => (
                  <ToggleGroupItem
                    key={reason.value}
                    value={reason.value}
                    className="h-auto rounded-full px-2 py-0.5 text-xs"
                  >
                    {reason.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}

            <div className="flex w-full flex-col items-start gap-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  step === "positive"
                    ? positiveCommentPlaceholder
                    : negativeCommentPlaceholder
                }
                rows={3}
              />
              <div className="flex w-full flex-col items-start gap-2">
                <p className="text-xs text-muted-foreground">
                  {disclaimerLabel}
                </p>
                <label
                  htmlFor={consentId}
                  className="flex w-full items-start gap-2 text-sm"
                >
                  <Checkbox
                    id={consentId}
                    checked={shareWithUiPath}
                    onCheckedChange={(checked) =>
                      setShareWithUiPath(checked === true)
                    }
                    className="mt-0.5"
                  />
                  {consentLabel}
                </label>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-start justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                {cancelLabel}
              </Button>
              <Button type="button" onClick={() => handleSubmit(step)}>
                {submitLabel}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface ShareFeedbackNudgeProps
  extends Omit<React.ComponentProps<"div">, "onSelect"> {
  questionLabel: string;
  declineLabel: string;
  acceptLabel: string;
  onDecline: () => void;
  onAccept: () => void;
}

function ShareFeedbackNudge({
  questionLabel,
  declineLabel,
  acceptLabel,
  onDecline,
  onAccept,
  className,
  ...props
}: ShareFeedbackNudgeProps) {
  return (
    <div
      data-slot="share-feedback-nudge"
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-2xl border bg-muted p-4 text-foreground",
        className,
      )}
      {...props}
    >
      <p className="text-sm font-medium">{questionLabel}</p>
      <div className="ml-auto flex flex-wrap items-start justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDecline}>
          {declineLabel}
        </Button>
        <Button type="button" size="sm" onClick={onAccept}>
          {acceptLabel}
        </Button>
      </div>
    </div>
  );
}

export { ShareFeedback, ShareFeedbackNudge };
export type {
  ShareFeedbackProps,
  ShareFeedbackNudgeProps,
  ShareFeedbackPreviousFeedback,
  ShareFeedbackReason,
  ShareFeedbackResult,
  ShareFeedbackSentiment,
  ShareFeedbackStep,
};
