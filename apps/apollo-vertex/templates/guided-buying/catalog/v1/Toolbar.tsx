import { Columns3, LayoutGrid, List, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS } from "./data";
import { FiltersControl } from "./FiltersControl";
import type { Filters, LayoutMode, SortKey } from "./types";

interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  layout: LayoutMode;
  onLayoutChange: (value: LayoutMode) => void;
  filters: Filters;
  activeFilterCount: number;
  onFiltersChange: (filters: Filters) => void;
  onClearAllFilters: () => void;
  /** Whether enough products are selected (≥2) to compare. */
  canCompare: boolean;
  onCompare: () => void;
}

/** Catalog toolbar: label, AI-assisted search, layout toggle, sort, and compare. */
export function Toolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  layout,
  onLayoutChange,
  filters,
  activeFilterCount,
  onFiltersChange,
  onClearAllFilters,
  canCompare,
  onCompare,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 lg:flex-row lg:items-center lg:gap-4">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by model, brand, or spec…"
          className="h-11 rounded-xl border-transparent bg-muted/60 pl-9"
          aria-label="Search catalog"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <FiltersControl
          filters={filters}
          activeCount={activeFilterCount}
          onChange={onFiltersChange}
          onClearAll={onClearAllFilters}
        />
        {/* TEMP layout toggle for comparing variants — removable before ship. */}
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={layout}
          onValueChange={(value) => {
            if (value) onLayoutChange(value as LayoutMode);
          }}
        >
          <ToggleGroupItem value="rows" aria-label="Row layout">
            <List className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="cards" aria-label="Card layout">
            <LayoutGrid className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        <Select
          value={sort}
          onValueChange={(value) => onSortChange(value as SortKey)}
        >
          <SelectTrigger className="border-0 bg-transparent shadow-none focus-visible:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                aria-disabled={!canCompare}
                onClick={() => {
                  if (canCompare) onCompare();
                }}
                className={cn(!canCompare && "cursor-not-allowed opacity-50")}
              >
                <Columns3 className="size-4" />
                Compare
              </Button>
            </TooltipTrigger>
            {!canCompare && (
              <TooltipContent>
                Select 2 or more products to compare
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
