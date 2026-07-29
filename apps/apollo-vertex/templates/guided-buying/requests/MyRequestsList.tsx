"use client";

import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { AiCaveat } from "@/registry/ai-caveat/ai-caveat";
import { AiMark } from "@/registry/ai-mark/ai-mark";
import { P2 } from "../P2";
import {
  REQUEST_DETAILS,
  REQUEST_ROWS,
  type RequestStatus,
  requestStats,
  STATUS_BADGE,
  STATUS_LABEL,
} from "./data";
import { useRequests } from "./requests-context";

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  valueClass?: string;
  delta?: string;
  tealBorder?: boolean;
}

function StatCard({
  label,
  value,
  hint,
  valueClass,
  delta,
  tealBorder,
}: StatCardProps) {
  return (
    <Card variant="glass" className={cn(tealBorder && "border-(--primary)")}>
      <CardContent className="px-5 pt-4 pb-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-3xl font-medium", valueClass)}>{value}</p>
        {delta && (
          <p className="mt-0.5 text-xs font-medium text-(--primary)">{delta}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

/** Requests landing — stat cards + the requester's queue table (Workbench twin). */
export function MyRequestsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">(
    "all",
  );

  const { submittedRows } = useRequests();
  // Deduplicate: submittedRows wins over the static seed for the same id.
  const seen = new Set<string>();
  const allRows = [...submittedRows, ...REQUEST_ROWS].filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  const stats = requestStats(allRows);

  const inflightEntry = (() => {
    const row = allRows.find((r) => {
      const d = REQUEST_DETAILS[r.id];
      return d?.inFlight === true && d.approver != null;
    });
    if (row == null) return null;
    const d = REQUEST_DETAILS[row.id]!;
    const daysMatch = d.statusLabel?.match(/(\d+)\s+day/);
    return {
      id: row.id,
      approverName: d.approver!.split(" · ")[0]!,
      days: daysMatch != null ? parseInt(daysMatch[1]!, 10) : null,
      noun:
        row.request
          .split(/\s+/)
          .find((w) => !/^\d+$/.test(w) && w.length > 3)
          ?.replace(/s$/, "")
          .toLowerCase() ?? "request",
    };
  })();

  const query = search.trim().toLowerCase();

  const rows = allRows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (query) {
      const hay = `${r.id} ${r.request} ${r.supplier}`.toLowerCase();
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
          <PageHeaderTitle className="w-auto">Requests</PageHeaderTitle>
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            Updated just now
          </span>
        </PageHeaderNav>
      </PageHeader>

      <div className="px-4 pb-8 sm:px-6 lg:px-8">
        {/* AI attention line — populated from in-flight request data, or empty state */}
        <div className="mb-4 space-y-2">
          <div className="flex gap-2.5 rounded-lg border bg-muted/40 px-3.5 py-3">
            <AiMark
              size={16}
              className="mt-0.5 shrink-0"
              gradientId="hub-ai-mark"
              aria-hidden
            />
            <p className="text-sm leading-[1.6] text-foreground">
              {inflightEntry != null ? (
                <>
                  Your {inflightEntry.noun} request has been with{" "}
                  {inflightEntry.approverName}
                  {inflightEntry.days != null
                    ? ` for ${inflightEntry.days} day${inflightEntry.days !== 1 ? "s" : ""}`
                    : ""}
                  .<P2> I sent a reminder this morning.</P2>
                </>
              ) : (
                "Nothing needs your attention today."
              )}
            </p>
          </div>
          {inflightEntry != null && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                void navigate({
                  to: "/requests/$id",
                  params: { id: inflightEntry.id },
                })
              }
            >
              Follow up
            </Button>
          )}
          <AiCaveat className="mt-0" />
        </div>

        {/* Stat tiles — 3 tiles at both tiers */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          <StatCard
            label="Total requests"
            value={String(stats.total)}
            hint="this quarter"
            valueClass="text-foreground"
          />
          <StatCard
            label="Awaiting a decision"
            value={String(stats.awaitingDecision)}
            hint="pending approval or sourcing"
            valueClass="text-warning"
          />
          <StatCard
            label="Approved"
            value={String(stats.approved)}
            hint="cleared to buy"
            valueClass="text-success"
          />
        </div>

        {/* Search + filter */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests…"
            className="h-8 w-64 text-xs"
          />
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as RequestStatus | "all")
            }
            className={selectClass}
          >
            <option value="all">Status: All</option>
            <option value="pending-approval">Pending Approval</option>
            <option value="sourcing">Sourcing</option>
            <option value="approved">Approved</option>
            <option value="ordered">Ordered</option>
          </select>
        </div>

        <Card variant="glass" className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "Request",
                  "Title",
                  "Supplier",
                  "Department",
                  "Amount",
                  "Status",
                  "Submitted",
                  "Updated",
                ].map((h) => (
                  <TableHead
                    key={h}
                    className={cn(
                      "text-xs font-semibold text-muted-foreground",
                      h === "Amount" && "text-right",
                    )}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const openable = REQUEST_DETAILS[row.id] != null;
                return (
                  <TableRow
                    key={row.id}
                    onClick={() => {
                      if (openable)
                        void navigate({
                          to: "/requests/$id",
                          params: { id: row.id },
                        });
                    }}
                    className={cn(
                      "h-[52px]",
                      openable && "cursor-pointer hover:bg-muted/50",
                    )}
                  >
                    <TableCell className="font-medium text-(--primary)">
                      {row.id}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {row.request}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {row.supplier}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {row.department}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.amount}
                    </TableCell>
                    <TableCell>
                      <Badge
                        status={STATUS_BADGE[row.status]}
                        variant="secondary"
                      >
                        {STATUS_LABEL[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {row.submitted}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {row.updated}
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
