"use client";

import type { ComponentType } from "react";
import type { SolutionTestRunResult } from "../types";
import { GenericEvaluatorResult } from "./generic-evaluator-result";
import { IxpExtractionResult } from "./ixp-extraction/ixp-extraction-result";

const JSON_SIMILARITY_EVALUATOR_ID = "uipath-json-similarity";
const LLM_JUDGE_EVALUATOR_ID = "uipath-llm-judge-output-semantic-similarity";
const IXP_EXTRACTION_EVALUATOR_ID = "uipath-ixp-document-extraction";

export interface EvaluatorResultProps {
  evaluatorId: string;
  score: number | undefined;
  /** The evaluator's own `details` payload — each component validates it. */
  evaluatorDetails: unknown;
  expectedOutput: unknown;
  actualOutput: unknown;
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
  [JSON_SIMILARITY_EVALUATOR_ID]: GenericEvaluatorResult,
  [LLM_JUDGE_EVALUATOR_ID]: GenericEvaluatorResult,
  [IXP_EXTRACTION_EVALUATOR_ID]: IxpExtractionResult,
};

export function resolveEvaluatorComponent(
  evaluatorId: string,
): ComponentType<EvaluatorResultProps> {
  return EVALUATOR_COMPONENTS[evaluatorId] ?? GenericEvaluatorResult;
}
