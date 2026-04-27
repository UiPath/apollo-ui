export interface EntityField {
  name: string;
  dataType: "string" | "number" | "boolean";
  isPrimaryKey: boolean;
  isRequired: boolean;
}

export interface Entity {
  id: string;
  name: string;
  fields: readonly EntityField[];
}

export interface DataFabricToolContext {
  entities: Record<string, Entity>;
  accessToken: string;
  dataFabricBaseUrl: string;
}

export function mapFieldType(
  dataType: "string" | "number" | "boolean",
): "string" | "numeric" | "boolean" {
  switch (dataType) {
    case "number":
      return "numeric";
    case "boolean":
      return "boolean";
    case "string":
      return "string";
  }
}

export function buildTableDataModel(entity: Entity) {
  return {
    id: entity.id,
    fields: entity.fields.map((field) => ({
      id: field.name,
      display: field.name,
      type: mapFieldType(field.dataType),
    })),
  };
}

export function collectQualifiedFields(
  entityNames: string[],
  entities: Record<string, Entity>,
): Map<string, EntityField> {
  const fields = new Map<string, EntityField>();
  for (const name of entityNames) {
    const entity = entities[name];
    if (!entity) continue;
    for (const field of entity.fields) {
      fields.set(`${name}.${field.name}`, field);
    }
  }
  return fields;
}

export function buildMultiEntityDataModel(
  id: string,
  dimensions: string[],
  fields: Map<string, EntityField>,
) {
  return {
    id,
    fields: dimensions.map((d) => {
      const field = fields.get(d);
      return {
        id: d,
        display: d,
        type: field ? mapFieldType(field.dataType) : ("string" as const),
      };
    }),
  };
}

export function validateDimensions(
  dimensions: string[],
  validNames: Iterable<string>,
): string[] {
  const valid = new Set(validNames);
  return dimensions.filter((d) => valid.has(d));
}

const isQualified = (field: string) => field.includes(".");

/**
 * Resolve a filter field for a multi-entity query. Returns the qualified
 * (`EntityName.Field`) form when it can be unambiguously determined, otherwise
 * null (unknown field, or unqualified name matches multiple joined entities).
 */
export function resolveQualifiedField(
  field: string,
  primaryEntity: string,
  qualifiedFields: Map<string, EntityField>,
): string | null {
  if (isQualified(field)) {
    return qualifiedFields.has(field) ? field : null;
  }

  const primary = `${primaryEntity}.${field}`;
  if (qualifiedFields.has(primary)) return primary;

  const suffix = `.${field}`;
  const matches = [...qualifiedFields.keys()].filter((k) => k.endsWith(suffix));
  return matches.length === 1 ? (matches[0] ?? null) : null;
}

export type ResolveFiltersOptions =
  | { mode: "single"; validFields: Iterable<string> }
  | {
      mode: "multi";
      primaryEntity: string;
      qualifiedFields: Map<string, EntityField>;
    };

function fieldResolver(
  options: ResolveFiltersOptions,
): (field: string) => string | null {
  if (options.mode === "single") {
    const valid = new Set(options.validFields);
    return (f) => (valid.has(f) ? f : null);
  }
  const { primaryEntity, qualifiedFields } = options;
  return (f) => resolveQualifiedField(f, primaryEntity, qualifiedFields);
}

/**
 * Validate & qualify filter fields. Drops filters referencing unknown or
 * ambiguous fields (same policy as validateDimensions — prevents hallucinated
 * fields from reaching the server).
 */
export function resolveFilters<F extends { field: string }>(
  filters: F[] | undefined,
  options: ResolveFiltersOptions,
): F[] | undefined {
  if (!filters) return filters;
  const resolve = fieldResolver(options);
  return filters.flatMap((f) => {
    const field = resolve(f.field);
    return field ? [{ ...f, field }] : [];
  });
}

export function generateEntityFieldsDocs(
  entities: Record<string, Entity>,
): string {
  return Object.entries(entities)
    .map(([entityName, entity]) => {
      const fields = entity.fields
        .map((field) => `${field.name} (${field.dataType})`)
        .join(", ");
      return `${entityName}: ${fields}`;
    })
    .join("\n\n");
}
