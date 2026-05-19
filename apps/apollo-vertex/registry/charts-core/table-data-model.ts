import type { DimensionType } from "./chart-models";

export interface TableDataModelField {
  id: string;
  display: string;
  type: DimensionType;
}

export interface TableDataModel {
  id: string;
  fields: Array<TableDataModelField>;
}
