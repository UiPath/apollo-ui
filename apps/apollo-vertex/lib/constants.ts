export const ENTITY_TABLE_STORAGE_PREFIX = "entity-table-";
export const ENTITY_TABLE_COLUMNS_STORAGE_PREFIX = "entity-table-columns-";

export const FORMAT_TYPE_MAP: Record<string, "date" | "datetime" | "number"> = {
  DATE: "date",
  DATETIME_WITH_TZ: "datetime",
  DECIMAL: "number",
};

export interface DateFormatOptions extends Intl.DateTimeFormatOptions {
  hideEmptyTime?: boolean;
}

export const DEFAULT_DATE_FORMAT_OPTIONS: DateFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hideEmptyTime: true,
};

export const DEFAULT_DATETIME_FORMAT_OPTIONS: DateFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
};
