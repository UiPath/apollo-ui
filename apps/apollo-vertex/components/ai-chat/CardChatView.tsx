"use client";

import { motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { Card, cardVariants } from "@/registry/card/card";
import {
  AiStarIcon,
  FollowUpChips,
  LoanTypeRows,
  NumberedList,
  TrendBadge,
  getQueryContext,
  topIssues,
  volumeData,
} from "./shared";

// ── Component-local data ──────────────────────────────────────────────────────

const slaByLoanType = [
  { type: "VA", rate: 100.0, color: "bg-chart-2" },
  { type: "Conventional", rate: 99.8, color: "bg-chart-1" },
  { type: "Jumbo", rate: 99.4, color: "bg-chart-3" },
  { type: "FHA", rate: 97.2, color: "bg-chart-4" },
];

const slaApproachingCases = [
  { id: "LN-2847", analyst: "Sarah K.", type: "FHA", daysLeft: 1.2 },
  { id: "LN-2901", analyst: "Marcus L.", type: "Conv.", daysLeft: 2.5 },
  { id: "LN-2765", analyst: "Dana R.", type: "Jumbo", daysLeft: 3.1 },
  { id: "LN-2934", analyst: "Wei C.", type: "VA", daysLeft: 4.8 },
];

const issuesByLoanType = [
  { type: "FHA", flagRate: 41, primaryIssue: "Title search delay" },
  { type: "Jumbo", flagRate: 27, primaryIssue: "Property record mismatch" },
  { type: "Conventional", flagRate: 18, primaryIssue: "Risk phrase flagging" },
  { type: "VA", flagRate: 12, primaryIssue: "Credit report window" },
];

const firstPassByLoanType = [
  { type: "Conventional", rate: 97.1, color: "bg-chart-1" },
  { type: "VA", rate: 95.8, color: "bg-chart-2" },
  { type: "Jumbo", rate: 96.3, color: "bg-chart-3" },
  { type: "FHA", rate: 88.4, color: "bg-chart-4" },
];

const slaRiskFollowUps = [
  "Show cases closest to the SLA limit",
  "What's causing the FHA compliance gap?",
  "Alert if any case exceeds 28 days",
  "Compare SLA performance vs. last quarter",
];

const slaLoanTypeFollowUps = [
  "Show open FHA cases near SLA",
  "Which analysts handle the most FHA?",
  "What's driving the FHA gap?",
  "Set an SLA alert for FHA cases",
];

const slaDeadlineFollowUps = [
  "Assign LN-2847 to senior review",
  "Notify Sarah K. about LN-2847",
  "Show all FHA cases in progress",
  "Escalate cases with < 2 days left",
];

const topIssuesFollowUps = [
  "Show open FHA loans with flagged issues",
  "Draft a compliance checklist for FHA",
  "Which analysts have the most flags?",
  "Compare flag rates vs. last quarter",
];

const loanVolumeFollowUps = [
  "Forecast volume for Q2",
  "Which brokers are driving the most volume?",
  "Are we staffed for the current volume?",
  "Show denial trend since August",
];

const firstPassFollowUps = [
  "Which analyst teams have the best first-pass rates?",
  "What doc types most often cause re-reviews?",
  "Show improvement trend by loan type",
  "Compare FHA vs Conventional first-pass rates",
];

// ── Component ─────────────────────────────────────────────────────────────────

interface CardChatViewProps {
  query: string;
  onClose: () => void;
}

export function CardChatView({ query, onClose }: CardChatViewProps) {
  const [showResponse, setShowResponse] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const ctx = getQueryContext(query);

  useEffect(() => {
    setShowResponse(false);
    const t = setTimeout(() => setShowResponse(true), 900);
    return () => clearTimeout(t);
  }, [query]);

  // ── Promoted left card ──────────────────────────────────────────────────────

  let promotedCard: React.ReactNode;

  if (ctx.startsWith("sla")) {
    promotedCard = (
      <Card variant="glass" className="row-span-3 gap-0 overflow-hidden p-6">
        <p className="mb-1 text-[13px] text-muted-foreground">SLA compliance</p>
        <div className="mb-2 flex items-baseline gap-3">
          <span className="text-[40px] font-bold leading-none text-foreground">
            99.5%
          </span>
          <TrendBadge value="+1.2%" />
        </div>
        <p className="mb-6 text-[12px] text-muted-foreground">
          Cases closed within 30-day SLA window, Feb 2025
        </p>
        <p className="mb-3 text-[12px] font-medium text-foreground">
          By loan type
        </p>
        <LoanTypeRows data={slaByLoanType} />
        <div
          className={cn(
            "mt-6 rounded-lg border px-3 py-2.5 text-[12px] text-muted-foreground",
            ctx === "sla-deadline"
              ? "border-warning/30 bg-warning/5"
              : "border-border/60 bg-muted/30",
          )}
        >
          {ctx === "sla-deadline" ? (
            <>
              <span className="font-medium text-warning">4 cases</span>{" "}
              approaching the 30-day SLA limit — earliest expires in{" "}
              <span className="font-medium text-warning">1.2 days</span>.
            </>
          ) : (
            <>
              FHA is{" "}
              <span className="font-medium text-foreground">
                2.8 pts below target
              </span>
              . Title search timing is the primary risk factor.
            </>
          )}
        </div>
      </Card>
    );
  } else if (ctx === "top-issues") {
    promotedCard = (
      <Card variant="glass" className="row-span-3 gap-0 overflow-hidden p-6">
        <p className="mb-1 text-[13px] text-muted-foreground">
          Top compliance issues
        </p>
        <div className="mb-2 flex items-baseline gap-3">
          <span className="text-[40px] font-bold leading-none text-foreground">
            34%
          </span>
          <span className="text-[14px] text-muted-foreground">
            top flag rate
          </span>
        </div>
        <p className="mb-6 text-[12px] text-muted-foreground">
          Flagged risk phrases leading all categories, Feb 2025
        </p>
        <p className="mb-3 text-[12px] font-medium text-foreground">
          By frequency
        </p>
        <div className="space-y-3">
          {topIssues.map((issue) => (
            <div key={issue.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-foreground/80">
                  {issue.label}
                </span>
                <span className="ml-3 flex-shrink-0 text-[12px] font-medium text-foreground">
                  {issue.pct}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${issue.color}`}
                  style={{ width: `${issue.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-[12px] text-muted-foreground">
          FHA has the{" "}
          <span className="font-medium text-foreground">
            highest flag rate at 41%
          </span>{" "}
          — more than double the VA rate of 12%.
        </div>
      </Card>
    );
  } else if (ctx === "loan-volume") {
    promotedCard = (
      <Card variant="glass" className="row-span-3 gap-0 overflow-hidden p-6">
        <p className="mb-1 text-[13px] text-muted-foreground">
          Loan volume over time
        </p>
        <div className="mb-2 flex items-baseline gap-3">
          <span className="text-[40px] font-bold leading-none text-foreground">
            280
          </span>
          <TrendBadge value="+73% since Aug" />
        </div>
        <p className="mb-4 text-[12px] text-muted-foreground">
          Total approvals per month, Feb 2025
        </p>
        <div className="min-h-0 flex-1 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={volumeData}
              margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
              barSize={14}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                }}
              />
              <Bar
                dataKey="approved"
                name="Approved"
                stackId="a"
                fill="var(--chart-1)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="denied"
                name="Denied"
                stackId="a"
                fill="var(--chart-2)"
              />
              <Bar
                dataKey="cancelled"
                name="Cancelled"
                stackId="a"
                fill="var(--chart-3)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4">
          {[
            { label: "Approved", color: "bg-chart-1" },
            { label: "Denied", color: "bg-chart-2" },
            { label: "Cancelled", color: "bg-chart-3" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-sm ${item.color}`} />
              <span className="text-[10px] text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </Card>
    );
  } else {
    // first-pass (default)
    promotedCard = (
      <Card variant="glass" className="row-span-3 gap-0 overflow-hidden p-6">
        <p className="mb-1 text-[13px] text-muted-foreground">
          First-pass decision rate
        </p>
        <div className="mb-2 flex items-baseline gap-3">
          <span className="text-[40px] font-bold leading-none text-foreground">
            94.2%
          </span>
          <TrendBadge value="+6.8%" />
        </div>
        <p className="mb-6 text-[12px] text-muted-foreground">
          Loans approved without rework or escalation on first review
        </p>
        <p className="mb-3 text-[12px] font-medium text-foreground">
          By loan type
        </p>
        <LoanTypeRows data={firstPassByLoanType} />
        <div className="mt-6 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-[12px] text-muted-foreground">
          FHA remains{" "}
          <span className="font-medium text-foreground">
            8.7 pts below target
          </span>
          . Title search timing is the primary blocker for this segment.
        </div>
      </Card>
    );
  }

  // ── AI response body + follow-ups ────────────────────────────────────────────

  let responseBody: React.ReactNode;
  let followUpItems: string[];

  switch (ctx) {
    case "sla-risk":
      followUpItems = slaRiskFollowUps;
      responseBody = (
        <>
          <p>
            SLA compliance is at{" "}
            <span className="font-semibold text-foreground">99.5%</span>{" "}
            overall, but three emerging risk factors could affect next month's
            performance:
          </p>
          <NumberedList
            badge="warning"
            items={[
              {
                n: 1,
                title: "FHA title search delays",
                detail:
                  "Harris County turnaround averaging +4.2 days — 12 active FHA cases affected, representing 41% of SLA risk",
              },
              {
                n: 2,
                title: "Volume surge pressure",
                detail:
                  "Feb volume is up 73% vs Aug baseline — processing pipeline is near capacity with current staffing",
              },
              {
                n: 3,
                title: "4 cases within 5 days of deadline",
                detail:
                  "LN-2847 has 1.2 days remaining. Any unexpected delay triggers a breach",
              },
            ]}
          />
          <p className="text-foreground/75">
            FHA's 97.2% compliance is the weakest segment. If volume continues
            at the Feb pace without additional staffing, FHA could breach 95% by
            April.
          </p>
        </>
      );
      break;

    case "sla-loan-types":
      followUpItems = slaLoanTypeFollowUps;
      responseBody = (
        <>
          <p>
            <span className="font-semibold text-foreground">FHA loans</span> are
            closest to the SLA threshold at 97.2% compliance — the only loan
            type below 99% and 2.8 pts below target.
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    Loan type
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    Compliance
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    Risk
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    type: "FHA",
                    rate: "97.2%",
                    risk: "High",
                    color: "text-warning",
                  },
                  {
                    type: "Jumbo",
                    rate: "99.4%",
                    risk: "Low",
                    color: "text-success",
                  },
                  {
                    type: "Conventional",
                    rate: "99.8%",
                    risk: "Low",
                    color: "text-success",
                  },
                  {
                    type: "VA",
                    rate: "100%",
                    risk: "None",
                    color: "text-muted-foreground",
                  },
                ].map((row, i, arr) => (
                  <tr
                    key={row.type}
                    className={
                      i < arr.length - 1 ? "border-b border-border/60" : ""
                    }
                  >
                    <td className="px-3 py-2 font-medium text-foreground">
                      {row.type}
                    </td>
                    <td className="px-3 py-2 text-foreground">{row.rate}</td>
                    <td className={`px-3 py-2 font-medium ${row.color}`}>
                      {row.risk}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-foreground/75">
            VA has maintained 100% SLA compliance for 6 consecutive months.
            FHA's gap is driven by title search turnaround in 3 counties —
            primarily Harris, Travis, and Bexar.
          </p>
        </>
      );
      break;

    case "sla-deadline":
      followUpItems = slaDeadlineFollowUps;
      responseBody = (
        <>
          <p>
            <span className="font-semibold text-foreground">4 cases</span> are
            within 5 days of the 30-day SLA limit. LN-2847 is critical — 1.2
            days remaining with no decision logged yet.
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    Loan ID
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    Analyst
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    Days left
                  </th>
                </tr>
              </thead>
              <tbody>
                {slaApproachingCases.map((c, i, arr) => (
                  <tr
                    key={c.id}
                    className={
                      i < arr.length - 1 ? "border-b border-border/60" : ""
                    }
                  >
                    <td className="px-3 py-2 font-medium text-foreground">
                      {c.id}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {c.analyst}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {c.type}
                    </td>
                    <td
                      className={`px-3 py-2 font-medium ${
                        c.daysLeft < 2
                          ? "text-destructive"
                          : c.daysLeft < 4
                            ? "text-warning"
                            : "text-foreground"
                      }`}
                    >
                      {c.daysLeft}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-foreground/75">
            All 4 are FHA or Jumbo loans — the types most susceptible to
            third-party delays. Recommend escalating LN-2847 to senior review
            immediately and notifying Sarah K.
          </p>
        </>
      );
      break;

    case "top-issues":
      followUpItems = topIssuesFollowUps;
      responseBody = (
        <>
          <p>
            <span className="font-semibold text-foreground">FHA loans</span>{" "}
            have the highest compliance flag rate at 41% — more than double the
            VA rate. All four issue types appear disproportionately in FHA
            submissions.
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    Loan type
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    Flag rate
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    Top issue
                  </th>
                </tr>
              </thead>
              <tbody>
                {issuesByLoanType.map((row, i, arr) => (
                  <tr
                    key={row.type}
                    className={
                      i < arr.length - 1 ? "border-b border-border/60" : ""
                    }
                  >
                    <td className="px-3 py-2 font-medium text-foreground">
                      {row.type}
                    </td>
                    <td
                      className={`px-3 py-2 font-medium ${row.flagRate > 30 ? "text-warning" : "text-foreground"}`}
                    >
                      {row.flagRate}%
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.primaryIssue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-foreground/75">
            The "flagged risk phrase" issue alone drives 34% of all flags — most
            are triggered by boilerplate application notes. A template update
            could resolve a large portion without analyst intervention.
          </p>
        </>
      );
      break;

    case "loan-volume":
      followUpItems = loanVolumeFollowUps;
      responseBody = (
        <>
          <p>
            Volume has grown{" "}
            <span className="font-semibold text-foreground">
              +73% since August
            </span>
            , driven by three compounding factors:
          </p>
          <NumberedList
            items={[
              {
                n: 1,
                title: "Rate environment shift",
                detail:
                  "Fed's August rate guidance drove a refinance wave — refi applications up 58% since September",
              },
              {
                n: 2,
                title: "New broker partnerships",
                detail:
                  "Meridian Financial and two regional networks onboarded in Sept, adding ~47 new apps/month",
              },
              {
                n: 3,
                title: "Seasonal Q4 acceleration",
                detail:
                  "Year-end close push from commercial clients — typical pattern, amplified by the rate drop",
              },
            ]}
          />
          <p className="text-foreground/75">
            Approval rate held steady at{" "}
            <span className="font-medium text-foreground">~65%</span> despite
            the surge — quality hasn't degraded under load. Denial rate is up
            slightly, mostly higher-DTI applicants entering via the new broker
            channels.
          </p>
        </>
      );
      break;

    default:
      // first-pass
      followUpItems = firstPassFollowUps;
      responseBody = (
        <>
          <p>
            The{" "}
            <span className="font-semibold text-foreground">
              +6.8% improvement
            </span>{" "}
            in first-pass rate since Q3 is driven by three primary factors:
          </p>
          <NumberedList
            items={[
              {
                n: 1,
                title: "Pre-screening automation",
                detail:
                  "DTI and credit checks surface issues before submission, reducing re-reviews by 34%",
              },
              {
                n: 2,
                title: "Document validation at intake",
                detail:
                  "Flagging missing docs upfront resolved 61% of the 'incomplete file' rejection category",
              },
              {
                n: 3,
                title: "Analyst routing by loan type",
                detail:
                  "Specialization cut avg review time by 1.8 days for Jumbo and VA loans",
              },
            ]}
          />
          <p className="text-foreground/75">
            Conventional loans gained the most at{" "}
            <span className="font-medium text-foreground">+9.1%</span>. FHA
            remains lowest at{" "}
            <span className="font-medium text-foreground">88.4%</span>, with
            title search timing as the main blocker.
          </p>
        </>
      );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="grid h-full min-h-0 gap-4 p-4"
      style={{
        gridTemplateColumns: "1.8fr 2.5fr",
        gridTemplateRows: "1fr 1fr 1.6fr",
      }}
    >
      {promotedCard}

      <div
        className={cn(
          cardVariants({ variant: "glass" }),
          "row-span-3 flex flex-col overflow-hidden gap-0 p-0",
        )}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <AiStarIcon className="h-4 w-4 text-primary" />
            <span className="text-[13px] font-semibold text-foreground">
              AI Analysis
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Back to overview
          </button>
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <div className="flex justify-end">
            <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-[13px] leading-relaxed text-primary-foreground">
              {query}
            </div>
          </div>

          {!showResponse ? (
            <div className="flex items-center gap-2.5">
              <AiStarIcon className="h-4 w-4 flex-shrink-0 text-primary" />
              <div className="flex gap-1">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          ) : (
            // framer-motion: response fade-in — opacity + y lift when AI response appears
            <motion.div
              className="flex gap-2.5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AiStarIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <div className="min-w-0 flex-1 space-y-3 text-[13px] leading-relaxed text-foreground/90">
                {responseBody}
                <FollowUpChips items={followUpItems} onSelect={setFollowUp} />
              </div>
            </motion.div>
          )}
        </div>

        {/* Follow-up input */}
        <div className="flex-shrink-0 border-t border-border/60 p-4">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2.5 transition-colors focus-within:border-primary/40">
            <input
              type="text"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="Ask a follow-up…"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
            <button
              type="button"
              disabled={!followUp.trim()}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
