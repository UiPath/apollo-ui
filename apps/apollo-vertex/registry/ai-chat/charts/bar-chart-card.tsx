"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart,
  type BarChartConfiguration,
  type ChartDataModel,
  type DataAdapter,
  type DataModelField,
} from "@uipath/apollo-dashboarding";
import { Card, CardContent } from "@/components/ui/card";

interface BarChartCardProps {
  configuration: BarChartConfiguration;
  dataModel: ChartDataModel<DataModelField & { type: "string" }>;
  dataAdapter: DataAdapter;
}

export function BarChartCard({
  configuration,
  dataModel,
  dataAdapter,
}: BarChartCardProps) {
  const queryClient = useQueryClient();

  return (
    <Card className="flex flex-col w-full h-[300px] gap-2 py-4">
      <CardContent className="flex-1 overflow-hidden p-0">
        <BarChart
          configuration={configuration}
          dataModel={dataModel}
          dataAdapter={dataAdapter}
          queryClient={queryClient}
        />
      </CardContent>
    </Card>
  );
}
