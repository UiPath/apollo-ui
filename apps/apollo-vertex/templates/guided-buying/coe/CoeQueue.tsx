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
import { ph } from "../data/placeholders";
import { FINDINGS } from "./findings-data";

const COLUMNS = ["Finding", "Raised", "Raised by", "Source"];

/**
 * Ravi's own queue (prompt 93): findings Elena sends land here. Reuses
 * Approvals.tsx's own Card + Table + Empty pattern verbatim, minus its
 * StatCard filter row and search, which a one or two row queue has no
 * use for yet. A row renders only for a finding that has both a written
 * `text` (section 7's unset second finding never gets one) and a
 * `sentAt` (section 6's unsent state), reading straight off the one
 * seeded record Elena's own card also reads and writes. Prompt 94: each
 * row now opens that finding's own detail (the no op from 93 is gone),
 * the same onClick + cursor-pointer/hover treatment Approvals.tsx uses
 * for a row that does have somewhere to go.
 */
export function CoeQueue() {
  const navigate = useNavigate();
  const rows = Object.values(FINDINGS).filter(
    (finding) => finding.text != null && finding.sentAt != null,
  );

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader>
        <PageHeaderNav>
          <PageHeaderTitle>
            {ph("PH-113", "coe queue page title")}
          </PageHeaderTitle>
        </PageHeaderNav>
      </PageHeader>

      <div className="px-4 pb-8 sm:px-6 lg:px-8">
        <Card variant="glass" className="overflow-hidden">
          {rows.length === 0 ? (
            <Empty>
              <EmptyDescription>
                {ph("PH-114", "coe queue empty state")}
              </EmptyDescription>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {COLUMNS.map((column) => (
                    <TableHead
                      key={column}
                      className="text-xs font-semibold text-muted-foreground"
                    >
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((finding) => (
                  <TableRow
                    key={finding.id}
                    onClick={() =>
                      void navigate({
                        to: "/coe/$id",
                        params: { id: finding.id },
                      })
                    }
                    className={cn(
                      "min-h-[52px]",
                      "cursor-pointer hover:bg-muted/50",
                    )}
                  >
                    <TableCell className="max-w-md min-w-64 font-medium text-foreground whitespace-normal">
                      {finding.text}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {finding.raisedAt}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {finding.raisedBy}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-normal">
                      {finding.sourceSurface} · {finding.sourceCard}
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
