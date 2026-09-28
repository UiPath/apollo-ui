import { DateTime } from "luxon";
import type { z } from "zod";
import type { FilterValues } from "@/lib/charts-core";
import type {
  DataFabricQueryFilterSchema,
  DataFabricQueryRequest,
} from "../schemas/query-schema";

type DataFabricQueryFilter = z.infer<typeof DataFabricQueryFilterSchema>;

function toFilterValue(value: unknown): string | number | boolean | null {
  if (value instanceof DateTime) return value.toISO() ?? "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return value;
  return null;
}

export function mapFilterValuesToDataFabricFilterGroup(
  filters: FilterValues[],
): DataFabricQueryRequest["filterGroup"] | undefined {
  if (filters.length === 0) return;

  const queryFilters: DataFabricQueryFilter[] = filters.flatMap(
    (filter): DataFabricQueryFilter[] => {
      switch (filter.type) {
        case "list": {
          const fieldName = filter.field;
          const values = filter.values;
          const invert = !!filter.invert;

          if (values.length === 0) return [];

          if (values.length === 1) {
            const operator: "=" | "!=" = invert ? "!=" : "=";
            return [
              {
                fieldName,
                operator,
                value: values[0] ?? null,
              },
            ];
          }

          if (invert) {
            return values
              .filter((v): v is string | number | boolean => v != null)
              .map((value) => ({
                fieldName,
                operator: "!=" as const,
                value,
              }));
          }

          return [
            {
              fieldName,
              operator: "in" as const,
              value: JSON.stringify(values.filter((v) => v != null)),
            },
          ];
        }
        case "search": {
          const operator =
            filter.searchFilterType === "startsWith"
              ? "startswith"
              : filter.searchFilterType === "endsWith"
                ? "endswith"
                : "contains";
          return [
            {
              fieldName: filter.field,
              operator,
              value: filter.pattern,
            },
          ];
        }
        case "period": {
          const minIso = filter.range.min.toISO();
          const maxIso = filter.range.max.toISO();

          return [
            ...(minIso == null
              ? []
              : [
                  {
                    fieldName: filter.field,
                    operator: ">=",
                    value: minIso,
                  } satisfies DataFabricQueryFilter,
                ]),
            ...(maxIso == null
              ? []
              : [
                  {
                    fieldName: filter.field,
                    operator: "<=",
                    value: maxIso,
                  } satisfies DataFabricQueryFilter,
                ]),
          ];
        }
        case "range": {
          const minVal = toFilterValue(filter.range.min);
          const maxVal = toFilterValue(filter.range.max);
          return [
            ...(minVal == null
              ? []
              : [
                  {
                    fieldName: filter.field,
                    operator: ">=",
                    value: minVal,
                  } satisfies DataFabricQueryFilter,
                ]),
            ...(maxVal == null
              ? []
              : [
                  {
                    fieldName: filter.field,
                    operator: "<=",
                    value: maxVal,
                  } satisfies DataFabricQueryFilter,
                ]),
          ];
        }
        default: {
          return [];
        }
      }
    },
  );

  if (queryFilters.length === 0) return;

  return {
    logicalOperator: "and",
    queryFilters,
  };
}
