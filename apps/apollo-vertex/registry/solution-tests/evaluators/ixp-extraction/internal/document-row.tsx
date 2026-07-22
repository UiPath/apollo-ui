"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  IxpDocStatus,
  IxpVerdict,
  type IxpDocument,
  type IxpField,
} from "../schema";
import { FieldGroup } from "./field-group";

/** Group fields by their `group` ("<Doc> > <Section>"), preserving first-seen
 * order. (A Map rather than Object.groupBy — consumers target the ES2023 lib.) */
function groupFields(fields: IxpField[]): [string, IxpField[]][] {
  const map = new Map<string, IxpField[]>();
  for (const f of fields) {
    const list = map.get(f.group);
    if (list) list.push(f);
    else map.set(f.group, [f]);
  }
  return [...map.entries()];
}

/** Per-document summary chips + status, shown on the row so the outcome is
 * legible without expanding. */
const DocumentSummary = ({
  doc,
  different,
  semanticallySame,
}: {
  doc: IxpDocument;
  different: number;
  semanticallySame: number;
}) => {
  const { t } = useTranslation();
  if (doc.status === IxpDocStatus.MissingInActual) {
    return <Badge status="error">{t("ixp_doc_missing")}</Badge>;
  }
  if (doc.status === IxpDocStatus.NewInActual) {
    return <Badge status="info">{t("ixp_doc_new")}</Badge>;
  }

  const hasDiff = different > 0;
  const hasSemantic = semanticallySame > 0;
  const isPerfectMatch = !hasDiff && !hasSemantic;
  const metrics = [
    {
      show: hasDiff,
      status: "error",
      labelKey: "ixp_count_different",
      count: different,
    },
    {
      show: hasSemantic,
      status: "warning",
      labelKey: "ixp_count_semantically_same",
      count: semanticallySame,
    },
    { show: isPerfectMatch, status: "success", labelKey: "ixp_doc_match" },
  ] as const;

  return (
    <div className="flex items-center gap-1.5">
      {metrics
        .filter((m) => m.show)
        .map((m) => (
          <Badge key={m.labelKey} status={m.status} variant="secondary">
            {"count" in m ? t(m.labelKey, { count: m.count }) : t(m.labelKey)}
          </Badge>
        ))}
      <span className="text-xs text-muted-foreground">
        {t("ixp_identical_ratio", {
          identical: doc.identical_count,
          total: doc.total_fields,
        })}
      </span>
    </div>
  );
};

/** A collapsible per-document section. Clean (all-identical) documents start
 * collapsed; anything with a change or a missing/new status starts open. */
export const DocumentRow = ({ doc }: { doc: IxpDocument }) => {
  const { t } = useTranslation();
  const verdictCounts = doc.fields.reduce<Record<string, number>>((acc, f) => {
    acc[f.verdict] = (acc[f.verdict] ?? 0) + 1;
    return acc;
  }, {});
  const different = verdictCounts[IxpVerdict.Different] ?? 0;
  const semanticallySame = verdictCounts[IxpVerdict.SemanticallySame] ?? 0;
  const isClean =
    doc.status === IxpDocStatus.Compared &&
    different === 0 &&
    semanticallySame === 0;
  const [open, setOpen] = useState(!isClean);
  const groups = groupFields(doc.fields);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-md border"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 p-3 text-left hover:bg-muted/30">
        <ChevronRight
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden="true"
        />
        <div className="flex flex-1 items-center gap-2 truncate">
          <span className="truncate text-sm font-medium">{doc.document}</span>
          {doc.previous_document ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  status="warning"
                  variant="secondary"
                  className="shrink-0"
                >
                  {t("ixp_doc_reclassified")}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {t("ixp_doc_reclassified_tooltip", {
                  previous: doc.previous_document,
                })}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <DocumentSummary
          doc={doc}
          different={different}
          semanticallySame={semanticallySame}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t p-3">
        {groups.map(([group, fields]) => (
          <FieldGroup key={group} group={group} fields={fields} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};
