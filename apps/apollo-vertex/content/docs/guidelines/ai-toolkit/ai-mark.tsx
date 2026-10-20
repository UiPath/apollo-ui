import type { CSSProperties, ReactNode } from "react";
import { AiIcon } from "./ai-icon";

function MarkCard({
  label,
  children,
  surfaceStyle,
}: {
  label: string;
  children: ReactNode;
  surfaceStyle?: CSSProperties;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div
        className="flex min-h-24 items-center justify-center rounded-lg bg-muted/30 px-4 py-8"
        style={surfaceStyle}
      >
        {children}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/** The AI Identity mark: astroid icon + wordmark, in gradient and solid fills. */
export function AiMark() {
  return (
    <div className="my-6 grid gap-4 sm:grid-cols-2">
      {/* Gradient stroke definition, shared by the gradient mark. */}
      <svg width={0} height={0} aria-hidden="true" className="absolute">
        <defs>
          <linearGradient
            id="ai-mark-gradient"
            x1="2"
            y1="4"
            x2="22"
            y2="20"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="var(--ai-gradient-start)" />
            <stop offset="1" stopColor="var(--ai-gradient-end)" />
          </linearGradient>
        </defs>
      </svg>

      <MarkCard label="Gradient">
        <div className="flex items-center gap-2">
          <AiIcon size={20} gradientId="ai-mark-gradient" />
          <span
            className="text-2xl font-bold leading-none tracking-tight"
            style={{
              backgroundImage: "var(--ai-gradient-text)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            AI Identity
          </span>
        </div>
      </MarkCard>

      <MarkCard label="Solid fill">
        <div className="flex items-center gap-2 text-foreground">
          <AiIcon size={20} />
          <span className="text-2xl font-bold leading-none tracking-tight">
            AI Identity
          </span>
        </div>
      </MarkCard>
    </div>
  );
}
