import * as React from 'react';

import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditableCell, EditableCellMeta } from '@/components/ui/editable-cell';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib';
import {
  CellContext,
  Column,
  ColumnDef,
  ColumnFiltersState,
  ColumnResizeMode,
  ColumnSizingState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Header,
  OnChangeFn,
  PaginationState,
  Row,
  RowSelectionState,
  SortingFn,
  SortingState,
  Table as TanStackTable,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';

/** The English text of the DataTable, overridable key by key. */
export interface DataTableStrings {
  /** Accessible name of the search input. Defaults to `searchPlaceholder` when not overridden. */
  search: string;
  /** Empty-state text, shown when no row matches. */
  noResults: string;
  /** Announced while `loading` is set. */
  loading: string;
  /** Previous-page button. */
  previous: string;
  /** Next-page button. */
  next: string;
  /** Page indicator. Both numbers are 1-based. */
  page: (page: number, pageCount: number) => string;
  /** Selection summary under the table. */
  rowsSelected: (selected: number, total: number) => string;
  /** Label of the page-size picker. */
  rowsPerPage: string;
  /** Accessible name of the header checkbox of `DataTableSelectColumn`. */
  selectAll: string;
  /** Accessible name of a row checkbox of `DataTableSelectColumn`. `rowNumber` is 1-based. */
  selectRow: (rowNumber: number) => string;
  /** Accessible name of a column resize handle. */
  resizeColumn: (column: string) => string;
  /** Accessible name of the button that starts editing a cell. `rowNumber` is 1-based. */
  editCell: (column: string, rowNumber: number) => string;
  /** Accessible name of an editable checkbox cell. `rowNumber` is 1-based. */
  toggleCell: (column: string, rowNumber: number) => string;
  /** Accessible name of the scrolling body region when `maxBodyHeight` is set. */
  scrollRegion: string;
}

export const DEFAULT_DATA_TABLE_STRINGS: DataTableStrings = {
  search: 'Search',
  noResults: 'No results.',
  loading: 'Loading',
  previous: 'Previous',
  next: 'Next',
  page: (page, pageCount) => `Page ${page} of ${pageCount}`,
  rowsSelected: (selected, total) => `${selected} of ${total} row(s) selected.`,
  rowsPerPage: 'Rows per page',
  selectAll: 'Select all',
  selectRow: (rowNumber) => `Select row ${rowNumber}`,
  resizeColumn: (column) => `Resize ${column} column`,
  editCell: (column, rowNumber) => `Edit ${column}, row ${rowNumber}`,
  toggleCell: (column, rowNumber) => `${column}, row ${rowNumber}`,
  scrollRegion: 'Table rows',
};

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Extra classes for the root element. */
  className?: string;
  /**
   * Column id the search input filters on, with a case-insensitive "contains" match on the
   * cell value. Works for text and number columns. Ignored when `globalFilterFn` is set.
   */
  searchKey?: string;
  searchPlaceholder?: string;
  /** Controlled search text. Pairs with `onSearchChange`. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showColumnToggle?: boolean;
  /**
   * Shows the pager and paginates the rows. When false, every row renders, unless
   * `pagination` is controlled.
   */
  showPagination?: boolean;
  /** Rows per page. Changing it after mount returns to the first page. Default: 10. */
  pageSize?: number;
  /** When set, the pager shows a page-size picker with these options. */
  pageSizeOptions?: number[];
  /** Controlled pagination state. Pairs with `onPaginationChange`. */
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  /**
   * Server-side pagination: `data` already holds only the current page. Requires `rowCount`
   * and a controlled `pagination`.
   */
  manualPagination?: boolean;
  /** Total number of rows across all pages, for `manualPagination`. */
  rowCount?: number;
  /**
   * Turns on inline editing for columns whose `meta.type` is set and that have no custom
   * `cell`. Requires `onCellUpdate`.
   */
  editable?: boolean;
  /** `rowIndex` is the row's index in `data`, whatever the current sort, filter or page. */
  onCellUpdate?: (rowIndex: number, columnId: string, value: unknown) => void;
  resizable?: boolean;
  compact?: boolean;
  columnToggleText?: string;
  /**
   * Stable id for a row. Without it rows are identified by their index in `data`, so
   * selection sticks to a position rather than a record when `data` changes. Set it
   * whenever rows can be added, removed or reordered.
   */
  getRowId?: (row: TData, index: number) => string;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  /**
   * Shows the "n of m row(s) selected" summary in the pager. Default: shown when the table
   * has a `select` column or selection is controlled.
   */
  showSelectionCount?: boolean;
  /** Controlled sort state. When provided, the table runs in controlled mode for sorting. */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Initial sort applied when `sorting` is uncontrolled. */
  initialSorting?: SortingState;
  /** Controlled column-sizing state. Pairs with `resizable`. */
  columnSizing?: ColumnSizingState;
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
  /** Controlled column-visibility state. */
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  /**
   * When set, the search input filters whole rows via this predicate, called once per row.
   * Takes precedence over `searchKey`. Needs at least one column with an accessor.
   */
  globalFilterFn?: (row: TData, query: string) => boolean;
  /**
   * When true, body cells render multi-line content (drops the default `truncate` class).
   * Useful for tables that show JSON, long text, or preformatted content.
   * Default: false (single-line + ellipsis).
   */
  allowWrap?: boolean;
  toolbarContent?: React.ReactNode;
  /**
   * When set, the table body scrolls independently with this max height (any CSS length).
   * The header stays above the scroll region and the vertical scrollbar is confined to the
   * body, leaving the header row clear of scrollbar tracks. In this mode columns without an
   * explicit `size` share the remaining width equally instead of sizing to their content.
   */
  maxBodyHeight?: string;
  /** Called when a row is clicked or activated with Enter. Clicks on controls inside the row are ignored. */
  onRowClick?: (row: TData) => void;
  /** Shows placeholder rows while there is no data yet, and dims existing rows. */
  loading?: boolean;
  /** Replaces the default "No results." text. */
  emptyState?: React.ReactNode;
  /** Overrides for the built-in English text, key by key. */
  strings?: Partial<DataTableStrings>;
}

