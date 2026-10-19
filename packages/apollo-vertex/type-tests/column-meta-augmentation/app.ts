// Consumer app that declares its own ColumnMeta augmentation for its own
// feature set. Checked against the built package (dist) by `test:types`.
import {
  type ColumnDef,
  type Row,
  type RowData,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import type {
  DataTableColumnMeta,
  ColumnDef as VertexColumnDef,
  Row as VertexRow,
} from "@uipath/apollo-vertex";

const appTableFeatures = tableFeatures({ rowSortingFeature });

type AppTableFeatures = typeof appTableFeatures;

type AppRow<TData extends RowData> = Row<AppTableFeatures, TData>;

declare module "@tanstack/react-table" {
  interface ColumnMeta<TFeatures, TData extends RowData, TValue> {
    displayName?: string;
    getFilterValue?: (value: unknown, row: AppRow<TData>) => string;
    overflowVisible?: boolean;
    numeric?: boolean;
  }
}

type Payment = Record<string, unknown>;

export const appColumns: ColumnDef<AppTableFeatures, Payment>[] = [
  {
    accessorKey: "amount",
    meta: {
      displayName: "Amount",
      numeric: true,
      getFilterValue: (value, row) => `${String(value)} ${row.id}`,
    },
  },
];

export function filterValue(
  column: ColumnDef<AppTableFeatures, Payment>,
  value: unknown,
  row: AppRow<Payment>,
): string {
  const meta = column.meta;
  return meta?.getFilterValue ? meta.getFilterValue(value, row) : "";
}

export const vertexColumns: VertexColumnDef<Payment>[] = [
  {
    accessorKey: "amount",
    meta: {
      displayName: "Amount",
      numeric: true,
      getFilterValue: (value, row) => `${String(value)} ${row.id}`,
    },
  },
  {
    accessorKey: "id",
    meta: {
      getFilterValue: (_value: unknown, row: VertexRow<Payment>) =>
        String(row.original["id"]),
    },
  },
];

export const vertexMeta: DataTableColumnMeta<Payment> = {
  displayName: "Amount",
  overflowVisible: true,
};
