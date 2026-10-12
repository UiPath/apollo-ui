"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { ASTROID_PATH } from "./astroid-path";

// Mirrors ai-chat's Thinking animation, but the start state is the filled
// Astroid instead of the Autopilot sparkle: the mark fades and rotates out as a
// gradient dot grows in and breathes, under a soft radiating glow.

const FORWARD_DURATION = 0.8;
const REVERSE_DURATION = 0.4;
const PULSE_DURATION = 1.8;
const EASE = [0.83, 0, 0.17, 1] as const;
const CIRCLE_RADIUS = 3;

const PULSE_TRANSITION_ON = {
  opacity: {
    duration: PULSE_DURATION,
    ease: "easeInOut" as const,
    delay: FORWARD_DURATION * 0.5,
    repeat: Number.POSITIVE_INFINITY,
    repeatType: "loop" as const,
  },
  scale: {
    duration: PULSE_DURATION,
    ease: "easeInOut" as const,
    delay: FORWARD_DURATION * 0.5,
    repeat: Number.POSITIVE_INFINITY,
    repeatType: "loop" as const,
  },
};

const PULSE_TRANSITION_OFF = { duration: REVERSE_DURATION * 0.8, ease: EASE };

interface AstroidThinkingProps {
  size?: number;
  className?: string;
  /** Forward (idle → thinking) and hold the pulse when true; reverse to idle when false. */
  isThinking?: boolean;
}

export function AstroidThinking({
  size = 32,
  className,
  isThinking = true,
}: AstroidThinkingProps) {
  const gradientId = useId();

  return (
    <div
      className={`relative inline-block ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Radiating glow ring — breathes with the dot. */}
      <motion.div
        className="pointer-events-none absolute rounded-full"
        style={{
          top: "50%",
          left: "50%",
          width: "55%",
          height: "55%",
          marginTop: "-27.5%",
          marginLeft: "-27.5%",
          background:
            "radial-gradient(circle, rgba(108,90,239,0.4) 0%, rgba(105,199,221,0.18) 55%, transparent 75%)",
        }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={
          isThinking
            ? { opacity: [0.5, 0.9, 0.5], scale: [0.9, 1.1, 0.9] }
            : { opacity: 0, scale: 0.7 }
        }
        transition={isThinking ? PULSE_TRANSITION_ON : PULSE_TRANSITION_OFF}
      />

      <svg
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        className="absolute inset-0 block overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0.5"
            x2="1"
            y2="0.5"
            gradientUnits="objectBoundingBox"
          >
            <stop
              offset="8.79%"
              style={{ stopColor: "var(--ai-gradient-start, #6C5AEF)" }}
            />
            <stop
              offset="91.48%"
              style={{ stopColor: "var(--ai-gradient-end, #69C7DD)" }}
            />
          </linearGradient>
        </defs>

        {/* Filled astroid — rotates and fades out as it hands off to the dot. */}
        <motion.g
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          initial={{ opacity: 1, rotate: 0 }}
          animate={
            isThinking ? { opacity: 0, rotate: 180 } : { opacity: 1, rotate: 0 }
          }
          transition={{
            duration: isThinking ? FORWARD_DURATION : REVERSE_DURATION,
            ease: EASE,
          }}
        >
          <path d={ASTROID_PATH} fill={`url(#${gradientId})`} />
        </motion.g>

        {/* Dot — grows in, then breathes in the steady state. */}
        <motion.g
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          initial={{ scale: 1 }}
          animate={isThinking ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          transition={
            isThinking
              ? {
                  duration: PULSE_DURATION,
                  ease: "easeInOut",
                  delay: FORWARD_DURATION,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                }
              : { duration: REVERSE_DURATION, ease: EASE }
          }
        >
          <motion.circle
            cx={12}
            cy={12}
            r={CIRCLE_RADIUS}
            fill={`url(#${gradientId})`}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={
              isThinking ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }
            }
            transition={{
              duration: isThinking ? FORWARD_DURATION : REVERSE_DURATION,
              ease: EASE,
            }}
          />
        </motion.g>
      </svg>
    </div>
  );
}
