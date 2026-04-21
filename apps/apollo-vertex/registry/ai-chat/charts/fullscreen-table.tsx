"use client";

import { useQuery } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/registry/button/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/select/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/table/table";

type Row = Record<string, unknown>;

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export interface QueryEntityParams {
  skip: number;
  top: number;
  sortBy?: { field: string; direction: "asc" | "desc" } | null;
}

export interface QueryEntityResult {
  rows: Row[];
  totalRecordCount: number;
}

export type QueryEntityFn = (
  params: QueryEntityParams,
) => Promise<QueryEntityResult>;

interface FullscreenTableProps {
  columns: string[];
  queryEntity: QueryEntityFn;
  entityName: string;
}

export function FullscreenTable({
  columns,
  queryEntity,
  entityName,
}: FullscreenTableProps) {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const sortBy = sorting[0]
    ? { field: sorting[0].id, direction: sorting[0].desc ? "desc" as const : "asc" as const }
    : null;

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: [entityName, "fullscreen-query", pageIndex, pageSize, sortBy],
    queryFn: () =>
      queryEntity({ skip: pageIndex * pageSize, top: pageSize, sortBy }),
    placeholderData: (prev) => prev,
  });

  const rows = data?.rows ?? [];
  const totalRecordCount = data?.totalRecordCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalRecordCount / pageSize));

  const columnDefs: ColumnDef<Row>[] = columns.map((col) => ({
    accessorKey: col,
    header: col,
    cell: ({ getValue }) => {
      const value = getValue();
      if (value == null) return "";
      if (typeof value === "string") return value;
      if (typeof value === "number" || typeof value === "boolean")
        return String(value);
      return JSON.stringify(value);
    },
  }));

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) => {
      setSorting(updater);
      setPageIndex(0);
    },
    state: { sorting },
    manualPagination: true,
    pageCount,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-auto relative">
        {(isLoading || isPlaceholderData) && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              {table.getFlatHeaders().map((header) => (
                <TableHead
                  key={header.id}
                  className="cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                  {header.column.getIsSorted() === "asc" && " \u2191"}
                  {header.column.getIsSorted() === "desc" && " \u2193"}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              !isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("no_data_available")}
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t pt-3 mt-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("rows_per_page")}</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPageIndex(0);
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">
            {t("total_records", { count: totalRecordCount })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("page_of", { current: pageIndex + 1, total: pageCount })}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setPageIndex((prev) => prev - 1)}
            disabled={pageIndex === 0}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setPageIndex((prev) => prev + 1)}
            disabled={pageIndex >= pageCount - 1}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
