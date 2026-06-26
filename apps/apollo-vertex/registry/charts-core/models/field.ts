interface BaseField {
  id: string;
  display: string;
}

interface NumericField extends BaseField {
  type: "numeric";
}

interface StringField extends BaseField {
  type: "string";
}

interface DateTimeField extends BaseField {
  type: "datetime";
}

interface PercentageField extends BaseField {
  type: "percentage";
}

interface DurationField extends BaseField {
  type: "duration";
}

interface CurrencyField extends BaseField {
  type: "currency";
  format?: { currency: string };
}

interface BooleanField extends BaseField {
  type: "boolean";
  format?: { trueDisplay: string; falseDisplay: string };
}

export type DataModelField =
  | NumericField
  | StringField
  | DateTimeField
  | PercentageField
  | DurationField
  | CurrencyField
  | BooleanField;

export type DataModelFieldType = DataModelField["type"];

export type DatetimeModelField = Extract<DataModelField, { type: "datetime" }>;
export type StringModelField = Extract<DataModelField, { type: "string" }>;
export type NumericOrDatetimeModelField = Extract<
  DataModelField,
  { type: "numeric" | "datetime" }
>;
