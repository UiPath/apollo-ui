"use client";

import { toolDefinition } from "@tanstack/ai";
import type { DataAdapter } from "@uipath/apollo-dashboarding";
import { Suspense } from "react";
import { z } from "zod";
import { BarChartCard } from "../../charts/bar-chart-card";
import {
  buildBarConfiguration,
  buildBarDataModel,
} from "../../charts/bar-data-model";
import { NoDataMessage } from "../../charts/no-data-message";
import { buildStaticDataAdapter } from "../../charts/static-data-adapter";
import type { AiChatTool } from "../tool-types";

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
    .min(1)
    .describe(
      "REQUIRED. The actual data rows as objects keyed by column name. Must include values for dimension and metric columns.",
    ),
  dimensions: z
    .array(z.string())
    .min(1)
    .describe("Categorical column names for X-axis"),
  metrics: z
    .array(z.string())
    .min(1)
    .describe("Numeric column names for Y-axis"),
});

type BarchartInput = z.infer<typeof barchartInput>;

export const BARCHART_TOOL_PROMPT = `You have a "show_barchart" tool.
When the user wants to visualize data as a bar chart, call it with columns, rows, dimensions, and metrics.
IMPORTANT: You MUST include the "rows" array with the actual data objects. The chart cannot render without rows.
Each row is an object keyed by column name (same format as show_table).
After calling the tool, keep text reply short — the UI renders the chart.`;

const showBarchartDef = toolDefinition({
  name: "show_barchart",
  description:
    "Display data as a bar chart. All parameters are required: columns (column definitions), rows (the actual data array — same format as show_table), dimensions (categorical X-axis column names), metrics (numeric Y-axis column names).",
  inputSchema: barchartInput,
});

export const showBarchartClient = showBarchartDef.client((input) => input);

interface CreateBarchartToolOptions {
  buildAdapter?: (
    rows: Record<string, unknown>[],
    cacheKey: string,
  ) => DataAdapter;
}

export function createBarchartTool(
  options?: CreateBarchartToolOptions,
): AiChatTool {
  const buildAdapter = options?.buildAdapter ?? buildStaticDataAdapter;

  return {
    tool: showBarchartClient,
    prompt: BARCHART_TOOL_PROMPT,
    render: (args) => {
      const { columns, rows, dimensions, metrics, title } =
        args as BarchartInput;
      if (
        !columns?.length ||
        !rows ||
        !dimensions?.length ||
        !metrics?.length
      ) {
        return <NoDataMessage />;
      }
      const safeRows = rows ?? [];
      const dataModel = buildBarDataModel(columns, dimensions, metrics);
      const configuration = buildBarConfiguration(dimensions, metrics, title);
      const cacheKey = JSON.stringify(safeRows).slice(0, 200);
      const adapter = buildAdapter(safeRows, cacheKey);
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
  };
}

export const barchartTool = createBarchartTool();
