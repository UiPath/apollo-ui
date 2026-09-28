"use client";

import { TableChart } from "@/components/ui/table-chart";
import { Card, CardContent } from "@/components/ui/card";

const rows = [
  { department: "Marketing", headcount: 12, avgSalary: 58000, active: true },
  { department: "Engineering", headcount: 28, avgSalary: 66000, active: false },
  { department: "Sales", headcount: 19, avgSalary: 74000, active: true },
  { department: "Support", headcount: 8, avgSalary: 82000, active: false },
  { department: "Operations", headcount: 15, avgSalary: 90000, active: true },
  { department: "Finance", headcount: 6, avgSalary: 98000, active: false },
];

const numberFormat = new Intl.NumberFormat("en-US");

export function TableChartTemplate() {
  return (
    <Card className="flex flex-col w-full h-[360px] gap-2 py-4">
      <CardContent className="flex-1 overflow-hidden p-0">
        <TableChart
          columns={[
            {
              id: "department",
              label: "Department",
              align: "left",
              format: String,
            },
            {
              id: "headcount",
              label: "Headcount",
              align: "right",
              format: (v) => numberFormat.format(Number(v)),
            },
            {
              id: "avgSalary",
              label: "Avg salary",
              align: "right",
              format: (v) => `$${numberFormat.format(Number(v))}`,
            },
            {
              id: "active",
              label: "Active",
              align: "left",
              format: (v) => (v ? "Yes" : "No"),
            },
          ]}
          rows={rows}
        />
      </CardContent>
    </Card>
  );
}
