import type { DataAdapter } from "@uipath/apollo-dashboarding";

const notSupported = () => {
  throw new Error("Chart type not supported by static data adapter");
};

export function buildStaticDataAdapter(
  rows: Record<string, unknown>[],
  cacheKey: string,
): DataAdapter {
  const queryDef = () => ({
    queryKey: ["static-chart-data", cacheKey],
    queryFn: () => rows,
  });

  return {
    charts: {
      table: queryDef,
      bar: queryDef,
      distribution: notSupported,
      line: notSupported,
      multiLine: notSupported,
      kpi: notSupported,
    },
    filters: {
      list: () => ({ queryKey: ["noop"] as const, queryFn: () => [] }),
    },
  } as DataAdapter;
}
