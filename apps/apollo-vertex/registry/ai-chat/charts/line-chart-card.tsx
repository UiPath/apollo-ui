"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  type ChartDataModel,
  type DataAdapter,
  LineChart,
  type LineChartConfiguration,
  type NumericOrDatetimeField,
} from "@uipath/apollo-dashboarding";
import { Card, CardContent } from "@/components/ui/card";

interface LineChartCardProps {
  configuration: LineChartConfiguration;
  dataModel: ChartDataModel<NumericOrDatetimeField>;
  dataAdapter: DataAdapter;
}

export function LineChartCard({
  configuration,
  dataModel,
  dataAdapter,
}: LineChartCardProps) {
  const queryClient = useQueryClient();

  return (
    <Card className="flex flex-col w-full h-[300px] gap-2 py-4">
      <CardContent className="flex-1 overflow-hidden p-0">
        <LineChart
          configuration={configuration}
          dataModel={dataModel}
          dataAdapter={dataAdapter}
          queryClient={queryClient}
        />
      </CardContent>
    </Card>
  );
}
