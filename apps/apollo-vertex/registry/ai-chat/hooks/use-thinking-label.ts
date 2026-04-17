"use client";

import { useEffect, useState } from "react";

// English interleaved with each translation so "Thinking…" appears every other cycle
const THINKING_LABELS = [
  "Thinking…",
  "Se gândește…",
  "Thinking…",
  "सोच रहा है…",
  "Thinking…",
  "Denkt nach…",
  "Thinking…",
  "Réflexion…",
];

// How long each label is visible before cycling to the next
const CYCLE_INTERVAL_MS = 3000;

interface UseThinkingLabelOptions {
  /**
   * How long to show the initial "Thinking…" label before starting to cycle.
   * During this phase the label is always THINKING_LABELS[0].
   * @default 2000
   */
  initialDelay?: number;
}

interface UseThinkingLabelResult {
  /** The current label text */
  label: string;
  /** Unique key for AnimatePresence — use this instead of the label string since "Thinking…" appears multiple times in the cycle */
  key: number;
}

/**
 * Returns a thinking label that cycles through translations after an initial delay.
 *
 * - 0 → initialDelay: returns "Thinking…" (English, static)
 * - initialDelay+: cycles through all labels every CYCLE_INTERVAL_MS
 *
 * English is interleaved so the sequence is:
 *   Thinking… → Se gândește… → Thinking… → सोच रहा है… → Thinking… → Denkt nach… → …
 *
 * The cycle wraps around indefinitely, so longer thinking phases just keep rotating.
 */
export function useThinkingLabel({
  initialDelay = 2000,
}: UseThinkingLabelOptions = {}): UseThinkingLabelResult {
  const [index, setIndex] = useState(0);
  const [generation, setGeneration] = useState(0);
  const [isCycling, setIsCycling] = useState(false);

  // Start cycling after the initial delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCycling(true);
      // Jump to index 1 to skip re-showing "Thinking…" which was already visible
      setIndex(1);
      setGeneration((g) => g + 1);
    }, initialDelay);
    return () => clearTimeout(timer);
  }, [initialDelay]);

  // Cycle through labels once cycling has started
  useEffect(() => {
    if (!isCycling) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % THINKING_LABELS.length);
      setGeneration((g) => g + 1);
    }, CYCLE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isCycling]);

  return {
    label: THINKING_LABELS[index] ?? THINKING_LABELS[0],
    key: generation,
  };
}
