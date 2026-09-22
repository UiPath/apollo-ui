import { z } from "zod";

// Metadata fields are nullish: IXP emits null for all of them on an unextracted
// value, and the payload must still validate.
const FieldValueSchema = z.object({
  id: z.string().nullish(),
  name: z.string(),
  value: z.unknown(),
  unformattedValue: z.unknown().optional(),
  confidence: z.number().nullish(),
  ocrConfidence: z.number().nullish(),
  type: z.string().nullish(),
});

const ExtractionSchema = z.object({
  fieldGroupName: z.string(),
  fieldValues: z.array(FieldValueSchema),
});

const DocumentExtractionSchema = z.object({
  documentName: z.string(),
  extractions: z.array(ExtractionSchema),
});

// Requiring document_extractions lets the renderer fall back to raw JSON for
// non-IXP output bound to the same agent; the summary counts are optional.
export const IxpOutputSchema = z.object({
  document_extractions: z.record(z.string(), DocumentExtractionSchema),
  total_files: z.number().optional(),
  classified_count: z.number().optional(),
  unclassified_count: z.number().optional(),
});

export type IxpOutput = z.infer<typeof IxpOutputSchema>;
export type IxpDocumentExtraction = z.infer<typeof DocumentExtractionSchema>;
export type IxpExtractionGroup = z.infer<typeof ExtractionSchema>;
export type IxpFieldValue = z.infer<typeof FieldValueSchema>;
