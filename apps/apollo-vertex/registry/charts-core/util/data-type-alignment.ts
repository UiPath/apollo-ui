import type { DimensionType } from "../chart-models";

export function dataTypeAlignment(field: {
  type: DimensionType;
}): "left" | "right" {
  switch (field.type) {
    case "datetime":
    case "numeric":
      return "right";
    case "boolean":
    case "string":
      return "left";
  }
}