interface DataTableInternalMeta {
  strings: DataTableStrings;
  onCellUpdate: React.MutableRefObject<
    ((rowIndex: number, columnId: string, value: unknown) => void) | undefined
  >;
}

const INTERNAL_META_KEY = '__apolloDataTable';

function getInternalMeta<TData>(table: TanStackTable<TData>): DataTableInternalMeta | undefined {
  return (table.options.meta as Record<string, unknown> | undefined)?.[INTERNAL_META_KEY] as
    | DataTableInternalMeta
    | undefined;
}

/** The id TanStack derives for a column definition. */
function resolveColumnId<TData, TValue>(def: ColumnDef<TData, TValue>): string | undefined {
  if (def.id) return def.id;
  const accessorKey = (def as { accessorKey?: unknown }).accessorKey;
  return typeof accessorKey === 'string' ? accessorKey.replace(/\./g, '_') : undefined;
}

function hasAccessor<TData, TValue>(def: ColumnDef<TData, TValue>): boolean {
  const candidate = def as { accessorKey?: unknown; accessorFn?: unknown };
  return candidate.accessorKey !== undefined || candidate.accessorFn !== undefined;
}

/** Applies `fn` to every leaf column definition, keeping group columns intact. */
function mapLeafColumns<TData, TValue>(
  defs: ColumnDef<TData, TValue>[],
  fn: (def: ColumnDef<TData, TValue>) => ColumnDef<TData, TValue>
): ColumnDef<TData, TValue>[] {
  return defs.map((def) => {
    const children = (def as { columns?: ColumnDef<TData, TValue>[] }).columns;
    if (children?.length) {
      return { ...def, columns: mapLeafColumns(children, fn) } as ColumnDef<TData, TValue>;
    }
    return fn(def);
  });
}

function flattenLeafColumns<TData, TValue>(
  defs: ColumnDef<TData, TValue>[]
): ColumnDef<TData, TValue>[] {
  return defs.flatMap((def) => {
    const children = (def as { columns?: ColumnDef<TData, TValue>[] }).columns;
    return children?.length ? flattenLeafColumns(children) : [def];
  });
}

