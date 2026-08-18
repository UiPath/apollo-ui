"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * One run of an agent summary sentence. Plain text renders as-is; a run
 * with `targetField` set gets the accent treatment and becomes interactive,
 * hover/click/keyboard notify `onHighlight` with that key so the caller can
 * flash or scroll to whatever it names (a rail field, on the approver's
 * screen; nothing requires a target at all). Ported from the approver
 * decision view (see the report), generalised only in that `targetField` is
 * a plain string instead of that screen's own closed rail-field union, so
 * this file carries no dependency on it.
 */
export interface SummaryMark {
  text: string;
  targetField?: string;
}

export function SummaryMarkSpan({
  mark,
  onHighlight,
  className,
}: {
  mark: SummaryMark;
  onHighlight?: (key: string, options?: { scroll?: boolean }) => void;
  /** Additive and optional (prompt 36): a caller can add to the mark's own
   * classes (e.g. `whitespace-nowrap`, to keep a short mark from breaking
   * mid phrase) without this component changing for callers that don't
   * pass it, the approver view among them. */
  className?: string;
}) {
  const { targetField } = mark;
  const interactive = targetField != null;
  return (
    <span
      {...(targetField == null
        ? {}
        : {
            role: "button" as const,
            tabIndex: 0,
            onMouseEnter: () => onHighlight?.(targetField),
            onClick: () => onHighlight?.(targetField, { scroll: true }),
            onKeyDown: (e: KeyboardEvent<HTMLSpanElement>) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              onHighlight?.(targetField, { scroll: true });
            },
          })}
      className={cn(
        "rounded-sm px-1 text-insight-900 dark:text-insight-50",
        interactive && "cursor-pointer",
        className,
      )}
      style={{
        backgroundImage: "var(--ai-gradient)",
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
      }}
    >
      {mark.text}
    </span>
  );
}

/** One item in an evidence chip row. `status` drives the icon (pass: neutral
 * check; exception: amber triangle) and is entirely optional, a chip stating
 * a plain count or fact (no pass/fail dimension) carries none, and renders
 * with no icon. `detail` is optional too: present, the chip expands on
 * click; absent, it's inert. */
export interface EvidenceItem {
  key: string;
  label: string;
  status?: "pass" | "exception";
  detail?: string;
}

/**
 * The band ("What I checked" / count, or any other caller-built heading) and
 * a wrapping chip row, ported from the approver decision view's own checks
 * list (see the report). Selecting a chip with a `detail` expands it beneath
 * the row; only one is expanded at a time, and none by default. A chip with
 * no `detail` doesn't respond to clicks at all.
 */
export function EvidenceChips({
  heading,
  items,
}: {
  heading?: ReactNode;
  items: EvidenceItem[];
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const expanded = items.find((item) => item.key === expandedKey);

  return (
    <div className="space-y-3">
      {heading && (
        <div className="flex items-baseline gap-1.5 text-sm">{heading}</div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const isSelected = item.key === expandedKey;
          const hasDetail = item.detail != null;
          const Icon =
            item.status === "pass"
              ? CheckCircle2
              : item.status === "exception"
                ? AlertTriangle
                : null;
          return (
            <button
              key={item.key}
              type="button"
              aria-expanded={isSelected}
              disabled={!hasDetail}
              onClick={() =>
                hasDetail && setExpandedKey(isSelected ? null : item.key)
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-foreground transition-colors",
                isSelected ? "border-primary/40 bg-primary/8" : "border-border",
                hasDetail && !isSelected && "hover:bg-accent",
                !hasDetail && "cursor-default",
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "size-3.5 shrink-0",
                    item.status === "pass"
                      ? "text-muted-foreground"
                      : "text-warning",
                  )}
                  aria-hidden
                />
              )}
              {item.label}
            </button>
          );
        })}
      </div>
      {expanded?.detail != null && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">{expanded.detail}</p>
        </div>
      )}
    </div>
  );
}

/**
 * The agent summary block shared by the approver decision view and the
 * buyer workbench's exception surface: a conclusion sentence (a plain
 * string, or JSX built from `SummaryMarkSpan` for a highlighted figure),
 * then whatever evidence the caller supplies beneath it (typically
 * `EvidenceChips`). Structure only, no persona content of its own.
 *
 * `conclusionClassName` (prompt 37) lets a caller override the conclusion
 * paragraph's own typography, additive and optional so the approver view
 * (which doesn't pass it) is unaffected. This has to live here, on the `<p>`
 * itself, not on a nested span: a font-size/line-height set on an inline
 * child doesn't override the line box height CSS derives from the block
 * container's own font, so a smaller override nested inside this `<p>`'s
 * un-overridden 23px/leading-snug still rendered at that larger line
 * height regardless of what the child declared (see the report on prompt
 * 36's line height fix, which set exactly this on a nested span and had no
 * visible effect for exactly this reason).
 */
export function AgentSummary({
  conclusion,
  evidence,
  conclusionClassName,
}: {
  conclusion: ReactNode;
  evidence?: ReactNode;
  conclusionClassName?: string;
}) {
  return (
    <div className="space-y-4">
      <p
        className={cn(
          "max-w-[568px] text-[23px] font-semibold leading-snug text-foreground",
          conclusionClassName,
        )}
      >
        {conclusion}
      </p>
      {evidence}
    </div>
  );
}
