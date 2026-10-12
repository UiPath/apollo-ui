"use client";

import { Card, CardContent } from "@/components/ui/card";
import { KpiChartWithAdapter } from "@/components/ui/kpi-chart";
import type {
  DataAdapter,
  KpiChartConfiguration,
  KpiDataModel,
} from "@/lib/charts-core";

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
  return (
    <Card className="w-fit min-w-[180px] gap-0 p-0">
      <CardContent className="p-0 [&>div>div>div]:!p-3">
        <KpiChartWithAdapter
          configuration={configuration}
          dataModel={dataModel}
          dataAdapter={dataAdapter}
        />
      </CardContent>
    </Card>
  );
}
