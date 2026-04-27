"use client";

import type { ReactNode } from "react";
import type { Entities } from "@uipath/uipath-typescript/entities";
import { useDataFabricEntities } from "./use-data-fabric-entities";
import type { Entity } from "@/registry/ai-chat/tools/data-fabric/shared";

interface DataFabricGateProps {
  entities: Entities;
  tenantId: string;
  children: (props: { entities: Record<string, Entity> }) => ReactNode;
}

export function DataFabricGate({
  entities: entitiesService,
  tenantId,
  children,
}: DataFabricGateProps) {
  const {
    data: entities,
    isLoading,
    isError,
  } = useDataFabricEntities({
    entities: entitiesService,
    tenantId,
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