/** Human-readable column name: `meta.label`, else a string header, else the column id. */
function getColumnLabel<TData>(column: Column<TData, unknown>): string {
  const meta = column.columnDef.meta as EditableCellMeta | undefined;
  if (meta?.label) return meta.label;
  const header = column.columnDef.header;
  return typeof header === 'string' && header.trim() !== '' ? header : column.id;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/**
 * Default sort. TanStack's own type detection samples the wrong rows on small tables and
 * falls back to a case-sensitive comparison, so the DataTable compares by value type
 * itself: numbers numerically, dates chronologically, text case-insensitively with
 * natural number ordering. Empty values sort last when ascending.
 */
function compareValues(a: unknown, b: unknown): number {
  const aEmpty = a === null || a === undefined || a === '';
  const bEmpty = b === null || b === undefined || b === '';
  if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'bigint' && typeof b === 'bigint') return a < b ? -1 : a > b ? 1 : 0;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return collator.compare(String(a), String(b));
}

const defaultSortingFn: SortingFn<unknown> = (rowA, rowB, columnId) =>
  compareValues(rowA.getValue(columnId), rowB.getValue(columnId));

/** Case-insensitive "contains" on the cell's string form, so number columns are searchable. */
const containsTextFilterFn: FilterFn<unknown> = (row, columnId, filterValue) => {
  const query = String(filterValue ?? '').toLowerCase();
  if (query === '') return true;
  const value = row.getValue(columnId);
  if (value === null || value === undefined) return false;
  return String(value).toLowerCase().includes(query);
};
containsTextFilterFn.autoRemove = (value: unknown) => !value;

/**
 * Module-level so its identity never changes. TanStack renders a `cell` function as a
 * component, so a renderer recreated on each render would remount every cell and drop an
 * in-progress edit.
 */
function EditableCellRenderer<TData>(cellContext: CellContext<TData, unknown>) {
  const internal = getInternalMeta(cellContext.table);
  const strings = internal?.strings ?? DEFAULT_DATA_TABLE_STRINGS;
  const columnLabel = getColumnLabel(cellContext.column);
  const rowNumber = cellContext.row.index + 1;
  return (
    <EditableCell
      cell={cellContext}
      editLabel={strings.editCell(columnLabel, rowNumber)}
      toggleLabel={strings.toggleCell(columnLabel, rowNumber)}
      onUpdate={(value) => {
        internal?.onCellUpdate.current?.(cellContext.row.index, cellContext.column.id, value);
      }}
    />
  );
}

const INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, label, summary, [role="button"], [role="checkbox"], [role="switch"], [role="menuitem"], [role="combobox"], [role="separator"], [contenteditable="true"]';

