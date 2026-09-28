"use client";

import { LineChart } from "@/components/ui/line-chart";
import { Card, CardContent } from "@/components/ui/card";

const data = [
  { x: "Jan", y: 120 },
  { x: "Feb", y: 132 },
  { x: "Mar", y: 101 },
  { x: "Apr", y: 134 },
  { x: "May", y: 90 },
  { x: "Jun", y: 230 },
  { x: "Jul", y: 210 },
  { x: "Aug", y: 260 },
  { x: "Sep", y: 190 },
  { x: "Oct", y: 220 },
  { x: "Nov", y: 280 },
  { x: "Dec", y: 320 },
];

const formatValue = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);

export function LineChartTemplate() {
  return (
    <Card className="flex flex-col w-full h-[300px] gap-2 py-4">
      <CardContent className="flex-1 overflow-hidden p-0">
        <LineChart
          data={data}
          seriesLabel="Order count"
          formatValue={formatValue}
        />
      </CardContent>
    </Card>
  );
}
