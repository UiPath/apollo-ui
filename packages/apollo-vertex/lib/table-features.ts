import {
  type Column,
  type ColumnDef,
  type ColumnMeta,
  columnFilteringFeature,
  columnOrderingFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  type FilterFn,
  filterFn_arrIncludes,
  filterFn_equals,
  filterFn_includesString,
  filterFn_inDateRange,
  filterFn_inNumberRange,
  filterFn_weakEquals,
  globalFilteringFeature,
  type ReactTable,
  type Row,
  type RowData,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table";

export type { RowData };

// Keeps fields that apps add to TanStack's global ColumnMeta, with Vertex's own fields taking precedence.
interface DataTableFeaturesColumnMeta
  extends Omit<
      // oxlint-disable-next-line typescript-eslint(no-explicit-any) -- reads the app's augmentation for any features and row data
      ColumnMeta<any, any, any>,
      keyof DataTableColumnMeta
    >,
    // oxlint-disable-next-line typescript-eslint(no-explicit-any) -- one meta type serves every row data type
    DataTableColumnMeta<any> {}

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowExpandingFeature,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnSizingFeature,
  columnResizingFeature,
  // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- type-only slot; TanStack reads its type, not its value
  columnMeta: {} as DataTableFeaturesColumnMeta,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    datetime: sortFn_datetime,
    basic: sortFn_basic,
  },
  filterFns: {
    includesString: filterFn_includesString,
    inNumberRange: filterFn_inNumberRange,
    equals: filterFn_equals,
    arrIncludes: filterFn_arrIncludes,
    inDateRange: filterFn_inDateRange,
    weakEquals: filterFn_weakEquals,
  },
});

export type DataTableFeatures = typeof dataTableFeatures;

export type DataTableColumnDef<
  TData extends RowData,
  TValue = unknown,
> = ColumnDef<DataTableFeatures, TData, TValue>;

export type DataTableRow<TData extends RowData> = Row<DataTableFeatures, TData>;

// TanStack rows are not assignable across row data types, so filter callbacks get the row fields
// they need instead of the full row.
export type DataTableFilterRow<TData extends RowData> = Pick<
  DataTableRow<TData>,
  "id" | "index" | "depth" | "parentId" | "original" | "getValue"
>;

export interface DataTableColumnMeta<TData extends RowData = RowData> {
  displayName?: string;
  getFilterValue?(value: unknown, row: DataTableFilterRow<TData>): string;
  overflowVisible?: boolean;
}

export type DataTableColumn<TData extends RowData, TValue = unknown> = Column<
  DataTableFeatures,
  TData,
  TValue
>;

export type DataTableInstance<TData extends RowData> = ReactTable<
  DataTableFeatures,
  TData
>;

export type DataTableFilterFn<TData extends RowData> = FilterFn<
  DataTableFeatures,
  TData
>;
