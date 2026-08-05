"use client";

import { useNavigate } from "@tanstack/react-router";
import { MoreHorizontal, Plus, SearchIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Input } from "@/components/ui/input";
import {
  PageHeader,
  PageHeaderActions,
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
import { useCart } from "../catalog/v1/cart-context";
import { useConversation } from "../catalog/v1/conversation-context";
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

// The two KPI tiles that group multiple statuses — clicking one is a
// shortcut for selecting this exact set in the Status filter below, so both
// controls stay driven by the same statusFilter state.
const AWAITING_STATUSES: RequestStatus[] = ["pending-approval", "sourcing"];
const APPROVED_STATUSES: RequestStatus[] = ["approved", "ordered"];

const STATUS_OPTIONS = [
  { label: "Pending Approval", value: "pending-approval" },
  { label: "Sourcing", value: "sourcing" },
  { label: "Approved", value: "approved" },
  { label: "Ordered", value: "ordered" },
  { label: "Delivered", value: "delivered" },
];

function sameStatusSet(current: string[], target: RequestStatus[]): boolean {
  return (
    current.length === target.length && target.every((v) => current.includes(v))
  );
}

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  valueClass?: string;
  /** Whether this tile's status set is the one currently applied. */
  active?: boolean;
  onClick: () => void;
}

/** A KPI tile that doubles as a quick filter — accent border + glow when active. */
function StatCard({
  label,
  value,
  hint,
  valueClass,
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
      <p className={cn("mt-1 text-3xl font-medium", valueClass)}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

/** Requests landing — stat cards + the requester's queue table (Workbench twin). */
export function MyRequestsList() {
  const navigate = useNavigate();
  const { clear } = useCart();
  const { startFresh } = useConversation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Same reset as the header's own "New request" (see CatalogSubmitted),
  // reused rather than a second, differently-behaved entry point into /buy.
  const startNewRequest = () => {
    clear();
    startFresh();
    void navigate({ to: "/buy" });
  };

  const { submittedRows } = useRequests();
  // Deduplicate: submittedRows wins over the static seed for the same id.
  const seen = new Set<string>();
  const allRows = [...submittedRows, ...REQUEST_ROWS].filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  const stats = requestStats(allRows);

  // Every row currently with an approver awaiting a decision — not just the
  // first. The attention line summarizes the count when more than one
  // qualifies, rather than only ever naming a single request.
  const attentionRows = allRows.filter((r) => {
    const d = REQUEST_DETAILS[r.id];
    return d?.inFlight === true && d.approver != null;
  });

  const singleAttention = (() => {
    if (attentionRows.length !== 1) return null;
    const row = attentionRows[0]!;
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

  const isTotalActive = statusFilter.length === 0;
  const isAwaitingActive = sameStatusSet(statusFilter, AWAITING_STATUSES);
  const isApprovedActive = sameStatusSet(statusFilter, APPROVED_STATUSES);

  const query = search.trim().toLowerCase();

  const rows = allRows.filter((r) => {
    if (statusFilter.length > 0 && !statusFilter.includes(r.status))
      return false;
    if (query) {
      const hay = `${r.id} ${r.request} ${r.supplier}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader>
        <PageHeaderNav className="items-baseline">
          <PageHeaderTitle className="w-auto">Requests</PageHeaderTitle>
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            Updated just now
          </span>
        </PageHeaderNav>
        <PageHeaderActions>
          <Button
            variant="outline"
            size="sm"
            onClick={startNewRequest}
            className="text-muted-foreground"
          >
            <Plus className="size-4" aria-hidden />
            New request
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="px-4 pb-8 sm:px-6 lg:px-8">
        {/* AI attention line — populated from in-flight request data, or empty
            state. The "gradient subtle · no border" ai-toolkit treatment, with
            the action and caveat inside the card rather than floating below
            it. text-insight-* pairs with --ai-gradient for contrast, same as
            the guidelines page's own use of this variant. */}
        <Card
          variant="solid"
          className="mb-4 border-0 p-4"
          style={{ background: "var(--ai-gradient)" }}
        >
          <div className="flex items-center gap-3">
            <AiMark
              size={16}
              className="mt-0.5 shrink-0 self-start text-insight-900 dark:text-insight-50"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-[1.6] text-insight-900 dark:text-insight-50">
                {attentionRows.length === 0 ? (
                  <span className="font-semibold">
                    Nothing needs your attention today.
                  </span>
                ) : singleAttention != null ? (
                  <>
                    <span className="font-semibold">
                      Your {singleAttention.noun} request has been with{" "}
                      {singleAttention.approverName}
                      {singleAttention.days != null
                        ? ` for ${singleAttention.days} day${singleAttention.days !== 1 ? "s" : ""}`
                        : ""}
                      .
                    </span>
                    <P2> I sent a reminder this morning.</P2>
                  </>
                ) : (
                  <span className="font-semibold">
                    {attentionRows.length} requests need your attention today.
                  </span>
                )}
              </p>
              <AiCaveat variant="withMark" className="mt-2 pl-0" />
            </div>
            {singleAttention != null && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() =>
                  void navigate({
                    to: "/requests/$id",
                    params: { id: singleAttention.id },
                  })
                }
              >
                Follow up
              </Button>
            )}
            {attentionRows.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setStatusFilter(AWAITING_STATUSES)}
              >
                View all
              </Button>
            )}
          </div>
        </Card>

        {/* Stat tiles — quick filters. Clicking an already-active tile
            clears back to "Total"; "Total" itself always clears. */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          <StatCard
            label="Total requests"
            value={String(stats.total)}
            hint="this quarter"
            valueClass="text-foreground"
            active={isTotalActive}
            onClick={() => setStatusFilter([])}
          />
          <StatCard
            label="Awaiting a decision"
            value={String(stats.awaitingDecision)}
            hint="pending approval or sourcing"
            valueClass="text-warning"
            active={isAwaitingActive}
            onClick={() =>
              setStatusFilter(isAwaitingActive ? [] : AWAITING_STATUSES)
            }
          />
          <StatCard
            label="Approved"
            value={String(stats.approved)}
            hint="cleared to buy"
            valueClass="text-success"
            active={isApprovedActive}
            onClick={() =>
              setStatusFilter(isApprovedActive ? [] : APPROVED_STATUSES)
            }
          />
        </div>

        {/* Search + filter — search left, filters right */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="relative w-full sm:w-auto">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requests…"
              className="w-full pl-9 sm:w-80"
            />
          </div>
          <FilterDropdown
            title="Status"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as string[])}
          />
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
                <TableHead className="w-px">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const openable = REQUEST_DETAILS[row.id] != null;
                // Only a real PO record has somewhere to go — most requests
                // haven't reached one yet, so the menu item just doesn't
                // render rather than linking to a page with nothing on it.
                const poChip = REQUEST_DETAILS[row.id]?.recordChips?.find((c) =>
                  c.startsWith("PO-"),
                );
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
                      "group h-[52px]",
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
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {row.status === "delivered" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              void navigate({
                                to: "/requests/$id",
                                params: { id: row.id },
                              })
                            }
                          >
                            Confirm receipt
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`More actions for ${row.id}`}
                              className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  `${window.location.origin}/requests/${row.id}`,
                                )
                              }
                            >
                              Copy link
                            </DropdownMenuItem>
                            {poChip != null && (
                              <DropdownMenuItem
                                onClick={() =>
                                  void navigate({
                                    to: "/po/$id",
                                    params: { id: poChip },
                                  })
                                }
                              >
                                View PO
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
