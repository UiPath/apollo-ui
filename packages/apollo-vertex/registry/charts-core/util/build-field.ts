import type { DataModelField, DataModelFieldType } from "../models/field";

export function buildField<T extends DataModelFieldType>(
  id: string,
  type: T,
): Extract<DataModelField, { type: T }>;
export function buildField(
  id: string,
  type: DataModelFieldType,
): DataModelField {
  return { id, display: id, type };
}
