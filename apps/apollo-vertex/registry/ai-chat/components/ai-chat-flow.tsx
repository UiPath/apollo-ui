"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import type { FlowOption, FlowStep, ToolResultFlow } from "../utils/ai-chat-utils";

const EASE = [0.22, 1, 0.36, 1] as const;

interface AiChatFlowProps {
  flow: ToolResultFlow;
  onComplete: (answers: { stepId: string; prompt: string; answer: string }[]) => void;
  onDismiss: () => void;
}

export function AiChatFlow({ flow, onComplete, onDismiss }: AiChatFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<{ stepId: string; prompt: string; answer: string }[]>([]);

  const step = flow.steps[stepIndex] as FlowStep;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === flow.steps.length - 1;
  const total = flow.steps.length;

  const handleSelect = (option: FlowOption) => {
    const answer = option.value ?? option.label;
    const updated = [
      ...answers.filter((a) => a.stepId !== step.id),
      { stepId: step.id, prompt: step.prompt, answer },
    ];
    setAnswers(updated);

    if (isLast) {
      onComplete(updated);
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const handleSkip = () => {
    const updated = [
      ...answers.filter((a) => a.stepId !== step.id),
      { stepId: step.id, prompt: step.prompt, answer: "(skipped)" },
    ];
    setAnswers(updated);

    if (isLast) {
      onComplete(updated);
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  return (
    <motion.div
      className="w-full rounded-xl border border-border bg-background shadow-lg overflow-hidden"
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              type="button"
              onClick={handleBack}
              className="size-6 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Go back"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
          )}
          <span className="text-xs text-muted-foreground">
            {stepIndex + 1}
            <span className="opacity-40 mx-1">{"/"}</span>
            {total}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {step.canSkip && (
            <button
              type="button"
              onClick={handleSkip}
              className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
            >
              {"Skip"}
              <ChevronRight className="size-3" aria-hidden="true" />
            </button>
          )}
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

      {/* Prompt + options */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.18, ease: EASE }}
        >
          <p className="px-4 pb-3 text-sm font-medium text-foreground">{step.prompt}</p>
          <div className="flex flex-col px-2 pb-3 gap-1">
            {step.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-muted text-foreground"
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
