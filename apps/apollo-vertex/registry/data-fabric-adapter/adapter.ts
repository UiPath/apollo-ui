import { queryOptions } from "@tanstack/react-query";
import { initClient } from "@ts-rest/core";
import { z } from "zod";
import {
  type DataAdapter,
  type ListFilter,
  PrimitiveValueSchema,
} from "@/lib/charts-core";
import { dataFabricBarChartAdapter } from "./chart-adapters/bar";
import { dataFabricDistributionChartAdapter } from "./chart-adapters/distribution";
import { dataFabricKpiChartAdapter } from "./chart-adapters/kpi";
import { dataFabricLineChartAdapter } from "./chart-adapters/line";
import { dataFabricMultiLineChartAdapter } from "./chart-adapters/multi-line";
import { dataFabricTableChartAdapter } from "./chart-adapters/table";
import { dataFabricContract } from "./contract";
import { dataFabricQuery } from "./utils/query";

interface DataFabricAdapterProps {
  baseUrl: string;
  accessToken: string;
  entityName: string;
}

export const dataFabricAdapter = ({
  baseUrl,
  accessToken,
  entityName,
}: DataFabricAdapterProps): DataAdapter => {
  const client = initClient(dataFabricContract, {
    baseUrl,
    baseHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return {
    charts: {
      table: dataFabricTableChartAdapter(client, entityName),
      bar: dataFabricBarChartAdapter(client, entityName),
      distribution: dataFabricDistributionChartAdapter(client, entityName),
      line: dataFabricLineChartAdapter(client, entityName),
      multiLine: dataFabricMultiLineChartAdapter(client, entityName),
      kpi: dataFabricKpiChartAdapter(client, entityName),
    },
    filters: {
      list: (filter: ListFilter) => {
        return queryOptions({
          queryKey: [entityName, filter.field.id] as readonly unknown[],
          queryFn: async () => {
            const response = await dataFabricQuery(
              client,
              entityName,
              {
                selectedFields: [filter.field.id],
                top: 1000,
              },
              "Failed to fetch filter values",
            );

            const values = [
              ...new Set(response.value.map((row) => row[filter.field.id])),
            ];
            return z.array(PrimitiveValueSchema).parse(values);
          },
        });
      },
    },
  };
};
