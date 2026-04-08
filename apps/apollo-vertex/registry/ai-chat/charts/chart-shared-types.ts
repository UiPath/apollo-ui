export type ColumnType = "numeric" | "string" | "boolean" | "datetime";

export interface Column {
  name: string;
  type: ColumnType;
}
