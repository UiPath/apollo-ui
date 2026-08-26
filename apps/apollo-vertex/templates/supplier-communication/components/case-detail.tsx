"use client";

import { ChevronRight } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  type ConfidenceCta,
  type ConfidenceFactor,
  ConfidenceSignal,
} from "@/registry/confidence-signal/confidence-signal";
import type { SupplierCase } from "../data/supplier-cases";
import { ActionBlock } from "./action-block";
import { ActivityLog } from "./activity-log";
import { AgentFoundPanel } from "./agent-found-panel";
import { ApprovalSteps } from "./approval-steps";
import { ComposeCard } from "./compose-card";
import {
  CONTROL_TONE,
  confidenceLevel,
  controlRationale,
} from "./control-tone";
import { GUTTER, GUTTER_ROW } from "./pane-grid";
import { SCROLL_PANE } from "./scroll-pane";

const EYEBROW =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

/** Caps the reading measure at roughly 65-70 characters. */
const MEASURE = "max-w-[68ch]";

/**
 * The marginalia gutter. One column runs the length of the pane holding the
 * confidence ring, the sender avatar and the activity-log markers, so every
 * text block starts at the same left edge instead of stacking centred blocks.
 */

function GutterRow({
  aside,
  className,
  children,
}: {
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(GUTTER_ROW, className)}>
      <div className={cn(GUTTER, "flex flex-col items-center")}>{aside}</div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** "Meridian Fasteners Co." -> "MF" */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * A flat context section: hairline rule, eyebrow, optional right-aligned meta,
 * and generous vertical rhythm. No card. Separation comes from whitespace, which
 * is what keeps the read-only register visually quiet.
 */
function Section({
  eyebrow,
  meta,
  aside,
  children,
}: {
  eyebrow: string;
  meta?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border py-6">
      {/* Eyebrow spans the full width so the rule still reads as a divider */}
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h3 className={EYEBROW}>{eyebrow}</h3>
        {meta && (
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {meta}
          </span>
        )}
      </div>
      <GutterRow aside={aside}>{children}</GutterRow>
    </section>
  );
}

/** Left-accent callout. The reason a decision exists, so it sits just above it. */
function MarginNote({ children }: { children: ReactNode }) {
  return (
    <p
      className={cn(
        "border-l-2 border-l-warning py-1 pl-4 text-sm leading-relaxed text-muted-foreground",
        MEASURE,
      )}
    >
      {children}
    </p>
  );
}

interface CaseDetailProps {
  case: SupplierCase | null;
}

export function CaseDetail({ case: c }: CaseDetailProps) {
  if (!c) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          Pick a case to see what the agent did and why.
        </p>
      </div>
    );
  }

  // Keyed so every per-case piece of state resets on selection: the activity
  // log closes again and the chip replays its one-time acquire animation.
  return <CaseBody key={c.id} case={c} />;
}

