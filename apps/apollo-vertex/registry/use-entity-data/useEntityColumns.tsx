import { useMemo } from "react";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/ui/data-table";

import type {
  ColumnDefWithAccessorKey,
  EntityRecord,
  ExtraColumn,
  VssEntity,
} from "./useEntityData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Column {
  key: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatTypeMap: Record<string, "date" | "datetime" | "number"> = {
  DATE: "date",
  DATETIME_WITH_TZ: "datetime",
  DECIMAL: "number",
};

function renderValueOrEmptyState(
  value: unknown,
  options?: { type?: "date" | "datetime" | "number" },
): string {
  if (value == null || value === "") return "\u2014";

  if (options?.type === "number") {
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return num.toLocaleString();
  }

  if (options?.type === "date" || options?.type === "datetime") {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return options.type === "date"
      ? date.toLocaleDateString()
      : date.toLocaleString();
  }

  return String(value);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

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
  const allColumns: Column[] = useMemo(() => {
    const visibleFields =
      entity.fields?.filter(
        (field) => !field.isHiddenField && !systemFields.includes(field.name),
      ) ?? [];

    const baseColumns = visibleFields.map((field) => ({
      key: field.name,
      label: field.displayName,
    }));

    let orderedColumns: Column[];
    if (columnOrderProp && columnOrderProp.length > 0) {
      const baseMap = new Map(baseColumns.map((col) => [col.key, col]));
      const prioritized = columnOrderProp
        .map((key) => baseMap.get(key))
        .filter((col): col is Column => col != null);
      const remaining = baseColumns.filter(
        (col) => !columnOrderProp.includes(col.key),
      );
      orderedColumns = [...prioritized, ...remaining];
    } else {
      orderedColumns = baseColumns;
    }

    if (extraColumns && extraColumns.length > 0) {
      const starts = extraColumns
        .filter((ec) => ec.position === "start")
        .map((ec) => ec.column);
      const ends = extraColumns
        .filter((ec) => ec.position === "end")
        .map((ec) => ec.column);
      orderedColumns = [...starts, ...orderedColumns, ...ends];
    }

    return orderedColumns;
  }, [entity, systemFields, columnOrderProp, extraColumns]);

  const allColumnKeys = useMemo(
    () => allColumns.map((col) => col.key),
    [allColumns],
  );

  const columns: ColumnDef<TRecord, unknown>[] = useMemo(() => {
    const baseDefs: ColumnDefWithAccessorKey<TRecord>[] = [];

    entity.fields?.forEach((field) => {
      if (!field.isHiddenField && !systemFields.includes(field.name)) {
        const accessorKey = field.name;
        const formatType = formatTypeMap[field.fieldDataType.name];

        const formatValue = formatType
          ? (value: unknown) =>
              renderValueOrEmptyState(value, { type: formatType })
          : (value: unknown) => renderValueOrEmptyState(value);

        baseDefs.push({
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
        });
      }
    });

    const overriddenDefs = columnOverrides
      ? baseDefs.map((def) => {
          const override = columnOverrides[def.accessorKey];
          return override ? override(def) : def;
        })
      : baseDefs;

    const extraDefs = extraColumns?.map((ec) => ec.definition) ?? [];
    return [...overriddenDefs, ...extraDefs];
  }, [entity, systemFields, columnOverrides, extraColumns]);

  return { allColumns, allColumnKeys, columns };
}
