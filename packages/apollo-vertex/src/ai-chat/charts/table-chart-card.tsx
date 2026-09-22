"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TableChartWithAdapter } from "@/components/ui/table-chart";
import type {
  DataAdapter,
  TableChartConfiguration,
  TableDataModel,
} from "@/lib/charts-core";

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
  return (
    <Card className="flex flex-col w-full h-[300px] gap-2 py-4">
      <CardContent className="flex-1 overflow-hidden p-0">
        <TableChartWithAdapter
          configuration={configuration}
          dataModel={dataModel}
          dataAdapter={dataAdapter}
          state={DEFAULT_TABLE_STATE}
        />
      </CardContent>
    </Card>
  );
}
