"use client";

import type * as React from "react";

import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const DATA_TABLE_ROW_HEIGHT = "h-[52px]";

function DataTableRow({
  className,
  ...props
}: React.ComponentProps<typeof TableRow>) {
  return (
    <TableRow
      data-slot="data-table-row"
      className={cn(
        `border-b last:border-b-0 ${DATA_TABLE_ROW_HEIGHT}`,
        className,
      )}
      {...props}
    />
  );
}

function DataTableCell({
  className,
  ...props
}: React.ComponentProps<typeof TableCell>) {
  return (
    <TableCell
      data-slot="data-table-cell"
      className={cn(
        "p-2 text-sm font-normal leading-5 text-foreground overflow-hidden text-ellipsis whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export { DATA_TABLE_ROW_HEIGHT, DataTableRow, DataTableCell };
