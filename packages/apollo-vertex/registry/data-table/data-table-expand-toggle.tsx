"use client";

import type { RowData } from "@tanstack/react-table";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DataTableInstance } from "@/lib/table-features";
import { useVertexTranslation } from "@/lib/vertex-translation";

interface DataTableExpandAllToggleProps<TData extends RowData> {
  table: DataTableInstance<TData>;
}

/**
 * Expand/collapse-all toggle for a data table's expand-column header. Reflects
 * and toggles the table's all-rows-expanded state, with distinct double-chevron
 * icons to set it apart from the per-row single-chevron expand controls.
 */
function DataTableExpandAllToggle<TData extends RowData>({
  table,
}: DataTableExpandAllToggleProps<TData>) {
  const { t } = useVertexTranslation();
  const allExpanded = table.getIsAllRowsExpanded();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-pressed={allExpanded}
      aria-label={
        allExpanded
          ? t("collapse_all", { defaultValue: "Collapse all" })
          : t("expand_all", { defaultValue: "Expand all" })
      }
      onClick={() => table.toggleAllRowsExpanded()}
    >
      {allExpanded ? (
        <ChevronsDownUp className="size-4" />
      ) : (
        <ChevronsUpDown className="size-4" />
      )}
    </Button>
  );
}

export { DataTableExpandAllToggle };
export type { DataTableExpandAllToggleProps };
