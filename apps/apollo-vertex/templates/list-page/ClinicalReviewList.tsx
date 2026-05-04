"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableColumnHeader,
  dataTableFacetedFilterFn,
  dataTableGlobalFilterFn,
} from "@/components/ui/data-table";
import {
  FilterDropdown,
  type FilterDropdownOption,
} from "@/components/ui/filter-dropdown";
import { MetricCard } from "@/components/ui/metric-card";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderNav,
  PageHeaderTitle,
} from "@/components/ui/page-header";
import { useDataTable } from "@/registry/use-data-table/useDataTable";

type ReviewStatus = "ready" | "in_progress" | "approved" | "rejected";

const UNASSIGNED = "Unassigned";

interface ClinicalReviewRecord {
  id: string;
  patient: string;
  status: ReviewStatus;
  /** Reviewer display name, or the literal "Unassigned" if none. */
  reviewer: string;
  template: string;
  createdAt: string;
}

const STATUSES: {
  value: ReviewStatus;
  label: string;
  badgeStatus: "success" | "info" | "warning" | "error";
}[] = [
  { value: "ready", label: "Ready for review", badgeStatus: "info" },
  { value: "in_progress", label: "Review started", badgeStatus: "warning" },
  { value: "approved", label: "Approved", badgeStatus: "success" },
  { value: "rejected", label: "Rejected", badgeStatus: "error" },
];

const statusByValue = new Map(STATUSES.map((s) => [s.value, s]));

const statusFilterOptions: FilterDropdownOption[] = STATUSES.map(
  ({ value, label }) => ({ value, label }),
);

const timeFilterOptions: FilterDropdownOption[] = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const REVIEWERS = ["Dr. Mei Chen", "Dr. Anika Patel", "Dr. Julian Rivera"];

const reviewerFilterOptions: FilterDropdownOption[] = [
  { value: "Unassigned", label: "Unassigned" },
  ...REVIEWERS.map((r) => ({ value: r, label: r })),
];

const records: ClinicalReviewRecord[] = [
  {
    id: "rec-4821",
    patient: "Harrison, Oliver",
    status: "ready",
    reviewer: UNASSIGNED,
    template: "Discharge Summary v2",
    createdAt: "2026-04-22T09:14:00Z",
  },
  {
    id: "rec-4820",
    patient: "Nakamura, Yui",
    status: "in_progress",
    reviewer: "Dr. Mei Chen",
    template: "Oncology Consult",
    createdAt: "2026-04-22T08:02:00Z",
  },
  {
    id: "rec-4819",
    patient: "Vasquez, Elena",
    status: "in_progress",
    reviewer: "Dr. Anika Patel",
    template: "ED Encounter",
    createdAt: "2026-04-21T17:45:00Z",
  },
  {
    id: "rec-4818",
    patient: "Okafor, Chinedu",
    status: "approved",
    reviewer: "Dr. Julian Rivera",
    template: "Discharge Summary v2",
    createdAt: "2026-04-21T14:18:00Z",
  },
  {
    id: "rec-4817",
    patient: "Bauer, Lena",
    status: "rejected",
    reviewer: "Dr. Anika Patel",
    template: "Radiology Report",
    createdAt: "2026-04-21T11:02:00Z",
  },
  {
    id: "rec-4816",
    patient: "Morales, Santiago",
    status: "ready",
    reviewer: UNASSIGNED,
    template: "ED Encounter",
    createdAt: "2026-04-20T19:33:00Z",
  },
  {
    id: "rec-4815",
    patient: "Petrov, Anastasia",
    status: "approved",
    reviewer: "Dr. Mei Chen",
    template: "Oncology Consult",
    createdAt: "2026-04-20T15:21:00Z",
  },
  {
    id: "rec-4814",
    patient: "Thompson, Alice",
    status: "ready",
    reviewer: UNASSIGNED,
    template: "Discharge Summary v2",
    createdAt: "2026-04-19T16:12:00Z",
  },
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const columns: ColumnDef<ClinicalReviewRecord>[] = [
  {
    accessorKey: "patient",
    minSize: 220,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Summary" />
    ),
    cell: ({ row }) => (
      <span className="truncate font-medium">{row.original.patient}</span>
    ),
  },
  {
    accessorKey: "status",
    minSize: 140,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Review status" />
    ),
    cell: ({ row }) => {
      const meta = statusByValue.get(row.original.status);
      if (!meta) return null;
      return (
        <Badge variant="secondary" status={meta.badgeStatus}>
          {meta.label}
        </Badge>
      );
    },
    filterFn: dataTableFacetedFilterFn,
  },
  {
    accessorKey: "reviewer",
    minSize: 180,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reviewer" />
    ),
    cell: ({ row }) => {
      const reviewer = row.original.reviewer;
      if (reviewer === UNASSIGNED) {
        return (
          <span className="text-muted-foreground italic">{UNASSIGNED}</span>
        );
      }
      return <span className="truncate">{reviewer}</span>;
    },
    filterFn: dataTableFacetedFilterFn,
  },
  {
    accessorKey: "template",
    minSize: 180,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Template" />
    ),
    cell: ({ row }) => <div className="truncate">{row.original.template}</div>,
  },
  {
    accessorKey: "createdAt",
    minSize: 140,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date created" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {dateFormatter.format(new Date(row.original.createdAt))}
      </span>
    ),
  },
];

