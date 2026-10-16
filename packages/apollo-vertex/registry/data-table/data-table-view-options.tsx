"use client";

import type { RowData } from "@tanstack/react-table";
import { Columns3Icon, SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DataTableInstance } from "@/lib/table-features";
import { useVertexTranslation } from "@/lib/vertex-translation";

import type { ColumnItem } from "./sortable-column-list";
import { SortableColumnList } from "./sortable-column-list";

interface DataTableViewOptionsProps<TData extends RowData> {
  table: DataTableInstance<TData>;
  className?: string;
  onColumnVisibilityToggle?: (
    columnId: string,
    visible: boolean,
    visibleCount: number,
  ) => void;
}

/** Hideable columns visible after toggling `toggledColumnId` to `visible`. */
export function visibleColumnCountAfterToggle(
  columns: { id: string; canHide: boolean; isVisible: boolean }[],
  toggledColumnId: string,
  visible: boolean,
): number {
  const otherVisible = columns.filter(
    (column) =>
      column.id !== toggledColumnId && column.canHide && column.isVisible,
  ).length;
  return visible ? otherVisible + 1 : otherVisible;
}

function DataTableViewOptions<TData extends RowData>({
  table,
  className,
  onColumnVisibilityToggle,
}: DataTableViewOptionsProps<TData>) {
  const { t } = useVertexTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleOpenChange = (open: boolean) => {
    if (!open) setSearchQuery("");
  };

  const allReorderableColumns = table
    .getAllColumns()
    .filter((column) => column.accessorFn != null && column.getCanHide());

  const currentOrder = table.state.columnOrder;

  const orderedColumns = () => {
    if (!currentOrder || currentOrder.length === 0)
      return allReorderableColumns;
    const orderMap = new Map(currentOrder.map((id, index) => [id, index]));
    return [...allReorderableColumns].toSorted((a, b) => {
      const aIdx = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bIdx = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return aIdx - bIdx;
    });
  };

  const columnItems: ColumnItem[] = orderedColumns().map((column) => ({
    id: column.id,
    displayName: column.columnDef.meta?.displayName ?? column.id,
    isVisible: column.getIsVisible(),
  }));

  const filteredColumnItems = searchQuery
    ? columnItems.filter((item) =>
        item.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : columnItems;

  const allColumns = table.getAllColumns();
  const allColumnIds =
    currentOrder && currentOrder.length > 0
      ? [...allColumns]
          .toSorted((a, b) => {
            const aIdx = currentOrder.indexOf(a.id);
            const bIdx = currentOrder.indexOf(b.id);
            return (
              (aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx) -
              (bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx)
            );
          })
          .map((c) => c.id)
      : allColumns.map((c) => c.id);

  return (
    <div data-slot="data-table-view-options" className={className}>
      <DropdownMenu onOpenChange={handleOpenChange}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto"
                aria-label={t("toggle_columns", {
                  defaultValue: "Toggle columns",
                })}
              >
                <Columns3Icon />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            {t("toggle_columns", { defaultValue: "Toggle columns" })}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent
          align="end"
          className="min-w-[220px] overflow-hidden"
        >
          <DropdownMenuLabel>
            {t("toggle_columns", { defaultValue: "Toggle columns" })}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-1 pb-1">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("search", { defaultValue: "Search..." })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Escape") e.stopPropagation();
                }}
                className="h-8 pl-7 pr-7 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label={t("clear_search", {
                    defaultValue: "Clear search",
                  })}
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>
          </div>
          {filteredColumnItems.length === 0 ? (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              {t("no_results_found", { defaultValue: "No results found" })}
            </div>
          ) : (
            <SortableColumnList
              columns={filteredColumnItems}
              allColumnIds={allColumnIds}
              onReorder={(ids) => table.setColumnOrder(ids)}
              onToggleVisibility={(columnId, visible) => {
                table.getColumn(columnId)?.toggleVisibility(visible);
                if (!onColumnVisibilityToggle) return;
                const columns = table.getAllColumns().map((column) => ({
                  id: column.id,
                  canHide: column.getCanHide(),
                  isVisible: column.getIsVisible(),
                }));
                onColumnVisibilityToggle(
                  columnId,
                  visible,
                  visibleColumnCountAfterToggle(columns, columnId, visible),
                );
              }}
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { DataTableViewOptions };
