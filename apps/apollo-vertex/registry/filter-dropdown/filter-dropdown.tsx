import type { Column } from "@tanstack/react-table";
import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FilterDropdownOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FilterDropdownProps<TData = unknown, TValue = unknown> {
  title: string;
  options: FilterDropdownOption[];
  className?: string;

  /** Multi-select (default) or single-select mode */
  multiSelect?: boolean;

  /** TanStack Table column integration (optional) */
  column?: Column<TData, TValue>;

  /** Standalone value — used when no column is provided */
  value?: string[] | string;
  /** Standalone onChange — used when no column is provided */
  onChange?: (value: string[] | string) => void;

  /** Show search input: true = always, false = never, "auto" = when options exceed searchThreshold (default: "auto") */
  enableSearch?: boolean | "auto";
  /** Number of options before search auto-appears (default: 8) */
  searchThreshold?: number;
  /** Placeholder for search input */
  searchPlaceholder?: string;
  /** Shown when options array is empty */
  noOptionsMessage?: ReactNode;
  /** Shown when search yields no results */
  noResultsMessage?: ReactNode;

  /** PopoverContent alignment */
  align?: "start" | "center" | "end";
  /** PopoverContent width class */
  popoverWidth?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function FilterDropdown<TData, TValue>({
  title,
  options,
  className,
  multiSelect = true,
  column,
  value: valueProp,
  onChange: onChangeProp,
  enableSearch = "auto",
  searchThreshold = 8,
  searchPlaceholder = "Search...",
  noOptionsMessage,
  noResultsMessage = "No results found",
  align = "start",
  popoverWidth = "w-[220px]",
}: FilterDropdownProps<TData, TValue>) {
  // React Compiler compat: TanStack Table Column objects have stable references with mutable state.
  // codeql[js/unknown-directive] - valid React Compiler directive
  "use no memo";
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const showSearch =
    enableSearch === true ||
    (enableSearch === "auto" && options.length >= searchThreshold);

  // Clear search when popover closes
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setSearchQuery("");
  };

  // --- Read selected values ---
  const getSelectedValues = (): string[] => {
    if (column) {
      const filterValue = column.getFilterValue();
      if (multiSelect) {
        return Array.isArray(filterValue)
          ? filterValue.filter((v): v is string => typeof v === "string")
          : [];
      }
      if (Array.isArray(filterValue) && typeof filterValue[0] === "string") {
        return [filterValue[0]];
      }
      if (typeof filterValue === "string") return [filterValue];
      if (typeof filterValue === "number") return [String(filterValue)];
      return [];
    }
    if (valueProp != null) {
      if (multiSelect) {
        return Array.isArray(valueProp) ? valueProp : [];
      }
      return [String(valueProp)];
    }
    return [];
  };

  const selectedValues = getSelectedValues();

  // --- Write selected values ---
  const setSelectedValues = (next: string[]) => {
    if (column) {
      if (multiSelect) {
        column.setFilterValue(next.length > 0 ? next : []);
      } else {
        column.setFilterValue(next.length > 0 ? [next[0]] : []);
      }
    } else if (onChangeProp) {
      if (multiSelect) {
        (onChangeProp as (v: string[]) => void)(next);
      } else {
        (onChangeProp as (v: string) => void)(next[0] ?? "");
      }
    }
  };

  // --- Handlers ---
  const handleMultiToggle = (optionValue: string) => {
    const next = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue];
    setSelectedValues(next);
  };

  const handleSingleSelect = (optionValue: string) => {
    setSelectedValues([optionValue]);
    setOpen(false);
  };

  const handleClearAll = () => {
    setSelectedValues([]);
  };

  // --- Filtered options (search) ---
  const filteredOptions =
    showSearch && searchQuery
      ? options.filter((o) =>
          o.label.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : options;

  // --- Trigger label ---
  const getTriggerLabel = () => {
    if (multiSelect) {
      if (selectedValues.length === 0) return `${title}: All`;
      if (selectedValues.length === 1) {
        const option = options.find((o) => o.value === selectedValues[0]);
        return `${title}: ${option?.label ?? selectedValues[0]}`;
      }
      return `${title}: ${selectedValues.length} selected`;
    }
    // Single-select: show the selected option's label
    if (selectedValues.length > 0) {
      const option = options.find((o) => o.value === selectedValues[0]);
      return option?.label ?? selectedValues[0];
    }
    return title;
  };

  return (
    <div data-slot="filter-dropdown" className={className}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 justify-between gap-2 font-normal"
          >
            <span className="shrink-0 text-sm font-medium">
              {getTriggerLabel()}
            </span>
            <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          className={cn(popoverWidth, "overflow-hidden p-0")}
        >
          {/* Search */}
          {showSearch && (
            <div className="p-2 pb-1">
              <div className="relative">
                <SearchIcon className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-7 pr-7 text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-64 overflow-y-auto p-1">
            {options.length === 0 ? (
              noOptionsMessage
            ) : (
              <>
                {/* "All" option — multi-select only, hidden during search */}
                {multiSelect && !searchQuery && (
                  <>
                    <div
                      role="option"
                      aria-selected={selectedValues.length === 0}
                      tabIndex={0}
                      className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                      onClick={handleClearAll}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleClearAll();
                        }
                      }}
                    >
                      <Checkbox
                        checked={selectedValues.length === 0}
                        className="pointer-events-none"
                        tabIndex={-1}
                      />
                      {"All"}
                    </div>
                    <Separator className="my-1" />
                  </>
                )}

                {/* Option rows */}
                {filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={0}
                      onClick={() =>
                        multiSelect
                          ? handleMultiToggle(option.value)
                          : handleSingleSelect(option.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (multiSelect) handleMultiToggle(option.value);
                          else handleSingleSelect(option.value);
                        }
                      }}
                      className={cn(
                        "flex w-full cursor-default items-center rounded-sm py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        multiSelect ? "gap-2 px-2" : "relative gap-2 pl-2 pr-8",
                      )}
                    >
                      {multiSelect && (
                        <Checkbox
                          checked={isSelected}
                          className="pointer-events-none"
                          tabIndex={-1}
                        />
                      )}
                      {option.icon && (
                        <option.icon className="size-4 text-muted-foreground" />
                      )}
                      <span className="truncate">{option.label}</span>
                      {!multiSelect && isSelected && (
                        <CheckIcon className="absolute right-2 size-4" />
                      )}
                    </div>
                  );
                })}

                {/* No search results */}
                {showSearch && searchQuery && filteredOptions.length === 0 && (
                  <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                    {noResultsMessage}
                  </div>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { FilterDropdown };
export type { FilterDropdownOption, FilterDropdownProps };
