"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
} from "lucide-react";
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
import { useShellNavigation } from "@/registry/shell/shell-navigation-context";

const kpis = [
  {
    label: "Total Invoices",
    value: "1,247",
    icon: FileText,
    change: "+12%",
    positive: true,
  },
  {
    label: "Pending Review",
    value: "83",
    icon: Clock,
    change: "-5%",
    positive: true,
  },
  {
    label: "Processed Today",
    value: "156",
    icon: CheckCircle,
    change: "+23%",
    positive: true,
  },
  {
    label: "Flagged",
    value: "12",
    icon: AlertTriangle,
    change: "+2",
    positive: false,
  },
];

const pipeline = [
  { label: "OCR Extraction", value: 96 },
  { label: "Field Validation", value: 88 },
  { label: "Approval Routing", value: 72 },
];

const invoices = [
  {
    id: "INV-4021",
    vendor: "Acme Corp",
    amount: "$12,450.00",
    status: "Processed" as const,
    date: "Feb 25, 2026",
    assignee: "Sarah Mitchell",
    hasDetail: true,
  },
  {
    id: "INV-4020",
    vendor: "Global Supplies Ltd",
    amount: "$3,280.50",
    status: "Pending" as const,
    date: "Feb 25, 2026",
    assignee: "James Wilson",
  },
  {
    id: "INV-4019",
    vendor: "TechParts Inc",
    amount: "$8,920.00",
    status: "In Review" as const,
    date: "Feb 24, 2026",
    assignee: "Maria Garcia",
  },
  {
    id: "INV-4018",
    vendor: "Globex Inc",
    amount: "$8,230.00",
    status: "In Review" as const,
    date: "Feb 23, 2026",
    assignee: "David Chen",
    hasDetail: true,
  },
  {
    id: "INV-4017",
    vendor: "CloudServ Solutions",
    amount: "$24,000.00",
    status: "Failed" as const,
    date: "Feb 23, 2026",
    assignee: "Lisa Park",
  },
  {
    id: "INV-4016",
    vendor: "Metro Logistics",
    amount: "$6,780.00",
    status: "Processed" as const,
    date: "Feb 23, 2026",
    assignee: "Sarah Mitchell",
  },
  {
    id: "INV-4015",
    vendor: "Initech Ltd",
    amount: "$4,150.00",
    status: "Processed" as const,
    date: "Feb 22, 2026",
    assignee: "James Wilson",
  },
  {
    id: "INV-4014",
    vendor: "Sterling Cooper",
    amount: "$15,300.00",
    status: "Pending" as const,
    date: "Feb 22, 2026",
    assignee: "Maria Garcia",
  },
  {
    id: "INV-4013",
    vendor: "Wayne Enterprises",
    amount: "$42,800.00",
    status: "In Review" as const,
    date: "Feb 21, 2026",
    assignee: "David Chen",
  },
  {
    id: "INV-4012",
    vendor: "Vandelay Industries",
    amount: "$2,950.00",
    status: "Processed" as const,
    date: "Feb 21, 2026",
    assignee: "Lisa Park",
  },
  {
    id: "INV-4011",
    vendor: "Umbrella Corp",
    amount: "$11,600.00",
    status: "Processed" as const,
    date: "Feb 20, 2026",
    assignee: "Sarah Mitchell",
  },
  {
    id: "INV-4009",
    vendor: "Stark Manufacturing",
    amount: "$19,750.00",
    status: "Pending" as const,
    date: "Feb 19, 2026",
    assignee: "James Wilson",
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

export function InvoicesListPage({
  visible,
  onSelectInvoice,
}: {
  visible: boolean;
  onSelectInvoice: (id: string) => void;
}) {
  const nav = useShellNavigation();

  if (!visible) return null;

  return (
    <div className="flex flex-col h-full relative z-10">
      {/* Header */}
      <div className="px-8 py-4 border-b border-border/50">
        <h1 className="text-base font-bold">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Monitor and manage invoice processing
        </p>
      </div>

      {/* Content — metrics left, table right */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[1fr_2fr] gap-6 p-6 h-full">
          {/* Left Panel — Metrics */}
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              {kpis.map((kpi) => (
                <Card key={kpi.label} variant="glass">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        {kpi.label}
                      </CardTitle>
                      <kpi.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{kpi.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span
                        className={
                          kpi.positive ? "text-emerald-500" : "text-destructive"
                        }
                      >
                        {kpi.change}
                      </span>{" "}
                      from last week
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Processing Pipeline */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-sm">Processing Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pipeline.map((step) => (
                    <div key={step.label}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span>{step.label}</span>
                        <span className="text-muted-foreground">
                          {step.value}%
                        </span>
                      </div>
                      <Progress value={step.value} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-sm">Weekly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Avg. Processing Time
                    </span>
                    <span className="text-sm font-medium">2.4 min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Auto-Approved
                    </span>
                    <span className="text-sm font-medium">892</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Manual Review
                    </span>
                    <span className="text-sm font-medium">355</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Success Rate
                    </span>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-sm font-medium">98.2%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel — Invoices Table */}
          <Card variant="glass" className="flex flex-col overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">All Invoices</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {invoices.length} invoices
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Assignee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow
                      key={inv.id}
                      className={
                        inv.hasDetail
                          ? "cursor-pointer hover:bg-muted/50 transition-colors"
                          : ""
                      }
                      onClick={
                        inv.hasDetail
                          ? () => {
                              onSelectInvoice(inv.id);
                              nav?.onNavigate("analytics");
                            }
                          : undefined
                      }
                    >
                      <TableCell className="font-medium">{inv.id}</TableCell>
                      <TableCell>{inv.vendor}</TableCell>
                      <TableCell>{inv.amount}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[inv.status]}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.date}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.assignee}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
