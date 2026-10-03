import { CheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface FilterDropdownOptionRowProps {
  selected: boolean;
  multiSelect: boolean;
  onSelect: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}

function FilterDropdownOptionRow({
  selected,
  multiSelect,
  onSelect,
  icon: Icon,
  children,
}: FilterDropdownOptionRowProps) {
  return (
    <div
      role="option"
      aria-selected={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex w-full cursor-default items-center rounded-sm py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
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

export { FilterDropdownOptionRow };
