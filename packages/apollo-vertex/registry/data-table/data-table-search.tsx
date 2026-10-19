"use client";

import type { RowData } from "@tanstack/react-table";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { DataTableInstance } from "@/lib/table-features";
import { cn } from "@/lib/utils";
import { useVertexTranslation } from "@/lib/vertex-translation";

interface DataTableSearchProps<TData extends RowData> {
  table: DataTableInstance<TData>;
  placeholder?: string;
  className?: string;
}

function DataTableSearch<TData extends RowData>({
  table,
  placeholder,
  className,
}: DataTableSearchProps<TData>) {
  const { t } = useVertexTranslation();
  return (
    <div data-slot="data-table-search" className={cn("relative", className)}>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder ?? t("search", { defaultValue: "Search..." })}
        value={String(table.state.globalFilter ?? "")}
        onChange={(e) => table.setGlobalFilter(e.target.value)}
        className="w-full sm:w-80 md:w-96 pl-9 border-0"
      />
    </div>
  );
}

export { DataTableSearch };
