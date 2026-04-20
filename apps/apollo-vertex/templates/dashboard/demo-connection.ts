import type { ModelMessage } from "@tanstack/ai";
import type { ConnectConnectionAdapter, UIMessage } from "@tanstack/ai-client";

function isUIMessages(
  messages: Array<UIMessage> | Array<ModelMessage>,
): messages is UIMessage[] {
  const first = messages[0];
  return first != null && "parts" in first;
}

function getLastUserText(
  messages: Array<UIMessage> | Array<ModelMessage>,
): string {
  if (!isUIMessages(messages)) return "";
  const last = messages[messages.length - 1];
  if (!last) return "";
  return last.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.content)
    .join("");
}

const RESPONSES: Record<string, string> = {
  kpi: `## KPI Analysis

The current performance metric is tracking well for this reporting period. Here's what the data is telling us:

**Current Status**
- Performance is within expected parameters with a positive trend
- The rate of change indicates sustained improvement over the selected range

**Key Observations**
1. The metric has shown consistent momentum — no major anomalies detected
2. The delta from the prior period reflects meaningful operational progress
3. Comparison against target indicates the team is on track to hit period goals

**Recommendations**
- Set threshold alerts to catch any regression early
- Investigate the top 2–3 contributing factors to understand what's driving the improvement
- Correlate this KPI with downstream metrics to confirm business impact

What specific aspect of this metric would you like to explore further?`,

  issues: `## Top Issues Analysis

The distribution shows a clear Pareto pattern — the top items are driving the majority of volume.

**Pattern Overview**
- The top 2 items account for roughly **70% of total occurrences** — a highly concentrated distribution
- This is a strong signal to prioritize root cause work on items A and B before addressing the long tail

**Key Findings**
1. **Item A (40%)** — the single largest contributor; warrants an immediate deep-dive
2. **Item B (30%)** — second-highest; likely shares causal factors with Item A
3. **Items C & D** — lower volume, but worth monitoring for upward trends

**Recommended Actions**
- Launch a focused workstream on the top 2 items — resolving them could reduce total volume by ~60–70%
- Set up automated detection to catch early signals before they escalate
- Review whether Item A and B share a common root cause — addressing one may resolve both

**Business Impact**
Prioritizing the top category alone could improve overall outcomes significantly within one reporting cycle.

Would you like me to model the projected impact of addressing each item?`,

  pipeline: `## Pipeline Analysis

The weekly pipeline data shows healthy activity with some clear patterns worth acting on.

**Weekly Trends**
- Mid-week peaks (Wednesday–Thursday) align with typical pipeline behavior — this is where the most conversions are happening
- End-of-week figures suggest late momentum that could be capitalized on
- Monday numbers are lower, likely reflecting weekend clearing

**Segment Breakdown**
- **Segment A** — the primary driver, consistently representing the largest share
- **Segment B** — moderate contribution with some week-to-week variability; worth investigating if seasonal
- **Segment C** — smallest footprint but stable presence, indicating a reliable base

**Observations**
1. No significant drops detected — pipeline health appears stable across the period
2. Segment B volatility may be seasonal or tied to external factors; historical comparison would help confirm
3. The Thursday uptick pattern is consistent — consider aligning outreach activities to peak around that window

**Next Steps**
- Investigate Segment B volatility: seasonal vs. structural?
- Model conversion rates by segment to identify where optimization has the highest leverage
- Consider a targeted mid-week activation strategy to sustain and grow the Wednesday–Thursday peak

Want me to dig into a specific segment or time window?`,
};

function pickResponse(sourceCardTitle: string, userMessage: string): string {
  const combined = `${sourceCardTitle} ${userMessage}`.toLowerCase();

  if (
    combined.includes("pipeline") ||
    combined.includes("stacked") ||
    combined.includes("weekly")
  ) {
    return RESPONSES.pipeline;
  }

  if (
    combined.includes("issue") ||
    combined.includes("top") ||
    combined.includes("bar") ||
    combined.includes("item")
  ) {
    return RESPONSES.issues;
  }

  return RESPONSES.kpi;
}

export function createDemoConnection(
  sourceCardTitle: string,
): ConnectConnectionAdapter {
  return {
    async *connect(messages, _data, abortSignal) {
      const messageId = crypto.randomUUID();
      const runId = crypto.randomUUID();

      yield { type: "RUN_STARTED", runId, timestamp: Date.now() } as const;
      yield {
        type: "TEXT_MESSAGE_START",
        messageId,
        role: "assistant",
        timestamp: Date.now(),
      } as const;

      const userText = getLastUserText(messages);
      const response = pickResponse(sourceCardTitle, userText);

      // Pause before first token so the thinking/loading indicator has time to complete
      // its entrance animation (500ms fade-in + 700ms icon morph = ~1200ms).
      // The connection is stable (won't be aborted during this wait), so 1200ms is safe.
      await new Promise((r) => setTimeout(r, 1200));

      for (const char of response) {
        if (abortSignal?.aborted) break;
        yield {
          type: "TEXT_MESSAGE_CONTENT",
          messageId,
          delta: char,
          timestamp: Date.now(),
        } as const;
        // Slight delay on whitespace/newlines for a natural typing feel
        if (char === " " || char === "\n") {
          await new Promise((r) => setTimeout(r, 18));
        }
      }

      yield {
        type: "TEXT_MESSAGE_END",
        messageId,
        timestamp: Date.now(),
      } as const;
      yield {
        type: "RUN_FINISHED",
        runId,
        finishReason: "stop",
        timestamp: Date.now(),
      } as const;
    },
  };
}
