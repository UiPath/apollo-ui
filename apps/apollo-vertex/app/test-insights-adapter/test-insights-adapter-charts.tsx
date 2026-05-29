"use client";

import { BarChartWithAdapter } from "@/registry/bar-chart/bar-chart-with-adapter";
import { LineChartWithAdapter } from "@/registry/line-chart/line-chart-with-adapter";
import { insightsAdapter } from "@/lib/insights-adapter";
import {
  barChartConfiguration,
  barChartDataModel,
  lineChartConfiguration,
  lineChartDataModel,
} from "./constants";

interface TestInsightsAdapterChartsProps {
  baseUrl: string;
  accessToken: string;
  sourceType: string;
}

export function TestInsightsAdapterCharts({
  baseUrl,
  accessToken,
  sourceType,
}: TestInsightsAdapterChartsProps) {
  const adapter = insightsAdapter({
    baseUrl,
    accessToken,
    sourceType,
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Bar — instances by status</h2>
        <div className="h-[360px] border rounded-md p-4">
          <BarChartWithAdapter
            configuration={barChartConfiguration}
            dataModel={barChartDataModel}
            dataAdapter={adapter}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          Line — completed instances over time (latest only)
        </h2>
        <div className="h-[360px] border rounded-md p-4">
          <LineChartWithAdapter
            configuration={lineChartConfiguration}
            dataModel={lineChartDataModel}
            dataAdapter={adapter}
          />
        </div>
      </section>
    </div>
  );
}
