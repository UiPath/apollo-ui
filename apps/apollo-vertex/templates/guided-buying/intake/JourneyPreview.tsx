"use client";

import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GLASS_CLASSES } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AiGlow } from "@/registry/ai-glow/ai-glow";
import {
  type AssembledJourney,
  assembleJourney,
  type IntakeAnswers,
  type JourneyStep,
  whyAdded,
} from "../data";

/**
 * One step's row: label and system read straight from the model, the
 * reason (if any) read straight from whyAdded. No step identity is ever
 * matched against a name here, base steps get a null reason from whyAdded
 * itself (its own trigger map returns false for them), not from a branch
 * in this component. Block presentation only, see JourneyPreview below.
 */
function JourneyStepRow({
  step,
  answers,
}: {
  step: JourneyStep;
  answers: IntakeAnswers;
}) {
  const reason = whyAdded(step.id, answers);
  return (
    <div className="flex min-w-0 flex-1 items-start gap-2.5">
      <span
        className="mt-1.5 size-1.5 shrink-0 rounded-full border border-muted-foreground"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">
            {step.label}
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {step.system}
          </Badge>
        </div>
        {reason != null && (
          <p className="mt-0.5 text-xs text-muted-foreground">{reason}</p>
        )}
      </div>
    </div>
  );
}

/**
 * The block presentation: Review's and the submitted state's own rendering,
 * unchanged from before the inline presentation existed (see the report).
 * A step renders as a row, a group renders its members side by side
 * (parallel, not sequential), reusing the same row for both so a step's
 * presentation never depends on whether it happened to be a base step or a
 * group member.
 *
 * A group's own membership count, not any per-step special case, decides
 * whether the dashed parallel container renders at all: two or more members
 * is a parallel group, exactly one is an ordinary sequential row, and zero
 * renders nothing.
 */
function BlockJourneyPreview({
  nodes,
  answers,
}: {
  nodes: AssembledJourney;
  answers: IntakeAnswers;
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <AiGlow variant="card" />
        <div
          className={cn(
            GLASS_CLASSES,
            "relative space-y-3 rounded-xl bg-[var(--ai-glass)] p-3 dark:bg-[var(--ai-glass)]",
          )}
        >
          {nodes.map((node) => {
            if (node.kind === "step") {
              return (
                <JourneyStepRow
                  key={node.step.id}
                  step={node.step}
                  answers={answers}
                />
              );
            }
            if (node.steps.length === 0) return null;
            if (node.steps.length === 1) {
              const [only] = node.steps;
              return (
                <JourneyStepRow key={only.id} step={only} answers={answers} />
              );
            }
            return (
              <div
                key={node.group.id}
                className="flex flex-wrap gap-4 rounded-lg border border-dashed border-border p-3"
              >
                {node.steps.map((step) => (
                  <JourneyStepRow key={step.id} step={step} answers={answers} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" aria-hidden />
        The output is AI generated. Please review.
      </p>
    </div>
  );
}

/** A node's marker. Every node renders in the same not-yet-started state
 * (see the report): the model defines structure, not runtime state, and
 * intake has no started/done/current fact to show yet. */
function TimelineMarker() {
  return (
    <span
      className="size-3 shrink-0 rounded-full bg-muted-foreground/30"
      aria-hidden
    />
  );
}

/** One step's content: label (plain text for a base step, a pill for a
 * triggered conditional one, the same "+label" pill the caption's own
 * count already implies) and its system of record as a secondary line
 * beneath, both read straight from the model. */
function TimelineStepContent({
  step,
  added,
}: {
  step: JourneyStep;
  added: boolean;
}) {
  return (
    <div className="min-w-0">
      {added ? (
        <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px]">
          {`+${step.label}`}
        </Badge>
      ) : (
        <p className="text-sm font-medium text-foreground">{step.label}</p>
      )}
      <p className="mt-0.5 text-xs text-muted-foreground">{step.system}</p>
    </div>
  );
}

/**
 * The timeline presentation: Data and Info's and Review's own rendering, a
 * connected vertical sequence rather than a line of running text. Every
 * step name, ordering, and system still comes from assembleJourney, same
 * as the block presentation; whyAdded is not called here, that reasoning
 * now lives on the questions themselves (Part B of the prompt that added
 * it, see the report), so a per-step reason line here would duplicate it.
 *
 * A group's own membership count decides its shape, same rule the block
 * presentation already applies: two or more members render as a branch (a
 * left rail bracketing both, sharing the one marker/connector position the
 * group occupies in the outer sequence), exactly one renders as an
 * ordinary node, and zero renders nothing.
 *
 * Every node renders with the same marker (see TimelineMarker). The model
 * has no runtime state to distinguish them by at intake (see the report).
 */
function TimelineJourneyPreview({ nodes }: { nodes: AssembledJourney }) {
  const group = nodes.find((node) => node.kind === "group");
  const addedCount = group?.kind === "group" ? group.steps.length : 0;
  const rows = nodes.filter(
    (node) => node.kind === "step" || node.steps.length > 0,
  );

  return (
    <div className="space-y-3">
      <p className="px-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Journey preview</span>
        {" · "}
        {addedCount > 0 ? `${addedCount} steps added` : "Standard path"}
      </p>

      <div className={cn(GLASS_CLASSES, "rounded-xl p-4")}>
        <ol>
          {rows.map((node, index) => {
            const isLast = index === rows.length - 1;

            if (node.kind === "step") {
              const { step } = node;
              return (
                <li key={step.id} className="flex gap-3">
                  <div className="flex w-3 shrink-0 flex-col items-center">
                    <TimelineMarker />
                    {!isLast && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className={cn("min-w-0 flex-1", !isLast && "pb-4")}>
                    <TimelineStepContent step={step} added={false} />
                  </div>
                </li>
              );
            }

            // node.kind === "group" here, filtered to steps.length > 0 above.
            if (node.steps.length === 1) {
              const [only] = node.steps;
              return (
                <li key={only.id} className="flex gap-3">
                  <div className="flex w-3 shrink-0 flex-col items-center">
                    <TimelineMarker />
                    {!isLast && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className={cn("min-w-0 flex-1", !isLast && "pb-4")}>
                    <TimelineStepContent step={only} added />
                  </div>
                </li>
              );
            }

            return (
              <li key={node.group.id} className="flex gap-3">
                <div className="flex w-3 shrink-0 flex-col items-center">
                  <TimelineMarker />
                  {!isLast && <div className="w-px flex-1 bg-border" />}
                </div>
                <div
                  className={cn(
                    "min-w-0 flex-1 space-y-3 border-l-2 border-border pl-3",
                    !isLast && "pb-4",
                  )}
                >
                  {node.steps.map((step) => (
                    <TimelineStepContent key={step.id} step={step} added />
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

interface JourneyPreviewProps {
  answers: IntakeAnswers;
  /** "timeline": the connected vertical sequence, Data and Info's and
   * Review's own presentation. "block": the stacked card, the submitted
   * state's own presentation, unchanged from before the timeline existed
   * (see the report). One component, one model
   * (assembleJourney/whyAdded), two presentations, rather than a second
   * journey renderer. */
  variant: "timeline" | "block";
}

export function JourneyPreview({ answers, variant }: JourneyPreviewProps) {
  const nodes = assembleJourney(answers);

  if (variant === "timeline") {
    return <TimelineJourneyPreview nodes={nodes} />;
  }

  return <BlockJourneyPreview nodes={nodes} answers={answers} />;
}
