import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface StructuredTableColumn {
  key: string;
  label: string;
  align: "left" | "right";
  /** A Tailwind width class (prompt 50), for a column whose content has a
   * known, narrow natural width (e.g. a capability name): without it,
   * `table-layout: auto` on a `w-full` table can hand a short column far
   * more room than its longest value needs, stranding the next column's
   * start well away from it. Omit for a column that should keep taking
   * whatever the auto layout gives it, unchanged from before this. */
  width?: string;
}

export interface StructuredTableRow {
  key: string;
  /** Keyed by column key, so a row only needs entries for the columns it
   * has values for. */
  cells: Record<string, ReactNode>;
  /** Marks the row being compared against the others, e.g. the subject of
   * a benchmark. Neutral: being the subject of a comparison isn't a fault,
   * so this never carries a status colour. Mutually exclusive with
   * `status` in practice, not enforced at the type level since nothing
   * needs both today. */
  emphasized?: boolean;
  /** Marks a row as a genuine exception state (prompt 51), distinct from
   * `emphasized`: a row under comparison and a row that's actually wrong
   * mean different things, so they carry different treatments rather than
   * sharing one flag. "warning" is the only value needed today (an open
   * exception's deviating row); more could join it later the same way
   * `align`'s own two values did. */
  status?: "warning";
}

export interface StructuredTableProps {
  caption?: ReactNode;
  columns: StructuredTableColumn[];
  rows: StructuredTableRow[];
}

/** The heading above a table: sentence case, bold, `text-foreground`
 * (matching the weight and colour a marked row's own subject text already
 * carries, e.g. the terms table's "Order form v1 · §4"), not the small
 * caps treatment this used before. Distinct from a table's own column
 * labels (`text-xs font-medium text-foreground`, unchanged) by weight,
 * and from a caption below the table (`text-[11px]`, unmarked weight) by
 * size and weight. */
const TABLE_HEADING_CLASSNAME = "text-xs font-semibold text-foreground";

/** The row-level wash and weight for `status`/`emphasized` (prompt 50 for
 * the neutral case, prompt 51 for the status one): `status` wins if a row
 * somehow carried both, since a genuine exception state is the stronger
 * claim of the two. Split from the border colour below so column mode can
 * put the background on the whole `<tr>` while the border lands on just
 * the first cell (a border set directly on a `<tr>` is unreliable across
 * browsers; a background colour isn't). */
function rowBackgroundClassName(row: StructuredTableRow): string | undefined {
  if (row.status === "warning") {
    return "bg-warning/15 dark:bg-warning/25 font-semibold";
  }
  if (row.emphasized) return "bg-muted/40 font-semibold";
}

/** The same row's own leading border colour: `warning`, an actual status
 * hue, for a row that's wrong; `foreground`, the base text colour, for a
 * row that's merely the subject of an even comparison. Two different
 * claims, so two different colours, never the same one reused for both. */
function rowBorderClassName(row: StructuredTableRow): string | undefined {
  if (row.status === "warning") return "border-l-2 border-warning";
  if (row.emphasized) return "border-l-2 border-foreground";
}

/** One row, stacked (prompt 47): the first column (the row's own subject,
 * e.g. a deal or a capability) on its own line, unlabelled. A right
 * aligned column is a figure that loses its meaning once it leaves a
 * column of its own kind, so each renders labelled with its own column
 * header; a left aligned column is text that already reads in context
 * following the subject, so it renders plainly beneath, the same shape
 * prompt 43's own capability list used before this had a table at all.
 *
 * `emphasized` (prompt 50): a left border in `foreground`, the base text
 * colour rather than any status hue, since being the row under comparison
 * isn't a warning or a success, paired with a heavier weight. Stronger
 * than the previous `bg-muted/40` wash alone, which read as zebra
 * striping rather than a marked row; the tint stays, the border and
 * weight are what actually says "this one." `status` (prompt 51) is the
 * separate, amber-carrying flag for a row that's an actual exception
 * state, not a neutral comparison subject. */
function StackedRow({
  columns,
  row,
}: {
  columns: StructuredTableColumn[];
  row: StructuredTableRow;
}) {
  const [subject, ...rest] = columns;
  const textColumns = rest.filter((column) => column.align === "left");
  const figureColumns = rest.filter((column) => column.align === "right");

  return (
    <li
      className={cn(
        "py-2.5 pl-2.5 text-xs",
        rowBackgroundClassName(row),
        rowBorderClassName(row),
      )}
    >
      {subject && (
        <p className="font-medium text-foreground">{row.cells[subject.key]}</p>
      )}
      {textColumns.map((column) => (
        <p key={column.key} className="mt-0.5 text-muted-foreground">
          {row.cells[column.key]}
        </p>
      ))}
      {figureColumns.length > 0 && (
        <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {figureColumns.map((column) => (
            <span key={column.key} className="text-muted-foreground">
              {column.label}{" "}
              <span className="font-medium tabular-nums text-foreground">
                {row.cells[column.key]}
              </span>
            </span>
          ))}
        </div>
      )}
    </li>
  );
}

/**
 * A generic comparison table (prompt 45): structural, not markup, so
 * tabular content doesn't get rendered as a run on sentence. Lives outside
 * any one surface's own directory (not the assistant panel's, not the
 * workbench's) since the buyer workbench's own comparisons, the assistant
 * panel, and later analytics surfaces all need the same shape rather than
 * three bespoke renderings of it.
 *
 * No fixed column count or row count: both come entirely from the caller.
 *
 * Two shapes, switched by the container's own width, not the viewport's
 * (prompt 47: this renders inside a fixed width assistant panel that isn't
 * itself the viewport, so a media query would answer the wrong question).
 * At `@md` (28rem, 448px) and up, columns, built on Apollo's own `Table`
 * primitive. Below that, a stacked list: every value still visible, no
 * horizontal scroll to find it. The threshold isn't the assistant panel's
 * own width (332px of usable space, see the report): it's the width a
 * three column table like the comparable deals needs to hold its own
 * longest descriptor and two labelled figures without wrapping or
 * crowding the divider between columns, measured live and rounded up to
 * Tailwind's own nearest container breakpoint rather than a bespoke
 * number, so this reads as an ordinary responsive threshold, not a
 * one off tuned to this one table's content. */
export function StructuredTable({
  caption,
  columns,
  rows,
}: StructuredTableProps) {
  return (
    <div className="@container">
      <div className="hidden @md:block">
        <Table className="caption-top">
          {caption && (
            <TableCaption
              className={cn("mt-0 mb-2 text-left", TABLE_HEADING_CLASSNAME)}
            >
              {caption}
            </TableCaption>
          )}
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "text-xs",
                    column.align === "right" && "text-right",
                    column.width,
                  )}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key} className={rowBackgroundClassName(row)}>
                {columns.map((column, i) => (
                  <TableCell
                    key={column.key}
                    className={cn(
                      "text-xs",
                      column.align === "right" && "text-right tabular-nums",
                      column.width,
                      i === 0 && rowBorderClassName(row),
                    )}
                  >
                    {row.cells[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="@md:hidden">
        {caption && (
          <p className={cn("mb-2", TABLE_HEADING_CLASSNAME)}>{caption}</p>
        )}
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <StackedRow key={row.key} columns={columns} row={row} />
          ))}
        </ul>
      </div>
    </div>
  );
}
