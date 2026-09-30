"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
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
// Value columns may shrink below their content so long ids wrap in a narrow pane.
export const BaselineCompare = ({ rows }: { rows: BaselineCompareRow[] }) => {
  const visible = rows.filter(
    (row) => row.baseline != null || row.current != null,
  );
  if (visible.length === 0) return null;

  return (
    <div className="grid w-fit max-w-full grid-cols-[max-content_minmax(0,max-content)_minmax(0,max-content)] items-center gap-x-6 gap-y-1 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      {visible.map((row) => (
        <CompareRow key={row.label} row={row} />
      ))}
    </div>
  );
};

const CompareRow = ({ row }: { row: BaselineCompareRow }) => {
  const { t } = useTranslation();
  const valueClass = cn(
    "text-foreground [overflow-wrap:anywhere]",
    row.mono && "font-mono",
  );

  return (
    <div className="contents">
      <span className="font-medium">{row.label}</span>
      <span>
        {`${t("compare_baseline")}: `}
        <span className={valueClass}>{row.baseline ?? EMPTY_VALUE}</span>
      </span>
      <span className="inline-flex min-w-0 flex-wrap items-center gap-1">
        {`${t("compare_new_run")}: `}
        <span className={valueClass}>{row.current ?? EMPTY_VALUE}</span>
        {row.marker}
      </span>
    </div>
  );
};