const RESIZE_STEP = 10;
const RESIZE_STEP_LARGE = 50;
const RESIZE_FALLBACK_MIN = 20;

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  searchKey,
  searchPlaceholder = 'Search...',
  searchValue: controlledSearch,
  onSearchChange,
  showColumnToggle = true,
  showPagination = true,
  pageSize = 10,
  pageSizeOptions,
  pagination: controlledPagination,
  onPaginationChange: controlledOnPaginationChange,
  manualPagination = false,
  rowCount,
  editable = false,
  onCellUpdate,
  resizable = false,
  compact = false,
  columnToggleText = 'Columns',
  getRowId,
  rowSelection: controlledRowSelection,
  onRowSelectionChange: controlledOnRowSelectionChange,
  showSelectionCount,
  sorting: controlledSorting,
  onSortingChange: controlledOnSortingChange,
  initialSorting,
  columnSizing: controlledColumnSizing,
  onColumnSizingChange: controlledOnColumnSizingChange,
  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange: controlledOnColumnVisibilityChange,
  globalFilterFn,
  allowWrap = false,
  toolbarContent,
  maxBodyHeight,
  onRowClick,
  loading = false,
  emptyState,
  strings: stringOverrides,
}: DataTableProps<TData, TValue>) {
  const useBlockLayout = maxBodyHeight !== undefined;
  const blockRowClasses = '[&>tr]:table [&>tr]:w-full [&>tr]:table-fixed';

  const strings = React.useMemo<DataTableStrings>(() => {
    const merged = { ...DEFAULT_DATA_TABLE_STRINGS };
    if (stringOverrides) {
      for (const key of Object.keys(stringOverrides) as (keyof DataTableStrings)[]) {
        const value = stringOverrides[key];
        if (value !== undefined) (merged as Record<string, unknown>)[key] = value;
      }
    }
    return merged;
  }, [stringOverrides]);

  const [internalSorting, setInternalSorting] = React.useState<SortingState>(initialSorting ?? []);
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<VisibilityState>(
    {}
  );
  const [internalColumnSizing, setInternalColumnSizing] = React.useState<ColumnSizingState>({});
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
  const [internalSearch, setInternalSearch] = React.useState('');
  const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  // Follow `pageSize` prop changes after mount (uncontrolled pagination only).
  const [appliedPageSize, setAppliedPageSize] = React.useState(pageSize);
  if (appliedPageSize !== pageSize) {
    setAppliedPageSize(pageSize);
    setInternalPagination({ pageIndex: 0, pageSize });
  }

  const isPaginationControlled = controlledPagination !== undefined;
  const pagination = isPaginationControlled ? controlledPagination : internalPagination;
  const paginationRef = React.useRef(pagination);
  paginationRef.current = pagination;
  const onPaginationChange: OnChangeFn<PaginationState> = React.useCallback(
    (updater) => {
      if (!isPaginationControlled) {
        setInternalPagination((prev) => (typeof updater === 'function' ? updater(prev) : updater));
      }
      controlledOnPaginationChange?.(updater);
    },
    [isPaginationControlled, controlledOnPaginationChange]
  );
  // The table does not reset the page on every `data` change (that would throw the user
  // back to page 1 after each inline edit), so searching and sorting reset it explicitly.
  const resetPageIndex = React.useCallback(() => {
    if (paginationRef.current.pageIndex !== 0) {
      onPaginationChange((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [onPaginationChange]);

  // Sorting/sizing/visibility wrappers forward the TanStack updater (value or
  // function) verbatim to the consumer's callback so `setState`-shaped handlers
  // can be passed directly and their functional-updater contract is preserved.
  // `onRowSelectionChange` predates this contract and accepts a resolved value,
  // so its wrapper resolves the updater before invoking the consumer callback.
  const isRowSelectionControlled = controlledRowSelection !== undefined;
  const rowSelection = isRowSelectionControlled ? controlledRowSelection : internalRowSelection;
  const rowSelectionRef = React.useRef(rowSelection);
  rowSelectionRef.current = rowSelection;
  const setRowSelection: OnChangeFn<RowSelectionState> = React.useCallback(
    (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelectionRef.current) : updater;
      if (!isRowSelectionControlled) setInternalRowSelection(next);
      controlledOnRowSelectionChange?.(next);
    },
    [isRowSelectionControlled, controlledOnRowSelectionChange]
  );

  const isSortingControlled = controlledSorting !== undefined;
  const sorting = isSortingControlled ? controlledSorting : internalSorting;
  const onSortingChange: OnChangeFn<SortingState> = React.useCallback(
    (updater) => {
      if (!isSortingControlled) {
        setInternalSorting((prev) => (typeof updater === 'function' ? updater(prev) : updater));
      }
      controlledOnSortingChange?.(updater);
      resetPageIndex();
    },
    [isSortingControlled, controlledOnSortingChange, resetPageIndex]
  );

  const isColumnSizingControlled = controlledColumnSizing !== undefined;
  const columnSizing = isColumnSizingControlled ? controlledColumnSizing : internalColumnSizing;
  const onColumnSizingChange: OnChangeFn<ColumnSizingState> = React.useCallback(
    (updater) => {
      if (!isColumnSizingControlled) {
        setInternalColumnSizing((prev) =>
          typeof updater === 'function' ? updater(prev) : updater
        );
      }
      controlledOnColumnSizingChange?.(updater);
    },
    [isColumnSizingControlled, controlledOnColumnSizingChange]
  );

  const isColumnVisibilityControlled = controlledColumnVisibility !== undefined;
  const columnVisibility = isColumnVisibilityControlled
    ? controlledColumnVisibility
    : internalColumnVisibility;
  const onColumnVisibilityChange: OnChangeFn<VisibilityState> = React.useCallback(
    (updater) => {
      if (!isColumnVisibilityControlled) {
        setInternalColumnVisibility((prev) =>
          typeof updater === 'function' ? updater(prev) : updater
        );
      }
      controlledOnColumnVisibilityChange?.(updater);
    },
    [isColumnVisibilityControlled, controlledOnColumnVisibilityChange]
  );

  const tanstackGlobalFilterFn = React.useMemo(
    () =>
      globalFilterFn
        ? (row: Row<TData>, _columnId: string, filterValue: string) =>
            globalFilterFn(row.original, filterValue)
        : undefined,
    [globalFilterFn]
  );

  const leafColumnDefs = React.useMemo(() => flattenLeafColumns(columns), [columns]);

  // TanStack evaluates a global filter once per filterable column and skips columns whose
  // first-row value is not a string or number. The predicate here looks at the whole row,
  // so route it through exactly one accessor column: one call per row, whatever the data.
  const globalFilterColumnId = React.useMemo(() => {
    const def = leafColumnDefs.find(
      (candidate) => hasAccessor(candidate) && candidate.enableGlobalFilter !== false
    );
    return def ? resolveColumnId(def) : undefined;
  }, [leafColumnDefs]);

  const searchColumnExists = React.useMemo(
    () =>
      searchKey !== undefined && leafColumnDefs.some((def) => resolveColumnId(def) === searchKey),
    [leafColumnDefs, searchKey]
  );

  // Column filters stay in table state so a custom header or cell can still call
  // `column.setFilterValue()`. The search input is one more entry in that list, keyed by
  // `searchKey`.
  const [internalColumnFilters, setInternalColumnFilters] = React.useState<ColumnFiltersState>([]);
  const usesColumnSearch = !globalFilterFn && searchKey !== undefined;
  const search =
    controlledSearch !== undefined
      ? controlledSearch
      : usesColumnSearch
        ? String(internalColumnFilters.find((filter) => filter.id === searchKey)?.value ?? '')
        : internalSearch;

  const columnFilters = React.useMemo<ColumnFiltersState>(() => {
    if (!usesColumnSearch) return internalColumnFilters;
    const others = internalColumnFilters.filter((filter) => filter.id !== searchKey);
    // An unknown `searchKey` keeps its text in state (so the input stays typeable) but is
    // not handed to the table, which would log an error for a column it cannot find.
    return searchColumnExists && search !== ''
      ? [...others, { id: searchKey as string, value: search }]
      : others;
  }, [usesColumnSearch, internalColumnFilters, searchKey, searchColumnExists, search]);
  const columnFiltersRef = React.useRef(columnFilters);
  columnFiltersRef.current = columnFilters;

  const handleSearchChange = (value: string) => {
    if (controlledSearch === undefined) {
      if (usesColumnSearch) {
        setInternalColumnFilters((prev) => [
          ...prev.filter((filter) => filter.id !== searchKey),
          ...(value === '' ? [] : [{ id: searchKey as string, value }]),
        ]);
      } else {
        setInternalSearch(value);
      }
    }
    onSearchChange?.(value);
    resetPageIndex();
  };

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    const next = typeof updater === 'function' ? updater(columnFiltersRef.current) : updater;
    setInternalColumnFilters(next);
    if (usesColumnSearch && controlledSearch !== undefined) {
      const value = String(next.find((filter) => filter.id === searchKey)?.value ?? '');
      if (value !== controlledSearch) onSearchChange?.(value);
    }
    resetPageIndex();
  };

  const onCellUpdateRef = React.useRef(onCellUpdate);
  onCellUpdateRef.current = onCellUpdate;
  const isEditable = editable && onCellUpdate !== undefined;

  React.useEffect(() => {
    if (editable && !onCellUpdate) {
      console.warn('DataTable: `editable` has no effect without `onCellUpdate`.');
    }
    if (searchKey !== undefined && !globalFilterFn && !searchColumnExists) {
      console.warn(`DataTable: \`searchKey\` "${searchKey}" does not match any column id.`);
    }
  }, [editable, onCellUpdate, searchKey, globalFilterFn, searchColumnExists]);

  const processedColumns = React.useMemo(() => {
    const needsSearchFilter = searchKey !== undefined && !globalFilterFn;
    if (!isEditable && !needsSearchFilter) return columns;

    return mapLeafColumns(columns, (col): ColumnDef<TData, TValue> => {
      let next = col;
      if (needsSearchFilter && resolveColumnId(col) === searchKey && col.filterFn === undefined) {
        next = { ...next, filterFn: containsTextFilterFn as FilterFn<TData> };
      }
      // Editable: skip columns without a type or with custom cell renderers
      const meta = col.meta as EditableCellMeta | undefined;
      if (isEditable && meta?.type && !col.cell) {
        next = { ...next, cell: EditableCellRenderer as ColumnDef<TData, TValue>['cell'] };
      }
      return next;
    });
  }, [columns, isEditable, searchKey, globalFilterFn]);

  const tableMeta = React.useMemo(
    () => ({
      [INTERNAL_META_KEY]: {
        strings,
        onCellUpdate: onCellUpdateRef,
      } satisfies DataTableInternalMeta,
    }),
    [strings]
  );

  const paginate = showPagination || isPaginationControlled;

  const table = useReactTable({
    data,
    columns: processedColumns,
    meta: tableMeta,
    getRowId,
    // Leave sizes undefined unless a column sets them, so only explicit sizes reach the DOM.
    defaultColumn: {
      size: undefined,
      minSize: undefined,
      maxSize: undefined,
      sortingFn: defaultSortingFn as SortingFn<TData>,
    },
    onSortingChange,
    onColumnFiltersChange,
    onGlobalFilterChange: (updater) => {
      if (!globalFilterFn) return;
      const next = typeof updater === 'function' ? updater(search) : updater;
      handleSearchChange(String(next ?? ''));
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: paginate && !manualPagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange,
    onColumnSizingChange,
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    manualPagination,
    rowCount,
    autoResetPageIndex: false,
    globalFilterFn: tanstackGlobalFilterFn,
    // Only narrowed for the row-level predicate. Passing `undefined` here would replace
    // TanStack's own default, so the option is added conditionally.
    ...(globalFilterFn
      ? {
          getColumnCanGlobalFilter: (column: Column<TData, unknown>) =>
            column.id === globalFilterColumnId,
        }
      : {}),
    enableColumnResizing: resizable,
    columnResizeMode: 'onChange' as ColumnResizeMode,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnSizing,
      rowSelection,
      pagination,
      globalFilter: globalFilterFn ? search : '',
    },
  });

  // Keep the page in range when rows disappear (filtering, deletion, a smaller data set).
  // The corrected index is applied to this render so no empty page flashes, then synced
  // into state.
  const pageCount = paginate ? Math.max(table.getPageCount(), 1) : 1;
  const lastPageIndex = pageCount - 1;
  const pageIndexOutOfRange = paginate && !manualPagination && pagination.pageIndex > lastPageIndex;
  if (pageIndexOutOfRange) {
    table.setOptions((prev) => ({
      ...prev,
      state: { ...prev.state, pagination: { ...pagination, pageIndex: lastPageIndex } },
    }));
  }
  React.useEffect(() => {
    if (pageIndexOutOfRange) {
      onPaginationChange((prev) => ({ ...prev, pageIndex: lastPageIndex }));
    }
  }, [pageIndexOutOfRange, lastPageIndex, onPaginationChange]);
  const currentPageIndex = pageIndexOutOfRange ? lastPageIndex : pagination.pageIndex;

  const rows = table.getRowModel().rows;
  const visibleColumnCount = Math.max(table.getVisibleLeafColumns().length, 1);
  const hasSelectColumn = leafColumnDefs.some((def) => resolveColumnId(def) === 'select');
  // Also shown as soon as anything is selected, which covers hand-rolled select columns.
  const selectionCountVisible =
    showSelectionCount ??
    (hasSelectColumn || isRowSelectionControlled || Object.keys(rowSelection).length > 0);
  const showSearch = globalFilterFn !== undefined || searchKey !== undefined;

  const resizeColumnBy = (header: Header<TData, unknown>, delta: number | 'min' | 'max') => {
    const { column } = header;
    const min = column.columnDef.minSize ?? RESIZE_FALLBACK_MIN;
    const max = column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER;
    const current = column.getSize();
    const target = delta === 'min' ? min : delta === 'max' ? max : current + delta;
    const next = Math.min(Math.max(target, min), max);
    if (next !== current) {
      table.setColumnSizing((prev) => ({ ...prev, [column.id]: next }));
    }
  };

  const handleResizeKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    header: Header<TData, unknown>
  ) => {
    const step = event.shiftKey ? RESIZE_STEP_LARGE : RESIZE_STEP;
    switch (event.key) {
      case 'ArrowLeft':
        resizeColumnBy(header, -step);
        break;
      case 'ArrowRight':
        resizeColumnBy(header, step);
        break;
      case 'Home':
        resizeColumnBy(header, 'min');
        break;
      case 'End':
        // Only meaningful when the column declares an upper bound.
        if (header.column.columnDef.maxSize === undefined) return;
        resizeColumnBy(header, 'max');
        break;
      case 'Enter':
        header.column.resetSize();
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const cellSizeStyle = (column: Column<TData, unknown>): React.CSSProperties => ({
    width: resizable ? column.getSize() : column.columnDef.size,
    minWidth: column.columnDef.minSize,
    maxWidth: column.columnDef.maxSize,
  });

  const bodyCellClasses = allowWrap
    ? compact
      ? 'min-h-8 px-2 py-1'
      : 'min-h-12 px-4 py-2'
    : compact
      ? 'h-8 truncate px-2 py-0'
      : 'h-12 truncate px-4 py-0';

  const skeletonRowCount = Math.min(Math.max(pagination.pageSize, 1), 5);

  return (
    <div data-slot="data-table" className={cn('w-full', className)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
        {showSearch && (
          <Input
            placeholder={searchPlaceholder}
            aria-label={stringOverrides?.search ?? searchPlaceholder}
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="min-w-0 max-w-sm flex-1 basis-48"
          />
        )}
        {toolbarContent}
        {showColumnToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                {columnToggleText} <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const label = getColumnLabel(column);
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      // A raw column id reads better capitalized; a real label is left as written.
                      className={label === column.id ? 'capitalize' : undefined}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div
        className={cn('rounded-md border', useBlockLayout ? 'overflow-x-auto' : 'overflow-auto')}
      >
        <Table
          className={useBlockLayout ? 'block' : undefined}
          style={resizable ? { width: table.getTotalSize(), tableLayout: 'fixed' } : undefined}
          aria-busy={loading || undefined}
        >
          <TableHeader
            className={cn(
              'sticky top-0 z-10 bg-background',
              // The header reserves the same scrollbar gutter as the scrolling body, so
              // columns stay aligned with classic (non-overlay) scrollbars too.
              useBlockLayout && `block overflow-hidden [scrollbar-gutter:stable] ${blockRowClasses}`
            )}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, headerIndex) => {
                  const { column } = header;
                  const sorted = column.getIsSorted();
                  const isLastHeader = headerIndex === headerGroup.headers.length - 1;
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan > 1 ? header.colSpan : undefined}
                      aria-sort={
                        sorted === 'asc'
                          ? 'ascending'
                          : sorted === 'desc'
                            ? 'descending'
                            : undefined
                      }
                      className={cn(
                        compact ? 'relative h-8 px-2 py-0' : 'relative py-0',
                        resizable && 'overflow-visible'
                      )}
                      style={{
                        ...cellSizeStyle(column),
                        width: resizable ? header.getSize() : column.columnDef.size,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {resizable && header.column.getCanResize() && (
                        // biome-ignore lint/a11y/useSemanticElements: Interactive resizable separator needs role="separator" with aria-valuenow
                        <div
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={strings.resizeColumn(getColumnLabel(column))}
                          aria-valuenow={Math.round(header.getSize())}
                          aria-valuemin={column.columnDef.minSize ?? RESIZE_FALLBACK_MIN}
                          aria-valuemax={
                            column.columnDef.maxSize ?? Math.max(1000, Math.round(header.getSize()))
                          }
                          tabIndex={0}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onDoubleClick={() => column.resetSize()}
                          onKeyDown={(event) => handleResizeKeyDown(event, header)}
                          className={cn(
                            'group absolute top-0 z-10 h-full w-2 cursor-col-resize touch-none select-none outline-none',
                            // The last handle stays inside the table so it adds no horizontal overflow.
                            isLastHeader ? 'right-0' : '-right-1'
                          )}
                        >
                          <div
                            className={cn(
                              'h-full transition-all duration-150',
                              isLastHeader ? 'ml-auto' : 'mx-auto',
                              header.column.getIsResizing()
                                ? 'w-0.5 bg-primary'
                                : 'w-px group-hover:w-0.5 group-hover:bg-primary group-focus-visible:w-0.5 group-focus-visible:bg-primary'
                            )}
                          />
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            className={cn(
              useBlockLayout &&
                `block overflow-y-auto [scrollbar-gutter:stable] ${blockRowClasses}`,
              loading && rows.length > 0 && 'opacity-60 transition-opacity'
            )}
            style={useBlockLayout ? { maxHeight: maxBodyHeight } : undefined}
            tabIndex={useBlockLayout ? 0 : undefined}
            aria-label={useBlockLayout ? strings.scrollRegion : undefined}
          >
            {rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={
                    onRowClick
                      ? (event) => {
                          const target = event.target as HTMLElement;
                          if (target.closest(INTERACTIVE_SELECTOR)) return;
                          onRowClick(row.original);
                        }
                      : undefined
                  }
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === 'Enter' && event.target === event.currentTarget) {
                            event.preventDefault();
                            onRowClick(row.original);
                          }
                        }
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => {
                    const { column } = cell;
                    return (
                      <TableCell
                        key={cell.id}
                        className={bodyCellClasses}
                        onMouseEnter={(e) => {
                          if (allowWrap) return;
                          const el = e.currentTarget;
                          const value = cell.getValue();
                          el.title =
                            el.scrollWidth > el.clientWidth &&
                            (typeof value === 'string' || typeof value === 'number')
                              ? String(value)
                              : '';
                        }}
                        style={cellSizeStyle(column)}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : loading ? (
              Array.from({ length: skeletonRowCount }, (_, rowIndex) => (
                <TableRow key={rowIndex} data-slot="data-table-loading-row" aria-hidden="true">
                  {table.getVisibleLeafColumns().map((column) => (
                    <TableCell
                      key={column.id}
                      className={bodyCellClasses}
                      style={cellSizeStyle(column)}
                    >
                      <Skeleton className="h-4 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumnCount} className="h-24 text-center">
                  {emptyState ?? strings.noResults}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {loading && <output className="sr-only">{strings.loading}</output>}
      {showPagination && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {selectionCountVisible &&
              strings.rowsSelected(
                table.getFilteredSelectedRowModel().rows.length,
                table.getFilteredRowModel().rows.length
              )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {pageSizeOptions && pageSizeOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{strings.rowsPerPage}</span>
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(value) =>
                    onPaginationChange({ pageIndex: 0, pageSize: Number(value) })
                  }
                >
                  <SelectTrigger
                    className="h-8 w-auto min-w-[4.5rem] gap-2"
                    aria-label={strings.rowsPerPage}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {Array.from(new Set([...pageSizeOptions, pagination.pageSize]))
                      .sort((a, b) => a - b)
                      .map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={currentPageIndex <= 0}
              >
                {strings.previous}
              </Button>
              <div className="text-sm font-medium">
                {strings.page(currentPageIndex + 1, pageCount)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={currentPageIndex >= lastPageIndex}
              >
                {strings.next}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export utility components for common column patterns
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  children,
}: {
  column: Column<TData, TValue>;
  title: string;
  children?: React.ReactNode;
}) {
  const sorted = column.getIsSorted();

  // A column that cannot be sorted renders as plain text, not as a button that does nothing.
  // The optional calls keep partial column mocks in consumer tests working as before.
  if (column.getCanSort?.() === false) {
    return (
      <span
        data-slot="data-table-column-header"
        className="flex h-8 max-w-full items-center text-sm font-medium"
      >
        <span className="truncate min-w-0">{title}</span>
        {children}
      </span>
    );
  }

  // Shift+click adds or changes this column within a multi-column sort.
  const handleClick = (event: React.MouseEvent) => {
    const multi = event.shiftKey && (column.getCanMultiSort?.() ?? false);
    if (sorted === 'asc') {
      column.toggleSorting(true, multi); // asc -> desc
    } else if (sorted === 'desc') {
      column.clearSorting(); // desc -> clear
    } else {
      column.toggleSorting(false, multi); // none -> asc
    }
  };

  return (
    <Button
      data-slot="data-table-column-header"
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 max-w-full data-[state=open]:bg-accent"
      onClick={handleClick}
      onMouseEnter={(e) => {
        const span = e.currentTarget.querySelector<HTMLSpanElement>('span');
        e.currentTarget.title = span && span.scrollWidth > span.clientWidth ? title : '';
      }}
    >
      <span className="truncate min-w-0">{title}</span>
      {children}
      {sorted === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" aria-hidden="true" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-2 h-4 w-4" aria-hidden="true" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  );
}

export function DataTableSelectColumn<TData>(): ColumnDef<TData> {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label={(getInternalMeta(table)?.strings ?? DEFAULT_DATA_TABLE_STRINGS).selectAll}
      />
    ),
    cell: ({ row, table }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={(getInternalMeta(table)?.strings ?? DEFAULT_DATA_TABLE_STRINGS).selectRow(
          row.index + 1
        )}
      />
    ),
    size: 48,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
  };
}
