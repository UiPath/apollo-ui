"use client";

import { toolDefinition } from "@tanstack/ai";
import { dataFabricAdapter } from "@uipath/apollo-dashboarding";
import { Suspense } from "react";
import { z } from "zod";
import { NoDataMessage } from "../../charts/no-data-message";
import type { QueryEntityParams } from "../../charts/fullscreen-table";
import { TableChartCard } from "../../charts/table-chart-card";
import type { DataFabricToolContext } from "../data-fabric/shared";
import {
  buildTableDataModel,
  generateEntityFieldsDocs,
} from "../data-fabric/shared";

export function createDataFabricTableTool(context: DataFabricToolContext) {
  const entityNames = Object.keys(context.entities);
  const firstEntity = entityNames[0];
  if (!firstEntity) {
    throw new Error("createDataFabricTableTool requires at least one entity");
  }
  const entityEnum = [firstEntity, ...entityNames.slice(1)] as [
    string,
    ...string[],
  ];

  const dataFabricTableInput = z.object({
    entityName: z.enum(entityEnum).describe("Data Fabric entity name to query"),
    dimensions: z
      .array(z.string())
      .min(1)
      .describe(
        "Field names to display as table columns. Choose 3-8 relevant fields based on the user's question.",
      ),
  });

  const toolPrompt = `You have a "data_fabric_table" tool.
When the user wants to see data as a table, call it with the entity name and field names as dimensions.
Choose 3-8 of the most relevant fields as dimensions based on the user's question.
Always include Id, and typically include CreateTime or UpdateTime for context.
After calling the tool, keep text reply short — the UI renders the table.
Only use fields that exist for the chosen entity (see Entity Reference).

## Entity Reference
${generateEntityFieldsDocs(context.entities)}`;

  const dataFabricTableDef = toolDefinition({
    name: "data_fabric_table",
    description:
      "Display data from a Data Fabric entity as a table. Call this when the user wants to see data, view records, or display information about entities. Provide the entity name and choose relevant field names as dimensions. Only use fields that exist for the chosen entity.",
    inputSchema: dataFabricTableInput,
  });

  function renderTable(output: unknown) {
    const parsed = dataFabricTableInput.safeParse(output);
    if (!parsed.success) {
      return <NoDataMessage />;
    }
    const { entityName, dimensions } = parsed.data;

    const entity = context.entities[entityName];
    if (!entity) {
      return <NoDataMessage />;
    }

    const validFields = new Set(entity.fields.map((f) => f.name));
    const validDimensions = dimensions.filter((d) => validFields.has(d));
    if (validDimensions.length === 0) {
      return <NoDataMessage />;
    }

    const dataModel = buildTableDataModel(entity);

    const configuration = {
      id: `${entityName.toLowerCase()}-table`,
      name: entityName,
      type: "table" as const,
      dimensions: validDimensions,
    };

    const adapter = dataFabricAdapter({
      baseUrl: context.dataFabricBaseUrl,
      accessToken: context.accessToken,
      entityName,
    });

    const queryEntity = async (params: QueryEntityParams) => {
      const response = await fetch(
        `${context.dataFabricBaseUrl}/v2/EntityService/${encodeURIComponent(entityName)}/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${context.accessToken}`,
          },
          body: JSON.stringify({
            selectedFields: validDimensions,
            skip: params.skip,
            top: params.top,
            sortOptions: params.sortBy
              ? [
                  {
                    fieldName: params.sortBy.field,
                    isDescending: params.sortBy.direction === "desc",
                  },
                ]
              : [],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Query failed: ${response.status}`);
      }

      const data: {
        totalRecordCount: number;
        value: Record<string, unknown>[];
      } = await response.json();
      return { rows: data.value, totalRecordCount: data.totalRecordCount };
    };

    return (
      <Suspense>
        <TableChartCard
          configuration={configuration}
          dataModel={dataModel}
          dataAdapter={adapter}
          toolDefinition={{
            entityName,
            dimensions: validDimensions,
          }}
          queryEntity={queryEntity}
        />
      </Suspense>
    );
  }

  const clientTool = dataFabricTableDef.client((input) => input);

  return { clientTool, toolPrompt, renderTable };
}
