"use client";

import { Search } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getExceptionSummary } from "../data";
import { useRequests } from "../requests/requests-context";
import {
  applyExceptionOverrides,
  type Decision,
  FORK_BADGE_STATUS,
  FORK_LABEL,
  type ForkType,
  STATUS_BADGE,
  STATUS_LABEL,
  WORKBENCH_DETAILS,
  WORKBENCH_EXCEPTIONS,
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
    <Card variant="glass" className={cn("py-0", dim && "opacity-60")}>
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-3xl font-medium", valueClass)}>{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

interface WorkbenchListProps {
  onOpen: (id: string) => void;
  /** Decisions made this session, overriding the seed row status. */
  decisions: Record<string, Decision>;
}

/** Workbench landing: stat cards + the escalation queue table. */
export function WorkbenchList({ onOpen, decisions }: WorkbenchListProps) {
  const { exceptionOverrides } = useRequests();
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

  const filterTriggerClass =
    "w-fit gap-1.5 border-none bg-transparent px-2 text-xs text-foreground hover:bg-muted/50 dark:bg-transparent dark:hover:bg-muted/50";

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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requests…"
              className="h-9 w-64 border-none bg-muted/40 pl-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as ForkType | "all")}
            >
              <SelectTrigger
                aria-label="Filter by type"
                size="sm"
                className={filterTriggerClass}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">Type: All</SelectItem>
                <SelectItem value="quote">Quote</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="sourcing">Sourcing</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as WorkbenchStatus | "all")
              }
            >
              <SelectTrigger
                aria-label="Filter by status"
                size="sm"
                className={filterTriggerClass}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">Status: All</SelectItem>
                <SelectItem value="awaiting">Awaiting your review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="countered">Countered</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card variant="glass" className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 text-xs font-semibold text-muted-foreground">
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
                <TableHead className="pr-4 text-xs font-semibold text-muted-foreground">
                  Assignee
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const openable = WORKBENCH_DETAILS[row.id] != null;
                // Absent for every row except REQ-10482 today, so every
                // other row's summary is undefined and renders exactly as
                // it did before (see the report).
                const seedExceptions = WORKBENCH_EXCEPTIONS[row.id];
                const summary = seedExceptions
                  ? getExceptionSummary(
                      applyExceptionOverrides(
                        seedExceptions,
                        exceptionOverrides[row.id] ?? {},
                      ),
                    )
                  : null;
                // A row that had exceptions and now has none open and none
                // waiting has left the buyer's queue on its own: reflect
                // that as "auto-cleared" rather than the seed's own
                // "awaiting" status, still derived from the same summary
                // above, never a separate flag.
                const autoReleased =
                  seedExceptions != null &&
                  seedExceptions.length > 0 &&
                  summary != null &&
                  summary.openCount === 0 &&
                  summary.waitingCount === 0;
                const effectiveStatus = autoReleased
                  ? "auto-cleared"
                  : (decisions[row.id] ?? row.status);
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
                    <TableCell className="pl-4 font-medium text-foreground">
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          status={STATUS_BADGE[effectiveStatus]}
                          variant="secondary"
                        >
                          {STATUS_LABEL[effectiveStatus]}
                        </Badge>
                        {/* The lead open exception, amber: a genuine
                            request-level exception state. Neither the
                            label nor the overflow count below is authored,
                            both derive from getExceptionSummary. */}
                        {summary?.lead && (
                          <Badge status="warning" variant="secondary">
                            {summary.lead.headline}
                          </Badge>
                        )}
                        {summary && summary.extraCount > 0 && (
                          <span className="text-xs font-medium text-muted-foreground">
                            {`+${summary.extraCount}`}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-4 text-foreground">
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
