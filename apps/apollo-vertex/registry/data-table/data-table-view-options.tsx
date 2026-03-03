import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Table as TanstackTable } from "@tanstack/react-table";
import { GripVerticalIcon, Settings2Icon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// SortableColumnItem
// ---------------------------------------------------------------------------

interface SortableColumnItemProps {
  id: string;
  displayName: string;
  isVisible: boolean;
  onToggleVisibility: (value: boolean) => void;
}

function SortableColumnItem({
  id,
  displayName,
  isVisible,
  onToggleVisibility,
}: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
        "hover:bg-accent transition-colors",
        isDragging && "bg-accent opacity-50",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <label className="flex flex-1 cursor-pointer items-center gap-2">
        <Checkbox
          checked={isVisible}
          onCheckedChange={(value) => onToggleVisibility(!!value)}
        />
        <span className="select-none">{displayName}</span>
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DataTableViewOptions
// ---------------------------------------------------------------------------

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

  const orderedColumns = React.useMemo(() => {
    if (!currentOrder || currentOrder.length === 0)
      return allReorderableColumns;
    const orderMap = new Map(currentOrder.map((id, index) => [id, index]));
    return [...allReorderableColumns].sort((a, b) => {
      const aIdx = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bIdx = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return aIdx - bIdx;
    });
  }, [allReorderableColumns, currentOrder]);

  const columnIds = orderedColumns.map((col) => col.id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = columnIds.indexOf(String(active.id));
      const newIndex = columnIds.indexOf(String(over.id));
      const newReorderableOrder = arrayMove(columnIds, oldIndex, newIndex);

      const allColumnIds = table.getAllColumns().map((c) => c.id);
      const reorderableSet = new Set(columnIds);
      const fullOrder: string[] = [];
      let reorderIdx = 0;
      for (const id of allColumnIds) {
        if (reorderableSet.has(id)) {
          fullOrder.push(newReorderableOrder[reorderIdx]);
          reorderIdx++;
          continue;
        }

        fullOrder.push(id);
      }
      table.setColumnOrder(fullOrder);
    },
    [columnIds, table],
  );

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
        <DropdownMenuContent align="end" className="min-w-[220px] overflow-hidden">
          <DropdownMenuLabel>{t("toggle_columns")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columnIds}
              strategy={verticalListSortingStrategy}
            >
              {orderedColumns.map((column) => {
                const meta = column.columnDef.meta;
                return (
                  <SortableColumnItem
                    key={column.id}
                    id={column.id}
                    displayName={meta?.displayName ?? column.id}
                    isVisible={column.getIsVisible()}
                    onToggleVisibility={(value) =>
                      column.toggleVisibility(value)
                    }
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { DataTableViewOptions };
