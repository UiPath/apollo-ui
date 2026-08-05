"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const FieldGroupHeading = ({ children }: { children: ReactNode }) => (
  <h5 className="mb-1 text-xs font-semibold text-muted-foreground">
    {children}
  </h5>
);

export interface FieldTableColumn {
  label: string;
  align?: "left" | "right";
}

// Columns + children (rather than row data) so the comparison and output views
// share identical chrome while each keeps its own row shape (4-col vs 2-col).
export const FieldTable = ({
  columns,
  children,
}: {
  columns: FieldTableColumn[];
  children: ReactNode;
}) => (
  <div className="rounded-md border">
    <Table className="text-xs">
      <TableHeader>
        <TableRow className="bg-muted/50">
          {columns.map((col) => (
            <TableHead
              key={col.label}
              className={cn(
                "h-8 px-2 text-xs",
                col.align === "right" && "text-right",
              )}
            >
              {col.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </Table>
  </div>
);

export const FieldRow = ({ children }: { children: ReactNode }) => (
  <TableRow>{children}</TableRow>
);

export const FieldCell = ({
  children,
  muted = false,
  align = "left",
  className,
}: {
  children: ReactNode;
  muted?: boolean;
  align?: "left" | "right";
  className?: string;
}) => (
  <TableCell
    className={cn(
      // align-top (overriding TableCell's align-middle) keeps a multi-line
      // value aligned with its field name in the adjacent cell.
      "px-2 py-1 align-top whitespace-normal break-words",
      muted && "text-muted-foreground",
      align === "right" && "text-right",
      className,
    )}
  >
    {children}
  </TableCell>
);
