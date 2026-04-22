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
  chartCycleTime: `Here's the **cycle time trend** over the past 8 weeks.

Cycle time dropped from **3.4 days to 2.1 days** — a 38% reduction. The target of 2.0 days is now within reach.

The improvement rate has accelerated in the last three weeks, suggesting the Q2 process changes are taking hold.

Two approval bottlenecks remain that are each adding ~0.5 days to the average. Resolving either one closes the remaining gap to target.`,

  chartExceptions: `Here's the **exception breakdown** by category.

The distribution is highly concentrated — the top two categories account for **65% of all manual intervention**. Overall exception volume is down 14% month over month.

Missing PO numbers are the most actionable: a validation gate at invoice submission would prevent this upstream before it enters the queue.

Amount mismatch routing by threshold (auto-approve below $50) would resolve ~60% of the second category without any manual review.`,

  chartSTP: `Here's the current **straight-through processing rate**.

Your STP rate of **78.4%** is up 5.2 points from last period — above the industry median of ~72% for mid-market AP automation.

The remaining 21.6% largely consists of non-standard invoices (service POs, blanket orders, multi-currency) that need rule extensions, not automation tuning.

Setting a target of **85% STP** for Q3 is achievable with the current infrastructure, primarily by closing the missing PO number gap.`,

  chartPipeline: `Here's the **weekly pipeline** by processing status.

Thursday carries the highest automated volume — consistent with supplier payment term deadlines. Automation is absorbing **78% of total weekly volume**.

The manual queue is stable week-over-week. The pending backlog dips on Fridays, which is worth monitoring for Monday carryover patterns.

Pre-staging capacity ahead of Thursday peak would reduce any risk of throughput compression.`,

  chartSavings: `Here's the **savings trajectory** against the original projection.

Actual savings are tracking **$0.4M above forecast** through W8, driven primarily by PO validation outperforming the original model.

At the current pace, annualized savings reach $3.0M by year-end. A new approval automation initiative could add another $0.6M in Q3 — the infrastructure cost would be minimal since the PO validation layer is already in place.`,

  chartSLABreach: `Here's the **daily SLA breach trend** for the current week.

Wednesday is the only day that breached the 5% threshold, reaching **5.8%**. Monday and Friday are both well below target.

The Wednesday spike is consistent with prior weeks and likely traces to midweek PO discrepancy batches. Auto-escalation for items open more than 24 hours would contain most of the overage without changing staffing patterns.`,

  chartVolumeGrowth: `Here's the **volume growth trend** over the past 12 weeks.

Volume has grown steadily at ~15% sustained week-over-week without any increase in headcount. The automation layer is absorbing all of the new volume.

Estimated capacity headroom before intervention is needed: **+22%** above current levels. Q3 seasonal patterns from prior years showed some compression in July–August, which is worth monitoring.`,

  layoutPerformance: `I put together a **Performance & Throughput** view for you. It focuses on cycle time trends, processing volume, and efficiency KPIs — the signals that show where automation is working and where bottlenecks are forming.

The view includes throughput rate, average cycle time over the past 12 weeks, processing volume growth, and a weekly pipeline breakdown. Cycle time is down 42% over that period, and automation is now handling 78% of total volume.

Two approval bottlenecks remain in the cycle time path — those are the highest-leverage items to address next.`,

  layoutRisk: `I put together a **Risk & Issues** view that surfaces the things most likely to need your attention right now — exception categories, SLA breach rates, and resolution trends.

The top 3 issue categories (missing documentation, threshold exceeded, data mismatch) account for 74% of all exception volume. Documentation issues are declining for the third consecutive week, but the SLA breach rate ticked up 0.3 points this period, which is worth watching.

Adding escalation automation for items open more than 48 hours would close most of the remaining breach gap.`,

  layoutOpportunities: `I put together an **Opportunities & Growth** view focused on improvement potential and where automation has the highest leverage.

Process automation delivers the highest ROI by a wide margin — invoice matching alone has a 6-week payback period. The growth trend has been sustained at 15% for 8 consecutive weeks, and projected annualized savings from current initiatives sit at \$2.4M with room to grow.

PO approval automation is the logical next expansion; the infrastructure is already in place.`,

  invoice_stp: `## Straight-Through Rate Analysis

Your STP rate of **78.4%** is above the industry median of ~72% for mid-market AP automation — a meaningful signal that the automation layer is maturing.

**What's driving the improvement**
- PO-matching logic improvements landed last quarter are reducing the largest exception category (missing PO numbers)
- Vendor master cleanup reduced "vendor not in system" errors by ~30% over the past 60 days
- The shift to e-invoicing with 3 key suppliers eliminated a manual data entry step entirely

**Where the ceiling is**
- The remaining ~22% largely consists of non-standard invoices (service POs, blanket orders, multi-currency) that require rule extensions, not just automation tuning
- Approval timeout exceptions (the smallest category) are a human behavior problem — escalation reminders or auto-escalation rules could close most of this gap

**Recommendations**
1. Target the missing PO number category first — a pre-submission validation at the supplier portal would prevent this upstream
2. Set a STP target of **85%** for next quarter; the gap is achievable with the current automation footprint
3. Track STP separately by invoice type to identify which sub-segments are dragging the aggregate

Want me to break this down by vendor tier or invoice category?`,

  invoice_exceptions: `## Top Exceptions Analysis

The exception distribution shows a concentrated pattern — the top 2 categories (**missing PO number + amount mismatch**) account for 65% of all exceptions.

**Category Breakdown**
1. **Missing PO number (38%)** — the single largest driver; almost always upstream procurement behavior, not an AP process failure
2. **Amount mismatch (27%)** — split between price discrepancies (catalog vs. invoice) and quantity disputes; each has a different resolution path
3. **Duplicate invoice (19%)** — lower risk but creates unnecessary queue volume; automated dedup logic should catch most of these
4. **Vendor not in system (11%)** — vendor onboarding lag; peaks when new suppliers are added without pre-registration
5. **Approval timeout (5%)** — small but high-cost to resolve; each timeout adds 2–3 days to cycle time

**The good news:** Total exception volume is down 14% month over month — the trend is moving in the right direction.

**Recommended actions**
- Add a PO validation gate at invoice submission to block missing-PO invoices at the source
- Route amount mismatches by threshold: auto-approve <$50 variance, human review above
- Implement duplicate detection with a 90-day lookback window
- Trigger auto-escalation after 24 hours on pending approvals

Want me to model the STP impact of resolving each exception category?`,

  invoice_pipeline: `## Weekly Pipeline Analysis

The pipeline shows healthy throughput with a clear mid-week exception spike worth investigating.

**Volume Pattern**
- Thursday and Friday carry the highest processed volume — consistent with net-30/net-60 payment term deadlines clustering at end of week
- Wednesday shows the most **on-hold exceptions** despite having lower overall volume — this is anomalous and worth investigating
- Monday pending volume is likely Friday carryover, which is normal

**Wednesday spike hypothesis**
The Wednesday on-hold spike likely traces to one of three causes:
1. Midweek PO discrepancies from procurement cut-offs the prior Friday
2. A specific vendor or department with approval routing delays
3. Batch submissions from a particular business unit that bypasses the standard portal

**Throughput summary**
- Weekly total: ~1,670 invoices processed
- Exception rate: ~8.3% (on hold / pending as share of total)
- End-of-week bias: 42% of weekly volume lands Thursday–Friday

**Recommendations**
- Drill into Wednesday on-hold invoices by vendor and department to isolate the pattern
- Consider shifting some approval notifications to Tuesday afternoon to reduce Wednesday morning queues
- Monitor whether Friday's lower on-hold rate reflects genuine resolution or deferred exceptions into Monday

Want me to identify which vendors or departments are contributing most to the Wednesday spike?`,

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

  // Chart-specific data queries — checked before layout-intent patterns
  if (/cycle.?time|avg.?time|processing.?time/.test(combined))
    return RESPONSES.chartCycleTime;
  if (
    /exception.?volume|exception.?trend|exception.?breakdown|show.+exception|top.+exception/.test(
      combined,
    )
  )
    return RESPONSES.chartExceptions;
  if (/stp.?rate|straight.?through|automation.?rate/.test(combined))
    return RESPONSES.chartSTP;
  if (/weekly.+pipeline|pipeline.+breakdown|pipeline.+status/.test(combined))
    return RESPONSES.chartPipeline;
  if (/saving.?trajectory|savings.?progress|projected.?saving/.test(combined))
    return RESPONSES.chartSavings;
  if (/sla.?breach|breach.?rate|daily.?breach/.test(combined))
    return RESPONSES.chartSLABreach;
  if (/volume.?growth|growth.?trend/.test(combined))
    return RESPONSES.chartVolumeGrowth;

  // Layout-intent responses — check before generic card responses
  if (/perform|throughput|efficienc|speed|velocit|cycle/.test(combined)) {
    return RESPONSES.layoutPerformance;
  }
  if (
    /risk|issue|problem|anomal|exception|breach|alert|fail|sla/.test(combined)
  ) {
    return RESPONSES.layoutRisk;
  }
  if (
    /opportunit|growth|trend|improve|potential|saving|upside|decision/.test(
      combined,
    )
  ) {
    return RESPONSES.layoutOpportunities;
  }

  // Invoice processing responses
  if (combined.includes("straight-through") || combined.includes("stp")) {
    return RESPONSES.invoice_stp;
  }
  if (
    combined.includes("exception") ||
    combined.includes("missing po") ||
    combined.includes("mismatch")
  ) {
    return RESPONSES.invoice_exceptions;
  }
  if (
    (combined.includes("invoice") || combined.includes("payment")) &&
    (combined.includes("pipeline") || combined.includes("weekly"))
  ) {
    return RESPONSES.invoice_pipeline;
  }
  if (
    combined.includes("on-time payment") ||
    combined.includes("on time payment")
  ) {
    return RESPONSES.invoice_stp;
  }

  // Generic responses
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

      // Hold thinking state until the full response is "ready", then print out quickly.
      // 3500ms gives the entrance animation time to complete and lets the thinking
      // label sit for a deliberate beat before anything appears.
      await new Promise((r) => setTimeout(r, 3500));

      // Stream word-by-word so the transition from thinking → text feels fast and decisive
      // rather than a slow character trickle.
      const words = response.split(" ");
      for (let i = 0; i < words.length; i++) {
        if (abortSignal?.aborted) break;
        const chunk = i === 0 ? words[i] : ` ${words[i]}`;
        yield {
          type: "TEXT_MESSAGE_CONTENT",
          messageId,
          delta: chunk,
          timestamp: Date.now(),
        } as const;
        await new Promise((r) => setTimeout(r, 22));
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
