"use client";

import { useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { ATTENTION_ARM_DELAY, ATTENTION_SWEEP } from "./motion";

/**
 * A single attention pass over an AI affordance: one sheen sweeps across it
 * shortly after arrival, then it settles and never runs again.
 *
 * TODO(apollo-vertex): missing primitive, a one-shot arrival treatment in the
 * AI toolkit. `registry/ai-glow` is the right visual family but is entirely
 * static (no motion, no keyframes), and `ai-chat-input-glow` likewise;
 * `AiChatThinking` animates but is a looping busy-state indicator, not an
 * arrival cue. Replace this with the shared primitive once the toolkit ships
 * one, rather than growing this local version.
 *
 * Driven by a CSS keyframe rather than by Framer Motion, following
 * `ai-chat-loading`'s own shimmer: a percentage `x` handed to Framer Motion
 * snaps to its end value instead of interpolating, and its completion
 * callback never fires, which leaves the overlay parked on screen forever.
 * A keyframe also lets the sweep take its curve straight from the theme's
 * `--ease-out-quint` token instead of a duplicated tuple. Timing still comes
 * from the motion module, so no duration is written here.
 *
 * Render as a child of a `relative` element; it covers the parent, is
 * `aria-hidden`, and never takes pointer events.
 */
interface AiAttentionProps {
  /**
   * Arms the pass. Flipping this false and back true re-arms it, which is
   * how a phase re-entry gets a fresh pass while a re-render does not.
   */
  armed: boolean;
  /**
   * Suppresses the pass outright, for when the surface it would point at is
   * already open and so needs no pointing at.
   */
  suppressed?: boolean;
}

const SWEEP_KEYFRAMES = `
@keyframes ap-claim-attention {
  from { transform: translateX(-150%); }
  to { transform: translateX(250%); }
}`;

export function AiAttention({ armed, suppressed = false }: AiAttentionProps) {
  const reduceMotion = useReducedMotion();
  const [spent, setSpent] = useState(false);

  // Re-arming resets the pass; a plain re-render does not, because `armed`
  // has not changed.
  useEffect(() => {
    if (armed) setSpent(false);
  }, [armed]);

  // Under reduced motion the rest state *is* the final state, so there is
  // nothing to render rather than something to render faster.
  if (reduceMotion || suppressed || !armed || spent) return null;

  const sweep: CSSProperties = {
    animationName: "ap-claim-attention",
    animationDuration: `${ATTENTION_SWEEP.duration}s`,
    animationDelay: `${ATTENTION_ARM_DELAY}s`,
    animationTimingFunction: "var(--ease-out-quint)",
    animationIterationCount: 1,
    animationFillMode: "both",
  };

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-sm"
    >
      <style>{SWEEP_KEYFRAMES}</style>
      <span
        className="absolute inset-y-0 w-1/2 bg-linear-to-r from-transparent via-primary/25 to-transparent"
        style={sweep}
        onAnimationEnd={() => setSpent(true)}
      />
    </span>
  );
}
