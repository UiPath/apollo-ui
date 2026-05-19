import { assertDefined } from "@/lib/asserts/assert-defined";
import type { PrimitiveValue } from "@/lib/charts-core";
import {
  type DataQueryResponse,
  PrimitiveValueSchema,
} from "../schemas/data-query-response-schema";

interface ChartDataMappingOptions {
  dimensions: string[];
  metrics?: string[];
}

type ChartDataRow = Record<string, PrimitiveValue>;

export function mapResponseToChartData({
  dimensions,
  metrics = [],
  data,
}: ChartDataMappingOptions & { data: DataQueryResponse }): ChartDataRow[] {
  const [firstKey] = dimensions;
  if (!firstKey) {
    return [];
  }

  const rows = data[firstKey]?.values ?? [];
  const rowCount = rows.length;

  const dimensionValues = dimensions.map((dimension) => {
    return assertDefined(data[dimension], `Dimension data: ${dimension}`)
      .values;
  });

  const metricValues = metrics?.map((metric) => {
    return assertDefined(data[metric], `Metric data: ${metric}`).values;
  });

  return Array.from({ length: rowCount }, (_, rowIdx) => {
    const entries: Array<readonly [string, PrimitiveValue]> = [
      ...dimensions.map(
        (dimension, dimensionIdx): readonly [string, PrimitiveValue] => {
          const value = PrimitiveValueSchema.parse(
            assertDefined(
              dimensionValues[dimensionIdx],
              `Dimension ${dimensionIdx}`,
            )[rowIdx],
          );
          return [dimension, value];
        },
      ),
      ...metrics.map((metric, metricIdx): readonly [string, PrimitiveValue] => {
        const value = PrimitiveValueSchema.parse(
          assertDefined(metricValues[metricIdx], `Metric ${metricIdx}`)[rowIdx],
        );
        return [metric, value];
      }),
    ];

    return Object.fromEntries(entries);
  });
}
