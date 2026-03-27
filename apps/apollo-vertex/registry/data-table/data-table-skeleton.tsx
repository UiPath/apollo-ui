"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DATA_TABLE_ROW_HEIGHT } from "./data-table-row";

const generateSkeletonKey = (
  type: string,
  rowIndex: number,
  colIndex?: number,
) => `skeleton-${type}-${rowIndex}${colIndex == null ? "" : `-${colIndex}`}`;

const DEFAULT_WIDTHS = ["w-32", "w-24", "w-28", "w-20", "w-36", "w-16", "w-24"];

function DataTableSkeleton({
  columnCount = 3,
  rowCount = 5,
  columnWidths,
}: {
  columnCount?: number;
  rowCount?: number;
  columnWidths?: string[];
}) {
  const getWidth = (colIndex: number) => {
    if (columnWidths && columnWidths[colIndex]) return columnWidths[colIndex];
    return DEFAULT_WIDTHS[colIndex % DEFAULT_WIDTHS.length];
  };

  const columns = (rowIndex: number) =>
    Array.from({ length: columnCount }, (_col, colIndex) => (
      <TableCell key={generateSkeletonKey("cell", rowIndex, colIndex)}>
        <Skeleton className={cn("h-4", getWidth(colIndex))} />
      </TableCell>
    ));

  return (
    <>
      {Array.from({ length: rowCount }, (_row, rowIndex) => (
        <TableRow
          key={generateSkeletonKey("row", rowIndex)}
          className={DATA_TABLE_ROW_HEIGHT}
        >
          {columns(rowIndex)}
        </TableRow>
      ))}
    </>
  );
}

export { DataTableSkeleton };
