/** Lucide's `astroid` icon path (v1.12.0), a four-pointed sharp star. */
export const ASTROID_PATH =
  "M12.983 21.186a1 1 0 0 1-1.966 0 10 10 0 0 0-8.203-8.203 1 1 0 0 1 0-1.966 10 10 0 0 0 8.203-8.203 1 1 0 0 1 1.966 0 10 10 0 0 0 8.203 8.203 1 1 0 0 1 0 1.966 10 10 0 0 0-8.203 8.203";

interface AstroidProps {
  size?: number;
  className?: string;
  /** Override the stroke, e.g. "url(#id)" for a gradient. Defaults to currentColor. */
  stroke?: string;
  /** Fill the shape (e.g. "currentColor" or "url(#id)"). Pair with strokeWidth 0. */
  fill?: string;
  strokeWidth?: number;
}

/**
 * The AI Identity mark: the Astroid icon, inlined because the installed
 * lucide-react (0.577.0) predates it. Behaves like any Lucide icon: outline via
 * stroke, or filled via fill (set strokeWidth 0); either takes a solid color
 * (currentColor) or a gradient (url).
 */
export function Astroid({
  size = 24,
  className,
  stroke,
  fill = "none",
  strokeWidth = 2,
}: AstroidProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke ?? "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ASTROID_PATH} />
    </svg>
  );
}
