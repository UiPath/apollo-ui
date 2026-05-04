"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  type ChartDataModel,
  type DataAdapter,
  MultiLineChart,
  type MultiLineChartConfiguration,
  type NumericOrDatetimeField,
} from "@uipath/apollo-dashboarding";
import { Card, CardContent } from "@/components/ui/card";

interface MultiLineChartCardProps {
  configuration: MultiLineChartConfiguration;
  dataModel: ChartDataModel<NumericOrDatetimeField>;
  dataAdapter: DataAdapter;
}

export function MultiLineChartCard({
  configuration,
  dataModel,
  dataAdapter,
}: MultiLineChartCardProps) {
  const queryClient = useQueryClient();

  return (
    <Card className="flex flex-col w-full h-[300px] gap-2 py-4">
      <CardContent className="flex-1 overflow-hidden p-0 px-20 [&_.recharts-surface]:overflow-visible">
        <MultiLineChart
          configuration={configuration}
          dataModel={dataModel}
          dataAdapter={dataAdapter}
          queryClient={queryClient}
        />
      </CardContent>
    </Card>
  );
}