function scrollTo(el: HTMLElement | null) {
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function CaseBody({ case: c }: { case: SupplierCase }) {
  const [logOpen, setLogOpen] = useState(false);
  const [showFullMessage, setShowFullMessage] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const level = confidenceLevel(c);

  const openLog = () => {
    setLogOpen(true);
    // After the collapsible has actually expanded.
    requestAnimationFrame(() => scrollTo(logRef.current));
  };

  // Every next step names something on this screen. Medium and low levels
  // require one; the component enforces that in the type.
  const nextStepFor = (): ConfidenceCta => {
    if (c.draft) {
      return {
        label: "Review the draft",
        onClick: () => {
          scrollTo(replyRef.current);
          replyRef.current?.focus();
        },
      };
    }
    if (c.steps) {
      return {
        label: "View the approval workflow",
        onClick: () => scrollTo(actionRef.current),
      };
    }
    if (c.note) {
      return {
        label: "Open the compliance queue",
        onClick: () => scrollTo(actionRef.current),
      };
    }
    // Every case with a chip has one of the three above; this keeps the
    // function total without inventing an action.
    return { label: "View the activity log", onClick: openLog };
  };

  const factors: ConfidenceFactor[] | undefined = c.sor?.map(
    ([label, value, status]) => ({ label, value, status }),
  );

  const explainCta: ConfidenceCta = {
    label: "View the activity log",
    onClick: openLog,
  };

  // The chip's popover already states this as structured factors, so the
  // callout only earns its place when no chip is there to carry it. Keyed off
  // the factors actually being shown rather than a list of case ids, so it
  // stays correct if factors get wired onto another case later.
  const showsFactors = Boolean(level && factors && factors.length > 0);
  const showFlag = Boolean(c.flag) && !showsFactors;

  return (
    <ScrollArea className={cn("size-full", SCROLL_PANE)}>
      <div className="mx-auto flex w-full max-w-3xl flex-col px-10 pt-10 pb-14">
        {/* Byline above headline: you already know who it's from, you clicked
            their row. What the case is about is the headline. */}
        <p className={EYEBROW}>
          {c.supplier}
          <span className="mx-1.5 text-border">·</span>
          <span className="font-mono normal-case tracking-normal">{c.id}</span>
        </p>

        <h2
          className={cn(
            // Extra right padding holds the headline to a shorter measure so
            // it wraps well before the pane edge.
            "mt-2 pr-24 text-3xl font-bold leading-tight tracking-tight text-foreground",
            MEASURE,
          )}
        >
          {c.subject}
        </h2>

        {/* A chip, not a circle, so the header runs horizontally. Triggered
            cases render no chip at all: they never classified anything, so any
            level would claim a judgement that was never made. */}
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          {level === "high" && (
            <ConfidenceSignal
              level="high"
              variant="max"
              animateIn
              factors={factors}
              explainCta={explainCta}
            />
          )}
          {(level === "medium" || level === "low") && (
            <ConfidenceSignal
              level={level}
              variant="max"
              animateIn
              factors={factors}
              explainCta={explainCta}
              nextStep={nextStepFor()}
            />
          )}
          <Badge status={CONTROL_TONE[c.control].badge} variant="secondary">
            {c.controlLabel}
          </Badge>
        </div>

        <p
          className={cn(
            "mt-4 text-base leading-relaxed text-muted-foreground",
            MEASURE,
          )}
        >
          {controlRationale(c)}
        </p>

        <div className="mt-8 flex flex-col">
          {/* Context: what arrived */}
          {c.trigger ? (
            <Section eyebrow="What opened this case" meta={c.time}>
              <p className={cn("text-base leading-7 text-foreground", MEASURE)}>
                {c.triggerReason}
              </p>
            </Section>
          ) : (
            c.email && (
              <Section
                eyebrow="The message"
                meta={c.time}
                aside={
                  <Avatar className="size-10">
                    <AvatarFallback className="text-xs font-medium text-muted-foreground">
                      {initials(c.supplier)}
                    </AvatarFallback>
                  </Avatar>
                }
              >
                <p className="mb-2 min-w-0 truncate text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {c.supplier}
                  </span>
                  <span className="mx-1.5">→</span>
                  AP Team
                </p>
                <div
                  className={cn(
                    "whitespace-pre-wrap text-sm leading-relaxed text-foreground",
                    MEASURE,
                  )}
                >
                  {showFullMessage ? c.email : (c.excerpt ?? c.email)}
                </div>
                {/* Only when there is something held back to reveal */}
                {c.excerpt && c.excerpt !== c.email && (
                  <button
                    type="button"
                    onClick={() => setShowFullMessage((v) => !v)}
                    aria-expanded={showFullMessage}
                    className="mt-2 rounded-sm text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {showFullMessage ? "Show less" : "Show full message"}
                  </button>
                )}
              </Section>
            )
          )}

          {c.sor && (
            <AgentFoundPanel sor={c.sor} source={c.source} className="mt-6" />
          )}

          {/* The reason a decision exists, read last before the action */}
          {showFlag && (
            <div className="pt-6">
              <GutterRow>
                <MarginNote>{c.flag}</MarginNote>
              </GutterRow>
            </div>
          )}

          {/* The single elevated block. Draft -> reply, else the control state. */}
          <div ref={actionRef} className="pt-6">
            {c.draft ? (
              <ComposeCard
                draft={c.draft}
                recipient={c.supplier}
                textareaRef={replyRef}
              />
            ) : c.steps ? (
              <ActionBlock tone="error">
                <h3 className={cn(EYEBROW, "mb-4")}>Approval workflow</h3>
                <ApprovalSteps steps={c.steps} />
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button disabled>Approve as second reviewer</Button>
                  <Button variant="outline">Reassign</Button>
                </div>
                {c.note && (
                  <p
                    className={cn(
                      "mt-4 text-sm leading-relaxed text-destructive",
                      MEASURE,
                    )}
                  >
                    {c.note}
                  </p>
                )}
              </ActionBlock>
            ) : (
              c.note && (
                <ActionBlock tone="error">
                  <h3 className={cn(EYEBROW, "mb-4")}>
                    Why this was escalated
                  </h3>
                  <p
                    className={cn(
                      "text-base leading-7 text-foreground",
                      MEASURE,
                    )}
                  >
                    {c.note}
                  </p>
                  <div className="mt-5">
                    <Button variant="outline">Open the compliance queue</Button>
                  </div>
                </ActionBlock>
              )
            )}
          </div>

          {/* Provenance: consulted when something looks wrong, not read every time */}
          <Collapsible
            open={logOpen}
            onOpenChange={setLogOpen}
            ref={logRef}
            className="mt-8 border-t border-border pt-4"
          >
            <CollapsibleTrigger
              className={cn(
                "group flex w-full items-center gap-1.5 rounded-md text-left",
                EYEBROW,
                "outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
              )}
            >
              <ChevronRight
                className="size-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-90"
                aria-hidden
              />
              {`Activity log · ${c.audit.length} steps`}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ActivityLog audit={c.audit} />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </ScrollArea>
  );
}
