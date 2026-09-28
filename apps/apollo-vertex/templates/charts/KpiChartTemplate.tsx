"use client";

import { KpiChart } from "@/components/ui/kpi-chart";
import { Card, CardContent } from "@/components/ui/card";

export function KpiChartTemplate() {
  return (
    <Card className="flex flex-col w-full h-[200px] gap-2 py-4">
      <CardContent className="flex-1 overflow-hidden p-0">
        <KpiChart label="Total revenue" value="$342,000" />
      </CardContent>
    </Card>
  );
}
