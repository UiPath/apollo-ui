export interface EntityField {
  name: string;
  dataType: "string" | "number" | "boolean" | "datetime";
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
  dataType: EntityField["dataType"],
): "string" | "numeric" | "boolean" | "datetime" {
  switch (dataType) {
    case "number":
      return "numeric";
    case "boolean":
      return "boolean";
    case "datetime":
      return "datetime";
    case "string":
      return "string";
  }
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

export function pickCountField(entity: Entity): string | null {
  const pk = entity.fields.find((f) => f.isPrimaryKey);
  if (pk) return pk.name;
  const numeric = entity.fields.find((f) => f.dataType === "number");
  if (numeric) return numeric.name;
  return entity.fields[0]?.name ?? null;
}

export function pickCountFieldQualified(
  primaryEntity: string,
  qualifiedFields: Map<string, EntityField>,
): string | null {
  const primaryEntries = [...qualifiedFields.entries()].filter(([key]) =>
    key.startsWith(`${primaryEntity}.`),
  );
  const pk = primaryEntries.find(([, f]) => f.isPrimaryKey);
  if (pk) return pk[0];
  const numeric = primaryEntries.find(([, f]) => f.dataType === "number");
  if (numeric) return numeric[0];
  return primaryEntries[0]?.[0] ?? null;
}
