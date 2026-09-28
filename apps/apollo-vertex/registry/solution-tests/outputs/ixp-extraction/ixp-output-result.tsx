"use client";

import { useTranslation } from "react-i18next";
import { DocumentSection } from "../../ixp/shared/document-section";
import {
  FieldCell,
  FieldGroupHeading,
  FieldRow,
  FieldTable,
} from "../../ixp/shared/field-table";
import { formatFieldValues } from "../../ixp/shared/format-values";
import type { ProcessOutputProps } from "../registry";
import { makeProcessOutputRenderer } from "../registry";
import {
  IxpOutputSchema,
  type IxpDocumentExtraction,
  type IxpExtractionGroup,
  type IxpOutput,
} from "./schema";

export const IxpOutputResult = ({ output }: ProcessOutputProps<IxpOutput>) => {
  const { t } = useTranslation();
  const documents = Object.entries(output.document_extractions);

  return (
    <div className="flex flex-col gap-4">
      <OutputSummary output={output} documentCount={documents.length} />
      <div className="flex flex-col gap-2">
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("ixp_output_no_documents")}
          </p>
        ) : (
          documents.map(([fileKey, doc]) => (
            <DocumentExtractionRow key={fileKey} doc={doc} />
          ))
        )}
      </div>
    </div>
  );
};

// Falls back to the document count when the payload omits total_files.
const OutputSummary = ({
  output,
  documentCount,
}: {
  output: IxpOutput;
  documentCount: number;
}) => {
  const { t } = useTranslation();
  const parts = [
    t("ixp_output_total_files", { count: output.total_files ?? documentCount }),
  ];
  if (output.classified_count != null) {
    parts.push(t("ixp_output_classified", { count: output.classified_count }));
  }
  if (output.unclassified_count != null) {
    parts.push(
      t("ixp_output_unclassified", { count: output.unclassified_count }),
    );
  }

  return (
    <div className="w-fit rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      {parts.join(" · ")}
    </div>
  );
};

const DocumentExtractionRow = ({ doc }: { doc: IxpDocumentExtraction }) => {
  const { t } = useTranslation();
  const fieldCount = doc.extractions.reduce(
    (total, group) => total + group.fieldValues.length,
    0,
  );

  return (
    <DocumentSection
      title={doc.documentName}
      summary={
        <span className="text-xs text-muted-foreground">
          {t("ixp_output_field_count", { count: fieldCount })}
        </span>
      }
    >
      {doc.extractions.map((group, i) => (
        // oxlint-disable-next-line react(no-array-index-key) -- group names can repeat within a document; output is static and never reorders
        <ExtractionGroup key={`${group.fieldGroupName}-${i}`} group={group} />
      ))}
    </DocumentSection>
  );
};

const ExtractionGroup = ({ group }: { group: IxpExtractionGroup }) => {
  const { t } = useTranslation();

  return (
    <div className="mt-3 first:mt-0">
      <FieldGroupHeading>{group.fieldGroupName}</FieldGroupHeading>
      <FieldTable
        columns={[{ label: t("ixp_field") }, { label: t("ixp_value") }]}
      >
        {group.fieldValues.map((field, i) => (
          // oxlint-disable-next-line react(no-array-index-key) -- field names can repeat; output is static and never reorders
          <FieldRow key={`${field.name}-${i}`}>
            <FieldCell className="font-medium">{field.name}</FieldCell>
            <FieldCell>{formatFieldValues(field.value)}</FieldCell>
          </FieldRow>
        ))}
      </FieldTable>
    </div>
  );
};

// Bind to a vertical's IXP agent via config.outputRenderers.
export const IXP_OUTPUT_RENDERER = makeProcessOutputRenderer(
  IxpOutputSchema,
  IxpOutputResult,
  {},
);
