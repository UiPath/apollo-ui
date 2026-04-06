"use client";

import { Suspense } from "react";
import { z } from "zod";
import { createDisplayTool } from "../tool-utils";
import { BarChartCard } from "../../charts/chart-card";
import {
  buildBarDataModel,
  buildBarConfiguration,
} from "../../charts/chart-data-model";
import { buildStaticDataAdapter } from "../../charts/static-data-adapter";

const columnSchema = z.object({
  name: z.string().describe("Column name"),
  type: z
    .enum(["string", "numeric", "boolean", "datetime"])
    .default("string")
    .describe("Data type"),
});

const barchartInput = z.object({
  title: z.string().optional().describe("Chart title"),
  columns: z.array(columnSchema).min(1).describe("Column definitions"),
  rows: z
    .array(z.record(z.string(), z.unknown()))
    .describe("Data rows as objects keyed by column name"),
  dimensions: z
    .array(z.string())
    .min(1)
    .describe("Categorical column names for X-axis"),
  metrics: z
    .array(z.string())
    .min(1)
    .describe("Numeric column names for Y-axis"),
});

export const BARCHART_TOOL_PROMPT = `You have a "show_barchart" tool.
When the user wants to visualize data as a bar chart, call it with column definitions, row data, dimensions (categorical X-axis), and metrics (numeric Y-axis).
After calling the tool, keep text reply short — the UI renders the chart.`;

export const barchartTool = createDisplayTool({
  name: "show_barchart",
  description:
    "Display data as a bar chart. Provide column definitions, row data, and specify which columns are dimensions (X-axis categories) vs metrics (Y-axis values).",
  inputSchema: barchartInput,
  prompt: BARCHART_TOOL_PROMPT,
  render: (args) => {
    if (
      !args.columns?.length ||
      !args.rows ||
      !args.dimensions?.length ||
      !args.metrics?.length
    ) {
      return (
        <p className="text-sm text-muted-foreground">
          No data to display.
        </p>
      );
    }
    const rows = args.rows ?? [];
    const dataModel = buildBarDataModel(
      args.columns,
      args.dimensions,
      args.metrics,
    );
    const configuration = buildBarConfiguration(
      args.dimensions,
      args.metrics,
      args.title,
    );
    const cacheKey = JSON.stringify(rows).slice(0, 200);
    const adapter = buildStaticDataAdapter(rows, cacheKey);
    return (
      <Suspense>
        <BarChartCard
          configuration={configuration}
          dataModel={dataModel}
          dataAdapter={adapter}
        />
      </Suspense>
    );
  },
});
