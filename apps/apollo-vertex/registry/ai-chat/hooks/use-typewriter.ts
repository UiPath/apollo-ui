"use client";

import { useEffect, useReducer, useRef } from "react";

interface UseTypewriterOptions {
  /** Characters per second to reveal. Set to 0 or negative to disable (returns full text instantly). */
  cps: number;
  /**
   * Whether the source text is currently being streamed (still growing).
   * When false, the typewriter accelerates 2× to drain any remaining buffered characters.
   */
  isStreaming: boolean;
}

interface UseTypewriterResult {
  /** The substring of `text` that should currently be visible. */
  displayedText: string;
  /** True while the typewriter is still revealing characters (i.e., displayedText.length < text.length). */
  isAnimating: boolean;
}

/**
 * Throttles a string's reveal to a configurable characters-per-second rate.
 * Designed for AI chat assistant messages whose text streams in faster than
 * a human can comfortably read — ChatGPT, Claude, and other major products
 * all throttle visible reveal to ~30–50 cps regardless of underlying stream speed.
 *
 * Behavior:
 *   - Mounts in "instant" mode (full text visible) when not streaming or when cps ≤ 0
 *   - Mounts in "typewriter" mode (starts at length 0) when streaming and cps > 0
 *   - When `isStreaming` flips from true → false, accelerates to 2× speed to drain
 *   - Stops the rAF chain when caught up; restarts naturally when text grows
 *   - Clamps `displayedLength` if text shrinks (e.g., regenerate)
 */
export function useTypewriter(
  text: string,
  { cps, isStreaming }: UseTypewriterOptions,
): UseTypewriterResult {
  const displayedLengthRef = useRef<number>(
    cps > 0 && isStreaming ? 0 : text.length,
  );
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  // Clamp if text shrunk (e.g., regenerate replaced the message with shorter content)
  if (displayedLengthRef.current > text.length) {
    displayedLengthRef.current = text.length;
  }

  useEffect(() => {
    // Disabled — show full text instantly
    if (cps <= 0) {
      if (displayedLengthRef.current !== text.length) {
        displayedLengthRef.current = text.length;
        forceRender();
      }
      return;
    }

    // Already caught up — nothing to animate until text grows
    if (displayedLengthRef.current >= text.length) {
      return;
    }

    let rafId: number | null = null;
    let lastTime = performance.now();
    // Drain mode: when streaming has completed, catch up to the buffered text 2× faster
    const speedMultiplier = isStreaming ? 1 : 2;

    const tick = (now: number) => {
      const target = text.length;
      if (displayedLengthRef.current >= target) {
        // Caught up — let the rAF chain end
        rafId = null;
        return;
      }

      const delta = (now - lastTime) / 1000;
      // Floor to integer characters so we only re-render when at least one new char is ready;
      // accumulate `lastTime` only when we actually advance, otherwise the next frame compounds
      const advance = Math.floor(cps * speedMultiplier * delta);
      if (advance > 0) {
        lastTime = now;
        displayedLengthRef.current = Math.min(
          target,
          displayedLengthRef.current + advance,
        );
        forceRender();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [text, isStreaming, cps]);

  return {
    displayedText: text.slice(0, displayedLengthRef.current),
    isAnimating: displayedLengthRef.current < text.length,
  };
}
