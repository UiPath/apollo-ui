"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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
      // Wait until the wrapper has mostly entered before staggering buttons
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
}

export function AiChatSuggestions({
  prompt,
  options,
  onSelect,
}: AiChatSuggestionsProps) {
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
            className={cn(
              "h-auto py-2 px-4 text-left max-w-full rounded-full text-xs font-semibold transition-colors",
              option.recommended
                ? "text-white border-0"
                : "border border-input bg-background text-foreground hover:bg-muted",
            )}
            style={
              option.recommended
                ? { background: "var(--ai-gradient-strong)" }
                : {}
            }
            onClick={() => onSelect(option)}
          >
            <span className="truncate">{option.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
