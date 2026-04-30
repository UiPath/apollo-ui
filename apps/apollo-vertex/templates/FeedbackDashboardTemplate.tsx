"use client";

import type { ColumnDef, ExpandedState } from "@tanstack/react-table";
import { ChevronRightIcon, ThumbsDown, ThumbsUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";
import { useDataTable } from "@/registry/use-data-table/useDataTable";

type Severity = "Critical" | "High" | "Medium" | "Low";

type FeedbackRow = {
  id: string;
  isPositive: boolean;
  section: string;
  user: string;
  reason: string;
  severity: Severity | null;
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
  Severity,
  "default" | "secondary" | "destructive" | "outline"
> = {
  Critical: "destructive",
  High: "destructive",
  Medium: "secondary",
  Low: "outline",
};

const SEVERITY_LABEL_KEY = {
  Critical: "feedback_severity_critical",
  High: "feedback_severity_high",
  Medium: "feedback_severity_medium",
  Low: "feedback_severity_low",
} as const;

function FeedbackRowDetail({ row }: { row: FeedbackRow }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-3 p-4 bg-muted/30">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {t("feedback_expanded_comment")}
        </p>
        <p className="text-sm">{row.comment}</p>
      </div>
      {row.agentFeedback && (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("feedback_expanded_to_agent")}
          </p>
          <p className="text-sm">{row.agentFeedback}</p>
        </div>
      )}
    </div>
  );
}

function FeedbackDashboardTemplateContent() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const total = data.length;
  const positive = data.filter((d) => d.isPositive).length;
  const negative = total - positive;
  const critical = data.filter((d) => d.severity === "Critical").length;

  const columns: ColumnDef<FeedbackRow>[] = [
    {
      id: "expander",
      header: () => null,
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={
            row.getIsExpanded()
              ? t("feedback_collapse_row")
              : t("feedback_expand_row")
          }
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
        <DataTableColumnHeader
          column={column}
          title={t("feedback_column_vote")}
        />
      ),
      cell: ({ row }) =>
        row.original.isPositive ? (
          <ThumbsUp
            className="size-4 text-success"
            aria-label={t("feedback_aria_positive")}
          />
        ) : (
          <ThumbsDown
            className="size-4 text-destructive"
            aria-label={t("feedback_aria_negative")}
          />
        ),
    },
    {
      accessorKey: "section",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("feedback_column_section")}
        />
      ),
    },
    {
      accessorKey: "reason",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("feedback_column_reason")}
        />
      ),
    },
    {
      accessorKey: "severity",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("feedback_column_severity")}
        />
      ),
      cell: ({ row }) => {
        const severity = row.original.severity;
        if (!severity) return <span className="text-muted-foreground">—</span>;
        return (
          <Badge variant={SEVERITY_VARIANT[severity]}>
            {t(SEVERITY_LABEL_KEY[severity])}
          </Badge>
        );
      },
    },
    {
      accessorKey: "user",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("feedback_column_submitted_by")}
        />
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("feedback_column_when")}
        />
      ),
    },
  ];

  const tableState = useDataTable({
    data,
    columns,
    storageKey: "feedback-dashboard-template",
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label={t("feedback_total_feedback")} value={total} />
        <MetricCard
          label={t("feedback_positive")}
          value={positive}
          trend="up"
        />
        <MetricCard
          label={t("feedback_negative")}
          value={negative}
          trend="down"
          isLowerBetter
        />
        <MetricCard
          label={t("feedback_critical")}
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

const FeedbackDashboardTemplateInner = dynamic(
  () => Promise.resolve(FeedbackDashboardTemplateContent),
  { ssr: false },
);

export function FeedbackDashboardTemplate() {
  return (
    <LocaleProvider>
      <FeedbackDashboardTemplateInner />
    </LocaleProvider>
  );
}
