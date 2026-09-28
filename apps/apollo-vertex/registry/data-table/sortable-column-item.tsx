import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

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
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-auto cursor-grab touch-none p-0 text-muted-foreground hover:bg-transparent dark:hover:bg-transparent hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" />
      </Button>
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

export { SortableColumnItem };
export type { SortableColumnItemProps };
