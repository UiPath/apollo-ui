"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { AiChatThinking } from "./ai-chat-thinking";

// Quartic ease-out — same curve used inside AiChatThinking for consistency
const ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;
const ENTRANCE_DURATION = 0.5;
// Text appears after the icon's morph completes (FORWARD_DURATION in AiChatThinking is 0.8s) plus a small gap
const TEXT_DELAY = 0.9;
const TEXT_DURATION = 0.3;
// Pulls the text left so it tucks under the icon's trailing glow rather than sitting flush
const TEXT_OVERLAP_PX = -7;

// TODO: Progressive thinking states
// The indicator should become more informative as latency grows, and should
// reflect what the agent is actually doing (not just that it is busy):
//
//   < 500ms   No indicator — avoids flicker on fast responses
//   500ms–2s  Static "Thinking…" + shimmer (current)
//   2s+       Contextual label — text reflects the current operation
//               (e.g. "Reading document…", "Running automation…")
//   4s+       Step-level UI — surfaces discrete agent actions as they occur,
//               so the user understands what the agent is doing on their behalf
//
// Labels will be caller-supplied once the state model is defined, so the
// component stays agnostic to the specific agent and its toolset.
export function AiChatLoading() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const thinkingLabel = t("thinking");

  const shimmerStyle: CSSProperties = prefersReducedMotion
    ? {}
    : {
        display: "inline-block",
        backgroundImage: `linear-gradient(90deg, var(--muted-foreground) 0%, var(--muted-foreground) 30%, var(--ai-gradient-start, #6C5AEF) 42%, var(--foreground) 50%, var(--muted-foreground) 58%, var(--muted-foreground) 70%, var(--muted-foreground) 100%)`,
        backgroundSize: "200% 100%",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        animation: "ap-chat-loading-shimmer 2.4s linear infinite",
      };

  return (
    <motion.div
      role="status"
      aria-label={thinkingLabel}
      className="flex justify-start py-2"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: ENTRANCE_DURATION, ease: ENTRANCE_EASE }}
    >
      {!prefersReducedMotion && (
        <style>{`
          @keyframes ap-chat-loading-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      )}
      <div className="flex items-center gap-0">
        <AiChatThinking size={40} isThinking />
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: TEXT_DURATION,
            delay: TEXT_DELAY,
            ease: ENTRANCE_EASE,
          }}
          className="flex items-center"
          style={{ marginLeft: TEXT_OVERLAP_PX }}
        >
          <span
            className="text-sm font-medium leading-snug whitespace-nowrap"
            style={shimmerStyle}
          >
            {`${thinkingLabel}\u2026`}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
