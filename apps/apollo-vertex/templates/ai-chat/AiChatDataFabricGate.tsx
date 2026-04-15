"use client";

import type { ReactNode } from "react";
import { useDataFabricEntities } from "@/registry/ai-chat/hooks/use-data-fabric-entities";
import type { Entity } from "@/registry/ai-chat/tools/data-fabric/shared";

interface DataFabricGateProps {
  baseUrl: string;
  accessToken: string;
  children: (props: { entities: Record<string, Entity> }) => ReactNode;
}

export function DataFabricGate({
  baseUrl,
  accessToken,
  children,
}: DataFabricGateProps) {
  const {
    data: entities,
    isLoading,
    isError,
  } = useDataFabricEntities({
    baseUrl,
    accessToken,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Loading entities...
      </div>
    );
  }

  if (isError || !entities) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Failed to load Data Fabric entities.
      </div>
    );
  }

  return <>{children({ entities })}</>;
}
