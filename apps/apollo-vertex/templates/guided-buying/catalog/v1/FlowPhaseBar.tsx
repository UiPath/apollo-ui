import { Check } from "lucide-react";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

export const CATALOG_PHASES = ["Details", "Choose", "Review", "Done"] as const;
export const NON_CATALOG_PHASES = ["Details", "Sent"] as const;

interface FlowPhaseBarProps {
  phases: readonly string[];
  /** 0-based index of the currently active phase. */
  currentIndex: number;
  /** Called with the phase index when the user clicks a completed phase. */
  onClickPhase?: (index: number) => void;
}

/**
 * Slim linear progress indicator for the Buy flow. Completed phases show a
 * check and are clickable (acts as back navigation). Current phase has a
 * filled dot. Upcoming phases are muted and non-interactive.
 */
export function FlowPhaseBar({
  phases,
  currentIndex,
  onClickPhase,
}: FlowPhaseBarProps) {
  return (
    <div
      className="flex items-center justify-center"
      role="list"
      aria-label="Progress"
    >
      {phases.map((label, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const clickable = done && !!onClickPhase;

        const dot = done ? (
          <Check className="size-3 shrink-0" strokeWidth={2.5} aria-hidden />
        ) : active ? (
          <span
            className="inline-block size-1.5 shrink-0 rounded-full bg-current"
            aria-hidden
          />
        ) : (
          <span
            className="inline-block size-1.5 shrink-0 rounded-full border border-current"
            aria-hidden
          />
        );

        const labelEl = clickable ? (
          <button
            key={label}
            type="button"
            onClick={() => onClickPhase(i)}
            className="flex items-center gap-1.5 text-[13px] leading-none text-muted-foreground transition-colors hover:text-foreground"
          >
            {dot}
            {label}
          </button>
        ) : (
          <span
            key={label}
            className={cn(
              "flex items-center gap-1.5 text-[13px] leading-none",
              active
                ? "font-medium text-foreground"
                : "text-muted-foreground/50",
            )}
            aria-current={active ? "step" : undefined}
          >
            {dot}
            {label}
          </span>
        );

        return (
          <Fragment key={label}>
            {i > 0 && (
              <div
                className={cn(
                  "mx-2.5 h-px w-5 shrink-0 bg-border",
                  done && "bg-border",
                )}
                aria-hidden
              />
            )}
            {labelEl}
          </Fragment>
        );
      })}
    </div>
  );
}
