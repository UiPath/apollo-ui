"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ChoiceOption } from "../types";

const ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: ENTRANCE_EASE,
      delayChildren: 0.18,
      staggerChildren: 0.05,
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: ENTRANCE_EASE },
  },
};

interface AiChatSuggestionsProps {
  prompt?: string;
  options: ChoiceOption[];
  onSelect: (option: ChoiceOption) => void;
  step?: number;
  totalSteps?: number;
  canSkip?: boolean;
  canGoBack?: boolean;
  isLoading?: boolean;
  onBack?: () => void;
  onSkip?: () => void;
  onDismiss?: () => void;
}

export function AiChatSuggestions({
  prompt,
  options,
  onSelect,
  step,
  totalSteps,
  canSkip,
  canGoBack,
  isLoading = false,
  onBack,
  onSkip,
  onDismiss,
}: AiChatSuggestionsProps) {
  const isMultiStep = step != null;

  if (isMultiStep) {
    return (
      <motion.div
        className="w-full rounded-xl border border-border bg-background shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.25, ease: ENTRANCE_EASE }}
      >
        {/* Header: prompt + controls */}
        <div className="flex items-start gap-3 px-6 pt-6 pb-3">
          <p className="flex-1 text-base font-bold tracking-tight text-foreground">
            {prompt}
          </p>
          <div className="flex items-center gap-4 flex-shrink-0 mt-0.5">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onBack}
                disabled={!canGoBack || !onBack || isLoading}
                className="size-6 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Go back"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              {totalSteps && (
                <span className="text-xs text-muted-foreground px-0.5">
                  {step}
                  <span className="opacity-40 mx-0.5">{"/"}</span>
                  {totalSteps}
                </span>
              )}
              <button
                type="button"
                onClick={onSkip}
                disabled={!canSkip || !onSkip || isLoading}
                className="size-6 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Skip step"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="size-6 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Dismiss"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Options with numbered circles and dividers */}
        <div className="pb-[76px]">
          {options.map((option, i) => (
            <div key={option.id}>
              {i > 0 && (
                <div
                  className="mx-6 border-t border-border"
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                disabled={isLoading}
                className="w-full text-left px-6 py-3.5 text-sm transition-colors hover:bg-muted text-foreground flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => onSelect(option)}
              >
                <span className="size-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold text-secondary-foreground flex-shrink-0 tabular-nums">
                  {i + 1}
                </span>
                {option.label}
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Single-step: original chip style
  return (
    <motion.div
      className="mt-4 space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {prompt && <p className="text-sm text-muted-foreground">{prompt}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <motion.button
            key={option.id}
            type="button"
            variants={buttonVariants}
            whileHover={{ scale: 1.02 }}
            className="h-auto py-2 px-4 text-left max-w-full rounded-full text-xs font-semibold transition-colors border border-input bg-background text-foreground hover:bg-muted"
            onClick={() => onSelect(option)}
          >
            <span className="truncate">{option.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
