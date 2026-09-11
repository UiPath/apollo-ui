"use client";

import { useStore } from "@tanstack/react-form";
import type { LucideIcon } from "lucide-react";
import { Cloud, HelpCircle, KeyRound, Shield } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { GLASS_CLASSES } from "@/components/ui/card";
import { useAppForm } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  INTAKE_QUESTIONS,
  type IntakeAnswers,
  type IntakeQuestion,
} from "../data";
import { useIntakeState } from "./intake-state-context";
import { JourneyPreview } from "./JourneyPreview";

// Icons key off the question id, not its (partly unresolved) wording, so
// they stay stable regardless of which strings are still placeholders.
const QUESTION_ICON: Record<IntakeQuestion["id"], LucideIcon> = {
  Q1: Shield,
  Q2: KeyRound,
  Q3: Cloud,
  Q4: HelpCircle,
  Q5: HelpCircle,
};

const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

function findQuestion(id: IntakeQuestion["id"]): IntakeQuestion {
  const question = INTAKE_QUESTIONS.find((q) => q.id === id);
  if (!question) throw new Error(`Unknown intake question id: ${id}`);
  return question;
}

interface QuestionRowProps {
  question: IntakeQuestion;
  /** Whether this question currently has an answer. The consequence line
   * only renders once it does. */
  answered: boolean;
  /** The consequence line to render beneath the answer, passed explicitly
   * rather than read from question.consequence directly, since Q1's line
   * depends on which answer was given (see the report). Absent when this
   * question has no consequence line for the current answer. */
  consequence?: string;
  children: ReactNode;
}

function QuestionRow({
  question,
  answered,
  consequence,
  children,
}: QuestionRowProps) {
  const Icon = QUESTION_ICON[question.id];
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Icon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        {children}
        {answered && consequence != null && (
          <p className="mt-2 text-xs text-muted-foreground">{consequence}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Data and Info, the third phase. Q1 arrives unanswered; Q2 through Q4 only
 * exist once Q1 is answered Yes (see the report on prompt 06's original
 * instruction, reversed here). The journey preview below reads the same
 * live answers this form holds, so there is exactly one place a change
 * happens.
 */
export function DataInfoStep() {
  const q1 = findQuestion("Q1");
  const q2 = findQuestion("Q2");
  const q3 = findQuestion("Q3");
  const q4 = findQuestion("Q4");

  const form = useAppForm({
    defaultValues: {
      Q1: "",
      Q2: "",
      Q3: "",
      Q4: "",
    },
  });

  const values = useStore(form.store, (s) => s.values);
  const q1Answered = values.Q1 !== "";
  const revealLater = values.Q1 === "yes";

  // Q2 through Q4 only exist once Q1 is Yes. Leaving Q1 or answering No
  // clears them back to unanswered instead of leaving a stale seeded value
  // sitting in a field the user can no longer see; returning to Yes
  // restores the seed, not necessarily whatever they held before hiding
  // (see the report).
  useEffect(() => {
    if (revealLater) {
      form.setFieldValue("Q2", q2.answer);
      form.setFieldValue("Q3", q3.answer);
      form.setFieldValue("Q4", q4.answer);
    } else {
      form.setFieldValue("Q2", "");
      form.setFieldValue("Q3", "");
      form.setFieldValue("Q4", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealLater]);

  // No token for a question never asked (Q2 through Q4, while Q1 isn't
  // Yes): personalData reflects Q1's own answer, absent while Q1 is
  // unanswered; systemAccess is only ever present once Q2 exists.
  const answers: IntakeAnswers = {};
  if (values.Q1 === "yes" || values.Q1 === "no") {
    answers.personalData = values.Q1;
  }
  if (revealLater) {
    answers.systemAccess = values.Q2 === "yes" ? "yes" : "no";
  }

  // Mirrors into shared state so Review (the journey model's second render,
  // plus its own summary line) reflects a live edit here rather than the
  // static seed. The form stays this step's own source of truth; this is a
  // one-way echo, same shape as RequestEnvelope's own choose() mirroring
  // into envelopeOverrides.
  const { setDataInfoValues } = useIntakeState();
  useEffect(() => {
    setDataInfoValues(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.Q1, values.Q2, values.Q3, values.Q4]);

  return (
    <div className="w-full space-y-6">
      <div className={cn(GLASS_CLASSES, "divide-y overflow-hidden rounded-xl")}>
        <QuestionRow
          question={q1}
          answered={q1Answered}
          consequence={values.Q1 === "yes" ? q1.consequence : q1.consequenceNo}
        >
          <form.AppField name="Q1">
            {(field) => (
              <field.RadioGroupField
                label={q1.question}
                description={q1.helperText}
                options={YES_NO_OPTIONS}
              />
            )}
          </form.AppField>
        </QuestionRow>
        {revealLater && (
          <>
            <QuestionRow
              question={q2}
              answered={values.Q2 !== ""}
              consequence={q2.consequence}
            >
              <form.AppField name="Q2">
                {(field) => (
                  <field.RadioGroupField
                    label={q2.question}
                    options={YES_NO_OPTIONS}
                  />
                )}
              </form.AppField>
            </QuestionRow>
            <QuestionRow
              question={q3}
              answered={values.Q3 !== ""}
              consequence={q3.consequence}
            >
              <form.AppField name="Q3">
                {(field) => (
                  <field.SelectField
                    label={q3.question}
                    options={[{ value: q3.answer, label: q3.answer }]}
                  />
                )}
              </form.AppField>
            </QuestionRow>
            <QuestionRow
              question={q4}
              answered={values.Q4 !== ""}
              consequence={q4.consequence}
            >
              <form.AppField name="Q4">
                {(field) => (
                  <field.RadioGroupField
                    label={q4.question}
                    options={YES_NO_OPTIONS}
                  />
                )}
              </form.AppField>
            </QuestionRow>
          </>
        )}
      </div>

      <JourneyPreview answers={answers} variant="timeline" />
    </div>
  );
}
