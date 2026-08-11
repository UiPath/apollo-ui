"use client";

import { useNavigate } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
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
  DECISION_DETAILS,
  DECISION_STATUS_META,
  type DecisionStatus,
  daysSince,
} from "./data";
import { useRequests } from "./requests-context";

const COLUMNS = [
  "Request",
  "Title",
  "Requester",
  "Need by",
  "Amount",
  "Status",
  "",
];

const STATUS_OPTIONS = Object.entries(DECISION_STATUS_META).map(
  ([value, meta]) => ({ label: meta.label, value }),
);

// REQ-2052 and REQ-2054 carry full decision packets with detail-page
// content (budget line, checks, PO) — REQ-2054 is the exception scenario
// (its cost center check). The other two are light queue records with
// nothing further to show, so their rows skip the click-through affordance
// entirely instead of looking clickable and doing nothing.
const HAS_DETAIL_PAGE: Record<string, boolean> = {
  "REQ-2052": true,
  "REQ-2054": true,
};

interface StatCardProps {
  label: string;
  value: string;
  /** Omitted entirely (not rendered) rather than shown empty — same
   * suppress-on-nothing-to-report rule the findings block uses. */
  hint?: string;
  /** Only ever the success token, only ever for a hint that reports a
   * real recent change (see the third card below) — the label stays
   * uncolored regardless, so the card itself never outranks the two
   * actionable ones next to it. */
  hintClassName?: string;
  /** Whether this tile's filter is the one currently applied. */
  active?: boolean;
  onClick: () => void;
}

/** A KPI tile that doubles as a quick filter — same selectable-card
 * treatment as My Requests' own stat tiles (accent border + glow when
 * active), so the two queues behave the same way. */
