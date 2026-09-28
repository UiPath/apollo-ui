"use client";

import { DistributionChart } from "@/components/ui/distribution-chart";
import { Card, CardContent } from "@/components/ui/card";

const data = [
  { x: "0–10", y: 5 },
  { x: "10–20", y: 12 },
  { x: "20–30", y: 28 },
  { x: "30–40", y: 45 },
  { x: "40–50", y: 62 },
  { x: "50–60", y: 80 },
  { x: "60–70", y: 95 },
  { x: "70–80", y: 78 },
  { x: "80–90", y: 60 },
  { x: "90–100", y: 40 },
  { x: "100–110", y: 22 },
  { x: "110–120", y: 8 },
];

const formatValue = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

export function DistributionChartTemplate() {
  return (
    <Card className="flex flex-col w-full h-[300px] gap-2 py-4">
      <CardContent className="flex-1 overflow-hidden p-0">
        <DistributionChart
          data={data}
          seriesLabel="Order count"
          formatValue={formatValue}
        />
      </CardContent>
    </Card>
  );
}
