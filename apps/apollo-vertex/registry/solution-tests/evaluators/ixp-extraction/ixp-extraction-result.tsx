"use client";

import { useTranslation } from "react-i18next";
import type { EvaluatorResultProps } from "../registry";
import type { IxpDetails } from "./schema";
import { ProvenanceBar } from "./internal/provenance-bar";
import { SummaryBar } from "./internal/summary-bar";
import { DocumentRow } from "./internal/document-row";

/** IXP document-extraction evaluator view: taxonomy provenance, a verdict
 * summary, and a per-document / per-field comparison. Renders entirely from
 * the evaluator details — it does not read the raw expected/actual outputs.
 * Details are validated by the registry, so they arrive already typed. */
export const IxpExtractionResult = ({
  evaluatorDetails,
}: EvaluatorResultProps<IxpDetails>) => {
  const { t } = useTranslation();
  const {
    documents,
    different_field_count,
    semantically_same_field_count,
    identical_field_count,
    expected_provenance,
    actual_provenance,
  } = evaluatorDetails;

  return (
    <div className="flex flex-col gap-4">
      <ProvenanceBar
        expected={expected_provenance}
        actual={actual_provenance}
      />
      <SummaryBar
        different={different_field_count}
        semanticallySame={semantically_same_field_count}
        identical={identical_field_count}
      />
      <div className="flex flex-col gap-2">
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("ixp_no_documents")}
          </p>
        ) : (
          documents.map((doc) => <DocumentRow key={doc.document} doc={doc} />)
        )}
      </div>
    </div>
  );
};
