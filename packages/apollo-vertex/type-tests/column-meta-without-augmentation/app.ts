// Consumer app without its own ColumnMeta augmentation. Checked against the
// built package (dist) by `test:types`.
import type { ColumnDef, Row } from "@uipath/apollo-vertex";

interface Payment {
  id: string;
  amount: number;
}

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "amount",
    meta: {
      displayName: "Amount",
      overflowVisible: true,
      getFilterValue: (value, row) => `${String(value)} ${row.id}`,
    },
  },
  {
    accessorKey: "id",
    meta: {
      getFilterValue: (_value: unknown, row: Row<Payment>) => row.original.id,
    },
  },
  {
    accessorKey: "id",
    meta: {
      // @ts-expect-error -- Vertex column meta only accepts its own fields
      unknownField: true,
    },
  },
];
