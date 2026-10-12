"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EMPTY_VALUE } from "./constants";

export interface BaselineCompareRow {
  label: string;
  baseline: string | null;
  current: string | null;
  mono?: boolean;
  /** Rendered after the new-run value to flag a change, e.g. a
   *  VersionDeltaGlyph or a "Changed" badge. */
  marker?: ReactNode;
}

// Shows baseline and new-run values side by side rather than collapsing to a
// single value, so an unchanged value reads as unchanged on its own.
export const BaselineCompare = ({ rows }: { rows: BaselineCompareRow[] }) => {
  const { t } = useTranslation();
  const visible = rows.filter(
    (row) => row.baseline != null || row.current != null,
  );
  if (visible.length === 0) return null;

  return (
    <div className="w-fit max-w-full rounded-md border bg-muted/30">
      <Table className="w-auto text-xs">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-8 px-3" />
            <TableHead className="h-8 px-3 text-xs">
              {t("compare_baseline")}
            </TableHead>
            <TableHead className="h-8 px-3 text-xs">
              {t("compare_new_run")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((row) => (
            <CompareRow key={row.label} row={row} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const CompareRow = ({ row }: { row: BaselineCompareRow }) => {
  // whitespace-normal + overflow-wrap so long ids wrap in a narrow pane
  // instead of pushing the new-run column out of view.
  const valueClass = cn(
    "px-3 py-1.5 whitespace-normal [overflow-wrap:anywhere] text-foreground",
    row.mono && "font-mono",
  );

  return (
    <TableRow className="hover:bg-transparent">
      <TableHead
        scope="row"
        className="h-auto px-3 py-1.5 text-xs font-medium text-muted-foreground"
      >
        {row.label}
      </TableHead>
      <TableCell className={valueClass}>
        {row.baseline ?? EMPTY_VALUE}
      </TableCell>
      <TableCell className={valueClass}>
        <span className="inline-flex flex-wrap items-center gap-1">
          {row.current ?? EMPTY_VALUE}
          {row.marker}
        </span>
      </TableCell>
    </TableRow>
  );
};
