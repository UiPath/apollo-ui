"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { Caveat, DecisionActionRow } from "../DecisionActionRow";

// The one section-heading treatment this feature repeats by hand across
// its own surfaces (Progress/Timeline label, Request details, Communication).
// Grep finds no such component in the Apollo Vertex registry, so this is
// this feature styling its own heading rather than consuming a system one.
// Kept as one constant so "unify the headings" means changing it in exactly
// one place.
const SECTION_HEADING_CLASSES =
  "text-base font-bold tracking-tighter text-foreground";

interface RecordCardProps {
  /** Card label, the region's name, matching every other labeled region on
   * these two screens (Communication, People, Request details). */
  label: string;
  /** Optional icon before the label, fully rendered by the caller (size,
   * gradient id, aria-hidden and all). A plain lucide icon and `AiMark`
   * (which needs its own `gradientId` prop) don't share one signature, so
   * this takes a node rather than a component type. */
  labelIcon?: ReactNode;
  /** Small muted line under the label, derived from request data. Not AI
   * output: no ✦ mark, not covered by the AI caveat below. Pass the fully
   * styled node (e.g. tier-gated `<p>`s) rather than a bare string, since
   * some callers render more than one depending on tier. */
  description?: ReactNode;
  /** Persona-specific primary content (e.g. the stage tracker). Optional,
   * omit entirely rather than passing an empty node, so no phantom spacing
   * renders when there's nothing to show. */
  primaryContent?: ReactNode;
  /** AI zone heading, next to the ✦ mark (e.g. "What I found out", "AI
   * summary"). Only meaningful alongside `aiContent`. */
  aiHeading?: ReactNode;
  /** AI-generated content. Presence alone decides whether the whole AI zone
   * (heading, and, when `caveatPlacement` is `"ai-zone"`, the caveat)
   * renders. Omit rather than passing empty content when there's nothing
   * to disclose. */
  aiContent?: ReactNode;
  /** Actions at the card's foot. Omit when there's nothing to do. */
  actions?: ReactNode;
  /** Surface treatment. `"glass"` (default) is translucent: fine on its
   * own, wrong the moment something (a glow) sits behind the card, since a
   * translucent surface lets it bleed through. `"solid"` is fully opaque,
   * pass it whenever the caller places a glow behind this card. */
  surface?: "glass" | "solid";
  /** `"stacked"` (default, the requester's own card): label+description+
   * primary content as one full-width band, then the AI zone, then
   * actions, each separated by its own rule. `"split"` (the approver's
   * decision card): the AI zone and the label+primary-content zone become
   * two side-by-side columns, AI flexible-width on the left, label+
   * primary content narrow and fixed on the right, separated by a vertical
   * rule, with actions spanning beneath both as a single full-width
   * footer. */
  layout?: "stacked" | "split";
  /** `"ai-zone"` (default, the requester's own card): the AI zone's heading
   * keeps its own smaller, lighter treatment, distinct from the plain
   * section labels elsewhere on the screen. `"section"` (the approver's
   * decision card): the heading matches every other section label exactly
   * (`SECTION_HEADING_CLASSES`), the ✦ mark stays the only visual
   * difference from a plain label. */
  aiHeadingStyle?: "ai-zone" | "section";
  /** `"ai-zone"` (default, the requester's own card): the caveat closes the
   * AI zone, after `aiContent`. `"footer"` (the approver's decision card):
   * the caveat moves into the actions footer, right aligned and vertically
   * centred with the buttons, a closing note on the card rather than a
   * trailing line of the checks. Escalated whether the requester's card
   * should also move to `"footer"` (see report), not changed here either
   * way. */
  caveatPlacement?: "ai-zone" | "footer";
}

/** The label + optional icon, identical in both layouts, just placed in a
 * different parent. */
function ZoneOneLabel({
  label,
  labelIcon,
}: {
  label: string;
  labelIcon?: ReactNode;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", SECTION_HEADING_CLASSES)}>
      {labelIcon}
      {label}
    </div>
  );
}

