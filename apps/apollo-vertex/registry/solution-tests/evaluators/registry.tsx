"use client";

import type { ComponentType, ReactNode } from "react";
import type { z } from "zod";
import type { SolutionTestRunResult } from "../types";
import {
  GenericEvaluatorDetailsSchema,
  GenericEvaluatorResult,
} from "./generic-evaluator-result";
import { IxpExtractionResult } from "./ixp-extraction/ixp-extraction-result";
import { IxpDetailsSchema } from "./ixp-extraction/schema";

const JSON_SIMILARITY_EVALUATOR_ID = "uipath-json-similarity";
const LLM_JUDGE_EVALUATOR_ID = "uipath-llm-judge-output-semantic-similarity";
const IXP_EXTRACTION_EVALUATOR_ID = "uipath-ixp-document-extraction";

export interface EvaluatorResultProps<TDetails = unknown> {
  evaluatorId: string;
  score: number | undefined;
  /** The evaluator's `details`, already validated + typed by the registry. */
  evaluatorDetails: TDetails;
  expectedOutput: unknown;
  actualOutput: unknown;
  result: SolutionTestRunResult;
}

interface EvaluatorRenderArgs {
  evaluatorId: string;
  score: number | undefined;
  /** The raw, unvalidated `details` off the EvaluatorResults attachment. */
  rawDetails: unknown;
  expectedOutput: unknown;
  actualOutput: unknown;
  result: SolutionTestRunResult;
}

/** Bind an evaluator's schema to its component so `details` is validated once,
 * centrally, and each component receives a typed `evaluatorDetails`. Closing
 * over the concrete `<TDetails>` keeps the map value a uniform function type —
 * no `unknown`/`any` leaks to component authors. Returns null if validation
 * fails (a malformed payload just renders nothing). */
function makeRenderer<TDetails>(
  schema: z.ZodType<TDetails>,
  Component: ComponentType<EvaluatorResultProps<TDetails>>,
) {
  return ({ rawDetails, ...rest }: EvaluatorRenderArgs): ReactNode => {
    const parsed = schema.safeParse(rawDetails);
    if (!parsed.success) return null;
    return <Component evaluatorDetails={parsed.data} {...rest} />;
  };
}

const GENERIC_RENDERER = makeRenderer(
  GenericEvaluatorDetailsSchema,
  GenericEvaluatorResult,
);

// Discriminator is the evaluator id — the key the result is stored under in the
// EvaluatorResults attachment — so no schema-sniffing is needed. Unknown ids
// fall back to the generic renderer.
const EVALUATOR_RENDERERS: Record<
  string,
  (args: EvaluatorRenderArgs) => ReactNode
> = {
  [JSON_SIMILARITY_EVALUATOR_ID]: GENERIC_RENDERER,
  [LLM_JUDGE_EVALUATOR_ID]: GENERIC_RENDERER,
  [IXP_EXTRACTION_EVALUATOR_ID]: makeRenderer(
    IxpDetailsSchema,
    IxpExtractionResult,
  ),
};

export function resolveEvaluatorRenderer(
  evaluatorId: string,
): (args: EvaluatorRenderArgs) => ReactNode {
  return EVALUATOR_RENDERERS[evaluatorId] ?? GENERIC_RENDERER;
}
