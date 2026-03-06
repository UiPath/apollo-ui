import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/ui/data-table";
import { FORMAT_TYPE_MAP } from "@/lib/constants";
import { renderValueOrEmptyState } from "@/lib/renderValueOrEmptyState";
import type {
  ColumnDefWithAccessorKey,
  EntityRecord,
  ExtraColumn,
  VssEntity,
} from "./useEntityDataTable";

export interface Column {
  key: string;
  label: string;
}

function mergeExtraColumns<TRecord extends EntityRecord>(
  columns: Column[],
  extraColumns?: ExtraColumn<TRecord>[],
): Column[] {
  if (!extraColumns || extraColumns.length === 0) return columns;

  const start = extraColumns
    .filter((ec) => ec.position === "start")
    .map((ec) => ec.column);
  const end = extraColumns
    .filter((ec) => ec.position === "end")
    .map((ec) => ec.column);

  return [...start, ...columns, ...end];
}

export interface UseEntityColumnsOptions<
  TRecord extends EntityRecord = EntityRecord,
> {
  entity: VssEntity;
  systemFields?: string[];
  columnOrder?: string[];
  extraColumns?: ExtraColumn<TRecord>[];
  columnOverrides?: Record<
    string,
    (
      baseDef: ColumnDefWithAccessorKey<TRecord>,
    ) => ColumnDefWithAccessorKey<TRecord>
  >;
}

export function useEntityColumns<TRecord extends EntityRecord = EntityRecord>({
  entity,
  systemFields = ["Id"],
  columnOrder: columnOrderProp,
  extraColumns,
  columnOverrides,
}: UseEntityColumnsOptions<TRecord>) {
  const visibleFields =
    entity.fields?.filter(
      (field) => !field.isHiddenField && !systemFields.includes(field.name),
    ) ?? [];

  const baseColumns = visibleFields.map((field) => ({
    key: field.name,
    label: field.displayName,
  }));

  const orderedColumns: Column[] =
    columnOrderProp && columnOrderProp.length > 0
      ? [
          ...columnOrderProp
            .map((key) => baseColumns.find((col) => col.key === key))
            .filter((col): col is Column => col != null),
          ...baseColumns.filter((col) => !columnOrderProp.includes(col.key)),
        ]
      : baseColumns;

  const allColumns = mergeExtraColumns(orderedColumns, extraColumns);

  const allColumnKeys = allColumns.map((col) => col.key);

  const baseDefs: ColumnDefWithAccessorKey<TRecord>[] =
    entity.fields
      ?.filter(
        (field) => !field.isHiddenField && !systemFields.includes(field.name),
      )
      .map((field) => {
        const accessorKey = field.name;
        const formatType = FORMAT_TYPE_MAP[field.fieldDataType.name];

        const formatValue = formatType
          ? (value: unknown) =>
              renderValueOrEmptyState(value, { type: formatType })
          : (value: unknown) => renderValueOrEmptyState(value);

        return {
          accessorKey,
          enableColumnFilter: true,
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={field.displayName} />
          ),
          meta: {
            displayName: field.displayName,
            ...(formatType ? { getFilterValue: formatValue } : {}),
          },
          cell: ({ getValue }) => (
            <div className="max-w-[200px] truncate">
              {formatValue(getValue())}
            </div>
          ),
        };
      }) ?? [];

  const overriddenDefs = columnOverrides
    ? baseDefs.map((def) => {
        const override = columnOverrides[def.accessorKey];
        return override ? override(def) : def;
      })
    : baseDefs;

  const extraDefs = extraColumns?.map((ec) => ec.definition) ?? [];
  const columns: ColumnDef<TRecord, unknown>[] = [
    ...overriddenDefs,
    ...extraDefs,
  ];

  return { allColumns, allColumnKeys, columns };
}
