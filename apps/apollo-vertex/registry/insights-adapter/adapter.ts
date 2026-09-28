import { queryOptions } from "@tanstack/react-query";
import { initClient } from "@ts-rest/core";
import { z } from "zod";
import {
  type DataAdapter,
  type ListFilter,
  PrimitiveValueSchema,
} from "@/lib/charts-core";
import { insightsBarChartAdapter } from "./chart-adapters/bar";
import { insightsDistributionChartAdapter } from "./chart-adapters/distribution";
import { insightsKpiChartAdapter } from "./chart-adapters/kpi";
import { insightsLineChartAdapter } from "./chart-adapters/line";
import { insightsMultiLineChartAdapter } from "./chart-adapters/multi-line";
import { insightsTableChartAdapter } from "./chart-adapters/table";
import { insightsContract } from "./contract";
import { type InsightsClient, insightsQuery } from "./utils/query";

interface InsightsAdapterProps {
  baseUrl: string;
  accessToken: string;
  sourceType: string;
}

export const insightsAdapter = ({
  baseUrl,
  accessToken,
  sourceType,
}: InsightsAdapterProps): DataAdapter => {
  const client: InsightsClient = initClient(insightsContract, {
    baseUrl,
    baseHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return {
    charts: {
      table: insightsTableChartAdapter(client, sourceType),
      bar: insightsBarChartAdapter(client, sourceType),
      distribution: insightsDistributionChartAdapter(client, sourceType),
      line: insightsLineChartAdapter(client, sourceType),
      multiLine: insightsMultiLineChartAdapter(client, sourceType),
      kpi: insightsKpiChartAdapter(client, sourceType),
    },
    filters: {
      list: (filter: ListFilter) => {
        return queryOptions({
          queryKey: [sourceType, filter.field.id] as readonly unknown[],
          queryFn: async () => {
            const response = await insightsQuery(
              client,
              sourceType,
              {
                filters: [],
                groupBy: [filter.field.id],
                aggregates: [],
              },
              "Failed to fetch filter values",
            );

            const values = response[filter.field.id]?.values ?? [];
            return z.array(PrimitiveValueSchema).parse(values);
          },
        });
      },
    },
  };
};
