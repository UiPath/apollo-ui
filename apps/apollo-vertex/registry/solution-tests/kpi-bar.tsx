"use client";

import { useTranslation } from "react-i18next";
import { TrendingUp } from "lucide-react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { RunStatus } from "./types";
import type { SolutionTestBatchRun } from "./types";
import { renderValueOrEmptyState } from "@/lib/renderValueOrEmptyState";
import { MAX_TREND_POINTS } from "./constants";
import { useSolutionTestsConfig } from "./context";
import { UserMessagesIcon } from "./user-messages-view";

function isCompletedBatch(batch: SolutionTestBatchRun): boolean {
  return batch.Status === RunStatus.Passed || batch.Status === RunStatus.Failed;
}

interface KpiBarProps {
  batchRuns: SolutionTestBatchRun[];
  loading?: boolean;
}

export const KpiBar = ({ batchRuns, loading = false }: KpiBarProps) => {
  const { t } = useTranslation();
  const { subjectNoun, passThreshold } = useSolutionTestsConfig();

  const scoreTrendChartConfig = {
    score: { label: t("score"), color: "var(--primary)" },
  } satisfies ChartConfig;

  const completedBatches = batchRuns
    .filter((batch) => isCompletedBatch(batch))
    .toSorted(
      (a, b) =>
        new Date(b.CompletedAt ?? b.CreateTime ?? 0).getTime() -
        new Date(a.CompletedAt ?? a.CreateTime ?? 0).getTime(),
    );

  const lastBatch = completedBatches[0];
  const lastRunScore = lastBatch?.OverallScore;
  const testsPassing = lastBatch?.TestsPassed;
  const testsTotal = lastBatch?.TestsTotal;

  const trendData = completedBatches
    .map((b) => {
      const date = new Date(b.CompletedAt ?? b.CreateTime ?? 0);
      return {
        date: date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        }),
        timestamp: date.getTime(),
        score: b.OverallScore == null ? 0 : Math.round(b.OverallScore * 100),
      };
    })
    .toSorted((a, b) => a.timestamp - b.timestamp)
    .slice(-MAX_TREND_POINTS);

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card variant="glass" className="py-6">
        <CardHeader>
          <CardTitle className="text-base font-bold">
            {t("last_run_score")}
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-auto">
          {loading ? (
            <Skeleton className="h-9 w-20" />
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-3xl font-bold">
                {renderValueOrEmptyState(lastRunScore, {
                  type: "number",
                  options: { style: "percent", maximumFractionDigits: 0 },
                })}
              </span>
              {lastBatch && (
                <UserMessagesIcon messages={lastBatch.UserMessages} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="glass" className="py-6">
        <CardHeader>
          <CardTitle className="text-base font-bold">
            {subjectNoun
              ? t("subject_passing", { subject: subjectNoun.plural })
              : t("tests_passing")}
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-auto">
          {loading ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <span className="text-3xl font-bold">
              {testsPassing == null || testsTotal == null
                ? "-"
                : `${testsPassing}/${testsTotal}`}
            </span>
          )}
        </CardContent>
      </Card>

      <Card variant="glass" className="py-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-1 text-base font-bold">
            <TrendingUp className="size-3" />
            {t("score_trend")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[100px] w-full" />
          ) : trendData.length > 1 ? (
            <ChartContainer
              config={scoreTrendChartConfig}
              className="aspect-auto h-[100px] w-full"
            >
              <LineChart
                data={trendData}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <ReferenceLine
                  y={passThreshold * 100}
                  stroke="var(--success)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `${String(value)}%`}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-score)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-score)", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[100px] items-center justify-center text-sm text-muted-foreground">
              {trendData.length === 1 ? `${trendData[0].score}%` : "-"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
