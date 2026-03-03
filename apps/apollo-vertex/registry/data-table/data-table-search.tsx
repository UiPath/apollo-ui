import type { Table as TanstackTable } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";

interface DataTableSearchProps<TData> {
  table: TanstackTable<TData>;
  placeholder?: string;
  className?: string;
}

function DataTableSearch<TData>({
  table,
  placeholder,
  className,
}: DataTableSearchProps<TData>) {
  const { t } = useTranslation();
  return (
    <div data-slot="data-table-search" className={className}>
      <Input
        placeholder={placeholder ?? t("search")}
        value={String(table.getState().globalFilter ?? "")}
        onChange={(e) => table.setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />
    </div>
  );
}

export { DataTableSearch };
