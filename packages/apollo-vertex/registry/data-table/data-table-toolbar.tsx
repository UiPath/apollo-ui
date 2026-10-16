"use client";

import type { RowData } from "@tanstack/react-table";
import type * as React from "react";
import type { DataTableInstance } from "@/lib/table-features";

import { cn } from "@/lib/utils";

import { DataTableSearch } from "./data-table-search";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData extends RowData> {
  table: DataTableInstance<TData>;
  className?: string;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  enableViewOptions?: boolean;
  customContent?: React.ReactNode;
  onColumnVisibilityToggle?: (
    columnId: string,
    visible: boolean,
    visibleCount: number,
  ) => void;
}

function DataTableToolbar<TData extends RowData>({
  table,
  className,
  enableSearch,
  searchPlaceholder,
  enableViewOptions,
  customContent,
  onColumnVisibilityToggle,
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
        <DataTableSearch
          table={table}
          placeholder={searchPlaceholder}
          className="w-full sm:w-auto"
        />
      )}
      <div className="flex items-center gap-2">
        {customContent}
        {enableViewOptions && (
          <DataTableViewOptions
            table={table}
            onColumnVisibilityToggle={onColumnVisibilityToggle}
          />
        )}
      </div>
    </div>
  );
}

export { DataTableToolbar };
