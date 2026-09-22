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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { SortableColumnItem } from "./sortable-column-item";

interface ColumnItem {
  id: string;
  displayName: string;
  isVisible: boolean;
}

interface SortableColumnListProps {
  columns: ColumnItem[];
  allColumnIds: string[];
  onReorder: (columnIds: string[]) => void;
  onToggleVisibility: (columnId: string, visible: boolean) => void;
}

function SortableColumnList({
  columns,
  allColumnIds,
  onReorder,
  onToggleVisibility,
}: SortableColumnListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columnIds = columns.map((col) => col.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = allColumnIds.indexOf(String(active.id));
    const newIndex = allColumnIds.indexOf(String(over.id));
    onReorder(arrayMove(allColumnIds, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={columnIds} strategy={verticalListSortingStrategy}>
        {columns.map((column) => (
          <SortableColumnItem
            key={column.id}
            id={column.id}
            displayName={column.displayName}
            isVisible={column.isVisible}
            onToggleVisibility={(value) => onToggleVisibility(column.id, value)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}

export { SortableColumnList };
export type { ColumnItem, SortableColumnListProps };
