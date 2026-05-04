import type {
  ColumnDataType,
  InfoResponse,
  TableDataModel,
} from "@uipath/apollo-dashboarding";

export type InsightsSchema = InfoResponse;
export type InsightsTable = InfoResponse["data"][number];
export type InsightsField = InsightsTable["fields"][number];
export type InsightsFieldType = "numeric" | "string" | "boolean" | "datetime";

export interface InsightsToolContext {
  sourceType: string;
  accessToken: string;
  insightsBaseUrl: string;
  schema: InsightsSchema;
}

export function mapInsightsFieldKind(
  columnDataType: ColumnDataType,
): InsightsFieldType {
  switch (columnDataType) {
    case "NUMBER":
    case "FLOAT":
      return "numeric";
    case "TIMESTAMP_NTZ":
    case "DATE":
      return "datetime";
    case "BOOLEAN":
      return "boolean";
    case "TEXT":
    case "LEGACYINGESTION":
    case "UNKNOWN":
      return "string";
  }
}

export function buildInsightsTableDataModel(
  sourceType: string,
  schema: InsightsSchema,
): TableDataModel {
  const fields = schema.data.flatMap((table) =>
    table.fields.map((field) => ({
      id: field.id,
      display: field.column,
      type: mapInsightsFieldKind(field.columnDataType),
    })),
  );
  return { id: sourceType, fields };
}

export function collectInsightsFieldIds(schema: InsightsSchema): string[] {
  return schema.data.flatMap((table) => table.fields.map((field) => field.id));
}

export function collectInsightsTableIds(schema: InsightsSchema): string[] {
  return schema.data.map((table) => table.id);
}

export function generateInsightsSchemaDocs(schema: InsightsSchema): string {
  return schema.data
    .map((table) => {
      const fields = table.fields
        .map(
          (field) =>
            `${field.id} (${mapInsightsFieldKind(field.columnDataType)})`,
        )
        .join(", ");
      return `${table.id}: ${fields}`;
    })
    .join("\n\n");
}
