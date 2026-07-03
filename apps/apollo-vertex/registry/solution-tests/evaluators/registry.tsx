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

// Built-in evaluator ids — mirror the Python runner's wire contract
// (shared/solution_tests/evaluator.py).
export const JSON_SIMILARITY_EVALUATOR_ID = "uipath-json-similarity";
export const LLM_JUDGE_EVALUATOR_ID =
  "uipath-llm-judge-output-semantic-similarity";
export const IXP_EXTRACTION_EVALUATOR_ID = "uipath-ixp-document-extraction";

export interface EvaluatorRenderArgs {
  evaluatorId: string;
  score: number | undefined;
  /** Raw, unvalidated `details` off the EvaluatorResults attachment. */
  rawDetails: unknown;
  expectedOutput: unknown;
  actualOutput: unknown;
  result: SolutionTestRunResult;
}

export type EvaluatorResultProps<TDetails = unknown> = Omit<
  EvaluatorRenderArgs,
  "rawDetails"
> & { evaluatorDetails: TDetails };

export type EvaluatorRenderer = (args: EvaluatorRenderArgs) => ReactNode;

export type EvaluatorRenderers = Record<string, EvaluatorRenderer>;

/** Bind an evaluator's schema + component (and any registration-time `bound`
 * props) into a renderer. */
export function makeRenderer<TDetails, TExtra extends object>(
  schema: z.ZodType<TDetails>,
  Component: ComponentType<EvaluatorResultProps<TDetails> & TExtra>,
  bound: TExtra,
): EvaluatorRenderer {
  return ({ rawDetails, ...rest }: EvaluatorRenderArgs): ReactNode => {
    const parsed = schema.safeParse(rawDetails);
    if (!parsed.success) return null;
    return <Component evaluatorDetails={parsed.data} {...bound} {...rest} />;
  };
}

/** The generic card; reuse for a custom evaluator that keeps the
 * `{score, justification}` contract, binding an optional display `label`. */
export function genericRenderer(
  options: { label?: string } = {},
): EvaluatorRenderer {
  return makeRenderer(GenericEvaluatorDetailsSchema, GenericEvaluatorResult, {
    label: options.label,
  });
}

/** Fallback for unknown ids (the card then shows the raw evaluator id). */
export const GENERIC_RENDERER: EvaluatorRenderer = genericRenderer();

const EVALUATOR_RENDERERS: EvaluatorRenderers = {
  [JSON_SIMILARITY_EVALUATOR_ID]: genericRenderer({ label: "JSON Similarity" }),
  [LLM_JUDGE_EVALUATOR_ID]: genericRenderer({ label: "LLM Judge" }),
  [IXP_EXTRACTION_EVALUATOR_ID]: makeRenderer(
    IxpDetailsSchema,
    IxpExtractionResult,
    {},
  ),
};

/** Precedence: vertical renderers > built-ins > generic fallback. */
export function resolveEvaluatorRenderer(
  evaluatorId: string,
  verticalRenderers?: EvaluatorRenderers,
): EvaluatorRenderer {
  return (
    verticalRenderers?.[evaluatorId] ??
    EVALUATOR_RENDERERS[evaluatorId] ??
    GENERIC_RENDERER
  );
}
