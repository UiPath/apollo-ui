"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LineChartWithAdapter } from "@/components/ui/line-chart";
import type {
  ChartDataModel,
  DataAdapter,
  DatetimeModelField,
  LineChartConfiguration,
} from "@/lib/charts-core";

interface LineChartCardProps {
  configuration: LineChartConfiguration;
  dataModel: ChartDataModel<DatetimeModelField>;
  dataAdapter: DataAdapter;
}

export function LineChartCard({
  configuration,
  dataModel,
  dataAdapter,
}: LineChartCardProps) {
  return (
    <Card className="flex flex-col w-full h-[300px] gap-2 py-4">
      <CardContent className="flex-1 overflow-hidden p-0">
        <LineChartWithAdapter
          configuration={configuration}
          dataModel={dataModel}
          dataAdapter={dataAdapter}
        />
      </CardContent>
    </Card>
  );
}
