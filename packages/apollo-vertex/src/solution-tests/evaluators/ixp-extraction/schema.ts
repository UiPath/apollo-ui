import { z } from "zod";

/** The three-way per-field verdict the IXP evaluator emits. */
export const IxpVerdict = {
  Identical: "identical",
  SemanticallySame: "semantically_same",
  Different: "different",
} as const;
export type IxpVerdictValue = (typeof IxpVerdict)[keyof typeof IxpVerdict];

/** Per-document comparison status. */
export const IxpDocStatus = {
  Compared: "compared",
  MissingInActual: "missing_in_actual",
  NewInActual: "new_in_actual",
} as const;

const ProvenanceSchema = z.object({
  // Always resolved (env-default fallback), so never null.
  project_name: z.string(),
  // These can be null when tag→version resolution fails.
  resolved_project_version: z.union([z.number(), z.string()]).nullish(),
  extractor: z.string().nullish(),
  tag: z.string().nullish(),
});

const FieldSchema = z.object({
  group: z.string(),
  field: z.string(),
  // Baseline vs new-run values for the field — arbitrary extracted values
  // (text/number/date/null), so intentionally untyped.
  expected: z.array(z.unknown()),
  actual: z.array(z.unknown()),
  verdict: z.string(),
  verdict_reason: z.string().optional().default(""),
});

const DocumentSchema = z.object({
  document: z.string(),
  // Baseline's name when the same file was re-classified this run, else null/absent.
  previous_document: z.string().nullish(),
  status: z.string(),
  score: z.number(),
  identical_count: z.number(),
  total_fields: z.number(),
  fields: z.array(FieldSchema),
});

export const IxpDetailsSchema = z.object({
  documents: z.array(DocumentSchema),
  different_field_count: z.number(),
  semantically_same_field_count: z.number(),
  identical_field_count: z.number(),
  // Present in every payload, but null when a run produced no provenance
  // (e.g. a baseline captured before provenance existed, or a no-documents run).
  expected_provenance: ProvenanceSchema.nullable(),
  actual_provenance: ProvenanceSchema.nullable(),
});

export type IxpDetails = z.infer<typeof IxpDetailsSchema>;
export type IxpDocument = z.infer<typeof DocumentSchema>;
export type IxpField = z.infer<typeof FieldSchema>;
export type IxpProvenance = z.infer<typeof ProvenanceSchema>;
