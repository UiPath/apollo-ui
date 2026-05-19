import {
  type DataQueryResponse,
  PrimitiveValueSchema,
} from "../schemas/data-query-response-schema";
import type { DataFabricQueryResponse } from "../schemas/query-schema";

export function mapDataFabricResponseToChartData(
  response: DataFabricQueryResponse,
  fieldIds: string[],
): DataQueryResponse {
  const { value: rows } = response;
  const columnKeys = [
    ...fieldIds,
    ...(rows[0]
      ? Object.keys(rows[0]).filter((k) => !fieldIds.includes(k))
      : []),
  ];
  const result: DataQueryResponse = {};

  for (const key of columnKeys) {
    result[key] = {
      values: rows.map((row) => {
        const value = row[key];
        return value == null ? null : PrimitiveValueSchema.parse(value);
      }),
      stackValues: null,
      ungrouped: null,
    };
  }

  return result;
}
