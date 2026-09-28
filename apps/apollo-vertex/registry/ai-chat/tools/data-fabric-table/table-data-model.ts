import { assert } from "@/lib/asserts/assert";
import { buildField } from "@/lib/charts-core";
import {
  type Entity,
  type EntityField,
  mapFieldType,
} from "../data-fabric/util/entities";

export function buildTableDataModel(entity: Entity) {
  return {
    id: entity.id,
    fields: entity.fields.map((field) =>
      buildField(field.name, mapFieldType(field.dataType)),
    ),
  };
}

export function buildMultiEntityDataModel(
  id: string,
  dimensions: string[],
  fields: Map<string, EntityField>,
) {
  return {
    id,
    fields: dimensions.map((d) => {
      const field = fields.get(d);
      assert(
        field != null,
        `buildMultiEntityDataModel: dimension "${d}" is not present in qualified fields. Caller must validate dimensions first.`,
      );
      return buildField(d, mapFieldType(field.dataType));
    }),
  };
}

export function validateDimensions(
  dimensions: string[],
  validNames: Iterable<string>,
): string[] {
  const valid = new Set(validNames);
  return dimensions.filter((d) => valid.has(d));
}
