"use client";

import type { ColumnDef, ExpandedState } from "@tanstack/react-table";
import { ChevronRightIcon, ThumbsDown, ThumbsUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { useDataTable } from "@/registry/use-data-table/useDataTable";

type FeedbackRow = {
  id: string;
  isPositive: boolean;
  section: string;
  user: string;
  reason: string;
  severity: "Critical" | "High" | "Medium" | "Low" | null;
  createdAt: string;
  comment: string;
  agentFeedback: string;
};

const data: FeedbackRow[] = [
  {
    id: "fb-001",
    isPositive: false,
    section: "Cardiology",
    user: "dr.singh@hospital.example",
    reason: "Incorrect information",
    severity: "High",
    createdAt: "Apr 28, 2026 09:14",
    comment:
      "ECG findings were misread — ST elevation was anterior, not inferior.",
    agentFeedback:
      "Pay closer attention to lead identification when summarizing ECG results.",
  },
  {
    id: "fb-002",
    isPositive: true,
    section: "Medications",
    user: "dr.lee@hospital.example",
    reason: "—",
    severity: null,
    createdAt: "Apr 28, 2026 08:52",
    comment: "Medication reconciliation captured all interactions correctly.",
    agentFeedback: "",
  },
  {
    id: "fb-003",
    isPositive: false,
    section: "Imaging",
    user: "dr.patel@hospital.example",
    reason: "Missing information",
    severity: "Medium",
    createdAt: "Apr 27, 2026 16:30",
    comment:
      "Forgot to include the comparison to the prior study from January.",
    agentFeedback: "Always reference prior studies when available.",
  },
  {
    id: "fb-004",
    isPositive: false,
    section: "Discharge plan",
    user: "rn.morales@hospital.example",
    reason: "Formatting / clarity",
    severity: "Low",
    createdAt: "Apr 27, 2026 11:08",
    comment:
      "Discharge instructions ran into the medication list — needs a separator.",
    agentFeedback: "",
  },
  {
    id: "fb-005",
    isPositive: false,
    section: "Cardiology",
    user: "dr.singh@hospital.example",
    reason: "Incorrect information",
    severity: "Critical",
    createdAt: "Apr 26, 2026 14:22",
    comment:
      "Suggested wrong dosage for the beta-blocker — could harm patient.",
    agentFeedback:
      "Always cross-reference dosage with patient weight and renal function.",
  },
];

const SEVERITY_VARIANT: Record<
  NonNullable<FeedbackRow["severity"]>,
  "default" | "secondary" | "destructive" | "outline"
> = {
  Critical: "destructive",
  High: "destructive",
  Medium: "secondary",
  Low: "outline",
};

const columns: ColumnDef<FeedbackRow>[] = [
  {
    id: "expander",
    header: () => null,
    cell: ({ row }) => (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
        onClick={(e) => {
          e.stopPropagation();
          row.getToggleExpandedHandler()();
        }}
      >
        <ChevronRightIcon
          className={
            row.getIsExpanded()
              ? "rotate-90 transition-transform"
              : "transition-transform"
          }
        />
      </Button>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "isPositive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vote" />
    ),
    cell: ({ row }) =>
      row.original.isPositive ? (
        <ThumbsUp className="size-4 text-success" aria-label="Positive" />
      ) : (
        <ThumbsDown className="size-4 text-destructive" aria-label="Negative" />
      ),
  },
  {
    accessorKey: "section",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Section" />
    ),
  },
  {
    accessorKey: "reason",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reason" />
    ),
  },
  {
    accessorKey: "severity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Severity" />
    ),
    cell: ({ row }) => {
      const severity = row.original.severity;
      if (!severity) return <span className="text-muted-foreground">—</span>;
      return <Badge variant={SEVERITY_VARIANT[severity]}>{severity}</Badge>;
    },
  },
  {
    accessorKey: "user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Submitted by" />
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="When" />
    ),
  },
];

function FeedbackRowDetail({ row }: { row: FeedbackRow }) {
  return (
    <div className="grid gap-3 p-4 bg-muted/30">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Comment
        </p>
        <p className="text-sm">{row.comment}</p>
      </div>
      {row.agentFeedback && (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Feedback to agent
          </p>
          <p className="text-sm">{row.agentFeedback}</p>
        </div>
      )}
    </div>
  );
}

function FeedbackDashboardTemplateContent() {
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const total = data.length;
  const positive = data.filter((d) => d.isPositive).length;
  const negative = total - positive;
  const critical = data.filter((d) => d.severity === "Critical").length;

  const tableState = useDataTable({
    data,
    columns,
    storageKey: "feedback-dashboard-template",
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total feedback" value={total} />
        <MetricCard label="Positive" value={positive} trend="up" />
        <MetricCard
          label="Negative"
          value={negative}
          trend="down"
          isLowerBetter
        />
        <MetricCard
          label="Critical"
          value={critical}
          trend="down"
          isLowerBetter
        />
      </div>
      <DataTable
        {...tableState}
        expanded={expanded}
        onExpandedChange={setExpanded}
        renderExpandedRow={(row) => <FeedbackRowDetail row={row.original} />}
      />
    </div>
  );
}

export const FeedbackDashboardTemplate = dynamic(
  () => Promise.resolve(FeedbackDashboardTemplateContent),
  { ssr: false },
);
