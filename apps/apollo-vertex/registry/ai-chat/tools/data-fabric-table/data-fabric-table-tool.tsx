"use client";

import { toolDefinition } from "@tanstack/ai";
import { dataFabricAdapter } from "@uipath/apollo-dashboarding";
import { DateTime } from "luxon";
import { z } from "zod";
import { TableChartCard } from "../../charts/table-chart-card";
import { ToolResolutionError } from "../../charts/tool-resolution-error";
import {
  collectQualifiedFields,
  type DataFabricToolContext,
  type Entity,
  generateEntityFieldsDocs,
} from "../data-fabric/util/entities";
import { filterSchema, resolveFilters } from "../data-fabric/util/filters";
import { joinSchema } from "../data-fabric/util/joins";
import {
  buildMultiEntityDataModel,
  buildTableDataModel,
  validateDimensions,
} from "./table-data-model";

const dataFabricTableInput = z.object({
  entityName: z.string().describe("Data Fabric entity name to query"),
  dimensions: z
    .array(z.string())
    .min(1)
    .describe("Field names to display as table columns."),
  filters: z
    .array(filterSchema)
    .optional()
    .describe("Optional filters to narrow down results."),
  joins: z
    .array(joinSchema)
    .optional()
    .describe(
      "Join other entities. Use EntityName.Field format for dimensions and join conditions when joining.",
    ),
});

const dataFabricTableDef = toolDefinition({
  name: "data_fabric_table",
  description:
    "Display data from a Data Fabric entity as a table. Call this when the user wants to see data, view records, or display information about entities. Supports optional filters (list, search, range — including datetime ranges) to narrow results. Only use fields that exist for the chosen entity.",
  inputSchema: dataFabricTableInput,
  outputSchema: dataFabricTableInput,
  metadata: { skipFollowUp: true },
});

export const dataFabricTableClient = dataFabricTableDef.client(
  (input) => input,
);

type BuildResult =
  | {
      mode: "single";
      validDimensions: string[];
      dataModel: ReturnType<typeof buildTableDataModel>;
      fieldNames: string[];
    }
  | {
      mode: "multi";
      validDimensions: string[];
      dataModel: ReturnType<typeof buildMultiEntityDataModel>;
      qualifiedFields: ReturnType<typeof collectQualifiedFields>;
    };

function buildSingleEntityResult(
  entity: Entity,
  dimensions: string[],
): BuildResult {
  const fieldNames = entity.fields.map((f) => f.name);
  return {
    mode: "single",
    validDimensions: validateDimensions(dimensions, fieldNames),
    dataModel: buildTableDataModel(entity),
    fieldNames,
  };
}

function buildMultiEntityResult(
  primaryEntity: string,
  dimensions: string[],
  joins: { entity: string }[],
  entities: Record<string, Entity>,
): BuildResult {
  const allEntityNames = [primaryEntity, ...joins.map((j) => j.entity)];
  const qualifiedFields = collectQualifiedFields(allEntityNames, entities);

  const normalizedDimensions = dimensions.map((d) =>
    d.includes(".") ? d : `${primaryEntity}.${d}`,
  );

  const validDimensions = validateDimensions(
    normalizedDimensions,
    qualifiedFields.keys(),
  );

  return {
    mode: "multi",
    validDimensions,
    dataModel: buildMultiEntityDataModel(
      primaryEntity,
      validDimensions,
      qualifiedFields,
    ),
    qualifiedFields,
  };
}

export function createDataFabricTableTool(context: DataFabricToolContext) {
  const today = DateTime.now().toISODate();
  const toolPrompt = `You have a "data_fabric_table" tool.
When the user wants to see data as a table, call it with the entity name and field names as dimensions.
If the user asks for specific fields, use exactly those fields.
If the user does not specify fields, pick a reasonable default set (3-8 fields).
Only use fields that exist for the chosen entity (see Entity Reference).

## Filters
You can optionally pass filters to narrow results. Available filter types:
- **list**: match specific values. Use valueType matching the field type (string/number/boolean). Set invert=true to exclude.
- **search**: text pattern matching on string fields. searchFilterType: "default" (contains), "startsWith", "endsWith".
- **range** (numeric): use valueType="number" with min/max numbers.
- **range** (datetime): use valueType="datetime" with min/max as ISO 8601 strings (e.g. "2026-01-01" or "2026-01-01T00:00:00Z"). Today is ${today} — use it to resolve relative phrases like "last 30 days" or "this year" into absolute ISO dates before passing them.
Only add filters when the user asks to filter, search, or narrow results.

## Multi-Entity Joins
To query across multiple entities, add "joins" to link related entities. The entityName field is the primary entity.
When using joins, use qualified field names everywhere: "EntityName.FieldName" (using the EXACT entity names from the Entity Reference, never abbreviations or aliases).
When joining, always include relevant fields from BOTH the primary entity and the joined entity in dimensions — not just the joined entity's fields.
The join condition is specified in "joins[].on" — do NOT also add a filter for the join condition.
Only use joins when the user explicitly asks to combine data from multiple entities.

## Entity Reference
${generateEntityFieldsDocs(context.entities)}`;

  function renderTable(
    output: z.infer<typeof dataFabricTableInput>,
    id: string,
  ) {
    const { entityName, dimensions, filters, joins } = output;
    const isMultiEntity = joins != null && joins.length > 0;

    const entity = context.entities[entityName];
    if (!entity) {
      return (
        <ToolResolutionError
          failure={{ reason: "unknown_entity", entity: entityName }}
        />
      );
    }

    const result = isMultiEntity
      ? buildMultiEntityResult(entityName, dimensions, joins, context.entities)
      : buildSingleEntityResult(entity, dimensions);

    if (result.validDimensions.length === 0) {
      return (
        <ToolResolutionError
          failure={{
            reason: "table_no_valid_fields",
            entity: entityName,
            fields: dimensions.join(", "),
          }}
        />
      );
    }

    const normalizedFilters =
      result.mode === "multi"
        ? resolveFilters(filters, {
            mode: "multi",
            primaryEntity: entityName,
            qualifiedFields: result.qualifiedFields,
          })
        : resolveFilters(filters, {
            mode: "single",
            validFields: result.fieldNames,
          });

    const configuration = {
      id,
      name: entityName,
      type: "table" as const,
      dimensions: result.validDimensions,
      filters: normalizedFilters,
      ...(result.mode === "multi" &&
        joins && {
          from: { entity: entityName, alias: entityName },
          joins: joins.map((j) => ({ ...j, alias: j.entity })),
        }),
    };

    const adapter = dataFabricAdapter({
      baseUrl: context.dataFabricBaseUrl,
      accessToken: context.accessToken,
      entityName,
    });

    return (
      <TableChartCard
        configuration={configuration}
        dataModel={result.dataModel}
        dataAdapter={adapter}
      />
    );
  }

  return { toolPrompt, renderTable };
}
