"use client";

import {
  type RowData,
  type SortDirection,
  Subscribe,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import type { AppColumn } from "@/lib/tableFeatures";
import { cn } from "@/lib/utils";

function SortIcon({ sortDirection }: { sortDirection: SortDirection | false }) {
  if (sortDirection === "asc") return <ArrowUpIcon className="size-3.5" />;
  if (sortDirection === "desc") return <ArrowDownIcon className="size-3.5" />;
  return (
    <ArrowUpIcon className="size-3.5 opacity-0 group-hover/sort:opacity-40 transition-opacity" />
  );
}

interface DataTableColumnHeaderProps<TData extends RowData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: AppColumn<TData, TValue>;
  title: string;
}

function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <Subscribe source={column.table.atoms.sorting}>
      {() => (
        <div
          data-slot="data-table-column-header"
          className={cn("flex items-center gap-2", className)}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="group/sort gap-1.5 -mx-2.5 -my-1 px-2.5 text-xs font-semibold text-muted-foreground"
          >
            <span className="truncate">{title}</span>
            <SortIcon sortDirection={column.getIsSorted()} />
          </Button>
        </div>
      )}
    </Subscribe>
  );
}

export { DataTableColumnHeader };
