"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  FieldCell,
  FieldGroupHeading,
  FieldRow,
  FieldTable,
} from "../../../ixp/shared/field-table";
import { formatFieldValues } from "../../../ixp/shared/format-values";
import { IxpVerdict, type IxpField } from "../schema";
import { VerdictBadge } from "./verdict-badge";

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
      <FieldGroupHeading>{group}</FieldGroupHeading>
      {visible.length > 0 && (
        <FieldTable
          columns={[
            { label: t("ixp_field") },
            { label: t("ixp_baseline") },
            { label: t("ixp_new") },
            { label: t("ixp_verdict"), align: "right" },
          ]}
        >
          {visible.map((f, i) => (
            // oxlint-disable-next-line react(no-array-index-key) -- line items repeat field names; no stable per-row id and the table never reorders
            <FieldRow key={`${f.field}-${i}`}>
              <FieldCell className="font-medium">{f.field}</FieldCell>
              <FieldCell muted>{formatFieldValues(f.expected)}</FieldCell>
              <FieldCell>
                {formatFieldValues(f.actual)}
                {f.verdict_reason && f.verdict !== IxpVerdict.Identical && (
                  <div className="mt-0.5 text-[11px] italic text-muted-foreground">
                    {f.verdict_reason}
                  </div>
                )}
              </FieldCell>
              <FieldCell align="right">
                <VerdictBadge verdict={f.verdict} />
              </FieldCell>
            </FieldRow>
          ))}
        </FieldTable>
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
