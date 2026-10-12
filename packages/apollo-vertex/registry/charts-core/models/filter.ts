import type { DataModelField } from "../chart-models";

interface BaseFilter {
  display: string;
  id: string;
}

export interface ListFilter extends BaseFilter {
  type: "list";
  field: DataModelField;
}

export interface PeriodFilter extends BaseFilter {
  type: "period";
  field: DataModelField;
}
