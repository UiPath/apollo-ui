import type { ColumnDef } from "@/components/ui/data-table";

export type EntityRecord = Record<string, unknown>;

export type ColumnDefWithAccessorKey<T extends EntityRecord> = ColumnDef<T> & {
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
