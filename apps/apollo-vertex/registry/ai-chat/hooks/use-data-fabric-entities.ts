import { useQuery } from "@tanstack/react-query";
import type { Entity, EntityField } from "../tools/data-fabric/shared";

interface UseDataFabricEntitiesOptions {
  baseUrl: string;
  accessToken: string;
  enabled?: boolean;
}

interface ApiEntityField {
  name: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isExternalField?: boolean;
  isRequired?: boolean;
  sqlType: { name: string };
}

interface ApiEntity {
  id: string;
  name: string;
  fields: ApiEntityField[];
}

function isApiEntityArray(data: unknown): data is ApiEntity[] {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "name" in item &&
        "fields" in item,
    )
  );
}

const SQL_TYPE_MAP: Record<string, "number" | "boolean"> = {
  INT: "number",
  BIGINT: "number",
  SMALLINT: "number",
  TINYINT: "number",
  DECIMAL: "number",
  FLOAT: "number",
  REAL: "number",
  NUMBER: "number",
  BIT: "boolean",
  BOOLEAN: "boolean",
};

function mapSqlTypeToDataType(
  sqlTypeName: string,
): "string" | "number" | "boolean" {
  return SQL_TYPE_MAP[sqlTypeName] ?? "string";
}

function isDirectlyQueryable(f: ApiEntityField): boolean {
  return !f.isForeignKey && !f.isExternalField;
}

function toEntity(api: ApiEntity): Entity {
  return {
    id: api.id,
    name: api.name,
    fields: api.fields.filter(isDirectlyQueryable).map(
      (f): EntityField => ({
        name: f.name,
        dataType: mapSqlTypeToDataType(f.sqlType.name),
        isPrimaryKey: f.isPrimaryKey ?? false,
        isRequired: f.isRequired ?? false,
      }),
    ),
  };
}

async function fetchEntities(
  baseUrl: string,
  accessToken: string,
): Promise<Record<string, Entity>> {
  const response = await fetch(`${baseUrl}v2/Entity`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch entities: ${response.status}`);
  }

  const data: unknown = await response.json();

  let apiEntities: ApiEntity[];
  if (isApiEntityArray(data)) {
    apiEntities = data;
  } else if (typeof data === "object" && data !== null && "value" in data) {
    const wrapped = data as Record<string, unknown>;
    if (isApiEntityArray(wrapped.value)) {
      apiEntities = wrapped.value;
    } else {
      return {};
    }
  } else {
    return {};
  }

  return Object.fromEntries(apiEntities.map((e) => [e.name, toEntity(e)]));
}

export function useDataFabricEntities({
  baseUrl,
  accessToken,
  enabled = true,
}: UseDataFabricEntitiesOptions) {
  return useQuery({
    queryKey: ["data-fabric-entities", baseUrl],
    queryFn: () => fetchEntities(baseUrl, accessToken),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
