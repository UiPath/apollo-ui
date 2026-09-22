"use client";

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
