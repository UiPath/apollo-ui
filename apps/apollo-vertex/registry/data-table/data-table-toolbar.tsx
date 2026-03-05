import type { Table } from "@tanstack/react-table";
import type * as React from "react";

import { cn } from "@/lib/utils";

import { DataTableSearch } from "./data-table-search";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  className?: string;
  enableSearch?: boolean;
  enableViewOptions?: boolean;
  customContent?: React.ReactNode;
}

function DataTableToolbar<TData>({
  table,
  className,
  enableSearch,
  enableViewOptions,
  customContent,
}: DataTableToolbarProps<TData>) {
  if (!enableSearch && !enableViewOptions && !customContent) return null;

  return (
    <div
      data-slot="data-table-toolbar"
      className={cn("flex items-center justify-between gap-2", className)}
    >
      <div className="flex items-center gap-2">
        {enableSearch && <DataTableSearch table={table} />}
        {customContent}
      </div>
      {enableViewOptions && <DataTableViewOptions table={table} />}
    </div>
  );
}

export { DataTableToolbar };
