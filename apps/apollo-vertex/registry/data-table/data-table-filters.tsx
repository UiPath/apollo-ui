import type { RowData } from "@tanstack/react-table";

import type { DataTableRow } from "./data-table-features";

export const dataTableGlobalFilterFn = <TData extends RowData>(
  row: DataTableRow<TData>,
  _columnId: string,
  filterValue: string,
): boolean => {
  if (!filterValue) return true;

  const searchStr = filterValue.toLowerCase();

  return row.getVisibleCells().some((cell) => {
    const value = cell.getValue();
    const meta = cell.column.columnDef.meta;
    const displayValue = meta?.getFilterValue
      ? meta.getFilterValue(value, row)
      : typeof value === "string"
        ? value
        : typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : "";
    return displayValue.toLowerCase().includes(searchStr);
  });
};

export const dataTableFacetedFilterFn = <TData extends RowData>(
  row: DataTableRow<TData>,
  columnId: string,
  filterValue: unknown,
): boolean => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0)
    return true;
  const cellValue = String(row.getValue(columnId) ?? "");
  return filterValue.includes(cellValue);
};
