"use client";

import { BarChart } from "@/components/ui/bar-chart";
import { Card, CardContent } from "@/components/ui/card";

const raw = [
  { department: "Marketing", spend: 12000 },
  { department: "Engineering", spend: 28000 },
  { department: "Sales", spend: 19000 },
  { department: "Support", spend: 8000 },
  { department: "Operations", spend: 15000 },
  { department: "Finance", spend: 6000 },
];

const total = raw.reduce((s, r) => s + r.spend, 0);
const numberFormat = new Intl.NumberFormat("en-US");
const percentFormat = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

const rows = raw.map((r) => ({
  id: r.department,
  dimensions: [{ key: "department", label: r.department }],
  values: { spend: r.spend },
  formattedValues: { spend: `$${numberFormat.format(r.spend)}` },
  formattedPercents: { spend: percentFormat.format(r.spend / total) },
}));

export function BarChartTemplate() {
  return (
    <Card className="flex flex-col w-full h-[360px] gap-2 py-4">
      <CardContent className="flex-1 overflow-hidden p-0">
        <BarChart
          rows={rows}
          series={[{ id: "spend", label: "Total spend" }]}
        />
      </CardContent>
    </Card>
  );
}
