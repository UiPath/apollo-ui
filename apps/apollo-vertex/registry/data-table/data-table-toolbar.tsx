"use client";

import type { RowData } from "@tanstack/react-table";
import type * as React from "react";

import type { AppTable } from "@/lib/tableFeatures";
import { cn } from "@/lib/utils";

import { DataTableSearch } from "./data-table-search";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData extends RowData> {
  table: AppTable<TData>;
  className?: string;
  enableSearch?: boolean;
  enableViewOptions?: boolean;
  customContent?: React.ReactNode;
}

function DataTableToolbar<TData extends RowData>({
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
      className={cn(
        "flex flex-wrap items-center justify-between gap-2",
        className,
      )}
    >
      {enableSearch && (
        <DataTableSearch table={table} className="w-full sm:w-auto" />
      )}
      <div className="flex items-center gap-2">
        {customContent}
        {enableViewOptions && <DataTableViewOptions table={table} />}
      </div>
    </div>
  );
}

export { DataTableToolbar };
