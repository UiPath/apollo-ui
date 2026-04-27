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
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  OnChangeFn,
  Row,
  RowSelectionState,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  showColumnToggle?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  editable?: boolean;
  onCellUpdate?: (rowIndex: number, columnId: string, value: unknown) => void;
  resizable?: boolean;
  compact?: boolean;
  columnToggleText?: string;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
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
   * When set, the search input filters whole rows via this predicate.
   * Takes precedence over `searchKey`.
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
   * body, leaving the header row clear of scrollbar tracks.
   */
  maxBodyHeight?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  showColumnToggle = true,
  showPagination = true,
  pageSize = 10,
  editable = false,
  onCellUpdate,
  resizable = false,
  compact = false,
  columnToggleText = 'Columns',
  rowSelection: controlledRowSelection,
  onRowSelectionChange: controlledOnRowSelectionChange,
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
}: DataTableProps<TData, TValue>) {
  const useBlockLayout = maxBodyHeight !== undefined;
  const blockRowClasses = '[&>tr]:table [&>tr]:w-full [&>tr]:table-fixed';
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(initialSorting ?? []);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<VisibilityState>(
    {}
  );
  const [internalColumnSizing, setInternalColumnSizing] = React.useState<ColumnSizingState>({});
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');

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
    },
    [isSortingControlled, controlledOnSortingChange]
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

  // Wrap columns with editable cell renderer if editable mode is enabled
  const processedColumns = React.useMemo(() => {
    if (!editable || !onCellUpdate) return columns;

    return columns.map((col): ColumnDef<TData, TValue> => {
      const meta = col.meta as EditableCellMeta | undefined;
      // Skip columns without a type or with custom cell renderers
      if (!meta?.type || col.cell) return col;

      return {
        ...col,
        cell: (cellContext) => (
          <EditableCell
            cell={cellContext as CellContext<unknown, unknown>}
            onUpdate={(value) => {
              onCellUpdate(cellContext.row.index, cellContext.column.id, value);
            }}
          />
        ),
      };
    });
  }, [columns, editable, onCellUpdate]);

  const table = useReactTable({
    data,
    columns: processedColumns,
    onSortingChange,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange,
    onColumnSizingChange,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: tanstackGlobalFilterFn,
    enableColumnResizing: resizable,
    columnResizeMode: 'onChange' as ColumnResizeMode,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnSizing,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 py-4">
        {globalFilterFn ? (
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        ) : (
          searchKey && (
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
              onChange={(event) => table.getColumn(searchKey)?.setFilterValue(event.target.value)}
              className="max-w-sm"
            />
          )
        )}
        {toolbarContent}
        {showColumnToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                {columnToggleText} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
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
        >
          <TableHeader
            className={cn(
              'sticky top-0 z-10 bg-background',
              useBlockLayout && `block ${blockRowClasses}`
            )}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const { column } = header;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        compact ? 'relative h-8 px-2 py-0' : 'relative py-0',
                        resizable && 'overflow-visible'
                      )}
                      style={{
                        width: resizable
                          ? header.getSize()
                          : column.getSize() !== 150
                            ? column.getSize()
                            : undefined,
                        minWidth: column.columnDef.minSize,
                        maxWidth: column.columnDef.maxSize,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {resizable && header.column.getCanResize() && (
                        // biome-ignore lint/a11y/useSemanticElements: Interactive resizable separator needs role="separator" with aria-valuenow
                        <div
                          role="separator"
                          aria-label="Resize column"
                          aria-valuenow={header.column.getSize()}
                          aria-valuemin={header.column.columnDef.minSize ?? 40}
                          aria-valuemax={header.column.columnDef.maxSize ?? 1000}
                          tabIndex={0}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize select-none touch-none group`}
                        >
                          <div
                            className={cn(
                              'h-full mx-auto transition-all duration-150',
                              header.column.getIsResizing()
                                ? 'w-0.5 bg-primary'
                                : 'w-px group-hover:w-0.5 group-hover:bg-primary'
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
            className={useBlockLayout ? cn('block overflow-y-auto', blockRowClasses) : undefined}
            style={useBlockLayout ? { maxHeight: maxBodyHeight } : undefined}
            tabIndex={useBlockLayout ? 0 : undefined}
          >
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => {
                    const { column } = cell;
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          allowWrap
                            ? compact
                              ? 'min-h-8 px-2 py-1'
                              : 'min-h-12 px-4 py-2'
                            : compact
                              ? 'h-8 truncate px-2 py-0'
                              : 'h-12 truncate px-4 py-0'
                        )}
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
                        style={{
                          width: resizable
                            ? cell.column.getSize()
                            : column.getSize() !== 150
                              ? column.getSize()
                              : undefined,
                          minWidth: column.columnDef.minSize,
                          maxWidth: column.columnDef.maxSize,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {showPagination && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
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

  const handleClick = () => {
    if (sorted === 'asc') {
      column.toggleSorting(true); // asc -> desc
    } else if (sorted === 'desc') {
      column.clearSorting(); // desc -> clear
    } else {
      column.toggleSorting(false); // none -> asc
    }
  };

  return (
    <Button
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
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
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
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}
