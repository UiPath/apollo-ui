"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AiCaveat } from "@/registry/ai-caveat/ai-caveat";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { ph } from "../data/placeholders";
import type { InsightCardData } from "./dashboard-data";
import { useRecommendationSent } from "./use-recommendation-sent";

// AI toolkit treatment (app/guidelines/ai-toolkit/surfaces.tsx, "Card
// (Primary)" -> "Gradient subtle, no border"): ported verbatim, background,
// border, and title/description colors all lifted from that example rather
// than chosen here. No AiGlow: a glow pairs with a label (page.mdx's
// principles) and this single, non-grouped item has no new label to give
// it without authoring copy beyond the ruled placeholders. `AiMark` once
// in the title, not repeated on the button, per "mark the group once, not
// every control". The action takes the standard primary button, at the
// user's own request over the toolkit's supporting-action tier. The
// caveat renders once for this block and does not carry over to the
// sent state below: the confirmation is a record of an action already
// taken, not generated content someone still needs to review (surfaces.tsx's
// own scoping of the caveat to "recommendations, actions, and AI-generated
// insights").
const GRADIENT_CARD_CLASS = "mt-10 gap-0 border-0";
const GRADIENT_CARD_STYLE = { background: "var(--ai-gradient)" };
// The mark sits beside the text it marks, one row, both reading in the
// same insight tone the toolkit's own title row uses; `font-normal` and
// `leading-snug` override CardTitle's heading defaults since this row
// carries a full sentence, not a short heading.
const TITLE_CLASS =
  "flex items-start gap-1.5 font-normal leading-snug text-insight-900 dark:text-insight-50";
// Sent: a record of a completed action, not generated content, so the
// gradient (this block's "AI is proposing something" signal) steps back
// to the same muted surface tokens the rest of the app uses for inert
// state, rather than staying an active looking AI card.
const SENT_CARD_CLASS = "mt-10 gap-0 border-0 bg-muted";
const SENT_TITLE_CLASS =
  "flex items-start gap-1.5 font-normal leading-snug text-muted-foreground";

export function StageDurationRecommendation({
  cardData,
}: {
  cardData: InsightCardData;
}) {
  const { sentAt, publishedAt, send } = useRecommendationSent();
  const expand = cardData.expandContent;
  if (!expand?.recommendation) return null;

  const destination = expand.recommendationDestination ?? "";

  if (sentAt) {
    // The finding itself, without the now moot ask to route it, so the
    // confirmation still says what was sent rather than only when and
    // where.
    const finding = expand.recommendation.split(". ")[0];
    const sentLine = (expand.recommendationConfirmation ?? "")
      .replace("{destination}", destination)
      .replace("{date}", new Date(sentAt).toLocaleString());
    const confirmation = `${finding}. ${sentLine}`;
    // Prompt 94: a third state layered onto the same block, same
    // position, rather than a second block or a move. Unpublished, this
    // renders nothing beyond the sent confirmation above, unchanged from
    // prompt 91/93.
    const publishedLine = publishedAt
      ? ph("PH-123", "published line").replace(
          "{date}",
          new Date(publishedAt).toLocaleString(),
        )
      : null;
    return (
      <Card variant="solid" className={SENT_CARD_CLASS}>
        <CardHeader>
          <CardTitle className={SENT_TITLE_CLASS}>
            <AiMark size={14} className="mt-0.5 shrink-0" />
            <span className="-mt-0.5">{confirmation}</span>
          </CardTitle>
        </CardHeader>
        {publishedLine && (
          <CardContent>
            <p className="text-sm text-muted-foreground">{publishedLine}</p>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card
      variant="solid"
      className={GRADIENT_CARD_CLASS}
      style={GRADIENT_CARD_STYLE}
    >
      <CardHeader style={{ columnGap: "2.5rem" }}>
        <CardTitle className={TITLE_CLASS}>
          <AiMark size={14} className="mt-0.5 shrink-0" />
          <span className="-mt-0.5">{expand.recommendation}</span>
        </CardTitle>
        <CardAction>
          <Button
            size="sm"
            onClick={() => {
              // Prompt 91: sending changes only this local, module level
              // flag (prompt 93 moved it off sessionStorage so a refresh
              // resets it). It reaches no route, queue, or destination
              // system; none of those exist in this prototype.
              send();
            }}
          >
            {expand.recommendationAction}
          </Button>
        </CardAction>
      </CardHeader>
      <AiCaveat className="px-6" />
    </Card>
  );
}