function StatCard({
  label,
  value,
  hint,
  hintClassName,
  active,
  onClick,
}: StatCardProps) {
  return (
    <Card
      selectable="standard"
      selected={active}
      onClick={onClick}
      aria-label={`Filter by ${label}`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-medium text-foreground">{value}</p>
      {hint != null && (
        <p className={cn("mt-1 text-xs text-muted-foreground", hintClassName)}>
          {hint}
        </p>
      )}
    </Card>
  );
}

/** Real elapsed time since a live approval this session — deliberately not
 * the seeded narrative calendar the rest of this file's dates use
 * (APPROVALS_TODAY etc.), since this is a genuine "just happened while you
 * were looking" interaction moment, not a scenario fact. */
function formatElapsed(approvedAtMs: number): string {
  const minutes = Math.floor((Date.now() - approvedAtMs) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

/**
 * Approver's queue — pending decisions read straight from DECISION_DETAILS,
 * same Card + Table treatment as My Requests. A Status column and inline
 * Approve/Deny actions read and write requestStatusOverrides, so decided
 * rows stay visible with their outcome shown rather than disappearing.
 */
export function Approvals() {
  const navigate = useNavigate();
  const { requestStatusOverrides, approvedAt, approveRequest, denyRequest } =
    useRequests();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  // Longest waiting's own quick filter narrows to that one row rather than
  // a status set — there's no decision status that means "has waited the
  // longest," so it can't share statusFilter's mechanism. Mutually
  // exclusive with it: selecting one clears the other.
  const [oldestOnly, setOldestOnly] = useState(false);

  const rows = Object.values(DECISION_DETAILS);
  const decisionOf = (id: string): DecisionStatus =>
    (requestStatusOverrides[id] ?? "pending") as DecisionStatus;

  const pendingRows = rows.filter((row) => decisionOf(row.id) === "pending");

  const awaitingTotal = pendingRows.reduce(
    (sum, row) => sum + row.totalValue,
    0,
  );
  const oldestPending = pendingRows.reduce<(typeof pendingRows)[number] | null>(
    (oldest, row) =>
      oldest == null || daysSince(row.submitted) > daysSince(oldest.submitted)
        ? row
        : oldest,
    null,
  );
  const longestWaitDays =
    oldestPending != null ? daysSince(oldestPending.submitted) : 0;

  // Spend under management: the total value of every request this approver
  // has actually approved, live-derived from requestStatusOverrides — no
  // seeded baseline (see report: a fresh session starts this at $0, which
  // reads small for a KPI headline, but embedding an invented starting
  // figure isn't a call this file gets to make).
  const approvedRows = rows.filter((row) => decisionOf(row.id) === "approved");
  const spendUnderManagement = approvedRows.reduce(
    (sum, row) => sum + row.totalValue,
    0,
  );
  // Most recent contribution: whichever approved row has the latest real
  // approvedAt timestamp — absent (not just old) for anything approved
  // before this session, since nothing is pre-seeded as approved.
  const mostRecentApproval = approvedRows.reduce<
    (typeof approvedRows)[number] | null
  >((latest, row) => {
    const t = approvedAt[row.id];
    if (t == null) return latest;
    if (latest == null || t > (approvedAt[latest.id] ?? 0)) return row;
    return latest;
  }, null);

  const isAwaitingActive =
    !oldestOnly && statusFilter.length === 1 && statusFilter[0] === "pending";
  const isOldestActive = oldestOnly;
  const isApprovedActive =
    !oldestOnly && statusFilter.length === 1 && statusFilter[0] === "approved";

  const query = search.trim().toLowerCase();

  const filteredRows = rows.filter((row) => {
    if (oldestOnly) return oldestPending != null && row.id === oldestPending.id;
    if (statusFilter.length > 0 && !statusFilter.includes(decisionOf(row.id)))
      return false;
    if (query) {
      const hay = `${row.id} ${row.request} ${row.requester}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  const isFiltered = oldestOnly || statusFilter.length > 0 || query.length > 0;

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader>
        <PageHeaderNav className="items-baseline">
          <PageHeaderTitle className="w-auto">Approvals</PageHeaderTitle>
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            Updated just now
          </span>
        </PageHeaderNav>
      </PageHeader>

      <div className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Awaiting your decision"
            value={`$${awaitingTotal.toLocaleString("en-US")}`}
            hint={`Across ${pendingRows.length} request${pendingRows.length === 1 ? "" : "s"}`}
            active={isAwaitingActive}
            onClick={() => {
              setOldestOnly(false);
              setStatusFilter(isAwaitingActive ? [] : ["pending"]);
            }}
          />
          <StatCard
            label="Longest waiting"
            value={
              oldestPending != null
                ? `${longestWaitDays} day${longestWaitDays === 1 ? "" : "s"}`
                : "—"
            }
            hint={
              oldestPending != null
                ? `${oldestPending.id} · ${oldestPending.submitted}`
                : "Nothing pending"
            }
            active={isOldestActive}
            onClick={() => {
              if (oldestPending == null) return;
              setStatusFilter([]);
              setOldestOnly(!oldestOnly);
            }}
          />
          <StatCard
            label="Spend under management"
            value={`$${spendUnderManagement.toLocaleString("en-US")}`}
            hint={
              mostRecentApproval != null
                ? `${mostRecentApproval.id} · ${formatElapsed(approvedAt[mostRecentApproval.id] ?? Date.now())}`
                : undefined
            }
            hintClassName={
              mostRecentApproval != null ? "text-success" : undefined
            }
            active={isApprovedActive}
            onClick={() => {
              setOldestOnly(false);
              setStatusFilter(isApprovedActive ? [] : ["approved"]);
            }}
          />
        </div>

        {/* Search + filter — search left, filters right, same treatment as
            My Requests' own row. */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="relative w-full sm:w-auto">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search approvals…"
              className="w-full pl-9 sm:w-80"
            />
          </div>
          <FilterDropdown
            title="Status"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(v) => {
              setOldestOnly(false);
              setStatusFilter(v as string[]);
            }}
          />
        </div>

        <Card variant="glass" className="overflow-hidden">
          {filteredRows.length === 0 ? (
            <Empty>
              <EmptyDescription>
                {isFiltered
                  ? "No requests match your search."
                  : "Nothing is waiting on your decision."}
              </EmptyDescription>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {COLUMNS.map((h) => (
                    <TableHead
                      key={h || "actions"}
                      className={cn(
                        "text-xs font-semibold text-muted-foreground",
                        h === "Amount" && "text-right",
                        h === "" && "text-right",
                      )}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => {
                  const decision = decisionOf(row.id);
                  const meta = DECISION_STATUS_META[decision];
                  const hasDetail = HAS_DETAIL_PAGE[row.id] === true;

                  return (
                    <TableRow
                      key={row.id}
                      onClick={
                        hasDetail
                          ? () =>
                              void navigate({
                                to: "/decision/$id",
                                params: { id: row.id },
                              })
                          : undefined
                      }
                      className={cn(
                        "h-[52px]",
                        hasDetail && "cursor-pointer hover:bg-muted/50",
                      )}
                    >
                      <TableCell className="font-medium text-(--primary)">
                        {row.id}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {row.request}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {row.requester}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.needBy}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.total}
                      </TableCell>
                      <TableCell>
                        <Badge status={meta.status} variant="secondary">
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {decision === "pending" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                approveRequest(row.id);
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                denyRequest(row.id);
                              }}
                            >
                              Deny
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
