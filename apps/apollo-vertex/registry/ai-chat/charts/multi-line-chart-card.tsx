"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MultiLineChartWithAdapter } from "@/components/ui/multi-line-chart";
import type {
  ChartDataModel,
  DataAdapter,
  DatetimeModelField,
  MultiLineChartConfiguration,
} from "@/lib/charts-core";

interface MultiLineChartCardProps {
  configuration: MultiLineChartConfiguration;
  dataModel: ChartDataModel<DatetimeModelField>;
  dataAdapter: DataAdapter;
}

export function MultiLineChartCard({
  configuration,
  dataModel,
  dataAdapter,
}: MultiLineChartCardProps) {
  return (
    <Card className="flex flex-col w-full h-[300px] gap-2 py-4">
      <CardContent className="flex-1 overflow-hidden p-0 [&_.recharts-surface]:overflow-visible">
        <MultiLineChartWithAdapter
          configuration={configuration}
          dataModel={dataModel}
          dataAdapter={dataAdapter}
        />
      </CardContent>
    </Card>
  );
}
