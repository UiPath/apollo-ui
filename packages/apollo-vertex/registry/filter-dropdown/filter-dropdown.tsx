"use client";

import { ChevronDownIcon, SearchIcon, XIcon } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { DataTableColumn, RowData } from "@/lib/table-features";
import { cn } from "@/lib/utils";
import { useVertexTranslation } from "@/lib/vertex-translation";
import {
  FilterDropdownOptionRow,
  moveOptionFocus,
} from "./filter-dropdown-option";
import {
  filterTriggerLabel,
  readSelectedValues,
  writeSelectedValues,
} from "./filter-dropdown-selection";
import {
  FILTER_DROPDOWN_LIST_SLOT,
  FilterDropdownError,
  FilterDropdownLoadingMore,
  FilterDropdownSentinel,
  FilterDropdownSkeleton,
} from "./filter-dropdown-states";
import { useFilterDropdownSearch } from "./use-filter-dropdown-search";

interface FilterDropdownOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FilterDropdownProps<
  TData extends RowData = RowData,
  TValue = unknown,
> {
  title: string;
  options: FilterDropdownOption[];
  className?: string;

  /** Multi-select (default) or single-select mode */
  multiSelect?: boolean;

  /** TanStack Table column integration (optional) */
  column?: DataTableColumn<TData, TValue>;

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
  /** Additional class for the trigger button, e.g. `w-full` to fill a narrow column */
  triggerClassName?: string;
  /** Called when the popover opens or closes */
  onOpenChange?: (open: boolean) => void;

  /** Options are being fetched: skeleton rows when empty, spinner row below loaded options otherwise */
  isLoading?: boolean;
  /** More options can be fetched; enables infinite scroll via onLoadMore */
  hasMore?: boolean;
  /** Called when the end of the list scrolls into view and hasMore is true */
  onLoadMore?: () => void;
  /** Optional text next to the load-more spinner */
  loadingMessage?: ReactNode;

  /** Server-side search: when set, options are not filtered locally and this receives the debounced query */
  onSearchChange?: (query: string) => void;
  /** Debounce for onSearchChange in ms (default: 300) */
  searchDebounceMs?: number;

  /** Fetch failed: true shows errorMessage, any other truthy node is rendered as-is */
  error?: ReactNode;
  /** Default error copy used when error is true */
  errorMessage?: ReactNode;
  /** Renders a retry button in the error state */
  onRetry?: () => void;
  /** Label for the retry button */
  retryLabel?: ReactNode;

  /** Known options for selected values that may not be loaded yet (used for the trigger label) */
  selectedOptions?: FilterDropdownOption[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function FilterDropdown<TData extends RowData = RowData, TValue = unknown>({
  title,
  options,
  className,
  multiSelect = true,
  column,
  value: valueProp,
  onChange: onChangeProp,
  enableSearch = "auto",
  searchThreshold = 8,
  searchPlaceholder,
  noOptionsMessage,
  noResultsMessage,
  align = "start",
  popoverWidth = "w-[220px]",
  triggerClassName,
  onOpenChange,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  loadingMessage,
  onSearchChange,
  searchDebounceMs = 300,
  error,
  errorMessage,
  onRetry,
  retryLabel,
  selectedOptions,
}: FilterDropdownProps<TData, TValue>) {
  // React Compiler compat: TanStack Table Column objects have stable references with mutable state.
  // codeql[js/unknown-directive] - valid React Compiler directive
  "use no memo";
  const { t } = useVertexTranslation();
  const [open, setOpen] = useState(false);
  const listboxRef = useRef<HTMLDivElement>(null);
  const { searchQuery, updateSearch, resetSearch } = useFilterDropdownSearch({
    onSearchChange,
    debounceMs: searchDebounceMs,
  });

  const isServerSearch = onSearchChange != null;
  const hasError = Boolean(error);

  const showSearch =
    enableSearch === true ||
    (enableSearch === "auto" &&
      // Server search or paging means the loaded count understates the total; keep the input while a query is active
      (isServerSearch ||
        hasMore ||
        options.length >= searchThreshold ||
        searchQuery !== ""));

  // Clear search when popover closes
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetSearch();
    onOpenChange?.(nextOpen);
  };

  // --- Labels of options picked here, kept for when paging/search drops them from `options` ---
  const [pickedLabels, setPickedLabels] = useState<Record<string, string>>({});
  // Runs alongside a selection change, so the extra state update adds no extra render
  const rememberLabel = (option: FilterDropdownOption) =>
    setPickedLabels((prev) => ({ ...prev, [option.value]: option.label }));

  const getOptionLabel = (optionValue: string) =>
    selectedOptions?.find((o) => o.value === optionValue)?.label ??
    options.find((o) => o.value === optionValue)?.label ??
    pickedLabels[optionValue] ??
    optionValue;

  const selectionSource = {
    column,
    value: valueProp,
    onChange: onChangeProp,
    multiSelect,
  };
  const selectedValues = readSelectedValues(selectionSource);
  const setSelectedValues = (next: string[]) =>
    writeSelectedValues(selectionSource, next);

  // --- Handlers ---
  const handleMultiToggle = (option: FilterDropdownOption) => {
    rememberLabel(option);
    const next = selectedValues.includes(option.value)
      ? selectedValues.filter((v) => v !== option.value)
      : [...selectedValues, option.value];
    setSelectedValues(next);
  };

  const handleSingleSelect = (option: FilterDropdownOption) => {
    rememberLabel(option);
    setSelectedValues([option.value]);
    // Close through the shared path so the search query is reset too
    handleOpenChange(false);
  };

  const handleClearAll = () => {
    setSelectedValues([]);
  };

  // --- Filtered options (search) ---
  const filteredOptions =
    showSearch && searchQuery && !isServerSearch
      ? options.filter((o) =>
          o.label.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : options;

  const triggerLabel = filterTriggerLabel({
    title,
    selectedValues,
    multiSelect,
    getOptionLabel,
    t,
  });

  // --- Async states ---
  const errorContent =
    error === true
      ? (errorMessage ??
        t("failed_to_load_options", { defaultValue: "Failed to load options" }))
      : error;
  const retryContent = retryLabel ?? t("retry", { defaultValue: "Retry" });

  const noResults = (
    <div className="px-2 py-3 text-center text-sm text-muted-foreground">
      {noResultsMessage ??
        t("no_results_found", { defaultValue: "No results found" })}
    </div>
  );

  const renderFooter = () => {
    if (isLoading)
      return <FilterDropdownLoadingMore message={loadingMessage} />;
    if (hasError) {
      return (
        <FilterDropdownError
          inline
          message={errorContent}
          onRetry={onRetry}
          retryLabel={retryContent}
        />
      );
    }
    if (hasMore && onLoadMore) {
      return <FilterDropdownSentinel onLoadMore={onLoadMore} />;
    }
    return null;
  };

  const renderBody = () => {
    if (options.length === 0) {
      if (isLoading)
        return <FilterDropdownSkeleton multiSelect={multiSelect} />;
      if (hasError) {
        return (
          <FilterDropdownError
            message={errorContent}
            onRetry={onRetry}
            retryLabel={retryContent}
          />
        );
      }
      return searchQuery ? noResults : noOptionsMessage;
    }

    return (
      <>
        <div
          ref={listboxRef}
          role="listbox"
          aria-label={title}
          aria-multiselectable={multiSelect}
          onKeyDown={(e) => moveOptionFocus(e, e.currentTarget)}
        >
          {/* "All" option — multi-select only, hidden during search */}
          {multiSelect && !searchQuery && (
            <>
              <FilterDropdownOptionRow
                selected={selectedValues.length === 0}
                multiSelect
                onSelect={handleClearAll}
              >
                {t("all", { defaultValue: "All" })}
              </FilterDropdownOptionRow>
              <Separator className="my-1" />
            </>
          )}

          {/* Option rows */}
          {filteredOptions.map((option) => (
            <FilterDropdownOptionRow
              key={option.value}
              value={option.value}
              selected={selectedValues.includes(option.value)}
              multiSelect={multiSelect}
              icon={option.icon}
              onSelect={() =>
                multiSelect
                  ? handleMultiToggle(option)
                  : handleSingleSelect(option)
              }
            >
              {option.label}
            </FilterDropdownOptionRow>
          ))}
        </div>

        {/* No local search results */}
        {searchQuery && filteredOptions.length === 0 && noResults}

        {renderFooter()}
      </>
    );
  };

  return (
    <div data-slot="filter-dropdown" className={className}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 justify-between gap-2 font-normal",
              triggerClassName,
            )}
          >
            <span className="min-w-0 truncate text-sm font-medium">
              {triggerLabel}
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
                  placeholder={
                    searchPlaceholder ??
                    t("search", { defaultValue: "Search..." })
                  }
                  value={searchQuery}
                  onChange={(e) => updateSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      moveOptionFocus(e, listboxRef.current);
                    }
                  }}
                  className="h-8 pl-7 pr-7 text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label={t("clear_search", {
                      defaultValue: "Clear search",
                    })}
                    onClick={resetSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options list */}
          <div
            data-slot={FILTER_DROPDOWN_LIST_SLOT}
            aria-busy={isLoading}
            className="max-h-64 overflow-y-auto p-1"
          >
            {renderBody()}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { FilterDropdown };
export type { FilterDropdownOption, FilterDropdownProps };
