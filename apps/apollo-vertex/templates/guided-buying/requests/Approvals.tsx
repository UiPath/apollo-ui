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
  hint: string;
}

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card variant="glass">
      <CardContent className="px-5 pt-4 pb-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-medium text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Approver's queue — pending decisions read straight from DECISION_DETAILS,
 * same Card + Table treatment as My Requests. A Status column and inline
 * Approve/Deny actions read and write requestStatusOverrides, so decided
 * rows stay visible with their outcome shown rather than disappearing.
 */
export function Approvals() {
  const navigate = useNavigate();
  const { requestStatusOverrides, approveRequest, denyRequest } = useRequests();
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

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader>
        <PageHeaderNav className="items-baseline">
          <PageHeaderTitle className="w-auto">Approvals</PageHeaderTitle>
        </PageHeaderNav>
      </PageHeader>

      <div className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
