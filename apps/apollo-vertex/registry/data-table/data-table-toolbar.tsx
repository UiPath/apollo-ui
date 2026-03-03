import type * as React from "react";

import { cn } from "@/lib/utils";

interface DataTableToolbarProps {
  className?: string;
  children: React.ReactNode;
}

function DataTableToolbar({ className, children }: DataTableToolbarProps) {
  return (
    <div
      data-slot="data-table-toolbar"
      className={cn("flex items-center justify-between gap-2", className)}
    >
      {children}
    </div>
  );
}

export { DataTableToolbar };
