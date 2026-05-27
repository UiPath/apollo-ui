import type { DataModelField } from "./models/field";

export type TableDataModelField = DataModelField;

export interface TableDataModel {
  id: string;
  fields: Array<DataModelField>;
}
