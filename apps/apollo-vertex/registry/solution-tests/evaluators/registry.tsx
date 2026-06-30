"use client";

import type { ComponentType } from "react";
import type { SolutionTestRunResult } from "../types";
import { GenericEvaluatorResult } from "./generic-evaluator-result";
import { IxpExtractionResult } from "./ixp-extraction/ixp-extraction-result";

export const IXP_EXTRACTION_EVALUATOR_ID = "uipath-ixp-document-extraction";

export interface EvaluatorResultProps {
  evaluatorId: string;
  score: number | undefined;
  /** Evaluator-specific `details` payload — each component validates it. */
  details: unknown;
  /** Raw expected/actual outputs (used by the generic component). */
  expected: unknown;
  actual: unknown;
  result: SolutionTestRunResult;
}

// Discriminator is the evaluator id — the key the result is stored under in the
// EvaluatorResults attachment — so no schema-sniffing is needed. Every evaluator
// is listed explicitly (the deterministic ones reuse GenericEvaluatorResult);
// unknown ids fall back to it too.
const EVALUATOR_COMPONENTS: Record<
  string,
  ComponentType<EvaluatorResultProps>
> = {
  "uipath-json-similarity": GenericEvaluatorResult,
  "uipath-llm-judge-output-semantic-similarity": GenericEvaluatorResult,
  [IXP_EXTRACTION_EVALUATOR_ID]: IxpExtractionResult,
};

export function resolveEvaluatorComponent(
  evaluatorId: string,
): ComponentType<EvaluatorResultProps> {
  return EVALUATOR_COMPONENTS[evaluatorId] ?? GenericEvaluatorResult;
}
