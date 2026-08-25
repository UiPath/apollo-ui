export interface InsightCardData {
  title: string;
  type: "kpi" | "chart";
  chartType:
    | "donut"
    | "horizontal-bars"
    | "sparkline"
    | "area"
    | "stacked-bar"
    | "average-marker-bars"
    | "stage-duration-bars"
    | "proportion-bar";
  size?: "sm" | "md" | "lg";
  interaction?: "static" | "expand" | "navigate";
  // Muted icon beside the card title (prompt 85), one per card.
  icon?: "clock" | "file-check" | "zap" | "unlink";
  // How this card's own row reacts when it expands. "grid" (default):
  // every other row collapses and fades, the reference behaviour, for a
  // card whose expanded content needs more height. "width": this card's
  // row keeps its own height, no other row collapses or fades, only its
  // own row sibling shrinks to give it the row's full width, for a card
  // whose expanded content only needs more width.
  expandGrowth?: "grid" | "width";
  // Navigate config
  navigateTo?: string;
  // Prompt 90: the scripted answer this card's own ask affordance returns,
  // registered as a placeholder rather than authored inline. Absent for a
  // card whose answer has not been written, which is also the signal the
  // card's own ask mark does not render.
  askAnswer?: string;
  // Suggested follow up questions shown beneath the answer, registered as
  // placeholders the same way. Absent where the answer itself is absent.
  askFollowUps?: string[];
  // Expand config: additional content shown when card is expanded. `bars`/
  // `barsUnit`/`average`/`footLines` (prompt 84) are a second, self
  // contained chart dataset shown only once expanded, for a card whose face
  // and expanded state are two different visuals (e.g. "where the time
  // goes" faces with stage duration bars, expands into the commodity cycle
  // time bars) rather than the same visual with more of it revealed.
  // `finding`/`heading` (prompt 86): a KPI card's own designed expanded
  // state, a sentence stating what a bars breakdown shows and a small
  // heading naming the list, both content and so registered as
  // placeholders rather than authored inline.
  expandContent?: {
    summary?: string;
    details?: string[];
    bars?: { label: string; value: number }[];
    barsUnit?: string;
    average?: number;
    footLines?: string[];
    finding?: string;
    heading?: string;
    // Prompt 87: the right column's facts, each already existing wording
    // split into its own leading figure/subject (rendered heavier) and
    // the rest of the sentence, never a reworded copy of the fact.
    emphasisFacts?: { lead: string; rest: string }[];
    // Prompt 88: "where the time goes" expands by adding the commodity
    // breakdown beneath the stage breakdown, not swapping to it. Headings
    // for each section and the sentence connecting them, content and so
    // registered as placeholders rather than authored inline.
    stageHeading?: string;
    commodityHeading?: string;
    connectingLine?: string;
  };
  // KPI data
  kpiNumber?: string;
  kpiDescription?: string;
  // Two or three short lines at the card's foot (prompt 73): the legwork
  // behind the visual, on the face rather than behind expansion. Absent
  // or empty when there is none.
  footLines?: string[];
  // Horizontal bars data. `barsFaceCount`, when set, is how many of `bars`
  // render on the face; the rest render only once the card is expanded
  // (prompt 82), reusing the same expand mechanism every other card uses
  // rather than a separate disclosure control. Absent, all of `bars`
  // render regardless of expand state.
  bars?: { label: string; value: number }[];
  barsUnit?: string;
  barsFaceCount?: number;
  // "share": each bar's value is already a share of a real whole (e.g. a
  // percentage that sums to 100 across the series), so its width is drawn
  // at its own value against a full track. "comparison": the values have
  // no common whole (e.g. a duration), so bars rank against each other
  // with no track, since a track implies a total that does not exist.
  // Unused by chartType "average-marker-bars", which always ranks distance from
  // `average` with no track (prompt 72's rule applies the same way).
  barsKind?: "share" | "comparison";
  // Distance-bars data (prompt 73): each bar's value in `bars` is compared
  // against this single reference point instead of against each other.
  average?: number;
  // Stacked bar data
  stackedBars?: { label: string; segments: number[] }[];
  stackedLegend?: string[];
  // Donut data
  donutPercent?: number;
  donutLabel?: string;
  donutDescription?: string;
  // Proportion bar data (prompt 85, captioned prompt 89): two segments of
  // one whole, each value already a derived share so its own width is
  // drawn directly against the segment's `value` (flex grow). A caption
  // above names the total the two segments sum to; one caption beneath
  // each segment sits within that segment's own width, not the bar's
  // outer edges.
  proportionSegments?: { label: string; value: number }[];
  proportionCaptionTotal?: string;
  proportionCaptionLeft?: string;
  proportionCaptionRight?: string;
  // Sparkline / Area data
  points?: number[];
}

export interface DashboardDataset {
  name: string;
  brandName: string;
  brandLine: string;
  dashboardTitle: string;
  badgeText: string;
  greeting: string;
  headline: string;
  subhead: string;
  chartLabels: { y: string[]; target: string };
  // The hero's own trend, on its face (prompt 70). Absent, the hero
  // renders headline only.
  heroTrend?: number[];
  heroTrendTarget?: number;
  promptPlaceholder: string;
  promptSuggestions: string[];
  insightCards: [
    InsightCardData,
    InsightCardData,
    InsightCardData,
    InsightCardData,
  ];
}
