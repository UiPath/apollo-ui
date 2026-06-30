import { z } from "zod";
import { renderValueOrEmptyState } from "@/lib/renderValueOrEmptyState";

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
  resolved_project_version: z.union([z.number(), z.string()]).nullish(),
  extractor: z.string().nullish(),
  tag: z.string().nullish(),
  project_name: z.string().nullish(),
});

const FieldSchema = z.object({
  group: z.string(),
  field: z.string(),
  expected: z.array(z.unknown()),
  actual: z.array(z.unknown()),
  verdict: z.string(),
  reason: z.string().optional().default(""),
});

const DocumentSchema = z.object({
  document: z.string(),
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
  expected_provenance: ProvenanceSchema.nullish(),
  actual_provenance: ProvenanceSchema.nullish(),
});

export type IxpDetails = z.infer<typeof IxpDetailsSchema>;
export type IxpDocument = z.infer<typeof DocumentSchema>;
export type IxpField = z.infer<typeof FieldSchema>;
export type IxpProvenance = z.infer<typeof ProvenanceSchema>;

/** Render a field's value list (multi-valued fields join with " | "). Empty,
 * absent, and null values all render the same way ("—") — the distinction
 * between "no field" and "null value" isn't meaningful to a reviewer. */
export function formatFieldValues(values: unknown[]): string {
  const present = values.filter((v) => v != null && v !== "").map(String);
  return present.length > 0
    ? present.join(" | ")
    : renderValueOrEmptyState(null);
}
