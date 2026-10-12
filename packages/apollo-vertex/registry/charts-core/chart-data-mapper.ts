import { assertDefined } from "@/lib/asserts/assert-defined";
import type { DataQueryResponse } from "./data-query-response-schema";
import type { PrimitiveValue } from "./models/primitive-value";

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

  const metricValues = metrics.map((metric) => {
    return assertDefined(data[metric], `Metric data: ${metric}`).values;
  });

  return Array.from({ length: rowCount }, (_, rowIdx) => {
    const entries: Array<readonly [string, PrimitiveValue]> = [
      ...dimensions.map(
        (dimension, dimensionIdx): readonly [string, PrimitiveValue] => [
          dimension,
          // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) `DataFabricQueryResponse` was validated upstream
          assertDefined(
            dimensionValues[dimensionIdx],
            `Dimension ${dimensionIdx}`,
          )[rowIdx] as PrimitiveValue,
        ],
      ),
      ...metrics.map((metric, metricIdx): readonly [string, PrimitiveValue] => [
        metric,
        // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) `DataFabricQueryResponse` was validated upstream
        assertDefined(metricValues[metricIdx], `Metric ${metricIdx}`)[
          rowIdx
        ] as PrimitiveValue,
      ]),
    ];

    return Object.fromEntries(entries);
  });
}
