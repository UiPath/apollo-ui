"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  type DataAdapter,
  TableChart,
  type TableChartConfiguration,
  type TableDataModel,
} from "@uipath/apollo-dashboarding";
import { Card, CardContent } from "@/components/ui/card";

const DEFAULT_TABLE_STATE = { sortBy: null } as const;

interface TableChartCardProps {
  configuration: TableChartConfiguration;
  dataModel: TableDataModel;
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
