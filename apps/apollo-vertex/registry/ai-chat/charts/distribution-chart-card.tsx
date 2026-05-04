"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  type ChartDataModel,
  type DataAdapter,
  DistributionChart,
  type DistributionChartConfiguration,
  type NumericOrDatetimeField,
} from "@uipath/apollo-dashboarding";
import { Card, CardContent } from "@/components/ui/card";

interface DistributionChartCardProps {
  configuration: DistributionChartConfiguration;
  dataModel: ChartDataModel<NumericOrDatetimeField>;
  dataAdapter: DataAdapter;
}

export function DistributionChartCard({
  configuration,
  dataModel,
  dataAdapter,
}: DistributionChartCardProps) {
  const queryClient = useQueryClient();

  return (
    <Card className="flex flex-col w-full h-[300px] gap-2 py-4">
      <CardContent className="flex-1 overflow-hidden p-0">
        <DistributionChart
          configuration={configuration}
          dataModel={dataModel}
          dataAdapter={dataAdapter}
          queryClient={queryClient}
        />
      </CardContent>
    </Card>
  );
}
