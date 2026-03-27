"use client";

import type { Table as TanstackTable } from "@tanstack/react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps<TData> {
  table: TanstackTable<TData>;
  paginationSizes?: number[];
  className?: string;
}

function DataTablePagination<TData>({
  table,
  paginationSizes = [10, 25, 50, 100],
  className,
}: DataTablePaginationProps<TData>) {
  // React Compiler compat: TanStack Table objects have stable references with mutable state.
  "use no memo";
  const { t } = useTranslation();
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageCount > 0 && pageIndex < pageCount - 1;

  return (
    <div
      data-slot="data-table-pagination"
      className={cn(
        "flex items-center justify-between px-2 flex-wrap gap-2",
        className,
      )}
    >
      <div className="text-muted-foreground flex-1 text-sm">
        {table.options.enableRowSelection &&
          t("rows_selected", {
            selected: table.getFilteredSelectedRowModel().rows.length,
            total: totalRows,
            defaultValue: "{{selected}} of {{total}} row(s) selected.",
          })}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">
            {t("rows_per_page", { defaultValue: "Rows per page" })}
          </p>
          <Select
            value={paginationSizes.includes(pageSize) ? `${pageSize}` : "all"}
            onValueChange={(value) => {
              table.setPageSize(
                value === "all" ? Number.MAX_SAFE_INTEGER : Number(value),
              );
            }}
          >
            <SelectTrigger size="sm" className="w-[80px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top" position="popper">
              {paginationSizes.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
              <SelectItem value="all">
                {t("all", { defaultValue: "All" })}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          {t("page", { defaultValue: "Page" })} {pageIndex + 1}{" "}
          {t("of", { defaultValue: "of" })} {pageCount}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">
              {t("go_to_first_page", { defaultValue: "Go to first page" })}
            </span>
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">
              {t("go_to_previous_page", {
                defaultValue: "Go to previous page",
              })}
            </span>
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!canNextPage}
          >
            <span className="sr-only">
              {t("go_to_next_page", { defaultValue: "Go to next page" })}
            </span>
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden lg:flex"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!canNextPage}
          >
            <span className="sr-only">
              {t("go_to_last_page", { defaultValue: "Go to last page" })}
            </span>
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}

export { DataTablePagination };
