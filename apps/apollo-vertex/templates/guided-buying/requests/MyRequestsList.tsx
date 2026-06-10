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
  REQUEST_DETAILS,
  REQUEST_ROWS,
  type RequestStatus,
  requestStats,
  STATUS_BADGE,
  STATUS_LABEL,
} from "./data";

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  valueClass?: string;
}

function StatCard({ label, value, hint, valueClass }: StatCardProps) {
  return (
    <Card variant="glass">
      <CardContent className="px-5 pt-4 pb-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-3xl font-medium", valueClass)}>{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

interface MyRequestsListProps {
  onOpen: (id: string) => void;
}

/** Requests landing — stat cards + the requester's queue table (Workbench twin). */
export function MyRequestsList({ onOpen }: MyRequestsListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">(
    "all",
  );

  const stats = requestStats();
  const query = search.trim().toLowerCase();

  const rows = REQUEST_ROWS.filter((r) => {
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
        {/* Four stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total requests"
            value={String(stats.total)}
            hint="this quarter"
            valueClass="text-foreground"
          />
          <StatCard
            label="Awaiting a decision"
            value={String(stats.awaitingDecision)}
            hint="still with procurement"
            valueClass="text-warning"
          />
          <StatCard
            label="Approved"
            value={String(stats.approved)}
            hint="cleared to buy"
            valueClass="text-success"
          />
          <StatCard
            label="Total value"
            value={`$${stats.totalValue.toLocaleString("en-US")}`}
            hint="annual equivalent"
            valueClass="text-foreground"
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
                      if (openable) onOpen(row.id);
                    }}
                    className={cn(
                      "h-[52px]",
                      openable && "cursor-pointer hover:bg-muted/50",
                    )}
                  >
                    <TableCell className="font-medium text-[#0f7b8a]">
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
