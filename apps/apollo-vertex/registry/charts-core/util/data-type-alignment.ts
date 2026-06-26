import type { DataModelFieldType } from "../chart-models";

export function dataTypeAlignment(field: {
  type: DataModelFieldType;
}): "left" | "right" {
  switch (field.type) {
    case "datetime":
    case "numeric":
    case "currency":
    case "percentage":
    case "duration":
      return "right";
    case "boolean":
    case "string":
      return "left";
  }
}
