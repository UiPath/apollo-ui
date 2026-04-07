"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type DataAdapter, TableChart } from "@uipath/apollo-dashboarding";
import { Card, CardContent } from "@/registry/card/card";
import type { TableChartConfig } from "./table-chart-types";

const DEFAULT_TABLE_STATE = { sortBy: null } as const;

interface TableChartCardProps {
  configuration: TableChartConfig;
  dataModel: {
    id: string;
    fields: Array<{
      id: string;
      display: string;
      type: "numeric" | "string" | "boolean" | "datetime";
    }>;
  };
  dataAdapter: DataAdapter;
}

export function TableChartCard({
  configuration,
  dataModel,
  dataAdapter,
}: TableChartCardProps) {
  const queryClient = useQueryClient();

  return (
    <Card className="flex flex-col w-full h-[300px] gap-2 py-4">
      <CardContent className="flex-1 overflow-hidden p-0">
        <TableChart
          configuration={configuration}
          dataModel={dataModel}
          dataAdapter={dataAdapter}
          state={DEFAULT_TABLE_STATE}
          queryClient={queryClient}
        />
      </CardContent>
    </Card>
  );
}