export function ClinicalReviewList() {
  const [timeRange, setTimeRange] = useState<string>("all");
  const tableState = useDataTable({
    data: records,
    columns,
    storageKey: "clinical-review-list",
  });

  const counts = {
    ready: records.filter((r) => r.status === "ready").length,
    approved: records.filter((r) => r.status === "approved").length,
    rejected: records.filter((r) => r.status === "rejected").length,
    total: records.length,
  };

  return (
    <div className="relative z-10">
      <PageHeader>
        <PageHeaderNav>
          <PageHeaderTitle>Clinical review</PageHeaderTitle>
        </PageHeaderNav>
        <PageHeaderActions>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh list"
            className="size-9"
          >
            <RefreshCw className="size-4" />
          </Button>
          <FilterDropdown
            title="Time"
            options={timeFilterOptions}
            multiSelect={false}
            value={timeRange}
            onChange={(v) => {
              if (typeof v === "string") setTimeRange(v);
            }}
          />
          <Button>Add summary</Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-4 mb-8">
          <div className="col-span-2 sm:col-span-4 lg:col-span-3">
            <MetricCard
              label="Ready for review"
              value={counts.ready}
              trend="up"
              percentage={18}
            />
          </div>
          <div className="col-span-2 sm:col-span-4 lg:col-span-3">
            <MetricCard
              label="Approved"
              value={counts.approved}
              trend="up"
              percentage={9}
            />
          </div>
          <div className="col-span-2 sm:col-span-4 lg:col-span-3">
            <MetricCard
              label="Rejected"
              value={counts.rejected}
              trend="down"
              percentage={12}
              isLowerBetter
            />
          </div>
          <div className="col-span-2 sm:col-span-4 lg:col-span-3">
            <MetricCard
              label="Total summaries"
              value={counts.total}
              trend="up"
              percentage={6}
            />
          </div>
        </div>

        <DataTable
          {...tableState}
          enableViewOptions={false}
          globalFilterFn={dataTableGlobalFilterFn}
          toolbarContent={(table) => (
            <>
              <FilterDropdown
                column={table.getColumn("status")}
                title="Status"
                options={statusFilterOptions}
              />
              <FilterDropdown
                column={table.getColumn("reviewer")}
                title="Reviewer"
                options={reviewerFilterOptions}
                searchPlaceholder="Search people..."
                popoverWidth="w-56"
              />
            </>
          )}
        />
      </div>
    </div>
  );
}
