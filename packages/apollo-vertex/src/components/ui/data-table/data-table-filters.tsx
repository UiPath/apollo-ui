import type { Row, RowData } from "@tanstack/react-table";

export const dataTableGlobalFilterFn = (
  row: Row<RowData>,
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

export const dataTableFacetedFilterFn = (
  row: Row<RowData>,
  columnId: string,
  filterValue: unknown,
): boolean => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0)
    return true;
  const cellValue = String(row.getValue(columnId) ?? "");
  return filterValue.includes(cellValue);
};
