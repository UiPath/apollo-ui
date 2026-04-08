"use client";

import type { Column, SortDirection } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SortIcon({ sortDirection }: { sortDirection: SortDirection | false }) {
  if (sortDirection === "asc") return <ArrowUpIcon className="size-3.5" />;
  if (sortDirection === "desc") return <ArrowDownIcon className="size-3.5" />;
  return (
    <ArrowUpIcon className="size-3.5 opacity-0 group-hover/sort:opacity-40 transition-opacity" />
  );
}

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  // React Compiler compat: TanStack Table Column objects have stable references with mutable state.
  // codeql[js/unknown-directive] - valid React Compiler directive
  "use no memo";
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
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
  );
}

export { DataTableColumnHeader };
