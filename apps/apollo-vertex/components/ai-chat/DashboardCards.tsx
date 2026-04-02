"use client";

import { LayoutGroup, motion } from "framer-motion";
import { TrendingDown } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/registry/card/card";
import { AiStarIcon, TrendBadge, volumeData } from "./shared";
import { TopIssuesCard } from "./TopIssuesCard";

// ── Internal sub-components (not AI-specific, not shared outside DashboardCards) ─

function AiPromptPill({
  question,
  onClick,
}: {
  question: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-left text-[12px] text-foreground/70 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-background hover:text-foreground"
    >
      <AiStarIcon className="h-4 w-4 flex-shrink-0 text-primary" />
      {question}
    </button>
  );
}

function SlaCard() {
  return (
    // framer-motion: layout animation — SlaCard participates in the LayoutGroup
    // so it resizes smoothly when TopIssuesCard flips and changes height.
    <motion.div layout transition={{ layout: slaSpring }}>
      <Card variant="glass" className="gap-0 p-4">
        <p className="mb-1.5 text-[13px] font-semibold text-foreground">
          SLA compliance
        </p>
        <div className="flex items-center gap-3">
          <span className="text-[28px] font-bold text-foreground">99.5%</span>
          <TrendBadge value="+1.2%" />
        </div>
      </Card>
    </motion.div>
  );
}

const slaSpring = { type: "spring" as const, stiffness: 260, damping: 28 };

// ── DashboardCards ────────────────────────────────────────────────────────────

interface DashboardCardsProps {
  onPromptClick: (q: string) => void;
}

export function DashboardCards({ onPromptClick }: DashboardCardsProps) {
  return (
    // framer-motion: LayoutGroup coordinates layout animations between SlaCard
    // and the loan volume card when TopIssuesCard's flip changes the grid layout.
    <LayoutGroup id="dashboard-cards">
      <div
        className="h-full grid min-h-0 gap-3"
        style={{
          gridTemplateColumns: "1fr 1.5fr",
          gridTemplateRows: "auto auto 1fr",
        }}
      >
        {/* First-pass decision rate — col 1, row 1 */}
        <Card variant="glass" className="gap-0 p-4">
          <p className="mb-1.5 text-[13px] font-semibold text-foreground">
            First-pass decision rate
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[28px] font-bold text-foreground">94.2%</span>
            <TrendBadge value="+6.8%" />
          </div>
          <AiPromptPill
            question="What's driving the +6.8% first-pass improvement?"
            onClick={() =>
              onPromptClick("What's driving the +6.8% first-pass improvement?")
            }
          />
        </Card>

        {/* Top issues — col 2, rows 1-2 — flip card */}
        <TopIssuesCard onPromptClick={onPromptClick} />

        {/* SLA compliance — col 1, row 2 */}
        <SlaCard />

        {/* Loan volume over time — col 1-2, row 3 */}
        {/* framer-motion: layout animation — expands/contracts with SlaCard in LayoutGroup */}
        <motion.div
          layout
          className="col-span-2 min-h-0"
          transition={slaSpring}
        >
          <Card variant="glass" className="h-full overflow-hidden gap-0 p-4">
            <p className="mb-3 text-[13px] font-semibold text-foreground">
              Loan volume over time
            </p>
            <div className="min-h-0 flex-1 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={volumeData}
                  margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
                  barSize={20}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
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
            <div className="mt-3 flex items-center justify-center gap-5">
              {[
                { label: "Approved", color: "bg-chart-1" },
                { label: "Denied", color: "bg-chart-2" },
                { label: "Cancelled", color: "bg-chart-3" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
                  <span className="text-[11px] text-muted-foreground">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </LayoutGroup>
  );
}
