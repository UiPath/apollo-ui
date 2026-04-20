"use client";

import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";
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
        className="mt-4 rounded-xl border border-border bg-background shadow-sm overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2
                className="size-3.5 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
            ) : (
              <>
                {canGoBack && onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="size-6 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
                    aria-label="Go back"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  </button>
                )}
                {totalSteps && (
                  <span className="text-xs text-muted-foreground">
                    {step} <span className="opacity-40">{"/"}</span>{" "}
                    {totalSteps}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {canSkip && onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
              >
                {"Skip"}
                <ChevronRight className="size-3" aria-hidden="true" />
              </button>
            )}
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

        {/* Prompt */}
        {prompt && (
          <p className="px-4 pb-3 text-sm font-medium text-foreground">
            {prompt}
          </p>
        )}

        {/* Options */}
        <div className="flex flex-col px-2 pb-3 gap-1">
          {options.map((option) => (
            <motion.button
              key={option.id}
              type="button"
              variants={buttonVariants}
              whileHover={isLoading ? {} : { x: 2 }}
              disabled={isLoading}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-muted text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => onSelect(option)}
            >
              {option.label}
            </motion.button>
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
