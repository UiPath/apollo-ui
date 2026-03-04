import type { Table as TanstackTable } from "@tanstack/react-table";
import { Settings2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { ColumnItem } from "./sortable-column-list";
import { SortableColumnList } from "./sortable-column-list";

interface DataTableViewOptionsProps<TData> {
  table: TanstackTable<TData>;
  className?: string;
}

function DataTableViewOptions<TData>({
  table,
  className,
}: DataTableViewOptionsProps<TData>) {
  const { t } = useTranslation();

  const allReorderableColumns = table
    .getAllColumns()
    .filter((column) => column.accessorFn != null && column.getCanHide());

  const currentOrder = table.getState().columnOrder;

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto hidden h-9 lg:flex"
          >
            <Settings2Icon />
            {t("view")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[220px] overflow-hidden"
        >
          <DropdownMenuLabel>{t("toggle_columns")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <SortableColumnList
            columns={columnItems}
            allColumnIds={allColumnIds}
            onReorder={(ids) => table.setColumnOrder(ids)}
            onToggleVisibility={(columnId, visible) =>
              table.getColumn(columnId)?.toggleVisibility(visible)
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { DataTableViewOptions };
