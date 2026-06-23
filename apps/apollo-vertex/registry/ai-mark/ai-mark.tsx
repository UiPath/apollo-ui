interface AiMarkProps {
  size?: number;
  className?: string;
  /** Paint with this gradient def id (e.g. "ai-mark-gradient") instead of currentColor. */
  gradientId?: string;
}

/**
 * The AI mark: a filled four-pointed star (Lucide's `astroid`, v1.12.0, inlined
 * because the installed lucide-react predates it). Paints with currentColor by
 * default, or a gradient via `gradientId` referencing an SVG <linearGradient> def.
 */
export function AiMark({ size = 24, className, gradientId }: AiMarkProps) {
  const fill = gradientId ? `url(#${gradientId})` : "currentColor";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      className={className}
      aria-hidden="true"
    >
      <path d="M12.983 21.186a1 1 0 0 1-1.966 0 10 10 0 0 0-8.203-8.203 1 1 0 0 1 0-1.966 10 10 0 0 0 8.203-8.203 1 1 0 0 1 1.966 0 10 10 0 0 0 8.203 8.203 1 1 0 0 1 0 1.966 10 10 0 0 0-8.203 8.203" />
    </svg>
  );
}
