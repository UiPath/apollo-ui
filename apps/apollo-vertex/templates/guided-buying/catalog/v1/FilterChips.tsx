import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FilterChip {
  key: string;
  label: string;
  /** Agent-applied chips carry the Autopilot sparkle (same chrome otherwise). */
  isAgent: boolean;
  onRemove: () => void;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onClearAll: () => void;
}

/** Active-filter chip row. Collapses to nothing when no constraints are active. */
export function FilterChips({ chips, onClearAll }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 rounded-full border bg-card py-1 pl-2.5 pr-1 text-sm text-foreground"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove ${chip.label}`}
            className="rounded-full p-0.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onClearAll}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
