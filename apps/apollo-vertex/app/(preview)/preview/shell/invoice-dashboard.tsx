"use client";

import {
  CheckCircle,
  Clock,
  FileText,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const kpis = [
  { label: "Total Invoices", value: "1,247", icon: FileText, change: "+12%" },
  { label: "Pending Review", value: "83", icon: Clock, change: "-5%" },
  { label: "Processed Today", value: "156", icon: CheckCircle, change: "+23%" },
  { label: "Success Rate", value: "98.2%", icon: TrendingUp, change: "+0.4%" },
];

const invoices = [
  { id: "INV-4021", vendor: "Acme Corp", amount: "$12,450.00", status: "Processed" as const, date: "Feb 25, 2026" },
  { id: "INV-4020", vendor: "Global Supplies Ltd", amount: "$3,280.50", status: "Pending" as const, date: "Feb 25, 2026" },
  { id: "INV-4019", vendor: "TechParts Inc", amount: "$8,920.00", status: "In Review" as const, date: "Feb 24, 2026" },
  { id: "INV-4018", vendor: "Office Depot", amount: "$1,150.75", status: "Processed" as const, date: "Feb 24, 2026" },
  { id: "INV-4017", vendor: "CloudServ Solutions", amount: "$24,000.00", status: "Failed" as const, date: "Feb 23, 2026" },
  { id: "INV-4016", vendor: "Metro Logistics", amount: "$6,780.00", status: "Processed" as const, date: "Feb 23, 2026" },
];

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Processed: "default",
  Pending: "secondary",
  Failed: "destructive",
  "In Review": "outline",
};

const activityBars = [
  { label: "Mon", height: 60 },
  { label: "Tue", height: 85 },
  { label: "Wed", height: 45 },
  { label: "Thu", height: 92 },
  { label: "Fri", height: 78 },
  { label: "Sat", height: 30 },
  { label: "Sun", height: 15 },
];

const recentActivity = [
  { text: "INV-4021 processed successfully", time: "2 min ago" },
  { text: "INV-4020 submitted for review", time: "15 min ago" },
  { text: "Batch processing completed (42 invoices)", time: "1 hr ago" },
  { text: "INV-4017 failed — missing PO number", time: "3 hrs ago" },
];

export function InvoiceDashboard({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="p-6 space-y-4 relative z-10">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold">Invoice Processing</h1>
        <p className="text-sm text-muted-foreground">
          Monitor and manage invoice automation workflows
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-white/55 border border-white/80 shadow-[0_2px_16px_2px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.6)] backdrop-blur-sm dark:bg-white/[0.055] dark:border-white/[0.03] dark:shadow-[0_2px_24px_2px_rgba(0,0,0,0.12),inset_0_1px_0_0_color-mix(in_srgb,var(--sidebar)_5%,transparent)] rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-emerald-500">{kpi.change}</span> from last week
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoices Table */}
      <Card className="bg-white/55 border border-white/80 shadow-[0_2px_16px_2px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.6)] backdrop-blur-sm dark:bg-white/[0.055] dark:border-white/[0.03] dark:shadow-[0_2px_24px_2px_rgba(0,0,0,0.12),inset_0_1px_0_0_color-mix(in_srgb,var(--sidebar)_5%,transparent)] rounded-2xl">
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.id}</TableCell>
                  <TableCell>{inv.vendor}</TableCell>
                  <TableCell>{inv.amount}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[inv.status]}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Processing Activity */}
        <Card className="bg-white/55 border border-white/80 shadow-[0_2px_16px_2px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.6)] backdrop-blur-sm dark:bg-white/[0.055] dark:border-white/[0.03] dark:shadow-[0_2px_24px_2px_rgba(0,0,0,0.12),inset_0_1px_0_0_color-mix(in_srgb,var(--sidebar)_5%,transparent)] rounded-2xl">
          <CardHeader>
            <CardTitle>Processing Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-32">
              {activityBars.map((bar) => (
                <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary/80 rounded-t-sm"
                    style={{ height: `${bar.height}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{bar.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white/55 border border-white/80 shadow-[0_2px_16px_2px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.6)] backdrop-blur-sm dark:bg-white/[0.055] dark:border-white/[0.03] dark:shadow-[0_2px_24px_2px_rgba(0,0,0,0.12),inset_0_1px_0_0_color-mix(in_srgb,var(--sidebar)_5%,transparent)] rounded-2xl">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((event, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{event.text}</p>
                    <p className="text-xs text-muted-foreground">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Pipeline */}
      <Card className="bg-white/55 border border-white/80 shadow-[0_2px_16px_2px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.6)] backdrop-blur-sm dark:bg-white/[0.055] dark:border-white/[0.03] dark:shadow-[0_2px_24px_2px_rgba(0,0,0,0.12),inset_0_1px_0_0_color-mix(in_srgb,var(--sidebar)_5%,transparent)] rounded-2xl">
        <CardHeader>
          <CardTitle>Processing Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>OCR Extraction</span>
              <span className="text-muted-foreground">96%</span>
            </div>
            <Progress value={96} />
            <div className="flex items-center justify-between text-sm">
              <span>Field Validation</span>
              <span className="text-muted-foreground">88%</span>
            </div>
            <Progress value={88} />
            <div className="flex items-center justify-between text-sm">
              <span>Approval Routing</span>
              <span className="text-muted-foreground">72%</span>
            </div>
            <Progress value={72} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
