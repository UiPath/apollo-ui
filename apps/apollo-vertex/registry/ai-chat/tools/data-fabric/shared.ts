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
  baseUrl: string;
  accessToken: string;
}

function mapFieldType(
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

export function generateEntityFieldsDocs(
  entities: Record<string, Entity>,
): string {
  return Object.entries(entities)
    .map(([entityName, entity]) => {
      const fields = entity.fields.map((field) => field.name).join(", ");
      return `${entityName}: ${fields}`;
    })
    .join("\n\n");
}
