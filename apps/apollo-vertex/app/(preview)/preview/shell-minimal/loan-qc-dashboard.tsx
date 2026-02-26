"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileSearch,
  ShieldCheck,
  TrendingUp,
  XCircle,
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
  { label: "Loans Reviewed", value: "3,842", icon: FileSearch, change: "+18%" },
  { label: "Pending QC", value: "127", icon: Clock, change: "-8%" },
  { label: "Compliance Rate", value: "99.1%", icon: ShieldCheck, change: "+0.3%" },
  { label: "Defect Rate", value: "0.9%", icon: TrendingUp, change: "-0.2%" },
];

const loans = [
  { id: "LN-8842", borrower: "Martinez Holdings LLC", amount: "$1,250,000", type: "Commercial", status: "Passed" as const, date: "Feb 25, 2026" },
  { id: "LN-8841", borrower: "Sarah Chen", amount: "$485,000", type: "Residential", status: "Flagged" as const, date: "Feb 25, 2026" },
  { id: "LN-8840", borrower: "Greenfield Dev Corp", amount: "$3,200,000", type: "Construction", status: "In Review" as const, date: "Feb 24, 2026" },
  { id: "LN-8839", borrower: "James & Linda Park", amount: "$320,000", type: "Residential", status: "Passed" as const, date: "Feb 24, 2026" },
  { id: "LN-8838", borrower: "NovaTech Industries", amount: "$890,000", type: "Commercial", status: "Failed" as const, date: "Feb 23, 2026" },
  { id: "LN-8837", borrower: "Riverside Properties", amount: "$2,100,000", type: "Commercial", status: "Passed" as const, date: "Feb 23, 2026" },
];

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Passed: "default",
  "In Review": "secondary",
  Failed: "destructive",
  Flagged: "outline",
};

const statusIcon: Record<string, typeof CheckCircle> = {
  Passed: CheckCircle,
  "In Review": Clock,
  Failed: XCircle,
  Flagged: AlertTriangle,
};

const complianceChecks = [
  { label: "Income Verification", pass: 98 },
  { label: "Credit Score Threshold", pass: 96 },
  { label: "Debt-to-Income Ratio", pass: 91 },
  { label: "Collateral Appraisal", pass: 87 },
  { label: "Document Completeness", pass: 94 },
];

const recentFindings = [
  { text: "LN-8838 — missing employment verification letter", time: "1 hr ago", severity: "high" as const },
  { text: "LN-8841 — DTI ratio exceeds threshold (43.2%)", time: "2 hrs ago", severity: "medium" as const },
  { text: "Batch QC completed — 156 loans, 2 flagged", time: "4 hrs ago", severity: "low" as const },
  { text: "LN-8835 — appraisal gap identified ($12K)", time: "6 hrs ago", severity: "medium" as const },
];

const severityColor: Record<string, string> = {
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-primary",
};

export function LoanQcDashboard({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="p-8 space-y-4 relative z-10">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold">Loan Processing QC</h1>
        <p className="text-sm text-muted-foreground">
          Quality control and compliance monitoring for loan origination
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
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
                <span className="text-emerald-500">{kpi.change}</span> from last week
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loans Table */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Recent QC Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan ID</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((loan) => {
                const StatusIcon = statusIcon[loan.status];
                return (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{loan.id}</TableCell>
                    <TableCell>{loan.borrower}</TableCell>
                    <TableCell>{loan.amount}</TableCell>
                    <TableCell className="text-muted-foreground">{loan.type}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[loan.status]} className="gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {loan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{loan.date}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Compliance Checks */}
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

        {/* Recent Findings */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Recent Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFindings.map((finding, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-1.5 w-2 h-2 rounded-full ${severityColor[finding.severity]} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{finding.text}</p>
                    <p className="text-xs text-muted-foreground">{finding.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
