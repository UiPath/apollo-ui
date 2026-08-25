"use client";

import {
  EllipsisVerticalIcon,
  MessageCircleIcon,
  PencilIcon,
  StickyNoteIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShareFeedback,
  ShareFeedbackNudge,
  type ShareFeedbackResult,
  type ShareFeedbackSentiment,
} from "@/components/ui/share-feedback";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";

export function ShareFeedbackTemplate() {
  return (
    <LocaleProvider>
      <ShareFeedbackTemplateContent />
    </LocaleProvider>
  );
}

function ShareFeedbackTemplateContent() {
  const { t } = useTranslation();

  const reasons = [
    {
      value: "rule-incorrect",
      label: t("share_feedback_reason_rule_incorrect"),
    },
    {
      value: "rule-applied-incorrectly",
      label: t("share_feedback_reason_rule_applied_incorrectly"),
    },
    { value: "wrong-value", label: t("share_feedback_reason_wrong_value") },
    {
      value: "value-not-found",
      label: t("share_feedback_reason_value_not_found"),
    },
  ];

  const sharedProps = {
    questionLabel: t("share_feedback_question"),
    positiveOptionLabel: t("share_feedback_positive_option"),
    negativeOptionLabel: t("share_feedback_negative_option"),
    positivePromptLabel: t("share_feedback_positive_prompt"),
    negativePromptLabel: t("share_feedback_negative_prompt"),
    positiveCommentPlaceholder: t("share_feedback_positive_placeholder"),
    negativeCommentPlaceholder: t("share_feedback_negative_placeholder"),
    cancelLabel: t("share_feedback_cancel"),
    closeLabel: t("close"),
    submitLabel: t("share_feedback_submit"),
    reasons,
  };

  // eslint-disable-next-line no-console -- demo-only, illustrates the submit payload
  const handleSubmit = (result: ShareFeedbackResult) =>
    console.log("share-feedback submit", result);

  // Anchors the always-open popovers in the flow section without showing a trigger button.
  const hiddenFlowTrigger = <span aria-hidden="true" className="invisible" />;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">
          {t("share_feedback_section_triggers_heading")}
        </h2>

        <div className="flex flex-row flex-wrap justify-between gap-6">
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-sm font-medium text-foreground">
              {t("share_feedback_demo_icon_trigger_label")}
            </p>
            <ShareFeedback
              {...sharedProps}
              triggerVariant="icon"
              triggerLabel={t("share_feedback_trigger_label")}
              disclaimerLabel={t("share_feedback_disclaimer_admin_team")}
              consentLabel={t("share_feedback_consent_improve")}
              onSubmit={handleSubmit}
            />
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <p className="text-sm font-medium text-foreground">
              {t("share_feedback_demo_icon_label_trigger_label")}
            </p>
            <ShareFeedback
              {...sharedProps}
              triggerVariant="icon-label"
              triggerLabel={t("share_feedback_trigger_label")}
              disclaimerLabel={t("share_feedback_disclaimer_admin_team")}
              consentLabel={t("share_feedback_consent_improve")}
              onSubmit={handleSubmit}
            />
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <p className="text-sm font-medium text-foreground">
              {t("share_feedback_demo_link_trigger_label")}
            </p>
            <ShareFeedback
              {...sharedProps}
              triggerVariant="link"
              triggerLabel={t("share_feedback_trigger_label")}
              disclaimerLabel={t("share_feedback_disclaimer_admin_team")}
              consentLabel={t("share_feedback_consent_improve")}
              onSubmit={handleSubmit}
            />
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <p className="text-sm font-medium text-foreground">
              {t("share_feedback_demo_menu_item_label")}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={t("share_feedback_menu_trigger_label")}
                >
                  <EllipsisVerticalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>
                  <PencilIcon />
                  {t("share_feedback_menu_edit_inputs")}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <StickyNoteIcon />
                  {t("share_feedback_menu_add_note")}
                </DropdownMenuItem>
                <ShareFeedback
                  {...sharedProps}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <MessageCircleIcon />
                      {t("share_feedback_trigger_label")}
                    </DropdownMenuItem>
                  }
                  disclaimerLabel={t("share_feedback_disclaimer_admin_team")}
                  consentLabel={t("share_feedback_consent_improve")}
                  onSubmit={handleSubmit}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">
          {t("share_feedback_section_flow_heading")}
        </h2>

        <div className="flex flex-col gap-48">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">
              {t("share_feedback_demo_flow_question_label")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("share_feedback_demo_flow_question_output_note")}
            </p>
            <ShareFeedback
              {...sharedProps}
              trigger={hiddenFlowTrigger}
              initialStep="question"
              open
              onOpenChange={() => {}}
              // This demo is just a static reference for the question step, so the
              // options that would advance it to positive/negative are disabled.
              disableQuestionOptions
              disclaimerLabel={t("share_feedback_disclaimer_admin_team")}
              consentLabel={t("share_feedback_consent_improve")}
              onSubmit={handleSubmit}
            />
          </div>

          <div className="flex flex-row gap-8">
            {(
              [
                ["positive", "share_feedback_demo_flow_positive_label"],
                ["negative", "share_feedback_demo_flow_negative_label"],
              ] as const
            ).map(([flowStep, labelKey]) => (
              <div key={flowStep} className="flex flex-1 flex-col gap-2">
                <p className="text-sm font-medium text-foreground">
                  {t(labelKey)}
                </p>
                <ShareFeedback
                  {...sharedProps}
                  trigger={hiddenFlowTrigger}
                  initialStep={flowStep}
                  open
                  onOpenChange={() => {}}
                  disclaimerLabel={t("share_feedback_disclaimer_admin_team")}
                  consentLabel={t("share_feedback_consent_improve")}
                  onSubmit={handleSubmit}
                />
                {flowStep === "negative" && (
                  <>
                    {/* Reserves space for the open popover card above, which floats via a
                        Portal and doesn't occupy flow height on its own, so this caption
                        renders below it instead of underneath it. Re-check this offset if
                        the negative card's content changes. */}
                    <div className="h-[22rem]" aria-hidden="true" />
                    <p className="text-xs text-muted-foreground">
                      {t("share_feedback_demo_flow_negative_reasons_note")}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">
          {t("share_feedback_section_indicator_heading")}
        </h2>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-6">
            {(
              [
                [
                  "positive" as const,
                  "share_feedback_demo_indicator_positive_label",
                  {
                    comment: t(
                      "share_feedback_demo_previous_feedback_positive_comment",
                    ),
                    author: "Sam Torres",
                    timestamp: t(
                      "share_feedback_demo_previous_feedback_recent_timestamp",
                    ),
                  },
                ],
                [
                  "negative" as const,
                  "share_feedback_demo_indicator_negative_label",
                  {
                    comment: t(
                      "share_feedback_demo_previous_feedback_negative_comment",
                    ),
                    author: "Alice Miller",
                    timestamp: t(
                      "share_feedback_demo_previous_feedback_older_timestamp",
                    ),
                  },
                ],
              ] as const
            ).map(([state, labelKey, previousFeedback]) => (
              <div key={labelKey} className="flex flex-col items-start gap-2">
                <p className="text-sm font-medium text-foreground">
                  {t(labelKey)}
                </p>
                <ShareFeedback
                  {...sharedProps}
                  triggerVariant="icon"
                  triggerLabel={t("share_feedback_trigger_label")}
                  state={state as ShareFeedbackSentiment}
                  previousFeedback={previousFeedback}
                  previousFeedbackHeading={t(
                    "share_feedback_previous_feedback_heading",
                  )}
                  disclaimerLabel={t("share_feedback_disclaimer_admin_team")}
                  consentLabel={t("share_feedback_consent_improve")}
                  onSubmit={handleSubmit}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">
          {t("share_feedback_section_nudge_heading")}
        </h2>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {t("share_feedback_demo_nudge_description")}
          </p>
          <div className="flex flex-col gap-4">
            <div className="max-w-lg">
              <NudgeDemo sharedProps={sharedProps} onSubmit={handleSubmit} />
            </div>
            <div className="max-w-xs">
              <NudgeDemo sharedProps={sharedProps} onSubmit={handleSubmit} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

interface NudgeDemoProps {
  sharedProps: Omit<
    React.ComponentProps<typeof ShareFeedback>,
    | "triggerLabel"
    | "disclaimerLabel"
    | "consentLabel"
    | "onSubmit"
    | "trigger"
    | "triggerVariant"
    | "open"
    | "onOpenChange"
    | "initialStep"
    | "defaultReasonValues"
    | "defaultComment"
    | "state"
  >;
  onSubmit: (result: ShareFeedbackResult) => void;
}

function NudgeDemo({ sharedProps, onSubmit }: NudgeDemoProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);

  if (dismissed) {
    return (
      <ShareFeedback
        {...sharedProps}
        open={open}
        onOpenChange={setOpen}
        triggerVariant="icon-label"
        triggerLabel={t("share_feedback_trigger_label")}
        initialStep="negative"
        defaultReasonValues={["value-not-found"]}
        defaultComment={t("share_feedback_negative_placeholder")}
        disclaimerLabel={t("share_feedback_disclaimer_admin_team")}
        consentLabel={t("share_feedback_consent_improve")}
        onSubmit={onSubmit}
      />
    );
  }

  return (
    <ShareFeedbackNudge
      questionLabel={t("share_feedback_nudge_question")}
      declineLabel={t("share_feedback_nudge_decline")}
      acceptLabel={t("share_feedback_nudge_accept")}
      onDecline={() => setDismissed(true)}
      onAccept={() => {
        setDismissed(true);
        setOpen(true);
      }}
    />
  );
}
