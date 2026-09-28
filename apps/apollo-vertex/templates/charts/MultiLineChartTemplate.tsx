"use client";

import { MultiLineChart } from "@/components/ui/multi-line-chart";
import { Card, CardContent } from "@/components/ui/card";

const data = [
  { x: "Jan", revenue: 120, cost: 80 },
  { x: "Feb", revenue: 132, cost: 88 },
  { x: "Mar", revenue: 101, cost: 75 },
  { x: "Apr", revenue: 134, cost: 95 },
  { x: "May", revenue: 90, cost: 70 },
  { x: "Jun", revenue: 230, cost: 140 },
  { x: "Jul", revenue: 210, cost: 130 },
  { x: "Aug", revenue: 260, cost: 160 },
  { x: "Sep", revenue: 190, cost: 110 },
  { x: "Oct", revenue: 220, cost: 140 },
  { x: "Nov", revenue: 280, cost: 170 },
  { x: "Dec", revenue: 320, cost: 200 },
];

const formatValue = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);

const totalRevenue = data.reduce((s, r) => s + r.revenue, 0);
const totalCost = data.reduce((s, r) => s + r.cost, 0);

export function MultiLineChartTemplate() {
  return (
    <Card className="flex flex-col w-full h-[420px] gap-2 py-4">
      <CardContent className="flex-1 overflow-hidden p-0">
        <MultiLineChart
          data={data}
          xKey="x"
          series={[
            {
              id: "revenue",
              label: "Revenue",
              color: "#0d47a1",
              axis: "left",
              formatValue,
              totalText: formatValue(totalRevenue),
              totalLabel: "Total Revenue",
            },
            {
              id: "cost",
              label: "Cost",
              color: "#fb8c00",
              axis: "right",
              formatValue,
              totalText: formatValue(totalCost),
              totalLabel: "Total Cost",
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}
