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
  IxpDocStatus,
  IxpVerdict,
  type IxpDocument,
  type IxpField,
} from "../schema";
import { FieldGroup } from "./field-group";

/** Group a document's fields by their `group` (e.g. "<Doc> > <Section>"),
 * preserving first-seen order. */
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
  return (
    <div className="flex items-center gap-1.5">
      {different > 0 && (
        <Badge status="error" variant="secondary">
          {t("ixp_count_different", { count: different })}
        </Badge>
      )}
      {semanticallySame > 0 && (
        <Badge status="warning" variant="secondary">
          {t("ixp_count_semantically_same", { count: semanticallySame })}
        </Badge>
      )}
      {different === 0 && semanticallySame === 0 && (
        <Badge status="success" variant="secondary">
          {t("ixp_doc_match")}
        </Badge>
      )}
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
  const different = doc.fields.filter(
    (f) => f.verdict === IxpVerdict.Different,
  ).length;
  const semanticallySame = doc.fields.filter(
    (f) => f.verdict === IxpVerdict.SemanticallySame,
  ).length;
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
        <span className="flex-1 truncate text-sm font-medium">
          {doc.document}
        </span>
        <DocumentSummary
          doc={doc}
          different={different}
          semanticallySame={semanticallySame}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t px-3 pb-3">
        {groups.map(([group, fields]) => (
          <FieldGroup key={group} group={group} fields={fields} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};