/** Heading, then content. The caveat is a sibling the caller places
 * itself, per `caveatPlacement` (see RecordCard), rather than living in
 * here unconditionally, since its position now differs between layouts. */
function AiZoneBody({
  aiHeading,
  aiContent,
  headingStyle,
}: {
  aiHeading?: ReactNode;
  aiContent: ReactNode;
  headingStyle: "ai-zone" | "section";
}) {
  return (
    <>
      <div
        className={cn(
          "flex items-center gap-1.5",
          headingStyle === "section" ? SECTION_HEADING_CLASSES : "text-sm",
        )}
      >
        <AiMark size={14} gradientId="gb-ai-mark" aria-hidden />
        {headingStyle === "ai-zone" ? (
          <span className="font-medium text-foreground">{aiHeading}</span>
        ) : (
          aiHeading
        )}
      </div>
      <div className="mt-3">{aiContent}</div>
    </>
  );
}

/**
 * The card shared by the requester's and the approver's request detail
 * screens: a label+description+primary-content zone, an AI zone (heading
 * then content), and an actions zone. Persona content is entirely
 * caller-supplied; this component only owns the zone contents, the
 * separating rules, and which of two arrangements the zones render in
 * (`layout`), so the two screens can't drift on structure independently.
 *
 * Zones with no content don't render, and no rule orphans itself between
 * two zones where one is absent.
 */
export function RecordCard({
  label,
  labelIcon,
  description,
  primaryContent,
  aiHeading,
  aiContent,
  actions,
  surface = "glass",
  layout = "stacked",
  aiHeadingStyle = "ai-zone",
  caveatPlacement = "ai-zone",
}: RecordCardProps) {
  // The footer has to survive even once `actions` empties out (a decided
  // request has none) whenever it's the caveat's home now, otherwise the
  // disclaimer would silently vanish along with the buttons while the AI
  // content stays. Only relevant when caveatPlacement is "footer"; the
  // default case is unchanged: no actions, no footer.
  const showFooter =
    actions != null || (caveatPlacement === "footer" && aiContent != null);
  const footer = showFooter && (
    <>
      <div className="border-t border-border" />
      <DecisionActionRow
        actions={actions}
        showCaveat={caveatPlacement === "footer" && aiContent != null}
        className="p-5"
      />
    </>
  );

  if (layout === "split") {
    return (
      <Card variant={surface} className="py-0">
        <CardContent className="p-0">
          <div className="flex">
            <div className="min-w-0 flex-1 p-5">
              {aiContent != null && (
                <>
                  <AiZoneBody
                    aiHeading={aiHeading}
                    aiContent={aiContent}
                    headingStyle={aiHeadingStyle}
                  />
                  {caveatPlacement === "ai-zone" && <Caveat className="mt-3" />}
                </>
              )}
            </div>
            {/* Narrow and fixed. The vertical rule between the columns is
                escalated (see report), not a final call. */}
            <div className="w-56 shrink-0 border-l border-border p-5">
              <ZoneOneLabel label={label} labelIcon={labelIcon} />
              {description}
              {primaryContent != null && (
                <div className="mt-4">{primaryContent}</div>
              )}
            </div>
          </div>

          {footer}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant={surface} className="py-0">
      <CardContent className="p-0">
        <div className="px-5 pb-5 pt-6">
          <ZoneOneLabel label={label} labelIcon={labelIcon} />
          {description}
          {primaryContent != null && (
            <div className="mt-6">{primaryContent}</div>
          )}
        </div>

        {aiContent != null && (
          <>
            <div className="border-t border-border" />
            <div className="p-5">
              <AiZoneBody
                aiHeading={aiHeading}
                aiContent={aiContent}
                headingStyle={aiHeadingStyle}
              />
              {/* Last element of the zone, always, in the default
                  (`"ai-zone"`) placement. This is the one structural rule
                  the shared component enforces on the caveat's position so
                  it can't drift per caller. */}
              {caveatPlacement === "ai-zone" && <Caveat className="mt-3" />}
            </div>
          </>
        )}

        {footer}
      </CardContent>
    </Card>
  );
}
