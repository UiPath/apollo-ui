"use client";

import { Astroid } from "./astroid";

interface AiIconProps {
  className?: string;
  size?: number;
  /** Paint with this gradient def id (e.g. "ai-mark-gradient") instead of currentColor. */
  gradientId?: string;
}

/** The AI icon: the filled Astroid mark. Paints with currentColor or a gradient def. */
export function AiIcon({ className, size, gradientId }: AiIconProps) {
  const paint = gradientId ? `url(#${gradientId})` : "currentColor";

  return (
    <Astroid className={className} size={size} fill={paint} strokeWidth={0} />
  );
}
