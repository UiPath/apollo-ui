"use client";

import { useTranslation } from "react-i18next";
import type { EvaluatorResultProps } from "../registry";
import { IxpDetailsSchema } from "./schema";
import { ProvenanceBar } from "./internal/provenance-bar";
import { SummaryBar } from "./internal/summary-bar";
import { DocumentRow } from "./internal/document-row";

/** IXP document-extraction evaluator view: taxonomy provenance, a verdict
 * summary, and a per-document / per-field comparison. Renders entirely from
 * the evaluator `details` — it does not read the raw expected/actual outputs. */
export const IxpExtractionResult = ({ details }: EvaluatorResultProps) => {
  const { t } = useTranslation();

  let raw: unknown = details;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }
  const parsed = IxpDetailsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const d = parsed.data;

  return (
    <div className="flex flex-col gap-4">
      <ProvenanceBar
        expected={d.expected_provenance}
        actual={d.actual_provenance}
      />
      <SummaryBar
        different={d.different_field_count}
        semanticallySame={d.semantically_same_field_count}
        identical={d.identical_field_count}
      />
      <div className="flex flex-col gap-2">
        {d.documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("ixp_no_documents")}
          </p>
        ) : (
          d.documents.map((doc) => <DocumentRow key={doc.document} doc={doc} />)
        )}
      </div>
    </div>
  );
};
