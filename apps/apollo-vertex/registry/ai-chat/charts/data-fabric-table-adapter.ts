import {
  type DataAdapter,
  mapResponseToChartData,
} from "@uipath/apollo-dashboarding";

interface DataFabricTableAdapterProps {
  baseUrl: string;
  accessToken: string;
  entityId: string;
}

function extractRows(json: unknown): Record<string, unknown>[] {
  if (typeof json !== "object" || json === null || !("value" in json))
    return [];
  const { value } = json as { value: unknown };
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null,
  );
}

function notSupported(): never {
  throw new Error("Not supported by dataFabricTableAdapter");
}

/**
 * Custom table adapter that uses the Data Fabric read endpoint with
 * `expansionLevel=1` to resolve related-entity fields.
 *
 * The built-in `dataFabricAdapter` uses `POST /EntityService/{name}/query`
 * which fails for entities with related fields. This adapter uses
 * `GET /EntityService/entity/{id}/read?expansionLevel=1` instead,
 * matching the UiPath SDK's approach.
 */
export function dataFabricTableAdapter({
  baseUrl,
  accessToken,
  entityId,
}: DataFabricTableAdapterProps): DataAdapter {
  const readUrl = `${baseUrl}EntityService/entity/${entityId}/read`;

  return {
    charts: {
      table: (table, state) => {
        const dimensionIds = table.dimensions.map((d) => d.id);
        const params = new URLSearchParams({
          expansionLevel: "1",
          $top: "100",
          $skip: "0",
        });

        if (state.sortBy) {
          const dir = state.sortBy.direction === "desc" ? " desc" : "";
          params.set("$orderby", `${state.sortBy.field}${dir}`);
        }

        const url = `${readUrl}?${params.toString()}`;

        return {
          queryKey: [entityId, "table-read", url],
          queryFn: async () => {
            const response = await fetch(url, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });

            if (!response.ok) {
              const text = await response.text();
              throw new Error(`Query failed (${response.status}): ${text}`);
            }

            const json: unknown = await response.json();
            const rows = extractRows(json);

            const allKeys = [
              ...dimensionIds,
              ...(rows[0]
                ? Object.keys(rows[0]).filter((k) => !dimensionIds.includes(k))
                : []),
            ];

            const columnar: Record<
              string,
              {
                values: (string | boolean | number | null)[];
                stackValues: null;
                ungrouped: null;
              }
            > = {};
            for (const key of allKeys) {
              columnar[key] = {
                values: rows.map((row) => {
                  const v = row[key];
                  if (v == null) return null;
                  if (typeof v === "string") return v;
                  if (typeof v === "number") return v;
                  if (typeof v === "boolean") return v;
                  return JSON.stringify(v);
                }),
                stackValues: null,
                ungrouped: null,
              };
            }

            return mapResponseToChartData({
              data: columnar,
              dimensions: dimensionIds,
            });
          },
        };
      },
      bar: notSupported,
      distribution: notSupported,
      line: notSupported,
      multiLine: notSupported,
      kpi: notSupported,
    },
    filters: {
      list: () => ({
        queryKey: ["noop"] as const,
        queryFn: () => [],
      }),
    },
  } as DataAdapter;
}
