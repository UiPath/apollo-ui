"use client";

import { useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
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
import { DECISION_DETAILS } from "./data";

const COLUMNS = ["Request", "Title", "Requester", "Need by", "Amount"];

/**
 * Approver's queue — pending decisions read straight from DECISION_DETAILS,
 * same Card + Table treatment as My Requests. No status column: every row
 * here is inherently pending by construction, and DecisionDetail carries no
 * status/submitted/updated fields to show one from.
 */
export function Approvals() {
  const navigate = useNavigate();
  const rows = Object.values(DECISION_DETAILS);

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader>
        <PageHeaderNav className="items-baseline">
          <PageHeaderTitle className="w-auto">Approvals</PageHeaderTitle>
        </PageHeaderNav>
      </PageHeader>

      <div className="px-4 pb-8 sm:px-6 lg:px-8">
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
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() =>
                      void navigate({
                        to: "/decision/$id",
                        params: { id: row.id },
                      })
                    }
                    className="h-[52px] cursor-pointer hover:bg-muted/50"
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
