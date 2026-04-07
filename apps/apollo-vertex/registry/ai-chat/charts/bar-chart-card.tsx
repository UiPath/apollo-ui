"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart,
  type BarDataModel,
  type DataAdapter,
} from "@uipath/apollo-dashboarding";
import { Card, CardContent } from "@/registry/card/card";
import type { BarChartConfig } from "./bar-chart-types";

interface BarChartCardProps {
  configuration: BarChartConfig;
  dataModel: BarDataModel;
  dataAdapter: DataAdapter;
}

export function BarChartCard({
  configuration,
  dataModel,
  dataAdapter,
}: BarChartCardProps) {
  const queryClient = useQueryClient();

  return (
    <Card className="flex flex-col w-full gap-2 py-4">
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
