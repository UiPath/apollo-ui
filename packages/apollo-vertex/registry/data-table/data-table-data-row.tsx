"use client";

import { flexRender, type RowData } from "@tanstack/react-table";
import type * as React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import type { DataTableRow } from "@/lib/table-features";
import { cn } from "@/lib/utils";

import { DATA_TABLE_ROW_HEIGHT } from "./data-table-row";

interface DataTableDataRowProps<TData extends RowData> {
  row: DataTableRow<TData>;
  onRowClick?: (row: TData) => void;
  isRowClickable?: (row: TData) => boolean;
  getRowHref?: (row: TData) => string | undefined;
  getRowClassName?: (row: TData) => string;
  enableColumnResizing: boolean;
  renderExpandedRow?: (row: DataTableRow<TData>) => React.ReactNode;
}

function DataTableDataRow<TData extends RowData>({
  row,
  onRowClick,
  isRowClickable,
  getRowHref,
  getRowClassName,
  enableColumnResizing,
  renderExpandedRow,
}: DataTableDataRowProps<TData>) {
  const isClickable = isRowClickable?.(row.original) ?? true;
  const rowClickHandler =
    onRowClick && isClickable ? () => onRowClick(row.original) : null;
  const rowHref = isClickable ? (getRowHref?.(row.original) ?? null) : null;
  const hasRowAction = rowClickHandler != null || rowHref != null;

  return (
    <>
      <TableRow
        data-state={row.getIsSelected() && "selected"}
        className={cn(
          `border-b last:border-b-0 ${DATA_TABLE_ROW_HEIGHT}`,
          hasRowAction && "cursor-pointer hover:bg-muted/50",
          getRowClassName?.(row.original),
        )}
        {...(rowClickHandler && { onClick: rowClickHandler })}
        {...(rowHref && {
          // Middle-click opens the row in a new tab. Suppress the browser
          // autoscroll that mousedown would otherwise start.
          onMouseDown: (event: React.MouseEvent) => {
            if (event.button === 1) event.preventDefault();
          },
          onAuxClick: (event: React.MouseEvent) => {
            if (event.button !== 1) return;
            event.preventDefault();
            window.open(rowHref, "_blank", "noopener,noreferrer");
          },
        })}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell
            key={cell.id}
            className={cn(
              cell.column.columnDef.meta?.numeric && "text-right tabular-nums",
            )}
            style={{
              ...(cell.column.columnDef.maxSize
                ? { maxWidth: cell.column.columnDef.maxSize }
                : {}),
              ...(enableColumnResizing
                ? { width: `calc(var(--col-${cell.column.id}-size) * 1px)` }
                : {}),
            }}
          >
            <div
              className={cn(
                "text-ellipsis whitespace-nowrap text-sm font-normal leading-5 text-foreground",
                !cell.column.columnDef.meta?.overflowVisible &&
                  "overflow-hidden",
              )}
              onMouseEnter={(event) => {
                const el = event.currentTarget;
                if (el.scrollWidth > el.clientWidth + 1) {
                  el.title = el.textContent ?? "";
                }
              }}
              onMouseLeave={(event) => {
                event.currentTarget.title = "";
              }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          </TableCell>
        ))}
      </TableRow>
      {renderExpandedRow && row.getIsExpanded() && (
        <TableRow data-state="expanded" className="hover:bg-transparent">
          <TableCell colSpan={row.getVisibleCells().length}>
            {renderExpandedRow(row)}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export { DataTableDataRow };
