"use client";

import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription } from "@/components/ui/empty";
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
import { DECISION_DETAILS, DECISION_STATUS_META, daysSince } from "./data";
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
}

function StatCard({ label, value, hint, hintClassName }: StatCardProps) {
  return (
    <Card variant="glass" className="py-0">
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-medium text-foreground">{value}</p>
        {hint != null && (
          <p
            className={cn("mt-1 text-xs text-muted-foreground", hintClassName)}
          >
            {hint}
          </p>
        )}
      </CardContent>
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
  const rows = Object.values(DECISION_DETAILS);
  const pendingRows = rows.filter(
    (row) => requestStatusOverrides[row.id] == null,
  );

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
  const approvedRows = rows.filter(
    (row) => requestStatusOverrides[row.id] === "approved",
  );
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

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader>
        <PageHeaderNav className="items-baseline">
          <PageHeaderTitle className="w-auto">Approvals</PageHeaderTitle>
        </PageHeaderNav>
      </PageHeader>

      <div className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Awaiting your decision"
            value={`$${awaitingTotal.toLocaleString("en-US")}`}
            hint={`Across ${pendingRows.length} request${pendingRows.length === 1 ? "" : "s"}`}
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
          />
        </div>

        <Card variant="glass" className="overflow-hidden">
          {rows.length === 0 ? (
            <Empty>
              <EmptyDescription>
                Nothing is waiting on your decision.
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
                {rows.map((row) => {
                  const decision = (requestStatusOverrides[row.id] ??
                    "pending") as
                    | "approved"
                    | "denied"
                    | "sent-back"
                    | "pending";
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
