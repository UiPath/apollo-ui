import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Types ---

export interface KpiItem {
  label: string;
  value: string;
  icon: LucideIcon;
  change: string;
}

// --- Sample data ---

const invoices = [
  {
    id: "INV-4021",
    vendor: "Acme Corp",
    amount: "$12,450.00",
    status: "Processed" as const,
    date: "Mar 18, 2026",
  },
  {
    id: "INV-4020",
    vendor: "Global Supplies Ltd",
    amount: "$3,280.50",
    status: "Pending" as const,
    date: "Mar 18, 2026",
  },
  {
    id: "INV-4019",
    vendor: "TechParts Inc",
    amount: "$8,920.00",
    status: "In Review" as const,
    date: "Mar 17, 2026",
  },
  {
    id: "INV-4018",
    vendor: "Office Depot",
    amount: "$1,150.75",
    status: "Processed" as const,
    date: "Mar 17, 2026",
  },
  {
    id: "INV-4017",
    vendor: "CloudServ Solutions",
    amount: "$24,000.00",
    status: "Failed" as const,
    date: "Mar 16, 2026",
  },
  {
    id: "INV-4016",
    vendor: "Metro Logistics",
    amount: "$6,780.00",
    status: "Processed" as const,
    date: "Mar 16, 2026",
  },
];

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  Processed: "default",
  Pending: "secondary",
  Failed: "destructive",
  "In Review": "outline",
};

const statusIcon: Record<string, typeof CheckCircle> = {
  Processed: CheckCircle,
  Pending: Clock,
  Failed: XCircle,
  "In Review": AlertTriangle,
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

const pipelineStages = [
  { label: "OCR Extraction", value: 96 },
  { label: "Field Validation", value: 88 },
  { label: "Approval Routing", value: 72 },
  { label: "Final Review", value: 64 },
];

const complianceChecks = [
  { label: "Income Verification", pass: 98 },
  { label: "Credit Score Threshold", pass: 96 },
  { label: "Debt-to-Income Ratio", pass: 91 },
  { label: "Collateral Appraisal", pass: 87 },
  { label: "Document Completeness", pass: 94 },
];

// --- Card components ---

export function KpiCards({ kpis }: { kpis: KpiItem[] }) {
  return (
    <>
      {kpis.map((kpi) => (
        <Card key={kpi.label} variant="glass">
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
              <span className="text-emerald-500">{kpi.change}</span> from last
              week
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export function InvoiceTable() {
  return (
    <Card variant="glass">
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
            {invoices.map((inv) => {
              const StatusIcon = statusIcon[inv.status];
              return (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.id}</TableCell>
                  <TableCell>{inv.vendor}</TableCell>
                  <TableCell>{inv.amount}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant[inv.status]}
                      className="gap-1"
                    >
                      <StatusIcon className="w-3 h-3" />
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {inv.date}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function ActivityBarChart() {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>Processing Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3 h-32">
          {activityBars.map((bar) => (
            <div
              key={bar.label}
              className="flex-1 flex flex-col items-center gap-1"
            >
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
  );
}

export function ActivityFeed() {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivity.map((event) => (
            <div key={event.text} className="flex items-start gap-3">
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
  );
}

export function PipelineProgress() {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>Processing Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pipelineStages.map((stage) => (
            <div key={stage.label}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span>{stage.label}</span>
                <span className="text-muted-foreground">{stage.value}%</span>
              </div>
              <Progress value={stage.value} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ComplianceProgress() {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>Compliance Pass Rates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {complianceChecks.map((check) => (
            <div key={check.label}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span>{check.label}</span>
                <span className="text-muted-foreground">{check.pass}%</span>
              </div>
              <Progress value={check.pass} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
