import { CheckIcon } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const FOCUS_MOVES: Record<string, (index: number, count: number) => number> = {
  ArrowDown: (index, count) => Math.min(index + 1, count - 1),
  ArrowUp: (index) => Math.max(index - 1, 0),
  Home: () => 0,
  End: (_, count) => count - 1,
};

function moveOptionFocus(event: KeyboardEvent, listbox: HTMLElement | null) {
  const move = FOCUS_MOVES[event.key];
  if (!move || !listbox) return;
  const rows = Array.from(
    listbox.querySelectorAll<HTMLElement>('[role="option"]'),
  );
  if (rows.length === 0) return;
  event.preventDefault();
  const current = rows.findIndex((row) => row === document.activeElement);
  rows[move(current, rows.length)]?.focus();
}

interface FilterDropdownOptionRowProps {
  selected: boolean;
  multiSelect: boolean;
  onSelect: () => void;
  value?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}

function FilterDropdownOptionRow({
  selected,
  multiSelect,
  onSelect,
  value,
  icon: Icon,
  children,
}: FilterDropdownOptionRowProps) {
  return (
    <div
      role="option"
      aria-selected={selected}
      tabIndex={0}
      data-slot="filter-dropdown-option"
      data-value={value}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex w-full cursor-default items-center rounded-sm py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
        multiSelect ? "gap-2 px-2" : "relative gap-2 pl-2 pr-8",
      )}
    >
      {multiSelect && (
        <Checkbox
          checked={selected}
          className="pointer-events-none"
          tabIndex={-1}
        />
      )}
      {Icon && <Icon className="size-4 text-muted-foreground" />}
      <span className="truncate">{children}</span>
      {!multiSelect && selected && (
        <CheckIcon className="absolute right-2 size-4" />
      )}
    </div>
  );
}

export { FilterDropdownOptionRow, moveOptionFocus };
