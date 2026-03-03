import type { Table as TanstackTable } from "@tanstack/react-table";
import { Settings2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DataTableViewOptionsProps<TData> {
  table: TanstackTable<TData>;
  className?: string;
}

function DataTableViewOptions<TData>({
  table,
  className,
}: DataTableViewOptionsProps<TData>) {
  "use no memo";
  const { t } = useTranslation();
  return (
    <div data-slot="data-table-view-options" className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto hidden h-9 lg:flex"
          >
            <Settings2Icon />
            {t("view")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          <DropdownMenuLabel>{t("toggle_columns")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter(
              (column) => column.accessorFn != null && column.getCanHide(),
            )
            .map((column) => {
              const meta = column.columnDef.meta as
                | { displayName?: string }
                | undefined;
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {meta?.displayName ?? column.id}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { DataTableViewOptions };
