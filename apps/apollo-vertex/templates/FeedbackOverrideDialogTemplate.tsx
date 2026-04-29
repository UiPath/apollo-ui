"use client";

import { type FormEvent, useState } from "react";

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

const OVERRIDE_REASONS = [
  { value: "incorrect_information", label: "Incorrect information" },
  { value: "missing_information", label: "Missing information" },
  { value: "formatting", label: "Formatting / clarity" },
  { value: "other", label: "Other" },
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

export function FeedbackOverrideDialogTemplate({
  originalContent = "Patient presents with chest pain radiating to the left arm. ECG shows ST elevation in leads II, III, and aVF.",
  sectionLabel = "Cardiology",
  onSubmit,
}: FeedbackOverrideDialogTemplateProps) {
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
          <Button variant="outline">Override section</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Override {sectionLabel}</DialogTitle>
              <DialogDescription>
                Edit the AI-generated content and tell us why. Your feedback
                helps the agent improve.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="override-content">Corrected content</Label>
                <Textarea
                  id="override-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="override-reason">Reason</Label>
                <Select
                  value={reason}
                  onValueChange={(v) => {
                    if (isOverrideReason(v)) setReason(v);
                  }}
                  required
                >
                  <SelectTrigger id="override-reason">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {OVERRIDE_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="agent-feedback">
                  Feedback to the agent{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="agent-feedback"
                  value={agentFeedback}
                  onChange={(e) => setAgentFeedback(e.target.value)}
                  placeholder="What should the agent have done differently?"
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
                Cancel
              </Button>
              <Button type="submit" disabled={!reason}>
                Save override
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
