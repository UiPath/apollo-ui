"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PageHeader,
  PageHeaderNav,
  PageHeaderTitle,
} from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  type Decision,
  FORK_BADGE_STATUS,
  FORK_LABEL,
  type ForkType,
  STATUS_BADGE,
  STATUS_LABEL,
  WORKBENCH_DETAILS,
  WORKBENCH_ROWS,
  type WorkbenchStatus,
  workbenchStats,
} from "./data";

interface StatCardProps {
  label: string;
  value: number;
  hint: string;
  valueClass?: string;
  dim?: boolean;
}

function StatCard({ label, value, hint, valueClass, dim }: StatCardProps) {
  return (
    <Card variant="glass" className={cn(dim && "opacity-60")}>
      <CardContent className="px-5 pt-4 pb-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-3xl font-medium", valueClass)}>{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

interface WorkbenchListProps {
  onOpen: (id: string) => void;
  /** Decisions made this session — override the seed row status. */
  decisions: Record<string, Decision>;
}

/** Workbench landing — stat cards + the escalation queue table. */
export function WorkbenchList({ onOpen, decisions }: WorkbenchListProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ForkType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<WorkbenchStatus | "all">(
    "all",
  );

  const stats = workbenchStats();
  const query = search.trim().toLowerCase();

  const rows = WORKBENCH_ROWS.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (query) {
      const hay = `${r.id} ${r.request} ${r.requester}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  const selectClass =
    "h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader>
        <PageHeaderNav className="items-baseline">
          <PageHeaderTitle className="w-auto">Workbench</PageHeaderTitle>
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            Updated just now
          </span>
        </PageHeaderNav>
      </PageHeader>

      <div className="px-4 pb-8 sm:px-6 lg:px-8">
        {/* Four stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Awaiting your review"
            value={stats.awaiting}
            hint="need a decision"
            valueClass="text-foreground"
          />
          <StatCard
            label="Quotes to price"
            value={stats.quotes}
            hint="off-catalog"
            valueClass="text-warning"
          />
          <StatCard
            label="Contracts to counter"
            value={stats.contracts}
            hint="under an MSA"
            valueClass="text-destructive"
          />
          <StatCard
            label="Auto-cleared"
            value={stats.autoCleared}
            hint="no action needed"
            valueClass="text-muted-foreground"
            dim
          />
        </div>

        {/* Search + filters */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests…"
            className="h-8 w-64 text-xs"
          />
          <select
            aria-label="Filter by type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ForkType | "all")}
            className={selectClass}
          >
            <option value="all">Type: All</option>
            <option value="quote">Quote</option>
            <option value="contract">Contract</option>
          </select>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as WorkbenchStatus | "all")
            }
            className={selectClass}
          >
            <option value="all">Status: All</option>
            <option value="awaiting">Awaiting your review</option>
            <option value="approved">Approved</option>
            <option value="countered">Countered</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <Card variant="glass" className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Request
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Requester
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Value
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Need by
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Type
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Assignee
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const openable = WORKBENCH_DETAILS[row.id] != null;
                const effectiveStatus = decisions[row.id] ?? row.status;
                return (
                  <TableRow
                    key={row.id}
                    onClick={() => {
                      if (openable) onOpen(row.id);
                    }}
                    className={cn(
                      "h-[52px]",
                      openable && "cursor-pointer hover:bg-muted/50",
                    )}
                  >
                    <TableCell className="font-medium text-foreground">
                      {row.request}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {row.id}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {row.requester}
                    </TableCell>
                    <TableCell className="tabular-nums">{row.value}</TableCell>
                    <TableCell className="text-foreground">
                      {row.needBy}
                    </TableCell>
                    <TableCell>
                      <Badge
                        status={FORK_BADGE_STATUS[row.type]}
                        variant="secondary"
                        className="rounded-[4px]"
                      >
                        {FORK_LABEL[row.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        status={STATUS_BADGE[effectiveStatus]}
                        variant="secondary"
                      >
                        {STATUS_LABEL[effectiveStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {row.assignee}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
