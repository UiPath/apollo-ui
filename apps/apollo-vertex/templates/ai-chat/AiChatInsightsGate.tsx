"use client";

import type { ReactNode } from "react";
import type { InsightsSchema } from "@/registry/ai-chat/tools/insights/shared";
import { useInsightsSchema } from "./use-insights-schema";

interface InsightsGateProps {
  baseUrl: string;
  accessToken: string;
  tenantId: string;
  sourceType: string;
  children: (props: { schema: InsightsSchema }) => ReactNode;
}

export function InsightsGate({
  baseUrl,
  accessToken,
  tenantId,
  sourceType,
  children,
}: InsightsGateProps) {
  const {
    data: schema,
    isLoading,
    isError,
  } = useInsightsSchema({ baseUrl, accessToken, tenantId, sourceType });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Loading Insights schema...
      </div>
    );
  }

  if (isError || !schema) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Failed to load Insights schema for "{sourceType}".
      </div>
    );
  }

  return <>{children({ schema })}</>;
}
