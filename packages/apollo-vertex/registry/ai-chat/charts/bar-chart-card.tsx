"use client";

import { BarChartWithAdapter } from "@/components/ui/bar-chart";
import { Card, CardContent } from "@/components/ui/card";
import type {
  BarChartConfiguration,
  ChartDataModel,
  DataAdapter,
  StringModelField,
} from "@/lib/charts-core";

interface BarChartCardProps {
  configuration: BarChartConfiguration;
  dataModel: ChartDataModel<StringModelField>;
  dataAdapter: DataAdapter;
}

export function BarChartCard({
  configuration,
  dataModel,
  dataAdapter,
}: BarChartCardProps) {
  return (
    <Card className="flex flex-col w-full h-[300px] gap-2 py-4">
      <CardContent className="flex-1 overflow-hidden p-0">
        <BarChartWithAdapter
          configuration={configuration}
          dataModel={dataModel}
          dataAdapter={dataAdapter}
        />
      </CardContent>
    </Card>
  );
}
