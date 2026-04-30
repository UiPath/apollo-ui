"use client";

import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";

const OVERRIDE_REASONS = [
  { value: "incorrect_information", labelKey: "feedback_reason_incorrect" },
  { value: "missing_information", labelKey: "feedback_reason_missing" },
  { value: "formatting", labelKey: "feedback_reason_formatting" },
  { value: "other", labelKey: "feedback_reason_other" },
] as const;

type OverrideReason = (typeof OVERRIDE_REASONS)[number]["value"];

function isOverrideReason(value: string): value is OverrideReason {
  return OVERRIDE_REASONS.some((r) => r.value === value);
}

interface FeedbackOverrideDialogTemplateProps {
  /** The original AI-generated content the user is editing. */
  originalContent?: string;
  /** Section or field label shown in the dialog header. */
  sectionLabel?: string;
  /** Called when the user saves the override. */
  onSubmit?: (override: {
    overriddenContent: string;
    reason: OverrideReason;
    agentFeedback: string;
  }) => void;
}

export function FeedbackOverrideDialogTemplate(
  props: FeedbackOverrideDialogTemplateProps,
) {
  return (
    <LocaleProvider>
      <FeedbackOverrideDialogTemplateContent {...props} />
    </LocaleProvider>
  );
}

function FeedbackOverrideDialogTemplateContent({
  originalContent = "Patient presents with chest pain radiating to the left arm. ECG shows ST elevation in leads II, III, and aVF.",
  sectionLabel = "Cardiology",
  onSubmit,
}: FeedbackOverrideDialogTemplateProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(originalContent);
  const [reason, setReason] = useState<OverrideReason | "">("");
  const [agentFeedback, setAgentFeedback] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reason) return;
    onSubmit?.({
      overriddenContent: content,
      reason,
      agentFeedback,
    });
    setOpen(false);
  }

  return (
    <div className="flex items-center justify-center p-12">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">{t("feedback_override_section")}</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {t("feedback_override_dialog_title", { section: sectionLabel })}
              </DialogTitle>
              <DialogDescription>
                {t("feedback_override_dialog_description")}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="override-content">
                  {t("feedback_corrected_content")}
                </Label>
                <Textarea
                  id="override-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="override-reason">
                  {t("feedback_reason_label")}
                </Label>
                <Select
                  value={reason}
                  onValueChange={(v) => {
                    if (isOverrideReason(v)) setReason(v);
                  }}
                  required
                >
                  <SelectTrigger id="override-reason">
                    <SelectValue
                      placeholder={t("feedback_select_reason_placeholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {OVERRIDE_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {t(r.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="agent-feedback">
                  {t("feedback_to_agent_label")}{" "}
                  <span className="text-muted-foreground">
                    ({t("optional")})
                  </span>
                </Label>
                <Textarea
                  id="agent-feedback"
                  value={agentFeedback}
                  onChange={(e) => setAgentFeedback(e.target.value)}
                  placeholder={t("feedback_to_agent_placeholder")}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={!reason}>
                {t("feedback_save_override")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
