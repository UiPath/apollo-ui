"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { renderValueOrEmptyState } from "@/lib/renderValueOrEmptyState";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IxpVerdict, type IxpField } from "../schema";
import { VerdictBadge } from "./verdict-badge";

/** Render a field's value list (multi-valued fields join with " | "). Empty,
 * absent, and null values all render the same way (—); the field-value arrays
 * can contain nulls (IXP emits null for taxonomy fields it didn't extract). */
function formatFieldValues(values: unknown[]): string {
  const present = values.filter((v) => v != null && v !== "").map(String);
  return present.length > 0
    ? present.join(" | ")
    : renderValueOrEmptyState(null);
}

/** One field group within a document: a heading + a table of fields. Identical
 * fields are hidden behind a toggle so the changes stand out. */
export const FieldGroup = ({
  group,
  fields,
}: {
  group: string;
  fields: IxpField[];
}) => {
  const { t } = useTranslation();
  const [showUnchanged, setShowUnchanged] = useState(false);

  const changed = fields.filter((f) => f.verdict !== IxpVerdict.Identical);
  const identicalCount = fields.length - changed.length;
  const visible = showUnchanged ? fields : changed;

  return (
    <div className="mt-3 first:mt-0">
      <h5 className="mb-1 text-xs font-semibold text-muted-foreground">
        {group}
      </h5>
      {visible.length > 0 && (
        <div className="rounded-md border">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="h-8 px-2 text-xs">
                  {t("ixp_field")}
                </TableHead>
                <TableHead className="h-8 px-2 text-xs">
                  {t("ixp_baseline")}
                </TableHead>
                <TableHead className="h-8 px-2 text-xs">
                  {t("ixp_new")}
                </TableHead>
                <TableHead className="h-8 px-2 text-right text-xs">
                  {t("ixp_verdict")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((f) => (
                <TableRow key={f.field} className="align-top">
                  <TableCell className="px-2 py-1 font-medium whitespace-normal break-words">
                    {f.field}
                  </TableCell>
                  <TableCell className="px-2 py-1 whitespace-normal break-words text-muted-foreground">
                    {formatFieldValues(f.expected)}
                  </TableCell>
                  <TableCell className="px-2 py-1 whitespace-normal break-words">
                    {formatFieldValues(f.actual)}
                    {f.reason && f.verdict !== IxpVerdict.Identical && (
                      <div className="mt-0.5 text-[11px] italic text-muted-foreground">
                        {f.reason}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-right">
                    <VerdictBadge verdict={f.verdict} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {identicalCount > 0 && (
        <Button
          variant="link"
          size="sm"
          onClick={() => setShowUnchanged((s) => !s)}
          className="mt-1 h-auto p-0 text-xs text-muted-foreground"
        >
          {showUnchanged
            ? t("ixp_hide_unchanged")
            : t("ixp_show_unchanged", { count: identicalCount })}
        </Button>
      )}
    </div>
  );
};
