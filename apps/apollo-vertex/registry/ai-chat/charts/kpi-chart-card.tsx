"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  type DataAdapter,
  KpiChart,
  type KpiChartConfiguration,
  type KpiDataModel,
} from "@uipath/apollo-dashboarding";
import { Card, CardContent } from "@/components/ui/card";

interface KpiChartCardProps {
  configuration: KpiChartConfiguration;
  dataModel: KpiDataModel;
  dataAdapter: DataAdapter;
}

export function KpiChartCard({
  configuration,
  dataModel,
  dataAdapter,
}: KpiChartCardProps) {
  const queryClient = useQueryClient();

  return (
    <Card className="w-fit min-w-[180px] gap-0 p-0">
      <CardContent className="p-0 [&>div>div>div]:!p-3">
        <KpiChart
          configuration={configuration}
          dataModel={dataModel}
          dataAdapter={dataAdapter}
          queryClient={queryClient}
        />
      </CardContent>
    </Card>
  );
}
