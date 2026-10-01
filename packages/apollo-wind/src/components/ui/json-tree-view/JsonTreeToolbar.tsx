import { Button } from '@/components/ui/button';
import { cn } from '@/lib';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ChevronsDownUp, ChevronsUpDown, Filter, Search, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { JsonTreeViewProvider, type JsonTreeViewStrings, useJsonTreeViewStrings } from './strings';
import { JsonTreeTooltip } from './JsonTreeTooltip';
import type { JsonTreeFilterOption } from './JsonTree.types';

// Radio values must be strings; this stands in for the "no filter" (null) state.
const ALL_FILTER_VALUE = '__all__';

export interface JsonTreeToolbarProps {
  /** Current search query (controlled). */
  query: string;
  onQueryChange: (query: string) => void;
  searchPlaceholder?: string;
  /** Consumer-provided filter options. Omit or pass empty to hide the filter control. */
  filters?: JsonTreeFilterOption[];
  /** Id of the active filter, or null for "All". */
  activeFilterId?: string | null;
  onFilterChange?: (id: string | null) => void;
  /** Collapse-all toggle state. Omit `onToggleAll` to hide the control. */
  allCollapsed?: boolean;
  onToggleAll?: () => void;
  /**
   * Content rendered at the start of the row, before the flexible spacer (e.g.
   * a tab switcher). The tree controls (search / filter / collapse) stay pinned
   * to the end.
   */
  leading?: ReactNode;
  /**
   * Hides the search / filter / collapse controls, keeping only `leading`.
   * Use when a non-tree tab is active and the controls would be inert.
   */
  controlsHidden?: boolean;
  /** String overrides; see `JsonTreeViewProps.strings`. */
  strings?: Partial<JsonTreeViewStrings>;
  /** Extra classes for every tooltip panel (e.g. a z-index above a host's overlays). */
  tooltipContentClassName?: string;
  className?: string;
}

/** Leading slot + search, filter, and collapse-all controls for a `JsonTreeView`. */
export function JsonTreeToolbar({
  strings,
  tooltipContentClassName,
  ...props
}: JsonTreeToolbarProps) {
  return (
    <JsonTreeViewProvider strings={strings} tooltipContentClassName={tooltipContentClassName}>
      <JsonTreeToolbarContent {...props} />
    </JsonTreeViewProvider>
  );
}

function JsonTreeToolbarContent({
  query,
  onQueryChange,
  searchPlaceholder,
  filters,
  activeFilterId = null,
  onFilterChange,
  allCollapsed = false,
  onToggleAll,
  leading,
  controlsHidden = false,
  className,
}: Omit<JsonTreeToolbarProps, 'strings' | 'tooltipContentClassName'>) {
  const strings = useJsonTreeViewStrings();
  const [searchOpen, setSearchOpen] = useState(false);
  const activeFilter = filters?.find((f) => f.id === activeFilterId);
  const resolvedSearchPlaceholder = searchPlaceholder ?? strings.searchFields;
  const filterLabel = activeFilter ? strings.filterActive(activeFilter.label) : strings.filter;
  const searchActionLabel = strings.searchFieldsAction;
  const toggleAllLabel = allCollapsed ? strings.expandAll : strings.collapseAll;

  const closeSearch = () => {
    onQueryChange('');
    setSearchOpen(false);
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {leading}
      {!controlsHidden && (
        <>
          {searchOpen ? (
            // Expanded search flexes to fill the row and shrinks with the
            // container (min-w-0) instead of taking a fixed width, so it never
            // pushes the filter / collapse controls out of a narrow panel.
            <div className="relative flex min-w-0 flex-1 items-center overflow-hidden">
              <Search
                size={13}
                className="pointer-events-none absolute left-2 text-foreground-subtle"
              />
              <Input
                autoFocus
                type="text"
                variant="ghost"
                size="xs"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') closeSearch();
                }}
                aria-label={resolvedSearchPlaceholder}
                placeholder={resolvedSearchPlaceholder}
                // Match the h-6 toolbar buttons so opening/closing search does
                // not change the toolbar height and shift the tree below it.
                // Inline padding to clear the leading icon / trailing clear
                // button: the `xs` variant's `px-2` outranks a `pl-*` class
                // under Tailwind v4's utility ordering, so a class would lose.
                style={{ paddingLeft: '1.75rem', paddingRight: '1.5rem' }}
                className="h-6 w-full text-foreground placeholder:text-foreground-subtle focus-visible:ring-0"
              />
              <button
                type="button"
                onClick={closeSearch}
                aria-label={strings.clearSearch}
                className="absolute right-1.5 grid size-4 place-items-center text-foreground-subtle transition hover:text-foreground"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            // Spacer only when the search is collapsed — it right-aligns the
            // icon controls. When expanded, the search itself fills the gap.
            <>
              <div className="flex-1" />
              <JsonTreeTooltip content={searchActionLabel} placement="top" delay>
                <Button
                  variant="ghost"
                  size="3xs"
                  icon
                  onClick={() => setSearchOpen(true)}
                  aria-label={searchActionLabel}
                  className="rounded text-foreground-subtle hover:bg-surface-overlay hover:text-foreground"
                >
                  <Search size={14} />
                </Button>
              </JsonTreeTooltip>
            </>
          )}
          {!!filters?.length && onFilterChange && (
            <DropdownMenu>
              {/* The active filter is surfaced as a dot on the icon rather than
                  an inline label; the tooltip carries "Filter: <label>". */}
              <JsonTreeTooltip content={filterLabel} placement="top" delay>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="3xs"
                    icon
                    aria-label={filterLabel}
                    className="relative rounded text-foreground-subtle hover:bg-surface-overlay hover:text-foreground"
                  >
                    <Filter size={14} />
                    {activeFilter && (
                      <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-primary ring-1 ring-surface" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
              </JsonTreeTooltip>
              <DropdownMenuContent align="end" className="w-52">
                {/* Radio semantics so the selected filter carries a menu
                    indicator (and is announced), matching the view switcher. */}
                <DropdownMenuRadioGroup
                  value={activeFilterId ?? ALL_FILTER_VALUE}
                  onValueChange={(value) =>
                    onFilterChange(value === ALL_FILTER_VALUE ? null : value)
                  }
                >
                  <DropdownMenuRadioItem
                    value={ALL_FILTER_VALUE}
                    className="text-[11px] [&>span:first-child]:text-foreground-accent"
                  >
                    {strings.filterAll}
                  </DropdownMenuRadioItem>
                  {filters.map((filter) => (
                    <DropdownMenuRadioItem
                      key={filter.id}
                      value={filter.id}
                      className="text-[11px] [&>span:first-child]:text-foreground-accent"
                    >
                      <span className="flex-1 truncate">{filter.label}</span>
                      {filter.count !== undefined && (
                        <span className="ml-3 rounded bg-surface-overlay px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none text-foreground-muted">
                          {filter.count}
                        </span>
                      )}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {onToggleAll && (
            <JsonTreeTooltip content={toggleAllLabel} placement="top" delay>
              <Button
                variant="ghost"
                size="3xs"
                icon
                onClick={onToggleAll}
                aria-label={toggleAllLabel}
                className="rounded text-foreground-subtle hover:bg-surface-overlay hover:text-foreground"
              >
                {allCollapsed ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
              </Button>
            </JsonTreeTooltip>
          )}
        </>
      )}
    </div>
  );
}
