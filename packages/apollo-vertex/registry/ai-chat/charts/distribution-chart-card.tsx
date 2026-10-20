"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DistributionChartWithAdapter } from "@/components/ui/distribution-chart";
import type {
  ChartDataModel,
  DataAdapter,
  DistributionChartConfiguration,
  NumericOrDatetimeModelField,
} from "@/lib/charts-core";

interface DistributionChartCardProps {
  configuration: DistributionChartConfiguration;
  dataModel: ChartDataModel<NumericOrDatetimeModelField>;
  dataAdapter: DataAdapter;
}

export function DistributionChartCard({
  configuration,
  dataModel,
  dataAdapter,
}: DistributionChartCardProps) {
  return (
    <Card className="flex flex-col w-full h-[300px] gap-2 py-4">
      <CardContent className="flex-1 overflow-hidden p-0">
        <DistributionChartWithAdapter
          configuration={configuration}
          dataModel={dataModel}
          dataAdapter={dataAdapter}
        />
      </CardContent>
    </Card>
  );
}
