import type { AppColumnDef } from "@/lib/tableFeatures";

export type EntityRecord = Record<string, unknown>;

export type ColumnDefWithAccessorKey<T extends Record<string, unknown>> =
  AppColumnDef<T> & {
    accessorKey: string;
  };

export interface Column {
  key: string;
  label: string;
}

export interface VssEntity {
  id?: string;
  name: string;
  fields: Array<{
    isHiddenField: boolean;
    name: string;
    displayName: string;
    fieldDataType: {
      name: string;
    };
  }>;
}

export interface ExtraColumn<TRecord extends EntityRecord = EntityRecord> {
  column: Column;
  position: "start" | "end";
  definition: ColumnDefWithAccessorKey<TRecord>;
}
