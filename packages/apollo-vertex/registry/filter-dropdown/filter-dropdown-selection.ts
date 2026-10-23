import type { DataTableColumn, RowData } from "@/lib/table-features";
import type { useVertexTranslation } from "@/lib/vertex-translation";

interface FilterDropdownSelectionSource<TData extends RowData, TValue> {
  column?: DataTableColumn<TData, TValue>;
  value?: string[] | string;
  onChange?: (value: string[] | string) => void;
  multiSelect: boolean;
}

function readSelectedValues<TData extends RowData, TValue>({
  column,
  value,
  multiSelect,
}: FilterDropdownSelectionSource<TData, TValue>): string[] {
  if (column) {
    const filterValue = column.getFilterValue();
    if (multiSelect) {
      return Array.isArray(filterValue)
        ? filterValue.filter((v): v is string => typeof v === "string")
        : [];
    }
    if (Array.isArray(filterValue) && typeof filterValue[0] === "string") {
      return [filterValue[0]];
    }
    if (typeof filterValue === "string") return [filterValue];
    if (typeof filterValue === "number") return [String(filterValue)];
    return [];
  }
  if (value != null) {
    if (multiSelect) {
      return Array.isArray(value) ? value : [];
    }
    return [String(value)];
  }
  return [];
}

function writeSelectedValues<TData extends RowData, TValue>(
  {
    column,
    onChange,
    multiSelect,
  }: FilterDropdownSelectionSource<TData, TValue>,
  next: string[],
) {
  if (column) {
    if (multiSelect) {
      column.setFilterValue(next.length > 0 ? next : []);
    } else {
      column.setFilterValue(next.length > 0 ? [next[0]] : []);
    }
  } else if (onChange) {
    if (multiSelect) {
      (onChange as (v: string[]) => void)(next);
    } else {
      (onChange as (v: string) => void)(next[0] ?? "");
    }
  }
}

interface FilterTriggerLabelInput {
  title: string;
  selectedValues: string[];
  multiSelect: boolean;
  getOptionLabel: (value: string) => string;
  t: ReturnType<typeof useVertexTranslation>["t"];
}

function filterTriggerLabel({
  title,
  selectedValues,
  multiSelect,
  getOptionLabel,
  t,
}: FilterTriggerLabelInput): string {
  const [first] = selectedValues;
  if (!multiSelect) return first == null ? title : getOptionLabel(first);
  if (first == null)
    return t("filter_trigger_all", { title, defaultValue: "{{title}}: All" });
  if (selectedValues.length === 1) {
    return t("filter_trigger_value", {
      title,
      value: getOptionLabel(first),
      defaultValue: "{{title}}: {{value}}",
    });
  }
  return t("filter_trigger_count", {
    title,
    count: selectedValues.length,
    defaultValue: "{{title}}: {{count}} selected",
  });
}

export { filterTriggerLabel, readSelectedValues, writeSelectedValues };
