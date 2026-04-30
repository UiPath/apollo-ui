"use client";

import { useId } from "react";

interface AiChatInputGlowProps {
  className?: string;
}

export function AiChatInputGlow({ className }: AiChatInputGlowProps) {
  const filterId = useId();
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 561 176"
      preserveAspectRatio="none"
      className={`w-full h-full overflow-visible ${className ?? ""}`}
      aria-hidden="true"
    >
      <defs>
        <filter id={filterId} x="-25%" y="-50%" width="150%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <linearGradient
          id={gradientId}
          x1="375.705"
          y1="97.1886"
          x2="356.926"
          y2="19.642"
          gradientUnits="userSpaceOnUse"
        >
          <stop style={{ stopColor: "var(--ai-gradient-end, #69C7DD)" }} />
          <stop
            offset="1"
            style={{ stopColor: "var(--ai-gradient-start, #6C5AEF)" }}
          />
        </linearGradient>
      </defs>
      <path
        d="M124.909 87.7963L40.0002 119.001L40.0471 121.245L88.6762 130.906C132.72 132.472 223.153 135.555 232.53 135.359C244.251 135.113 315.666 133.619 447.602 128.917C579.537 124.214 504.087 109.289 446.803 90.7685C428.089 88.9151 405.086 89.6999 383 82.3956C360.914 75.0913 357.352 70.9186 338.481 61.6054C319.611 52.2922 308.392 55.8035 286.366 51.4103C264.341 47.0172 245.606 44.1934 181.911 40.9756C118.215 37.7579 138.966 43.5125 129.849 43.7033C122.556 43.8559 113.044 50.082 109.2 53.176L124.454 66.084L124.909 87.7963Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.25"
        filter={`url(#${filterId})`}
      />
    </svg>
  );
}
