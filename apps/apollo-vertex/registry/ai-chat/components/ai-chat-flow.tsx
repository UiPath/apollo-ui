"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { FlowOption, ToolResultFlow } from "../utils/ai-chat-utils";

const EASE = [0.22, 1, 0.36, 1] as const;

interface AiChatFlowProps {
  flow: ToolResultFlow;
  onComplete: (
    answers: { stepId: string; prompt: string; answer: string }[],
  ) => void;
  onDismiss: () => void;
  /** Called on mount and on every step change with a resolver for the current step's free-text answer. */
  onFreeTextReady?: (resolve: (text: string) => void) => void;
}

export function AiChatFlow({
  flow,
  onComplete,
  onDismiss,
  onFreeTextReady,
}: AiChatFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<
    { stepId: string; prompt: string; answer: string }[]
  >([]);

  const step = flow.steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === flow.steps.length - 1;
  const total = flow.steps.length;

  const advance = (
    updated: { stepId: string; prompt: string; answer: string }[],
  ) => {
    if (isLast) {
      onComplete(updated);
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  // Notify parent with a fresh resolver whenever the step changes
  useEffect(() => {
    onFreeTextReady?.((text) => {
      const updated = [
        ...answers.filter((a) => a.stepId !== step.id),
        { stepId: step.id, prompt: step.prompt, answer: text },
      ];
      setAnswers(updated);
      advance(updated);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  const handleSelect = (option: FlowOption) => {
    const answer = option.value ?? option.label;
    const updated = [
      ...answers.filter((a) => a.stepId !== step.id),
      { stepId: step.id, prompt: step.prompt, answer },
    ];
    setAnswers(updated);
    advance(updated);
  };

  const handleBack = () => setStepIndex((i) => Math.max(0, i - 1));

  const handleSkip = () => {
    const updated = [
      ...answers.filter((a) => a.stepId !== step.id),
      { stepId: step.id, prompt: step.prompt, answer: "(skipped)" },
    ];
    setAnswers(updated);
    advance(updated);
  };

  return (
    <motion.div
      className="w-full rounded-xl border border-border bg-background shadow-lg overflow-hidden"
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      {/* Header: prompt + controls */}
      <div className="flex items-start gap-3 px-6 pt-6 pb-3">
        <AnimatePresence mode="wait">
          <motion.p
            key={step.id}
            className="flex-1 text-base font-bold tracking-tight text-foreground"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: EASE }}
          >
            {step.prompt}
          </motion.p>
        </AnimatePresence>

        <div className="flex items-center gap-4 flex-shrink-0 mt-0.5">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleBack}
              disabled={isFirst}
              className="size-6 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Go back"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <span className="text-xs text-muted-foreground px-0.5">
              {stepIndex + 1}
              <span className="opacity-40 mx-0.5">{"/"}</span>
              {total}
            </span>
            <button
              type="button"
              onClick={handleSkip}
              disabled={isLast}
              className="size-6 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Go forward"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="size-6 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Dismiss"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Options */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          className="pb-[76px]"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.18, ease: EASE }}
        >
          {step.options.map((option, i) => (
            <div key={option.id}>
              {i > 0 && (
                <div
                  className="mx-6 border-t border-border"
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                className="w-full text-left px-6 py-3.5 text-sm transition-colors hover:bg-muted text-foreground flex items-center gap-3"
                onClick={() => handleSelect(option)}
              >
                <span className="size-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold text-secondary-foreground flex-shrink-0 tabular-nums">
                  {i + 1}
                </span>
                {option.label}
              </button>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
