"use client";

import { motion } from "framer-motion";
import { useId } from "react";

interface AiChatThinkingProps {
  size?: number;
  className?: string;
  /**
   * When true, plays the forward sequence (idle → thinking) and holds
   * the steady-state pulse. When false, plays the reverse back to idle.
   * Defaults to true so existing usages auto-play on mount.
   */
  isThinking?: boolean;
}

// Timing
const FORWARD_DURATION = 0.8;
const REVERSE_DURATION = 0.4;
const PULSE_DURATION = 1.8;

// Single easing for both directions — quartic ease-in-out, smooth acceleration and deceleration
const EASE = [0.83, 0, 0.17, 1] as const;

// Circle radius in viewBox units. The 24×24 viewBox at 25% target = 6 units diameter = 3 units radius.
const CIRCLE_RADIUS = 3;

// Small sparkle geometric center within the 24×24 viewBox
const SMALL_SPARKLE_CENTER_X = 17.82;
const SMALL_SPARKLE_CENTER_Y = 6.35;
const VIEWBOX_CENTER = 12;

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

export function AiChatThinking({
  size = 32,
  className,
  isThinking = true,
}: AiChatThinkingProps) {
  const gradientId = useId();

  // Framer Motion's x/y on SVG elements are applied as CSS translate in CSS pixels.
  // Convert viewBox-unit deltas into pixel values at the current render size.
  const unit = size / 24;
  const smallSparkleTargetX = (VIEWBOX_CENTER - SMALL_SPARKLE_CENTER_X) * unit;
  const smallSparkleTargetY = (VIEWBOX_CENTER - SMALL_SPARKLE_CENTER_Y) * unit;

  return (
    <div
      className={`relative inline-block ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Radiating glow ring — sized proportionally to the circle, fades in with it */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
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

      {/* SVG stage — holds both layers, no clipping */}
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

        {/* Large sparkle — slow rotation (180°), fades out in place */}
        <motion.g
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
          }}
          initial={{ opacity: 1, rotate: 0 }}
          animate={
            isThinking ? { opacity: 0, rotate: 180 } : { opacity: 1, rotate: 0 }
          }
          transition={{
            duration: isThinking ? FORWARD_DURATION : REVERSE_DURATION,
            ease: EASE,
          }}
        >
          <path
            d="M19.4231 13.2391C15.2592 12.5335 11.9733 9.06719 11.3046 4.67449C11.292 4.59158 11.1901 4.59158 11.1775 4.67449C10.5088 9.06719 7.22293 12.5335 3.05898 13.2391C2.98034 13.2524 2.98034 13.3599 3.05898 13.3732C7.22293 14.0786 10.5088 17.5451 11.1775 21.9378C11.1901 22.0207 11.292 22.0207 11.3046 21.9378C11.9733 17.5451 15.2592 14.0786 19.4231 13.3732C19.5017 13.3599 19.5017 13.2524 19.4231 13.2391ZM15.3321 13.3397C13.2501 13.6924 11.6072 15.4256 11.2728 17.622C11.2665 17.6634 11.2156 17.6634 11.2093 17.622C10.8749 15.4256 9.23198 13.6924 7.15 13.3397C7.11069 13.333 7.11069 13.2793 7.15 13.2726C9.23198 12.9198 10.8749 11.1867 11.2093 8.99032C11.2156 8.94886 11.2665 8.94886 11.2728 8.99032C11.6072 11.1867 13.2501 12.9198 15.3321 13.2726C15.3714 13.2793 15.3714 13.333 15.3321 13.3397Z"
            fill={`url(#${gradientId})`}
          />
        </motion.g>

        {/* Small sparkle — fast independent rotation (720°), translates to center, scales up, fades out */}
        <motion.g
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
          }}
          initial={{ opacity: 1, rotate: 0, x: 0, y: 0, scale: 1 }}
          animate={
            isThinking
              ? {
                  opacity: 0,
                  rotate: 720,
                  x: smallSparkleTargetX,
                  y: smallSparkleTargetY,
                  scale: 1.8,
                }
              : { opacity: 1, rotate: 0, x: 0, y: 0, scale: 1 }
          }
          transition={{
            duration: isThinking ? FORWARD_DURATION : REVERSE_DURATION,
            ease: EASE,
          }}
        >
          <path
            d="M21.9179 6.38045C19.8359 6.73316 18.193 8.4664 17.8586 10.6628C17.8523 10.7042 17.8014 10.7042 17.7951 10.6628C17.4607 8.4664 15.8178 6.73316 13.7358 6.38045C13.6965 6.3738 13.6965 6.32005 13.7358 6.3134C15.8178 5.96062 17.4607 4.22744 17.7951 2.03109C17.8014 1.98964 17.8523 1.98964 17.8586 2.03109C18.193 4.22744 19.8359 5.96062 21.9179 6.3134C21.9572 6.32005 21.9572 6.3738 21.9179 6.38045Z"
            fill={`url(#${gradientId})`}
          />
        </motion.g>

        {/* Circle pulse wrapper — infinite breathing in steady state */}
        <motion.g
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
          }}
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
          {/* Circle — grows from scale 0 / opacity 0 as the sparkle fades out */}
          <motion.circle
            cx={12}
            cy={12}
            r={CIRCLE_RADIUS}
            fill={`url(#${gradientId})`}
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
            }}
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
