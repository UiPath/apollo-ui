import { useQuery } from "@tanstack/react-query";
import type { Entities } from "@uipath/uipath-typescript/entities";
import {
  EntityFieldDataType,
  type EntityGetResponse,
  type FieldMetaData,
} from "@uipath/uipath-typescript/entities";
import { STALE_TIME_MS } from "@/lib/constants";
import type {
  Entity,
  EntityField,
} from "@/registry/ai-chat/tools/data-fabric/util/entities";

interface UseDataFabricEntitiesOptions {
  entities: Entities;
  tenantId: string;
  enabled?: boolean;
}

const NUMERIC_FIELD_TYPES = new Set<EntityFieldDataType>([
  EntityFieldDataType.INTEGER,
  EntityFieldDataType.DECIMAL,
  EntityFieldDataType.FLOAT,
  EntityFieldDataType.DOUBLE,
  EntityFieldDataType.BIG_INTEGER,
  EntityFieldDataType.AUTO_NUMBER,
]);

const DATETIME_FIELD_TYPES = new Set<EntityFieldDataType>([
  EntityFieldDataType.DATE,
  EntityFieldDataType.DATETIME,
  EntityFieldDataType.DATETIME_WITH_TZ,
]);

function mapFieldDataType(
  fieldDataType: EntityFieldDataType,
): "string" | "number" | "boolean" | "datetime" {
  if (NUMERIC_FIELD_TYPES.has(fieldDataType)) return "number";
  if (DATETIME_FIELD_TYPES.has(fieldDataType)) return "datetime";
  if (fieldDataType === EntityFieldDataType.BOOLEAN) return "boolean";
  return "string";
}

function isDirectlyQueryable(f: FieldMetaData): boolean {
  return !f.isForeignKey && !f.isExternalField;
}

function toEntity(sdkEntity: EntityGetResponse): Entity {
  return {
    id: sdkEntity.id,
    name: sdkEntity.name,
    fields: sdkEntity.fields.filter(isDirectlyQueryable).map(
      (f): EntityField => ({
        name: f.name,
        dataType: mapFieldDataType(f.fieldDataType.name),
        isPrimaryKey: f.isPrimaryKey ?? false,
        isRequired: f.isRequired ?? false,
      }),
    ),
  };
}

async function fetchEntities(
  entitiesService: Entities,
): Promise<Record<string, Entity>> {
  const allEntities = await entitiesService.getAll();
  return Object.fromEntries(allEntities.map((e) => [e.name, toEntity(e)]));
}

export function useDataFabricEntities({
  entities,
  tenantId,
  enabled = true,
}: UseDataFabricEntitiesOptions) {
  return useQuery({
    queryKey: ["data-fabric-entities", tenantId],
    queryFn: () => fetchEntities(entities),
    enabled,
    staleTime: STALE_TIME_MS,
  });
}
