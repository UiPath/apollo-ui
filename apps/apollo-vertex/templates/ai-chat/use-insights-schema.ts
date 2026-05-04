import { useQuery } from "@tanstack/react-query";
import type { InfoResponse } from "@uipath/apollo-dashboarding";

interface UseInsightsSchemaOptions {
  baseUrl: string;
  accessToken: string;
  tenantId: string;
  sourceType: string;
  enabled?: boolean;
}

async function fetchSchema({
  baseUrl,
  accessToken,
  tenantId,
  sourceType,
}: Omit<UseInsightsSchemaOptions, "enabled">): Promise<InfoResponse> {
  const response = await fetch(
    `${baseUrl}/standalone-query/${encodeURIComponent(sourceType)}/info`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-UiPath-Internal-TenantId": tenantId,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load Insights schema for source "${sourceType}" (HTTP ${response.status})`,
    );
  }

  // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- shape validated upstream by the standalone-query/info contract
  return (await response.json()) as InfoResponse;
}

export function useInsightsSchema({
  baseUrl,
  accessToken,
  tenantId,
  sourceType,
  enabled = true,
}: UseInsightsSchemaOptions) {
  return useQuery({
    queryKey: ["insights-schema", tenantId, sourceType],
    queryFn: () =>
      fetchSchema({ baseUrl, accessToken, tenantId, sourceType }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
